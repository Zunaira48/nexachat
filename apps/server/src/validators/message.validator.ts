import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(4000, 'Message is too long'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const listMessagesQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(30),
});