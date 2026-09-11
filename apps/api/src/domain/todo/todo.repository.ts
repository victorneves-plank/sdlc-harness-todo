import { type Todo } from './todo.js'
import { type TodoId } from './todo-id.js'

/**
 * Declared by the domain, implemented by infrastructure. This ownership is the whole
 * of Dependency Inversion: the source-code dependency points inward (infrastructure
 * imports this file) while control flows outward at runtime.
 *
 * Put this interface in infrastructure instead and nothing is inverted — the domain
 * would depend on a detail. See docs/sdlc/09-architecture.md.
 */
export interface TodoRepository {
  findAll(): readonly Todo[]
  findById(id: TodoId): Todo | undefined
  save(todo: Todo): void
  remove(id: TodoId): boolean
}
