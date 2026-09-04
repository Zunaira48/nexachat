import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

const conversationInclude = {
  members: {
    include: {
      user: {
        select: { id: true, username: true, displayName: true },
      },
    },
  },
  messages: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
} as const;

// Keep this service compatible with the generated Prisma client when its
// delegate typings lag behind the schema.
const conversation = (prisma as any).conversation;

export async function listConversationsForUser(userId: string) {
  return conversation.findMany({
    where: {
      members: { some: { userId } }, // <-- the isolation boundary: only conversations you belong to
    },
    include: conversationInclude,
    orderBy: { updatedAt: 'desc' },
  });
}

export async function createDirectConversation(currentUserId: string, otherUserId: string) {
  if (currentUserId === otherUserId) {
    throw new AppError('Cannot start a conversation with yourself', 400);
  }

  const otherUser = await prisma.user.findUnique({ where: { id: otherUserId } });
  if (!otherUser) {
    throw new AppError('User not found', 404);
  }

  const existing = await conversation.findFirst({
    where: {
      type: 'DIRECT',
      AND: [
        { members: { some: { userId: currentUserId } } },
        { members: { some: { userId: otherUserId } } },
      ],
    },
    include: conversationInclude,
  });

  if (existing) return existing;

  return conversation.create({
    data: {
      type: 'DIRECT',
      members: {
        create: [{ userId: currentUserId }, { userId: otherUserId }],
      },
    },
    include: conversationInclude,
  });
}


export async function toggleFavorite(conversationId: string, userId: string) {
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!membership) throw new AppError('Conversation not found', 404);

  return prisma.conversationMember.update({
    where: { id: membership.id },
    data: { isFavorite: !membership.isFavorite },
  });
}