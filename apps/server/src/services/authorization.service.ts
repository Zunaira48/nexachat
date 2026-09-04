import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

export async function assertConversationMember(conversationId: string, userId: string) {
  const membership = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });

  if (!membership) {
    throw new AppError('Conversation not found', 404);
  }

  return membership;
}

// Owner or admin — for group management actions like adding/removing
// members or renaming the group.
export async function assertConversationAdmin(conversationId: string, userId: string) {
  const membership = await assertConversationMember(conversationId, userId);
  if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
    throw new AppError('Only group admins can perform this action', 403);
  }
  return membership;
}

// Owner only — for irreversible/high-trust actions like promoting a
// new owner or deleting the group entirely (not built yet, but this
// is where that check will live).
export async function assertConversationOwner(conversationId: string, userId: string) {
  const membership = await assertConversationMember(conversationId, userId);
  if (membership.role !== 'OWNER') {
    throw new AppError('Only the group owner can perform this action', 403);
  }
  return membership;
}