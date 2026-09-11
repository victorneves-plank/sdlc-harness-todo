import { type Todo } from '../../domain/todo/todo.js'
import { type TodoId } from '../../domain/todo/todo-id.js'
import { type TodoRepository } from '../../domain/todo/todo.repository.js'

/**
 * Session memory: a plain array in the process. Restart the server and it is gone.
 *
 * This is the only file in the API that knows how todos are stored. Swapping it for
 * a database is this file plus one line in the composition root — see
 * docs/adr/0003-in-memory-session-storage.md.
 */
export class InMemoryTodoRepository implements TodoRepository {
  private readonly todos = new Map<TodoId, Todo>()

  findAll(): readonly Todo[] {
    // A copy, not the live collection. Returning the internal structure would let
    // any caller mutate the store from outside and bypass every domain invariant.
    return [...this.todos.values()]
  }

  findById(id: TodoId): Todo | undefined {
    return this.todos.get(id)
  }

  save(todo: Todo): void {
    this.todos.set(todo.id, todo)
  }

  remove(id: TodoId): boolean {
    return this.todos.delete(id)
  }

  /** Test seam: lets each test start from a known empty store. */
  clear(): void {
    this.todos.clear()
  }
}
