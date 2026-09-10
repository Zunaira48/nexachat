import { prisma } from '../config/prisma';
import { getIO } from '../socket';

const prismaClient = prisma as any;

export async function createNotification(params: {
  userId: string;
  type: string;
  conversationId?: string;
  actorId?: string;
  content: string;
}) {
  const notification = await prismaClient.notification.create({ data: params });
  // Push it live if the recipient is currently connected — the
  // frontend will also fetch on load for anything missed while offline.
  getIO().to(`user:${params.userId}`).emit('notification', notification);
  return notification;
}

// Fan out a notification to every member of a conversation except
// the person who triggered it — the common case for new messages.
export async function notifyConversationMembers(
  conversationId: string,
  excludeUserId: string,
  type: string,
  content: string,
) {
  const members = await prismaClient.conversationMember.findMany({
    where: { conversationId, userId: { not: excludeUserId } },
    select: { userId: true },
  });

  await Promise.all(
    members.map((m: (typeof members)[number]) =>
      createNotification({
        userId: m.userId,
        type,
        conversationId,
        actorId: excludeUserId,
        content,
      }),
    ),
  );
}

export async function listNotifications(userId: string) {
  return prismaClient.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getUnreadCount(userId: string) {
  return prismaClient.notification.count({ where: { userId, readAt: null } });
}

export async function markAllRead(userId: string) {
  await prismaClient.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}