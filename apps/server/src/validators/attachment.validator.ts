import { z } from 'zod';

// Deliberately conservative allow-list rather than a deny-list —
// safer default for untrusted uploads (Section 48 of the spec).
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

export const requestUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  size: z.number().positive().max(MAX_FILE_SIZE_BYTES, 'File exceeds the 15MB limit'),
});