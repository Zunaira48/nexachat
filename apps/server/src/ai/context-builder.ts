import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { assertConversationMember } from '../services/authorization.service';

const MAX_CONTEXT_MESSAGES = 30;

// Returns ONLY what's needed for an AI feature to work: message
// content, sender display name, timestamp. Never IDs, emails, tokens,
// or any field beyond what a human reading the chat would see.
export async function buildConversationContext(conversationId: string, userId: string) {
  await assertConversationMember(conversationId, userId);

  const messages = await prisma.message.findMany({
    where: { conversationId, deletedAt: null, type: { in: ['TEXT', 'IMAGE', 'FILE'] } },
    orderBy: { createdAt: 'desc' },
    take: MAX_CONTEXT_MESSAGES,
    select: {
      createdAt: true,
      content: true,
      sender: { select: { displayName: true } },
    },
  });

  if (messages.length === 0) {
    throw new AppError('No messages to work with yet', 400);
  }

  return messages
    .reverse()
    .map((message) => {
      const sender = (message as { sender?: { displayName?: string } }).sender;
      return `${sender?.displayName ?? 'Unknown user'}: ${message.content}`;
    })
    .join('\n');
}

const MAX_UNREAD_CONTEXT_MESSAGES = 50;

// Same "unread" definition already used in read-receipt.service.ts and
// conversation.controller.ts (Phase 12) — not a new definition of unread.
export async function buildUnreadContext(conversationId: string, userId: string) {
  await assertConversationMember(conversationId, userId);

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      senderId: { not: userId },
      deletedAt: null,
      reads: { none: { userId } },
    },
    orderBy: { createdAt: 'asc' },
    take: MAX_UNREAD_CONTEXT_MESSAGES,
    select: {
      createdAt: true,
      content: true,
      sender: { select: { displayName: true } },
    },
  });

  if (messages.length === 0) {
    throw new AppError('No unread messages to summarize', 400);
  }

  return messages
    .map((message) => {
      const sender = (message as { sender?: { displayName?: string } }).sender;
      return `${sender?.displayName ?? 'Unknown user'}: ${message.content}`;
    })
    .join('\n');
}