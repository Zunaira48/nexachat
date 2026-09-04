import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { assertConversationMember } from './authorization.service';

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
  replyToId?: string,
) {
  await assertConversationMember(conversationId, senderId);

  if (replyToId) {
    const replyTarget = await prisma.message.findFirst({
      where: { id: replyToId, conversationId },
    });
    if (!replyTarget) throw new AppError('Message being replied to was not found', 404);
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, senderId, content, replyToId },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
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
    include: {
      reactions: true,
      replyTo: { select: { id: true, content: true, senderId: true, deletedAt: true } },
    },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = messages.length > limit;
  const page = hasMore ? messages.slice(0, limit) : messages;

  return {
    messages: page.reverse(),
    nextCursor: hasMore ? (page[0]?.id ?? null) : null,
  };
}

async function getOwnedMessage(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message || message.deletedAt) throw new AppError('Message not found', 404);
  if (message.senderId !== userId) {
    throw new AppError('You can only modify your own messages', 403);
  }
  return message;
}

export async function editMessage(messageId: string, userId: string, content: string) {
  const message = await getOwnedMessage(messageId, userId);
  return prisma.message.update({
    where: { id: message.id },
    data: { content, editedAt: new Date() },
  });
}

export async function deleteMessage(messageId: string, userId: string) {
  const message = await getOwnedMessage(messageId, userId);
  // Soft delete — the row stays (replies/reactions referencing it stay
  // valid), but content is cleared so it can never be read back.
  return prisma.message.update({
    where: { id: message.id },
    data: { deletedAt: new Date(), content: '' },
  });
}

export async function addReaction(
  conversationId: string,
  messageId: string,
  userId: string,
  emoji: string,
) {
  await assertConversationMember(conversationId, userId);
  const message = await prisma.message.findFirst({ where: { id: messageId, conversationId } });
  if (!message || message.deletedAt) throw new AppError('Message not found', 404);

  return prisma.messageReaction.upsert({
    where: { messageId_userId_emoji: { messageId, userId, emoji } },
    create: { messageId, userId, emoji },
    update: {}, // already exists — no-op, idempotent
  });
}

export async function removeReaction(
  conversationId: string,
  messageId: string,
  userId: string,
  emoji: string,
) {
  await assertConversationMember(conversationId, userId);
  await prisma.messageReaction.deleteMany({ where: { messageId, userId, emoji } });
}

export async function togglePin(conversationId: string, messageId: string, userId: string) {
  await assertConversationMember(conversationId, userId);
  const message = await prisma.message.findFirst({ where: { id: messageId, conversationId } });
  if (!message || message.deletedAt) throw new AppError('Message not found', 404);

  return prisma.message.update({
    where: { id: message.id },
    data: { pinnedAt: message.pinnedAt ? null : new Date() },
  });
}