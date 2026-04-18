import type { Conversation } from '../types'

interface SidebarProps {
  conversations: Conversation[]
  activeId: string | null
  loading: boolean
  onSelect: (id: string) => void
  onNew: () => void
}

export default function Sidebar({
  conversations,
  activeId,
  loading,
  onSelect,
  onNew,
}: SidebarProps) {
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
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={[
              'w-full text-left px-4 py-2.5 text-sm truncate transition-colors duration-100 cursor-pointer',
              c.id === activeId
                ? 'bg-purple-700/50 text-purple-100 font-medium'
                : 'text-purple-300 hover:bg-purple-800/40 hover:text-purple-100',
            ].join(' ')}
          >
            {c.title}
          </button>
        ))}
      </nav>
    </aside>
  )
}
