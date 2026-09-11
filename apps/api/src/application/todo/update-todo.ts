import { type Todo } from '../../domain/todo/todo.js'
import { type TodoId } from '../../domain/todo/todo-id.js'
import { TodoNotFoundError } from '../../domain/todo/todo.errors.js'
import { type TodoRepository } from '../../domain/todo/todo.repository.js'

export interface TodoChanges {
  readonly title?: string
  readonly completed?: boolean
}

/**
 * Applies a partial change to a todo.
 *
 * Both fields are optional and applied independently, so PATCH with only
 * `{ completed }` cannot accidentally clear the title — the lost-update bug that
 * a full PUT invites when two clients hold stale copies.
 */
export class UpdateTodo {
  constructor(private readonly todos: TodoRepository) {}

  execute(id: TodoId, changes: TodoChanges): Todo {
    const existing = this.todos.findById(id)

    if (!existing) {
      throw new TodoNotFoundError(id)
    }

    let updated = existing
    if (changes.title !== undefined) updated = updated.withTitle(changes.title)
    if (changes.completed !== undefined) updated = updated.withCompletion(changes.completed)

    this.todos.save(updated)
    return updated
  }
}
