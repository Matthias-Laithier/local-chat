import type { Conversation, Message } from '../types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

export function listConversations(): Promise<Conversation[]> {
  return request<Conversation[]>('/api/conversations')
}

export function createConversation(): Promise<Conversation> {
  return request<Conversation>('/api/conversations', { method: 'POST' })
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }
}

export function listMessages(conversationId: string): Promise<Message[]> {
  return request<Message[]>(`/api/conversations/${conversationId}/messages`)
}

export type StreamEvent =
  | { type: 'user_message'; message: Message }
  | { type: 'title'; title: string }
  | { type: 'thinking_delta'; content: string }
  | { type: 'delta'; content: string }
  | { type: 'assistant_message'; message: Message }
  | { type: 'error'; detail: string }

export async function streamMessage(
  conversationId: string,
  message: string,
  imageDataUrl: string | null,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  const response = await fetch(
    `/api/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, image_data_url: imageDataUrl }),
    },
  )
  if (!response.ok || !response.body) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .getReader()

  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += value
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed === '') continue
      onEvent(JSON.parse(trimmed) as StreamEvent)
    }
  }
  const tail = buffer.trim()
  if (tail !== '') {
    onEvent(JSON.parse(tail) as StreamEvent)
  }
}
