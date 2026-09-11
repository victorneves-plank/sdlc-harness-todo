import { beforeEach, describe, expect, it } from 'vitest'
import { Todo } from '../../domain/todo/todo.js'
import { toTodoId } from '../../domain/todo/todo-id.js'
import { TodoNotFoundError } from '../../domain/todo/todo.errors.js'
import { InMemoryTodoRepository } from '../../infrastructure/todo/in-memory-todo.repository.js'
import { UpdateTodo } from './update-todo.js'
import { RemoveTodo } from './remove-todo.js'
import { CreateTodo } from './create-todo.js'
import { ListTodos } from './list-todos.js'

describe('todo use cases', () => {
  let repository: InMemoryTodoRepository

  beforeEach(() => {
    repository = new InMemoryTodoRepository()
  })

  describe('CreateTodo', () => {
    it('stores the created todo', () => {
      const todo = new CreateTodo(repository).execute('Buy milk')

      expect(repository.findById(todo.id)).toBe(todo)
    })

    it('propagates the domain rule rather than storing an invalid todo', () => {
      expect(() => new CreateTodo(repository).execute('  ')).toThrow()
      expect(repository.findAll()).toHaveLength(0)
    })
  })

  describe('ListTodos', () => {
    it('returns todos newest first', () => {
      const older = Todo.create({ title: 'Older', now: new Date('2026-01-01') })
      const newer = Todo.create({ title: 'Newer', now: new Date('2026-06-01') })
      repository.save(older)
      repository.save(newer)

      expect(new ListTodos(repository).execute().map((todo) => todo.title)).toEqual([
        'Newer',
        'Older',
      ])
    })
  })

  describe('UpdateTodo', () => {
    it('marks a todo as completed', () => {
      const todo = new CreateTodo(repository).execute('Buy milk')

      const updated = new UpdateTodo(repository).execute(todo.id, { completed: true })

      expect(updated.completed).toBe(true)
      expect(repository.findById(todo.id)?.completed).toBe(true)
    })

    it('changes only the title when only the title is supplied', () => {
      const todo = new CreateTodo(repository).execute('Buy milk')
      new UpdateTodo(repository).execute(todo.id, { completed: true })

      const updated = new UpdateTodo(repository).execute(todo.id, { title: 'Buy oat milk' })

      // The lost-update bug a full PUT invites: a partial change must not silently
      // reset the field the caller did not mention.
      expect(updated.title).toBe('Buy oat milk')
      expect(updated.completed).toBe(true)
    })

    it('throws TodoNotFoundError for an unknown id', () => {
      expect(() =>
        new UpdateTodo(repository).execute(toTodoId('nope'), { completed: true }),
      ).toThrow(TodoNotFoundError)
    })
  })

  describe('RemoveTodo', () => {
    it('removes the todo', () => {
      const todo = new CreateTodo(repository).execute('Buy milk')

      new RemoveTodo(repository).execute(todo.id)

      expect(repository.findAll()).toHaveLength(0)
    })

    it('throws rather than silently succeeding for an unknown id', () => {
      expect(() => new RemoveTodo(repository).execute(toTodoId('nope'))).toThrow(TodoNotFoundError)
    })
  })
})
