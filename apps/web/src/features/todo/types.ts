export interface Todo {
  readonly id: string
  readonly title: string
  readonly completed: boolean
  readonly createdAt: string
}

export type TodoFilter = 'all' | 'active' | 'completed'

/**
 * Make illegal states unrepresentable. The shape `{ status: string; todos?: Todo[];
 * error?: string }` permits `{ status: 'loading', error: 'boom', todos: [...] }`, which
 * means nothing — and every component then has to defend against it.
 *
 * See docs/sdlc/08-coding-standards.md.
 */
export type TodosState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly todos: readonly Todo[] }
  | { readonly status: 'error'; readonly message: string }
