import { prisma } from '../config/prisma';
import { assertConversationMember } from './authorization.service';

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  await assertConversationMember(conversationId, senderId);

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, senderId, content },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }, // keeps conversation list sorted by recent activity
    }),
  ]);

  return message;
}

export async function listMessages(
  conversationId: string,
  userId: string,
  cursor: string | undefined,
  limit: number,
) {
  await assertConversationMember(conversationId, userId);

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = messages.length > limit;
  const page = hasMore ? messages.slice(0, limit) : messages;

  return {
    messages: page.reverse(),
    nextCursor: hasMore ? (page[0]?.id ?? null) : null,
  };
}