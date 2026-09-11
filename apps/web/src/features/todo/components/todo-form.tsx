import { type FormEvent, useState } from 'react'
import { Button } from '../../../shared/components/button'

interface TodoFormProps {
  readonly onSubmit: (title: string) => void | Promise<void>
}

export const TodoForm = ({ onSubmit }: TodoFormProps) => {
  const [title, setTitle] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()

    // The server is the authority on what a valid title is; this only avoids a
    // pointless round trip for the obvious case. Duplicating the length rule here
    // would give it two homes and let them drift.
    if (title.trim().length === 0) return

    void onSubmit(title)
    setTitle('')
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor="todo-title">
        What needs doing?
      </label>
      <input
        id="todo-title"
        className="todo-form__input"
        placeholder="What needs doing?"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        autoComplete="off"
      />
      <Button type="submit" disabled={title.trim().length === 0}>
        Add
      </Button>
    </form>
  )
}
