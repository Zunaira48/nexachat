import { geminiProvider } from './gemini.provider';

// Single point of provider selection. To switch providers later,
// change this one line — nothing else in the app needs to know.
export const aiProvider = geminiProvider;