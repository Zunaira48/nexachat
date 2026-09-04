import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { assertConversationAdmin, assertConversationOwner } from './authorization.service';

const conversationInclude = {
  members: {
    include: {
      user: { select: { id: true, username: true, displayName: true } },
    },
  },
} as const;

async function createSystemMessage(conversationId: string, content: string, actingUserId: string) {
  return prisma.message.create({
    data: { conversationId, senderId: actingUserId, content, type: 'SYSTEM' },
  });
}

export async function createGroup(ownerId: string, name: string, memberIds: string[]) {
  if (!name.trim()) throw new AppError('Group name is required', 400);

  const uniqueMemberIds = Array.from(new Set(memberIds.filter((id) => id !== ownerId)));
  if (uniqueMemberIds.length === 0) {
    throw new AppError('A group needs at least one other member', 400);
  }

  const validUsers = await prisma.user.findMany({
    where: { id: { in: uniqueMemberIds } },
    select: { id: true },
  });
  if (validUsers.length !== uniqueMemberIds.length) {
    throw new AppError('One or more selected users were not found', 400);
  }

  return prisma.conversation.create({
    data: {
      type: 'GROUP',
      name: name.trim(),
      members: {
        create: [
          { userId: ownerId, role: 'OWNER' },
          ...uniqueMemberIds.map((userId) => ({ userId, role: 'MEMBER' as const })),
        ],
      },
    },
    include: conversationInclude,
  });
}

export async function addMember(
  conversationId: string,
  actingUserId: string,
  newUserId: string,
) {
  await assertConversationAdmin(conversationId, actingUserId);

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation || conversation.type !== 'GROUP') {
    throw new AppError('Group not found', 404);
  }

  const existing = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: newUserId } },
  });
  if (existing) throw new AppError('User is already a member', 409);

  const newUser = await prisma.user.findUnique({ where: { id: newUserId } });
  if (!newUser) throw new AppError('User not found', 404);

  await prisma.conversationMember.create({
    data: { conversationId, userId: newUserId, role: 'MEMBER' },
  });

  const systemMessage = await createSystemMessage(
    conversationId,
    `${newUser.displayName} was added to the group`,
    actingUserId,
  );

  return systemMessage;
}

export async function removeMember(
  conversationId: string,
  actingUserId: string,
  targetUserId: string,
) {
  await assertConversationAdmin(conversationId, actingUserId);

  const target = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: targetUserId } },
    include: { user: { select: { displayName: true } } },
  });
  if (!target) throw new AppError('User is not a member of this group', 404);
  if (target.role === 'OWNER') {
    throw new AppError('The group owner cannot be removed', 400);
  }

  await prisma.conversationMember.delete({ where: { id: target.id } });

  return createSystemMessage(
    conversationId,
    `${target.user.displayName} was removed from the group`,
    actingUserId,
  );
}

export async function leaveGroup(conversationId: string, userId: string) {
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    include: { user: { select: { displayName: true } } },
  });
  if (!membership) throw new AppError('Conversation not found', 404);

  if (membership.role === 'OWNER') {
    // Transfer ownership to the longest-standing remaining member
    // rather than leaving a group ownerless.
    const nextOwner = await prisma.conversationMember.findFirst({
      where: { conversationId, userId: { not: userId } },
      orderBy: { joinedAt: 'asc' },
    });
    if (nextOwner) {
      await prisma.conversationMember.update({
        where: { id: nextOwner.id },
        data: { role: 'OWNER' },
      });
    }
  }

  await prisma.conversationMember.delete({ where: { id: membership.id } });

  return createSystemMessage(
    conversationId,
    `${membership.user.displayName} left the group`,
    userId,
  );
}

export async function updateGroupName(conversationId: string, userId: string, name: string) {
  await assertConversationAdmin(conversationId, userId);
  if (!name.trim()) throw new AppError('Group name is required', 400);

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { name: name.trim() },
  });

  return createSystemMessage(conversationId, `Group renamed to "${name.trim()}"`, userId);
}

export async function changeRole(
  conversationId: string,
  actingUserId: string,
  targetUserId: string,
  newRole: 'ADMIN' | 'MEMBER',
) {
  await assertConversationOwner(conversationId, actingUserId);

  const target = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: targetUserId } },
    include: { user: { select: { displayName: true } } },
  });
  if (!target) throw new AppError('User is not a member of this group', 404);
  if (target.role === 'OWNER') throw new AppError('Cannot change the owner\'s role', 400);

  await prisma.conversationMember.update({
    where: { id: target.id },
    data: { role: newRole },
  });

  const verb = newRole === 'ADMIN' ? 'promoted to admin' : 'demoted to member';
  return createSystemMessage(conversationId, `${target.user.displayName} was ${verb}`, actingUserId);
}
