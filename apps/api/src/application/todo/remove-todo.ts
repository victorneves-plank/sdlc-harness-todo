import { type TodoId } from '../../domain/todo/todo-id.js'
import { TodoNotFoundError } from '../../domain/todo/todo.errors.js'
import { type TodoRepository } from '../../domain/todo/todo.repository.js'

export class RemoveTodo {
  constructor(private readonly todos: TodoRepository) {}

  execute(id: TodoId): void {
    // Deleting something that does not exist is an error, not a silent success:
    // a client that thinks it deleted a todo it never had is a client with a bug,
    // and swallowing this hides it.
    if (!this.todos.remove(id)) {
      throw new TodoNotFoundError(id)
    }
  }
}
