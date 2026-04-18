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

export function listMessages(conversationId: string): Promise<Message[]> {
  return request<Message[]>(`/api/conversations/${conversationId}/messages`)
}

export interface SendMessageResponse {
  reply: string
  user_message: Message
  assistant_message: Message
}

export function sendMessage(
  conversationId: string,
  message: string,
): Promise<SendMessageResponse> {
  return request<SendMessageResponse>(
    `/api/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    },
  )
}
