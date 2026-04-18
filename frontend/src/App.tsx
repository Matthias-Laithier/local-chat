import { useCallback, useEffect, useState } from 'react'
import {
  createConversation,
  deleteConversation,
  listConversations,
  listMessages,
} from './api/conversations'
import ChatArea from './components/ChatArea'
import Sidebar from './components/Sidebar'
import type { Conversation, Message } from './types'

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [sidebarLoading, setSidebarLoading] = useState(false)

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null

  useEffect(() => {
    void listConversations().then(setConversations)
  }, [])

  const handleSelect = useCallback(
    async (id: string) => {
      if (id === activeId) return
      setActiveId(id)
      const msgs = await listMessages(id)
      setMessages(msgs)
    },
    [activeId],
  )

  const handleNew = useCallback(async () => {
    setSidebarLoading(true)
    try {
      const conv = await createConversation()
      setConversations((prev) => [conv, ...prev])
      setActiveId(conv.id)
      setMessages([])
    } finally {
      setSidebarLoading(false)
    }
  }, [])

  const handleMessagesChange = useCallback(
    (updater: (prev: Message[]) => Message[]) => {
      setMessages(updater)
    },
    [],
  )

  const handleConversationTitleChange = useCallback(
    (id: string, title: string) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c)),
      )
    },
    [],
  )

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteConversation(id)
      } catch (err) {
        console.error('Failed to delete conversation', err)
        return
      }
      setConversations((prev) => prev.filter((c) => c.id !== id))
      setActiveId((prev) => (prev === id ? null : prev))
    },
    [],
  )

  useEffect(() => {
    if (activeId == null) setMessages([])
  }, [activeId])

  return (
    <div className="min-h-screen bg-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[85vh] flex bg-purple-900/60 border border-purple-700/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-purple-950/80 overflow-hidden">
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          loading={sidebarLoading}
          onSelect={(id) => void handleSelect(id)}
          onNew={() => void handleNew()}
          onDelete={(id) => void handleDelete(id)}
        />
        <ChatArea
          conversation={activeConversation}
          messages={messages}
          onMessagesChange={handleMessagesChange}
          onConversationTitleChange={handleConversationTitleChange}
        />
      </div>
    </div>
  )
}
