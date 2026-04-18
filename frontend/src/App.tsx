import { useState } from 'react'
import { fetchDateTime } from './api/datetime'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function App() {
  const [status, setStatus] = useState<Status>('idle')
  const [datetime, setDatetime] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFetch() {
    setStatus('loading')
    setError(null)
    try {
      const data = await fetchDateTime()
      setDatetime(data.datetime)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  const formatted =
    datetime != null
      ? new Intl.DateTimeFormat(undefined, {
          dateStyle: 'full',
          timeStyle: 'long',
        }).format(new Date(datetime))
      : null

  return (
    <div className="min-h-screen bg-purple-950 flex items-center justify-center p-6">
      <div className="bg-purple-900/60 border border-purple-700/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-purple-950/80 p-10 w-full max-w-md flex flex-col items-center gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-purple-100">
            What time is it?
          </h1>
          <p className="text-purple-400 text-sm">
            Ask the server for the current date and time
          </p>
        </div>

        <button
          onClick={handleFetch}
          disabled={status === 'loading'}
          className="w-full py-3 px-6 rounded-xl bg-purple-500 hover:bg-purple-400 active:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-base transition-colors duration-150 shadow-lg shadow-purple-900/60 cursor-pointer"
        >
          {status === 'loading' ? 'Fetching…' : 'Get current date & time'}
        </button>

        {status === 'success' && formatted != null && (
          <div className="w-full rounded-xl bg-purple-800/50 border border-purple-600/40 px-6 py-5 text-center space-y-1">
            <p className="text-xs uppercase tracking-widest text-purple-400 font-medium">
              Server time (UTC)
            </p>
            <p className="text-purple-100 font-semibold text-lg leading-snug">
              {formatted}
            </p>
            <p className="text-purple-500 text-xs font-mono">{datetime}</p>
          </div>
        )}

        {status === 'error' && error != null && (
          <div className="w-full rounded-xl bg-red-900/40 border border-red-600/40 px-6 py-4 text-center">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
