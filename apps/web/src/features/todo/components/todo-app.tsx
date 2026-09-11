import { useMemo, useState } from 'react'
import { Button } from '../../../shared/components/button'
import { useTodos } from '../hooks/use-todos'
import { type Todo, type TodoFilter } from '../types'
import { TodoFilters } from './todo-filters'
import { TodoForm } from './todo-form'
import { TodoList } from './todo-list'

const EMPTY_MESSAGE: Readonly<Record<TodoFilter, string>> = {
  all: 'Nothing here yet. Add your first todo above.',
  active: 'Nothing outstanding. Everything is done.',
  completed: 'Nothing completed yet.',
}

const matches = (todo: Todo, filter: TodoFilter): boolean =>
  filter === 'all' || (filter === 'active' ? !todo.completed : todo.completed)

export const TodoApp = () => {
  const { state, actionError, addTodo, toggleTodo, removeTodo, reload } = useTodos()
  const [filter, setFilter] = useState<TodoFilter>('all')

  const todos = state.status === 'ready' ? state.todos : []

  const counts = useMemo(
    () => ({
      all: todos.length,
      active: todos.filter((todo) => !todo.completed).length,
      completed: todos.filter((todo) => todo.completed).length,
    }),
    [todos],
  )

  const visible = useMemo(() => todos.filter((todo) => matches(todo, filter)), [todos, filter])

  return (
    <main className="todo-app">
      <header className="todo-app__header">
        <h1>Todos</h1>
        <p className="todo-app__note">
          Stored in the API's memory. Restart the server and this list is empty again.
        </p>
      </header>

      <TodoForm onSubmit={addTodo} />

      {actionError && (
        <p className="alert alert--error" role="alert">
          {actionError}
        </p>
      )}

      {state.status === 'loading' && <p className="todo-app__status">Loading…</p>}

      {state.status === 'error' && (
        <div className="alert alert--error" role="alert">
          <p>{state.message}</p>
          <Button variant="ghost" onClick={() => void reload()}>
            Try again
          </Button>
        </div>
      )}

      {state.status === 'ready' && (
        <>
          <TodoFilters value={filter} counts={counts} onChange={setFilter} />
          <TodoList
            todos={visible}
            emptyMessage={EMPTY_MESSAGE[filter]}
            onToggle={(todo) => void toggleTodo(todo)}
            onRemove={(todo) => void removeTodo(todo)}
          />
        </>
      )}
    </main>
  )
}
