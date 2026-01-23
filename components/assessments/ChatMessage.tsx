'use client'

import type { ChatMessage as ChatMessageType } from '@/types/assessments'

interface ChatMessageProps {
  message: ChatMessageType
  isLatest?: boolean
}

export function ChatMessage({ message, isLatest }: ChatMessageProps) {
  const isAI = message.role === 'ai'

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <div
      className={`flex items-start gap-3 ${isLatest ? 'animate-fade-in' : ''} ${
        isAI ? '' : 'flex-row-reverse'
      }`}
    >
      {/* Avatar */}
      {isAI ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent">
          <span className="text-sm font-semibold text-accent-foreground">AI</span>
        </div>
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary">
          <span className="text-sm font-semibold text-primary-foreground">You</span>
        </div>
      )}

      {/* Message Bubble */}
      <div className={`max-w-[80%] ${isAI ? '' : 'text-right'}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-3 ${
            isAI
              ? 'rounded-tl-md bg-card text-foreground shadow-sm border border-border'
              : 'rounded-tr-md bg-primary text-primary-foreground'
          }`}
        >
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
            {message.content}
          </p>
        </div>
        <p
          className={`mt-1.5 text-xs text-muted-foreground ${
            isAI ? '' : 'mr-1'
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  )
}
