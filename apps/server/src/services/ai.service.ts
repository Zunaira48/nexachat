import { z } from 'zod';
import { aiProvider } from '../ai';
import { buildConversationContext } from '../ai/context-builder';
import { AppError } from '../utils/AppError';

const suggestionsResponseSchema = z
  .array(z.string().trim().min(1).max(200))
  .min(1)
  .max(4);

const REPLY_SUGGESTIONS_SYSTEM_INSTRUCTION = `You suggest short replies inside a real-time chat app.
Rules:
- Respond with ONLY a raw JSON array of strings. No markdown, no code fences, no explanation.
- Provide exactly 3 suggestions.
- Each suggestion must be under 15 words.
- Suggestions must be natural, casual, and directly relevant to the last message in the conversation.
- Do not invent facts, names, or commitments that were not in the conversation.
- Do not repeat the last message verbatim.`;

// Strips accidental ```json fences etc. before parsing — cheap insurance
// against a model that ignores the "no markdown" instruction.
function extractJsonArray(raw: string): unknown {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new AppError('AI returned an unreadable response', 502);
  }
}

export async function generateReplySuggestions(conversationId: string, userId: string) {
  const context = await buildConversationContext(conversationId, userId);

  const raw = await aiProvider.generateText(
    `Conversation so far:\n${context}\n\nSuggest replies for the current user to send next.`,
    REPLY_SUGGESTIONS_SYSTEM_INSTRUCTION,
  );

  const parsed = extractJsonArray(raw);
  const result = suggestionsResponseSchema.safeParse(parsed);

  if (!result.success) {
    throw new AppError('AI returned suggestions in an unexpected format', 502);
  }

  return result.data;
}