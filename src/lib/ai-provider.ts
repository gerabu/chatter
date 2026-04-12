import { createOllama } from 'ollama-ai-provider-v2';

export const ollama = createOllama({
  baseURL: 'http://localhost:11434/api',
});
