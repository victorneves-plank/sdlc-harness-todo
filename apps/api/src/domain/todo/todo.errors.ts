import { type TodoId } from './todo-id.js'

/**
 * Errors are part of the domain's API, so they are declared here alongside the rules
 * that raise them. The interface layer maps each to an HTTP status; nothing in the
 * domain knows that HTTP exists.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string

  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

export class InvalidTodoTitleError extends DomainError {
  readonly code = 'INVALID_TITLE'
}

export class TodoNotFoundError extends DomainError {
  readonly code = 'TODO_NOT_FOUND'

  constructor(id: TodoId) {
    super(`No todo exists with id "${id}"`)
  }
}
