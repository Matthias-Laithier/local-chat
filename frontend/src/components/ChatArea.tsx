import { useEffect, useRef, useState } from 'react'
import { streamMessage } from '../api/conversations'
import type { Conversation, Message } from '../types'
import ThinkingPanel from './ThinkingPanel'

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
  const [streamingReply, setStreamingReply] = useState<string | null>(null)
  const [streamingThinking, setStreamingThinking] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInput('')
    setError(null)
    setLoading(false)
    setStreamingReply(null)
    setStreamingThinking('')
  }, [conversation?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingReply, streamingThinking, loading])

  async function handleSend() {
    if (!conversation || !input.trim() || loading) return
    const text = input.trim()
    setInput('')
    setError(null)
    setLoading(true)
    setStreamingReply('')
    setStreamingThinking('')

    const optimisticUserMsg: Message = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversation.id,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    onMessagesChange((prev) => [...prev, optimisticUserMsg])

    let accumulatedContent = ''
    let accumulatedThinking = ''
    try {
      await streamMessage(conversation.id, text, (event) => {
        switch (event.type) {
          case 'user_message':
            onMessagesChange((prev) =>
              prev.map((m) => (m.id === optimisticUserMsg.id ? event.message : m)),
            )
            break
          case 'title':
            onConversationTitleChange(conversation.id, event.title)
            break
          case 'thinking_delta':
            accumulatedThinking += event.content
            setStreamingThinking(accumulatedThinking)
            break
          case 'delta':
            accumulatedContent += event.content
            setStreamingReply(accumulatedContent)
            break
          case 'assistant_message':
            onMessagesChange((prev) => [...prev, event.message])
            setStreamingReply(null)
            setStreamingThinking('')
            break
          case 'error':
            setError(event.detail)
            setStreamingReply(null)
            setStreamingThinking('')
            break
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStreamingReply(null)
      setStreamingThinking('')
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

  const isStreaming = streamingReply != null
  const streamingContentEmpty = streamingReply === ''

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-purple-700/50 shrink-0">
        <h2 className="text-base font-semibold text-purple-100 truncate">{conversation.title}</h2>
        <p className="text-xs text-purple-500">Streaming via Ollama</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !isStreaming && !loading && (
          <p className="text-center text-purple-600 text-sm mt-8 select-none">
            Send a message to get started
          </p>
        )}

        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-purple-500 px-4 py-2.5 text-white text-sm shadow-md shadow-purple-950/40 whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
              </div>
            )
          }
          return (
            <div key={msg.id} className="flex justify-start">
              <div className="max-w-[75%] flex flex-col">
                {msg.thinking && <ThinkingPanel thinking={msg.thinking} />}
                <div className="rounded-2xl rounded-bl-sm bg-purple-800/70 border border-purple-600/30 px-4 py-2.5 text-purple-100 text-sm shadow-md shadow-purple-950/40 whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}

        {isStreaming && (
          <div className="flex justify-start">
            <div className="max-w-[75%] flex flex-col">
              {streamingThinking !== '' && (
                <ThinkingPanel
                  thinking={streamingThinking}
                  streaming={streamingContentEmpty}
                  defaultOpen={streamingContentEmpty}
                />
              )}
              {!streamingContentEmpty && (
                <div className="rounded-2xl rounded-bl-sm bg-purple-800/70 border border-purple-600/30 px-4 py-2.5 text-purple-100 text-sm shadow-md shadow-purple-950/40 whitespace-pre-wrap break-words">
                  {streamingReply}
                  <span className="inline-block w-1.5 h-4 align-[-2px] ml-0.5 bg-purple-300 animate-pulse" />
                </div>
              )}
              {streamingContentEmpty && streamingThinking === '' && (
                <div className="rounded-2xl rounded-bl-sm bg-purple-800/70 border border-purple-600/30 px-4 py-3 shadow-md shadow-purple-950/40">
                  <span className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              )}
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
