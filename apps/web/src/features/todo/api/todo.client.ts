import { type Todo } from '../types'

const BASE_URL = (import.meta.env['VITE_API_URL'] as string | undefined) ?? 'http://localhost:3000'

/**
 * The only module that knows about fetch, URLs and the wire format. A component that
 * calls fetch directly is untestable without a network mock and unusable anywhere else.
 */
export class TodoApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'TodoApiError'
  }
}

interface ErrorBody {
  error?: { code?: string; message?: string }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response

  try {
    response = await fetch(`${BASE_URL}/api${path}`, {
      headers: { 'content-type': 'application/json' },
      ...init,
    })
  } catch {
    // A network failure is indistinguishable from a stopped server here, and the
    // useful thing to tell the user is the same either way.
    throw new TodoApiError('NETWORK_ERROR', 'Could not reach the API. Is it running?')
  }

  if (response.status === 204) {
    return undefined as T
  }

  const body: unknown = await response.json().catch(() => ({}))

  if (!response.ok) {
    const { error } = body as ErrorBody
    throw new TodoApiError(error?.code ?? 'UNKNOWN', error?.message ?? 'Something went wrong')
  }

  return body as T
}

export const todoApi = {
  list: () => request<{ todos: Todo[] }>('/todos').then((body) => body.todos),

  create: (title: string) =>
    request<{ todo: Todo }>('/todos', {
      method: 'POST',
      body: JSON.stringify({ title }),
    }).then((body) => body.todo),

  update: (id: string, changes: { title?: string; completed?: boolean }) =>
    request<{ todo: Todo }>(`/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    }).then((body) => body.todo),

  remove: (id: string) => request<void>(`/todos/${id}`, { method: 'DELETE' }),
}
