import { type Todo } from '../../domain/todo/todo.js'
import { type TodoRepository } from '../../domain/todo/todo.repository.js'

/** Returns every todo, newest first. */
export class ListTodos {
  constructor(private readonly todos: TodoRepository) {}

  execute(): readonly Todo[] {
    return [...this.todos.findAll()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
}
