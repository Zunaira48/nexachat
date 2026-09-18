import { z } from 'zod';

export const replySuggestionsSchema = z.object({
  conversationId: z.string().min(1, 'conversationId is required'),
});