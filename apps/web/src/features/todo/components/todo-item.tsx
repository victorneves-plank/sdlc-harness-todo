import { Button } from '../../../shared/components/button'
import { type Todo } from '../types'

interface TodoItemProps {
  readonly todo: Todo
  readonly onToggle: (todo: Todo) => void
  readonly onRemove: (todo: Todo) => void
}

export const TodoItem = ({ todo, onToggle, onRemove }: TodoItemProps) => (
  <li className={`todo-item ${todo.completed ? 'todo-item--completed' : ''}`.trim()}>
    <label className="todo-item__label">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo)}
        // The accessible name is the title, so the checkbox is addressable by what it
        // controls -- which is what makes `getByRole('checkbox', { name: 'Buy milk' })`
        // work in tests and a screen reader usable in practice. Same discipline.
        aria-label={todo.title}
      />
      <span className="todo-item__title">{todo.title}</span>
    </label>

    <Button variant="ghost" onClick={() => onRemove(todo)} aria-label={`Delete ${todo.title}`}>
      ×
    </Button>
  </li>
)
