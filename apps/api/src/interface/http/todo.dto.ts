import { type Todo } from '../../domain/todo/todo.js'

/**
 * The wire shape. Kept separate from the entity on purpose: the entity is free to
 * change its internals without breaking clients, and `createdAt` is serialised as an
 * ISO string rather than leaking a Date through JSON.stringify by accident.
 */
export interface TodoDto {
  readonly id: string
  readonly title: string
  readonly completed: boolean
  readonly createdAt: string
}

export const toTodoDto = (todo: Todo): TodoDto => ({
  id: todo.id,
  title: todo.title,
  completed: todo.completed,
  createdAt: todo.createdAt.toISOString(),
})
