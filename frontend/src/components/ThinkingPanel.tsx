import { useState } from 'react'

interface ThinkingPanelProps {
  thinking: string
  streaming?: boolean
  defaultOpen?: boolean
}

export default function ThinkingPanel({
  thinking,
  streaming = false,
  defaultOpen = false,
}: ThinkingPanelProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mb-1.5 rounded-xl border border-purple-700/40 bg-purple-950/50 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3 py-1.5 flex items-center gap-2 text-xs text-purple-300 hover:text-purple-100 hover:bg-purple-900/40 transition-colors cursor-pointer"
      >
        <span
          className={[
            'inline-block transition-transform duration-150 text-purple-500',
            open ? 'rotate-90' : '',
          ].join(' ')}
        >
          {'>'}
        </span>
        <span className="font-medium tracking-wide uppercase">
          {streaming ? 'Thinking…' : 'Thought process'}
        </span>
        {streaming && (
          <span className="flex gap-0.5 ml-1">
            <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce [animation-delay:0ms]" />
            <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce [animation-delay:150ms]" />
            <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce [animation-delay:300ms]" />
          </span>
        )}
      </button>
      {open && (
        <div className="px-3 py-2 border-t border-purple-700/40 text-xs text-purple-300/90 whitespace-pre-wrap break-words font-mono leading-relaxed max-h-60 overflow-y-auto">
          {thinking}
        </div>
      )}
    </div>
  )
}
