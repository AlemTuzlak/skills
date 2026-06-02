import { chat } from '@tanstack/ai';
import { ollamaText } from '@tanstack/ai-ollama';
import { openaiText } from '@tanstack/ai-openai';
import { outputSchema, type Output } from './schemas';
import { makeSystemPrompt } from './prompts';

const { OPENAI_API_KEY: RAW_OPENAI_KEY = '' } = process.env as Record<string, string>;

export async function generateMetadata(transcript: string): Promise<Output> {
  const adapter = RAW_OPENAI_KEY !== ''
    ? openaiText('gpt-5.5')
    : ollamaText('gpt-oss:20b');

  const response = await chat({
    adapter,
    systemPrompts: makeSystemPrompt(),
    outputSchema,
    messages: [
      {
        role: 'user',
        content: `\nTranscript of the video:\n${transcript}`,
      },
    ],
  });

  return response;
}
