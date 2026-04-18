import { useState } from 'react'
import type { Conversation } from '../types'

interface SidebarProps {
  conversations: Conversation[]
  activeId: string | null
  loading: boolean
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}

export default function Sidebar({
  conversations,
  activeId,
  loading,
  onSelect,
  onNew,
  onDelete,
}: SidebarProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  function handleDeleteClick(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setConfirmingId(id)
  }

  function handleConfirm(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setConfirmingId(null)
    onDelete(id)
  }

  function handleCancel(e: React.MouseEvent) {
    e.stopPropagation()
    setConfirmingId(null)
  }

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-purple-950/80 border-r border-purple-700/50">
      <div className="px-4 py-4 border-b border-purple-700/50">
        <button
          onClick={onNew}
          disabled={loading}
          className="w-full rounded-xl bg-purple-500 hover:bg-purple-400 active:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed py-2 px-3 text-white font-semibold text-sm transition-colors duration-150 cursor-pointer"
        >
          + New Chat
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 && (
          <p className="px-4 py-3 text-xs text-purple-600 select-none">No chats yet</p>
        )}
        {conversations.map((c) => {
          const isActive = c.id === activeId
          const isConfirming = c.id === confirmingId

          if (isConfirming) {
            return (
              <div
                key={c.id}
                className="flex items-center gap-1 px-2 py-2 bg-red-900/30 border-y border-red-700/30"
              >
                <span className="flex-1 text-xs text-red-300 truncate pl-2">Delete?</span>
                <button
                  onClick={(e) => handleConfirm(e, c.id)}
                  className="shrink-0 rounded-md bg-red-700/60 hover:bg-red-600/70 px-2 py-1 text-xs text-red-100 font-medium cursor-pointer transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={handleCancel}
                  className="shrink-0 rounded-md bg-purple-700/50 hover:bg-purple-600/60 px-2 py-1 text-xs text-purple-200 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            )
          }

          return (
            <div
              key={c.id}
              className={[
                'group relative flex items-center transition-colors duration-100',
                isActive
                  ? 'bg-purple-700/50 text-purple-100'
                  : 'text-purple-300 hover:bg-purple-800/40 hover:text-purple-100',
              ].join(' ')}
            >
              <button
                onClick={() => onSelect(c.id)}
                className={[
                  'flex-1 text-left pl-4 pr-10 py-2.5 text-sm truncate cursor-pointer',
                  isActive ? 'font-medium' : '',
                ].join(' ')}
              >
                {c.title}
              </button>
              <button
                onClick={(e) => handleDeleteClick(e, c.id)}
                aria-label="Delete chat"
                title="Delete chat"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-purple-400 hover:text-red-300 hover:bg-red-900/40 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3.5 h-3.5"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
