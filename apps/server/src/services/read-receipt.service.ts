import { prisma } from '../config/prisma';
import { assertConversationMember } from './authorization.service';

export async function markConversationRead(conversationId: string, userId: string) {
  await assertConversationMember(conversationId, userId);

  const unreadMessages = await prisma.message.findMany({
    where: {
      conversationId,
      senderId: { not: userId },
      reads: { none: { userId } },
    },
    select: { id: true },
  });

  if (unreadMessages.length === 0) return { markedCount: 0, messageIds: [] as string[] };

  const messageIds = unreadMessages.map((m: (typeof unreadMessages)[number]) => m.id);

  // skipDuplicates isn't supported on SQL Server (only Postgres/MySQL/SQLite),
  // so we swallow unique-constraint violations individually instead —
  // a rare race between two near-simultaneous "mark read" calls, not
  // something worth failing the whole request over.
  const results = await Promise.allSettled(
    messageIds.map((messageId: string) =>
      prisma.messageRead.create({ data: { messageId, userId } }),
    ),
  );

  const successCount = results.filter(
    (r: PromiseSettledResult<unknown>) => r.status === 'fulfilled',
  ).length;

  return { markedCount: successCount, messageIds };
}