import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

// The single source of truth for "does this user belong to this
// conversation." Every message read/write goes through this first —
// this is the actual isolation boundary for private conversation content.
export async function assertConversationMember(conversationId: string, userId: string) {
  const membership = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });

  if (!membership) {
    // 404, not 403 — we don't want to confirm a private conversation
    // even exists to someone who isn't a member of it
    throw new AppError('Conversation not found', 404);
  }

  return membership;
}