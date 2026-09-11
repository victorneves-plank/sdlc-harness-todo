import { type Todo } from '../types'
import { TodoItem } from './todo-item'

interface TodoListProps {
  readonly todos: readonly Todo[]
  readonly emptyMessage: string
  readonly onToggle: (todo: Todo) => void
  readonly onRemove: (todo: Todo) => void
}

export const TodoList = ({ todos, emptyMessage, onToggle, onRemove }: TodoListProps) => {
  if (todos.length === 0) {
    return <p className="todo-list__empty">{emptyMessage}</p>
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onRemove={onRemove} />
      ))}
    </ul>
  )
}
