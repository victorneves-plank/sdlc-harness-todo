import { describe, expect, it } from 'vitest'
import { TITLE_MAX_LENGTH, Todo } from './todo.js'
import { InvalidTodoTitleError } from './todo.errors.js'

describe('Todo', () => {
  describe('creation', () => {
    it('assigns a unique id to each created todo', () => {
      const first = Todo.create({ title: 'Buy milk' })
      const second = Todo.create({ title: 'Buy milk' })

      expect(first.id).not.toBe(second.id)
    })

    it('starts every todo as not completed', () => {
      expect(Todo.create({ title: 'Buy milk' }).completed).toBe(false)
    })

    it('trims surrounding whitespace from the title', () => {
      expect(Todo.create({ title: '  Buy milk  ' }).title).toBe('Buy milk')
    })

    it('rejects a title that is empty', () => {
      expect(() => Todo.create({ title: '' })).toThrow(InvalidTodoTitleError)
    })

    it('rejects a title that is only whitespace', () => {
      expect(() => Todo.create({ title: '   \t\n ' })).toThrow(InvalidTodoTitleError)
    })

    // Pins the documented limit. The tests below derive their input from
    // TITLE_MAX_LENGTH, which makes them good at checking the boundary LOGIC and
    // useless at checking where the boundary IS -- change the constant and they
    // simply move with it. This one fails, which is what forces a deliberate
    // decision when the API contract changes.
    it('caps titles at the 200 characters the API contract documents', () => {
      expect(TITLE_MAX_LENGTH).toBe(200)
    })

    it(`accepts a title of exactly ${TITLE_MAX_LENGTH} characters`, () => {
      const title = 'a'.repeat(TITLE_MAX_LENGTH)

      expect(Todo.create({ title }).title).toBe(title)
    })

    it(`rejects a title longer than ${TITLE_MAX_LENGTH} characters`, () => {
      expect(() => Todo.create({ title: 'a'.repeat(TITLE_MAX_LENGTH + 1) })).toThrow(
        InvalidTodoTitleError,
      )
    })

    it('measures length after trimming, so padding does not push a valid title over', () => {
      const title = `  ${'a'.repeat(TITLE_MAX_LENGTH)}  `

      expect(() => Todo.create({ title })).not.toThrow()
    })
  })

  describe('completion', () => {
    it('returns a completed copy without mutating the original', () => {
      const todo = Todo.create({ title: 'Buy milk' })
      const completed = todo.toggleCompletion()

      expect(completed.completed).toBe(true)
      expect(todo.completed).toBe(false)
    })

    it('toggles back to not completed', () => {
      const todo = Todo.create({ title: 'Buy milk' })

      expect(todo.toggleCompletion().toggleCompletion().completed).toBe(false)
    })

    it('returns the same instance when the value is unchanged', () => {
      const todo = Todo.create({ title: 'Buy milk' })

      expect(todo.withCompletion(false)).toBe(todo)
    })

    it('preserves id, title and creation time across a change', () => {
      const todo = Todo.create({ title: 'Buy milk' })
      const completed = todo.withCompletion(true)

      expect(completed.id).toBe(todo.id)
      expect(completed.title).toBe(todo.title)
      expect(completed.createdAt).toBe(todo.createdAt)
    })
  })

  describe('retitling', () => {
    it('applies the same validation as creation', () => {
      const todo = Todo.create({ title: 'Buy milk' })

      expect(() => todo.withTitle('  ')).toThrow(InvalidTodoTitleError)
    })

    it('keeps the completed state', () => {
      const todo = Todo.create({ title: 'Buy milk' }).withCompletion(true)

      expect(todo.withTitle('Buy oat milk').completed).toBe(true)
    })
  })
})
