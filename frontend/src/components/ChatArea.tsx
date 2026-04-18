import { useEffect, useRef, useState } from 'react'
import { sendMessage } from '../api/conversations'
import type { Conversation, Message } from '../types'

interface ChatAreaProps {
  conversation: Conversation | null
  messages: Message[]
  onMessagesChange: (updater: (prev: Message[]) => Message[]) => void
  onConversationTitleChange: (id: string, title: string) => void
}

export default function ChatArea({
  conversation,
  messages,
  onMessagesChange,
  onConversationTitleChange,
}: ChatAreaProps) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInput('')
    setError(null)
    setLoading(false)
  }, [conversation?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend() {
    if (!conversation || !input.trim() || loading) return
    const text = input.trim()
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const data = await sendMessage(conversation.id, text)
      onMessagesChange((prev) => [...prev, data.user_message, data.assistant_message])
      if (messages.length === 0) {
        onConversationTitleChange(conversation.id, text.slice(0, 60))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-purple-600 text-sm select-none">Select a chat or start a new one</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-purple-700/50 shrink-0">
        <h2 className="text-base font-semibold text-purple-100 truncate">{conversation.title}</h2>
        <p className="text-xs text-purple-500">Powered by a very smart hardcoded backend</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !loading && (
          <p className="text-center text-purple-600 text-sm mt-8 select-none">
            Send a message to get started
          </p>
        )}

        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-purple-500 px-4 py-2.5 text-white text-sm shadow-md shadow-purple-950/40">
                  {msg.content}
                </div>
              </div>
            )
          }
          return (
            <div key={msg.id} className="flex justify-start">
              <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-purple-800/70 border border-purple-600/30 px-4 py-2.5 text-purple-100 text-sm shadow-md shadow-purple-950/40">
                {msg.content}
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-purple-800/70 border border-purple-600/30 px-4 py-3">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        {error != null && (
          <div className="flex justify-start">
            <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-red-900/50 border border-red-600/30 px-4 py-2.5 text-red-300 text-sm">
              {error}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-purple-700/50 flex gap-2 items-center shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Type a message…"
          className="flex-1 rounded-xl bg-purple-800/60 border border-purple-600/40 px-4 py-2.5 text-purple-100 placeholder-purple-500 text-sm outline-none focus:ring-2 focus:ring-purple-500/60 disabled:opacity-50 transition"
        />
        <button
          onClick={() => void handleSend()}
          disabled={loading || !input.trim()}
          className="rounded-xl bg-purple-500 hover:bg-purple-400 active:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 text-white font-semibold text-sm transition-colors duration-150 shadow-lg shadow-purple-950/40 cursor-pointer"
        >
          Send
        </button>
      </div>
    </div>
  )
}
