import { z } from 'zod';
import { aiProvider } from '../ai';
import { buildConversationContext, buildUnreadContext } from '../ai/context-builder';
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
const REWRITE_INSTRUCTIONS: Record<'PROFESSIONAL' | 'CASUAL' | 'GRAMMAR', string> = {
  PROFESSIONAL: `Rewrite the user's message in a professional, polished tone suitable for a workplace conversation.
Preserve the original meaning exactly. Do not add new information or invent details.
Respond with ONLY the rewritten message. No quotes, no markdown, no explanation.`,
  CASUAL: `Rewrite the user's message in a casual, friendly, relaxed tone, like texting a friend.
Preserve the original meaning exactly. Do not add new information.
Respond with ONLY the rewritten message. No quotes, no markdown, no explanation.`,
  GRAMMAR: `Correct grammar, spelling, and punctuation in the user's message.
Do not change the tone, meaning, or style otherwise.
Respond with ONLY the corrected message. No quotes, no markdown, no explanation.`,
};

const rewriteResponseSchema = z.string().trim().min(1).max(2000);

function cleanRewriteOutput(raw: string): string {
  let cleaned = raw.trim().replace(/^```(?:text)?/i, '').replace(/```$/, '').trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

export async function rewriteMessage(content: string, style: 'PROFESSIONAL' | 'CASUAL' | 'GRAMMAR') {
  const raw = await aiProvider.generateText(content, REWRITE_INSTRUCTIONS[style]);
  const cleaned = cleanRewriteOutput(raw);

  const result = rewriteResponseSchema.safeParse(cleaned);
  if (!result.success) {
    throw new AppError('AI returned an unusable rewrite', 502);
  }

  return result.data;
}
const SUMMARY_SYSTEM_INSTRUCTION = `You summarize chat conversations for someone catching up.
Rules:
- Write 2 to 4 plain sentences, no bullet points, no headings, no markdown.
- Cover only what was actually said. Do not invent names, facts, or outcomes not present in the conversation.
- Be neutral and factual, not dramatic.
- Respond with ONLY the summary text. No preamble like "Here is a summary".`;

const summarySchema = z.string().trim().min(1).max(1000);

export async function summarizeConversation(conversationId: string, userId: string) {
  const context = await buildConversationContext(conversationId, userId);

  const raw = await aiProvider.generateText(
    `Conversation to summarize:\n${context}`,
    SUMMARY_SYSTEM_INSTRUCTION,
  );

  const cleaned = raw.trim().replace(/^```(?:text)?/i, '').replace(/```$/, '').trim();
  const result = summarySchema.safeParse(cleaned);

  if (!result.success) {
    throw new AppError('AI returned an unusable summary', 502);
  }

  return result.data;
}


export async function summarizeUnreadMessages(conversationId: string, userId: string) {
  const context = await buildUnreadContext(conversationId, userId);

  const raw = await aiProvider.generateText(
    `Unread messages to summarize:\n${context}`,
    SUMMARY_SYSTEM_INSTRUCTION,
  );

  const cleaned = raw.trim().replace(/^```(?:text)?/i, '').replace(/```$/, '').trim();
  const result = summarySchema.safeParse(cleaned);

  if (!result.success) {
    throw new AppError('AI returned an unusable summary', 502);
  }

  return result.data;
}
const ASK_SYSTEM_INSTRUCTION = `You answer a question about a chat conversation, using ONLY the conversation text given to you.
Rules:
- If the answer isn't in the conversation, say plainly that it isn't mentioned. Do not guess or invent an answer.
- Answer in 1 to 3 plain sentences. No markdown, no headings.
- Do not add commentary beyond what was asked.`;

const askResponseSchema = z.string().trim().min(1).max(800);

export async function answerAboutConversation(conversationId: string, userId: string, question: string) {
  const context = await buildConversationContext(conversationId, userId);

  const raw = await aiProvider.generateText(
    `Conversation:\n${context}\n\nQuestion: ${question}`,
    ASK_SYSTEM_INSTRUCTION,
  );

  const cleaned = raw.trim().replace(/^```(?:text)?/i, '').replace(/```$/, '').trim();
  const result = askResponseSchema.safeParse(cleaned);

  if (!result.success) {
    throw new AppError('AI returned an unusable answer', 502);
  }

  return result.data;
}
const TASK_EXTRACTION_SYSTEM_INSTRUCTION = `You extract action items / tasks mentioned in a chat conversation.
Rules:
- Respond with ONLY a raw JSON array of strings. No markdown, no code fences, no explanation.
- Each item should be a short, clear task (who needs to do what, if mentioned), under 20 words.
- If the conversation mentions no actual tasks or action items, respond with an empty array: []
- Do NOT invent a task just to have something to return. An empty array is a correct answer when nothing was asked of anyone.
- Maximum 8 items.`;

const tasksResponseSchema = z.array(z.string().trim().min(1).max(200)).max(8);

export async function extractTasks(conversationId: string, userId: string) {
  const context = await buildConversationContext(conversationId, userId);

  const raw = await aiProvider.generateText(
    `Conversation:\n${context}`,
    TASK_EXTRACTION_SYSTEM_INSTRUCTION,
  );

  const parsed = extractJsonArray(raw);
  const result = tasksResponseSchema.safeParse(parsed);

  if (!result.success) {
    throw new AppError('AI returned tasks in an unexpected format', 502);
  }

  return result.data;
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