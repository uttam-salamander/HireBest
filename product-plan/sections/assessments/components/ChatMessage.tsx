import type { ChatMessage as ChatMessageType } from '../types'

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
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-md shadow-teal-500/20">
          <span className="text-sm font-semibold text-white">AI</span>
        </div>
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-500 shadow-md shadow-orange-500/20">
          <span className="text-sm font-semibold text-white">You</span>
        </div>
      )}

      {/* Message Bubble */}
      <div className={`max-w-[80%] ${isAI ? '' : 'text-right'}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-3 ${
            isAI
              ? 'rounded-tl-md bg-white text-stone-800 shadow-sm dark:bg-stone-800 dark:text-stone-200'
              : 'rounded-tr-md bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20'
          }`}
        >
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
            {message.content}
          </p>
        </div>
        <p
          className={`mt-1.5 text-xs text-stone-400 dark:text-stone-500 ${
            isAI ? '' : 'mr-1'
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  )
}
