import { randomUUID } from 'crypto';
import { PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client } from '../config/r2';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { assertConversationMember } from './authorization.service';
import { MAX_FILE_SIZE_BYTES } from '../validators/attachment.validator';

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

  // Presigned PUT — R2 does not implement the S3 "POST Object" API
  // (confirmed: it returns 501 Not Implemented), so a presigned-POST
  // upload policy with a content-length-range condition isn't usable
  // here the way it would be on real AWS S3. Real size enforcement
  // happens after the upload instead, in confirmAttachment below,
  // by checking R2's own reported object size.
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

  // R2 can't enforce a real size limit at upload time (see the comment
  // in createUploadUrl), so we verify the ACTUAL uploaded object's size
  // here — not the size the client claims in this request body. An
  // oversized object is deleted immediately rather than kept in storage
  // or recorded as a real attachment.
  const head = await r2Client.send(
    new HeadObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: data.key }),
  );

  if ((head.ContentLength ?? 0) > MAX_FILE_SIZE_BYTES) {
    await r2Client.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: data.key }));
    throw new AppError('Uploaded file exceeds the allowed size limit', 400);
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