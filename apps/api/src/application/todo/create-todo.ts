import { Todo } from '../../domain/todo/todo.js'
import { type TodoRepository } from '../../domain/todo/todo.repository.js'

export class CreateTodo {
  constructor(private readonly todos: TodoRepository) {}

  execute(title: string): Todo {
    // The rule lives in the entity; this use case only orchestrates. An `if` here
    // encoding what a valid title is would be a rule in the wrong layer.
    const todo = Todo.create({ title })
    this.todos.save(todo)
    return todo
  }
}
