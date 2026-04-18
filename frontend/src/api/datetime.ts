export interface DateTimeResponse {
  datetime: string
}

export async function fetchDateTime(): Promise<DateTimeResponse> {
  const response = await fetch('/api/datetime')
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<DateTimeResponse>
}
