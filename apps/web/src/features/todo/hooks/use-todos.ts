import { useCallback, useEffect, useState } from 'react'
import { TodoApiError, todoApi } from '../api/todo.client'
import { type Todo, type TodosState } from '../types'

/**
 * Components render; hooks decide. All fetching, state transitions and error mapping
 * live here so the components stay dumb and trivially testable.
 */
export const useTodos = () => {
  const [state, setState] = useState<TodosState>({ status: 'loading' })
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      setState({ status: 'ready', todos: await todoApi.list() })
    } catch (error) {
      setState({ status: 'error', message: describe(error) })
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  /**
   * Applies an optimistic change, then reconciles with the server's response.
   *
   * On failure the previous list is restored rather than left in the optimistic
   * state — a UI that silently disagrees with the server is worse than a slow one.
   */
  const mutate = useCallback(
    async (
      optimistic: (todos: readonly Todo[]) => readonly Todo[],
      perform: () => Promise<void>,
    ) => {
      setActionError(null)

      const previous = state.status === 'ready' ? state.todos : undefined
      if (previous) setState({ status: 'ready', todos: optimistic(previous) })

      try {
        await perform()
      } catch (error) {
        if (previous) setState({ status: 'ready', todos: previous })
        setActionError(describe(error))
      }
    },
    [state],
  )

  const addTodo = useCallback(async (title: string) => {
    setActionError(null)
    try {
      const created = await todoApi.create(title)
      setState((current) =>
        current.status === 'ready'
          ? { status: 'ready', todos: [created, ...current.todos] }
          : current,
      )
    } catch (error) {
      setActionError(describe(error))
    }
  }, [])

  const toggleTodo = useCallback(
    (todo: Todo) =>
      mutate(
        (todos) => todos.map((t) => (t.id === todo.id ? { ...t, completed: !t.completed } : t)),
        async () => {
          await todoApi.update(todo.id, { completed: !todo.completed })
        },
      ),
    [mutate],
  )

  const removeTodo = useCallback(
    (todo: Todo) =>
      mutate(
        (todos) => todos.filter((t) => t.id !== todo.id),
        async () => {
          await todoApi.remove(todo.id)
        },
      ),
    [mutate],
  )

  return { state, actionError, addTodo, toggleTodo, removeTodo, reload: load }
}

const describe = (error: unknown): string =>
  error instanceof TodoApiError ? error.message : 'Something went wrong'
