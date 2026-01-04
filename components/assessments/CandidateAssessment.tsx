'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Menu, X } from 'lucide-react'
import type { CandidateAssessmentProps } from '@/types/assessments'
import { ChatMessage } from './ChatMessage'
import { ProgressSidebar } from './ProgressSidebar'

export function CandidateAssessment({
  assessment,
  onSendMessage,
}: CandidateAssessmentProps) {
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [assessment.chatMessages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && onSendMessage) {
      onSendMessage(inputValue.trim())
      setInputValue('')
      setIsTyping(true)
      setTimeout(() => setIsTyping(false), 2000)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex h-screen bg-stone-50 dark:bg-stone-950">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar - Fixed, slides in */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <ProgressSidebar
          candidate={assessment.candidate}
          job={assessment.job}
          progress={assessment.progress}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Desktop Sidebar - Static, always visible */}
      <div className="hidden lg:block">
        <ProgressSidebar
          candidate={assessment.candidate}
          job={assessment.job}
          progress={assessment.progress}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-4 dark:border-stone-800 dark:bg-stone-900 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/20">
              <span className="text-lg font-bold text-white">H</span>
            </div>
            <div>
              <h1 className="font-heading text-lg font-semibold text-stone-900 dark:text-stone-100">
                HireBest Assessment
              </h1>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {assessment.job.title} at {assessment.job.company}
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="inline-flex items-center rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
              <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-teal-500" />
              Live Session
            </span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-6">
            {assessment.chatMessages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLatest={index === assessment.chatMessages.length - 1}
              />
            ))}

            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600">
                  <span className="text-sm font-semibold text-white">AI</span>
                </div>
                <div className="rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm dark:bg-stone-800">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 sm:p-6">
          <form onSubmit={handleSubmit} className="mx-auto max-w-2xl">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response..."
                rows={3}
                className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 pr-14 text-stone-900 placeholder-stone-400 transition-all focus:border-orange-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500 dark:focus:border-orange-600 dark:focus:bg-stone-800"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-600 hover:shadow-orange-500/40 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none dark:disabled:bg-stone-600"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-stone-400 dark:text-stone-500">
              Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
