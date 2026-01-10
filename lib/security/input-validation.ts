import { z } from 'zod'

// Maximum sizes
export const MAX_MESSAGE_LENGTH = 5000 // 5KB for candidate messages
export const MAX_RESPONSE_LENGTH = 10000 // 10KB for AI responses
export const MAX_TOKEN_LENGTH = 64 // Token should be ~32 chars from nanoid

// Suspicious patterns for prompt injection detection
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  /disregard\s+(all\s+)?(previous|prior|above)/i,
  /forget\s+(everything|all|your\s+instructions)/i,
  /you\s+are\s+now\s+in\s+(debug|admin|developer)\s+mode/i,
  /system\s*:\s*/i,
  /\[\s*SYSTEM\s*\]/i,
  /reveal\s+(the\s+)?(scoring\s+)?rubric/i,
  /show\s+(me\s+)?(the\s+)?(expected|correct)\s+answer/i,
  /change\s+(my\s+)?score\s+to/i,
  /give\s+me\s+(a\s+)?(full|perfect|100)\s+score/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /act\s+as\s+(if|though)/i,
  /jailbreak/i,
  /bypass\s+(the\s+)?filter/i,
]

// Token format validation
export const tokenSchema = z.string()
  .min(20, 'Invalid token format')
  .max(MAX_TOKEN_LENGTH, 'Invalid token format')
  .regex(/^[A-Za-z0-9_-]+$/, 'Invalid token format')

// Chat message validation
export const chatMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(MAX_MESSAGE_LENGTH, `Message too long (max ${MAX_MESSAGE_LENGTH} characters)`)
    .transform(sanitizeMessage),
})

// Sanitize message content
export function sanitizeMessage(message: string): string {
  // Remove null bytes and control characters (except newlines and tabs)
  let sanitized = message.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim()

  return sanitized
}

// Check for prompt injection attempts
export function detectPromptInjection(message: string): {
  detected: boolean
  patterns: string[]
} {
  const detectedPatterns: string[] = []

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(message)) {
      detectedPatterns.push(pattern.source)
    }
  }

  return {
    detected: detectedPatterns.length > 0,
    patterns: detectedPatterns,
  }
}

// Escape content for safe inclusion in prompts
export function escapeForPrompt(content: string): string {
  // Replace potential injection markers
  return content
    .replace(/```/g, '\\`\\`\\`')
    .replace(/\[SYSTEM\]/gi, '[USER]')
    .replace(/\[ADMIN\]/gi, '[USER]')
    .replace(/\[ASSISTANT\]/gi, '[USER]')
}

// Validate token format (constant-time-ish comparison for format check)
export function isValidTokenFormat(token: string): boolean {
  const result = tokenSchema.safeParse(token)
  return result.success
}
