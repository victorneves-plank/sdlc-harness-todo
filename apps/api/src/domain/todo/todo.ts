import { type TodoId, toTodoId } from './todo-id.js'
import { InvalidTodoTitleError } from './todo.errors.js'

export const TITLE_MAX_LENGTH = 200

export interface TodoSnapshot {
  readonly id: TodoId
  readonly title: string
  readonly completed: boolean
  readonly createdAt: Date
}

/**
 * A todo, and every rule that is true about one regardless of how it is stored or
 * delivered.
 *
 * Immutable: every mutation returns a new instance. That is not ceremony — it means a
 * caller holding a Todo cannot have it changed underneath them, which removes a whole
 * class of aliasing bug that the in-memory repository would otherwise be exposed to.
 */
export class Todo {
  private constructor(
    readonly id: TodoId,
    readonly title: string,
    readonly completed: boolean,
    readonly createdAt: Date,
  ) {}

  static create(input: { title: string; id?: string; now?: Date }): Todo {
    return new Todo(
      toTodoId(input.id ?? crypto.randomUUID()),
      Todo.normaliseTitle(input.title),
      false,
      input.now ?? new Date(),
    )
  }

  static fromSnapshot(snapshot: TodoSnapshot): Todo {
    return new Todo(snapshot.id, snapshot.title, snapshot.completed, snapshot.createdAt)
  }

  /**
   * The single home of the title rule. The HTTP layer also validates shape (is it a
   * string?), but the *rule* — what counts as a valid title — lives only here, so a
   * future CLI or queue consumer cannot bypass it.
   */
  private static normaliseTitle(raw: string): string {
    const title = raw.trim()

    if (title.length === 0) {
      throw new InvalidTodoTitleError('Title must not be empty')
    }

    if (title.length > TITLE_MAX_LENGTH) {
      throw new InvalidTodoTitleError(
        `Title must be ${TITLE_MAX_LENGTH} characters or fewer, but was ${title.length}`,
      )
    }

    return title
  }

  withCompletion(completed: boolean): Todo {
    return completed === this.completed
      ? this
      : new Todo(this.id, this.title, completed, this.createdAt)
  }

  withTitle(title: string): Todo {
    return new Todo(this.id, Todo.normaliseTitle(title), this.completed, this.createdAt)
  }

  toggleCompletion(): Todo {
    return this.withCompletion(!this.completed)
  }
}
