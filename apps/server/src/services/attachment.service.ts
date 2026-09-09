import { randomUUID } from 'crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client } from '../config/r2';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { assertConversationMember } from './authorization.service';

// Sanitize the filename to prevent path traversal or weird characters
// ending up in the object key — never trust the client's raw filename.
function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(0, 100);
}

export async function createUploadUrl(
  conversationId: string,
  userId: string,
  fileName: string,
  mimeType: string,
) {
  await assertConversationMember(conversationId, userId);

  const key = `${conversationId}/${randomUUID()}-${safeFileName(fileName)}`;

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: mimeType,
  });

  // Short-lived — the client must actually perform the upload within
  // this window; it's not a long-term credential.
  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
  const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

  return { uploadUrl, key, publicUrl };
}

export async function confirmAttachment(
  conversationId: string,
  senderId: string,
  data: { key: string; publicUrl: string; fileName: string; mimeType: string; size: number },
) {
  await assertConversationMember(conversationId, senderId);

  if (!data.key.startsWith(`${conversationId}/`)) {
    // The key must belong to this conversation — prevents someone
    // confirming an attachment using an upload URL issued for a
    // different conversation they don't have access to.
    throw new AppError('Invalid attachment key', 400);
  }

  const messageType = data.mimeType.startsWith('image/') ? 'IMAGE' : 'FILE';

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: data.fileName,
        type: messageType,
        attachment: {
          create: {
            fileName: data.fileName,
            mimeType: data.mimeType,
            size: data.size,
            key: data.key,
            url: data.publicUrl,
          },
        },
      },
      include: { attachment: true },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return message;
}