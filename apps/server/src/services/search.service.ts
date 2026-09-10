import { prisma } from '../config/prisma';

export async function searchMessages(userId: string, query: string) {
  if (!query.trim()) return [];

  // Only search within conversations the user is actually a member
  // of — same isolation boundary as every other message query.
  return prisma.message.findMany({
    where: {
      deletedAt: null,
      type: 'TEXT',
      content: { contains: query },
      conversation: { members: { some: { userId } } },
    },
    include: {
      conversation: { select: { id: true, name: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
}

export async function searchConversations(userId: string, query: string) {
  if (!query.trim()) return [];

  return prisma.conversation.findMany({
    where: {
      members: { some: { userId } },
      OR: [
        { name: { contains: query } },
        { members: { some: { user: { displayName: { contains: query } } } } },
      ],
    },
    include: {
      members: { include: { user: { select: { id: true, username: true, displayName: true } } } },
    },
    take: 20,
  });
}