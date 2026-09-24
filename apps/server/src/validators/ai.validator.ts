import { z } from 'zod';

export const replySuggestionsSchema = z.object({
  conversationId: z.string().min(1, 'conversationId is required'),
});

export const rewriteSchema = z.object({
  content: z.string().trim().min(1, 'Message content is required').max(1000, 'Message is too long to rewrite'),
  style: z.enum(['PROFESSIONAL', 'CASUAL', 'GRAMMAR']),
});

export const summarizeSchema = z.object({
  conversationId: z.string().min(1, 'conversationId is required'),
});

export const askSchema = z.object({
  conversationId: z.string().min(1, 'conversationId is required'),
  question: z.string().trim().min(1, 'Question is required').max(300, 'Question is too long'),
});