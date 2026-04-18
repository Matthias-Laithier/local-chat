import { useEffect, useRef, useState } from 'react'
import { sendMessage } from './api/chat'

interface Message {
  id: number
  role: 'user' | 'assistant' | 'error'
  text: string
}

let nextId = 0

export default function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages((prev) => [...prev, { id: nextId++, role: 'user', text }])
    setLoading(true)

    try {
      const data = await sendMessage(text)
      setMessages((prev) => [
        ...prev,
        { id: nextId++, role: 'assistant', text: data.reply },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId++,
          role: 'error',
          text: err instanceof Error ? err.message : 'Unknown error',
        },
      ])
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

  return (
    <div className="min-h-screen bg-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl h-[80vh] flex flex-col bg-purple-900/60 border border-purple-700/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-purple-950/80 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-purple-700/50">
          <h1 className="text-lg font-bold text-purple-100 tracking-tight">Local Chat</h1>
          <p className="text-xs text-purple-400">Powered by a very smart hardcoded backend</p>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <p className="text-center text-purple-600 text-sm mt-8 select-none">
              Send a message to get started
            </p>
          )}

          {messages.map((msg) => {
            if (msg.role === 'user') {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-purple-500 px-4 py-2.5 text-white text-sm shadow-md shadow-purple-950/40">
                    {msg.text}
                  </div>
                </div>
              )
            }
            if (msg.role === 'assistant') {
              return (
                <div key={msg.id} className="flex justify-start">
                  <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-purple-800/70 border border-purple-600/30 px-4 py-2.5 text-purple-100 text-sm shadow-md shadow-purple-950/40">
                    {msg.text}
                  </div>
                </div>
              )
            }
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-red-900/50 border border-red-600/30 px-4 py-2.5 text-red-300 text-sm">
                  {msg.text}
                </div>
              </div>
            )
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-purple-800/70 border border-purple-600/30 px-4 py-3 shadow-md shadow-purple-950/40">
                <span className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-purple-700/50 flex gap-2 items-center">
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
    </div>
  )
}
