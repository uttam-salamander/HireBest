import { createOpenAI } from '@ai-sdk/openai'

// OpenRouter provider using OpenAI-compatible API
export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'HireBest Assessment',
  },
})

// Get the configured model
export function getModel() {
  const modelId = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet'
  return openrouter(modelId)
}
