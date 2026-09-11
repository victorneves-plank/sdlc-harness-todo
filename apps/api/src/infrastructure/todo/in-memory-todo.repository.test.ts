import { beforeEach, describe, expect, it } from 'vitest'
import { Todo } from '../../domain/todo/todo.js'
import { toTodoId } from '../../domain/todo/todo-id.js'
import { InMemoryTodoRepository } from './in-memory-todo.repository.js'

describe('InMemoryTodoRepository', () => {
  let repository: InMemoryTodoRepository

  // Module-level mutable state is this repository's main footgun: a test that leaks
  // into the store makes the NEXT test fail, in innocent-looking code.
  beforeEach(() => {
    repository = new InMemoryTodoRepository()
  })

  it('returns an empty list before anything is saved', () => {
    expect(repository.findAll()).toEqual([])
  })

  it('finds a saved todo by its id', () => {
    const todo = Todo.create({ title: 'Buy milk' })
    repository.save(todo)

    expect(repository.findById(todo.id)).toBe(todo)
  })

  it('returns undefined for an unknown id', () => {
    expect(repository.findById(toTodoId('does-not-exist'))).toBeUndefined()
  })

  it('replaces rather than duplicates when saving the same id twice', () => {
    const todo = Todo.create({ title: 'Buy milk' })
    repository.save(todo)
    repository.save(todo.withCompletion(true))

    expect(repository.findAll()).toHaveLength(1)
    expect(repository.findById(todo.id)?.completed).toBe(true)
  })

  it('does not expose its internal collection to callers', () => {
    repository.save(Todo.create({ title: 'Buy milk' }))

    // Mutating what findAll() returned must not reach the store. Returning the live
    // array here would let any caller bypass every invariant the domain enforces.
    const escaped = repository.findAll() as Todo[]
    escaped.push(Todo.create({ title: 'Injected' }))

    expect(repository.findAll()).toHaveLength(1)
  })

  it('reports whether a removal actually removed something', () => {
    const todo = Todo.create({ title: 'Buy milk' })
    repository.save(todo)

    expect(repository.remove(todo.id)).toBe(true)
    expect(repository.remove(todo.id)).toBe(false)
  })
})
