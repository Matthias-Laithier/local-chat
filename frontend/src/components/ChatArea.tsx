import { useEffect, useRef, useState } from 'react'
import { streamMessage } from '../api/conversations'
import type { Conversation, Message } from '../types'
import MarkdownMessage from './MarkdownMessage'
import ThinkingPanel from './ThinkingPanel'

interface ChatAreaProps {
  conversation: Conversation | null
  messages: Message[]
  onMessagesChange: (updater: (prev: Message[]) => Message[]) => void
  onConversationTitleChange: (id: string, title: string) => void
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

export default function ChatArea({
  conversation,
  messages,
  onMessagesChange,
  onConversationTitleChange,
}: ChatAreaProps) {
  const [input, setInput] = useState('')
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [streamingReply, setStreamingReply] = useState<string | null>(null)
  const [streamingThinking, setStreamingThinking] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [webSearch, setWebSearch] = useState(false)
  const [webSearchStatus, setWebSearchStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInput('')
    setPendingImage(null)
    setError(null)
    setLoading(false)
    setStreamingReply(null)
    setStreamingThinking('')
    setWebSearchStatus(null)
  }, [conversation?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingReply, streamingThinking, loading])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(`Image too large (max ${MAX_IMAGE_BYTES / 1024 / 1024} MB)`)
      return
    }
    setError(null)
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setPendingImage(dataUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read image')
    }
  }

  async function handleSend() {
    if (!conversation || loading) return
    const text = input.trim()
    if (!text && !pendingImage) return

    const imageToSend = pendingImage
    setInput('')
    setPendingImage(null)
    setError(null)
    setLoading(true)
    setStreamingReply('')
    setStreamingThinking('')
    setWebSearchStatus(
      webSearch && text.trim() ? 'Searching the web…' : null,
    )

    const optimisticUserMsg: Message = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversation.id,
      role: 'user',
      content: text,
      image_data_url: imageToSend,
      created_at: new Date().toISOString(),
    }
    onMessagesChange((prev) => [...prev, optimisticUserMsg])

    let accumulatedContent = ''
    let accumulatedThinking = ''
    try {
      await streamMessage(
        conversation.id,
        text,
        imageToSend,
        (event) => {
          switch (event.type) {
            case 'user_message':
              onMessagesChange((prev) =>
                prev.map((m) => (m.id === optimisticUserMsg.id ? event.message : m)),
              )
              break
            case 'title':
              onConversationTitleChange(conversation.id, event.title)
              break
            case 'web_search':
              setWebSearchStatus(
                event.result_count > 0
                  ? `Web search: ${event.result_count} result${event.result_count === 1 ? '' : 's'} (DuckDuckGo)`
                  : 'Web search returned no results (check network or try again)',
              )
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
              setWebSearchStatus(null)
              break
            case 'error':
              setError(event.detail)
              setStreamingReply(null)
              setStreamingThinking('')
              setWebSearchStatus(null)
              break
          }
        },
        webSearch,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStreamingReply(null)
      setStreamingThinking('')
      setWebSearchStatus(null)
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
  const canSend = !loading && (input.trim().length > 0 || pendingImage != null)

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-purple-700/50 shrink-0">
        <h2 className="text-base font-semibold text-purple-100 truncate">{conversation.title}</h2>
        <p
          className={`text-xs ${webSearchStatus ? 'text-emerald-400/95' : 'text-purple-500'}`}
        >
          {webSearchStatus ?? 'Streaming via Ollama'}
        </p>
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
                <div className="max-w-[75%] flex flex-col items-end gap-1.5">
                  {msg.image_data_url && (
                    <img
                      src={msg.image_data_url}
                      alt="attachment"
                      className="max-h-64 rounded-xl border border-purple-400/40 shadow-md shadow-purple-950/40 object-contain"
                    />
                  )}
                  {msg.content && (
                    <div className="rounded-2xl rounded-br-sm bg-purple-500 px-4 py-2.5 text-white text-sm shadow-md shadow-purple-950/40 whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            )
          }
          return (
            <div key={msg.id} className="flex justify-start">
              <div className="max-w-[75%] flex flex-col">
                {msg.thinking && <ThinkingPanel thinking={msg.thinking} />}
                <div className="rounded-2xl rounded-bl-sm bg-purple-800/70 border border-purple-600/30 px-4 py-2.5 text-purple-100 text-sm shadow-md shadow-purple-950/40 break-words">
                  <MarkdownMessage>{msg.content}</MarkdownMessage>
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
                <div className="rounded-2xl rounded-bl-sm bg-purple-800/70 border border-purple-600/30 px-4 py-2.5 text-purple-100 text-sm shadow-md shadow-purple-950/40 break-words">
                  <MarkdownMessage>{streamingReply ?? ''}</MarkdownMessage>
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

      {/* Pending image preview */}
      {pendingImage && (
        <div className="px-4 pt-3 shrink-0">
          <div className="inline-flex items-center gap-2 rounded-xl bg-purple-800/60 border border-purple-600/40 p-1.5 pr-3">
            <img
              src={pendingImage}
              alt="pending attachment"
              className="h-14 w-14 rounded-lg object-cover"
            />
            <span className="text-xs text-purple-300">Image attached</span>
            <button
              onClick={() => setPendingImage(null)}
              className="text-purple-300 hover:text-purple-100 rounded-full w-6 h-6 flex items-center justify-center hover:bg-purple-700/50 transition cursor-pointer"
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-purple-700/50 flex flex-col gap-2 shrink-0">
        <label className="flex items-center gap-2 text-xs text-purple-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={webSearch}
            onChange={(e) => setWebSearch(e.target.checked)}
            disabled={loading}
            className="rounded border-purple-500 bg-purple-900/40 text-purple-400 focus:ring-purple-500/60"
          />
          Search the web (DuckDuckGo)
        </label>
        <div className="flex gap-2 items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => void handleFileChange(e)}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          title="Attach image"
          aria-label="Attach image"
          className="shrink-0 rounded-xl bg-purple-800/60 border border-purple-600/40 hover:bg-purple-700/60 hover:border-purple-500/60 disabled:opacity-40 disabled:cursor-not-allowed w-10 h-10 flex items-center justify-center text-purple-300 hover:text-purple-100 transition cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 17.98 8.78l-8.58 8.57a2 2 0 0 1-2.83-2.83l7.91-7.91" />
          </svg>
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder={pendingImage ? 'Add a message (optional)…' : 'Type a message…'}
          className="flex-1 rounded-xl bg-purple-800/60 border border-purple-600/40 px-4 py-2.5 text-purple-100 placeholder-purple-500 text-sm outline-none focus:ring-2 focus:ring-purple-500/60 disabled:opacity-50 transition"
        />
        <button
          onClick={() => void handleSend()}
          disabled={!canSend}
          className="rounded-xl bg-purple-500 hover:bg-purple-400 active:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 text-white font-semibold text-sm transition-colors duration-150 shadow-lg shadow-purple-950/40 cursor-pointer"
        >
          Send
        </button>
        </div>
      </div>
    </div>
  )
}
