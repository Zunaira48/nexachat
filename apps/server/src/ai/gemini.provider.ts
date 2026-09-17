import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';
import type { AIProvider } from './provider';
import { AppError } from '../utils/AppError';

const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export const geminiProvider: AIProvider = {
  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    try {
      const response = await client.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: prompt,
        ...(systemInstruction ? { config: { systemInstruction } } : {}),
      });

      const text = response.text;

      if (!text || !text.trim()) {
        throw new AppError('AI provider returned an empty response', 502);
      }

      return text;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('AI service is temporarily unavailable', 502);
    }
  },
};