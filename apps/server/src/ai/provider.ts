// The rest of the app calls these functions, never the Gemini SDK
// directly — swapping providers later means rewriting gemini.provider.ts
// only, nothing that calls into it.
export interface AIProvider {
  generateText(prompt: string, systemInstruction?: string): Promise<string>;
}