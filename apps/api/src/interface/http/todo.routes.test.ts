import type { Express } from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { CreateTodo } from '../../application/todo/create-todo.js'
import { ListTodos } from '../../application/todo/list-todos.js'
import { RemoveTodo } from '../../application/todo/remove-todo.js'
import { UpdateTodo } from '../../application/todo/update-todo.js'
import { TITLE_MAX_LENGTH } from '../../domain/todo/todo.js'
import { InMemoryTodoRepository } from '../../infrastructure/todo/in-memory-todo.repository.js'
import { createApp } from './app.js'

/**
 * Integration tests against the REAL repository, not a mock. Because the in-memory
 * store IS the production store, these are both fast and honest — there is no
 * mock/reality drift to worry about. See docs/adr/0003.
 */
describe('todo routes', () => {
  let app: Express

  beforeEach(() => {
    const repository = new InMemoryTodoRepository()
    app = createApp({
      listTodos: new ListTodos(repository),
      createTodo: new CreateTodo(repository),
      updateTodo: new UpdateTodo(repository),
      removeTodo: new RemoveTodo(repository),
    })
  })

  const createTodo = (title: string) => request(app).post('/api/todos').send({ title })

  describe('GET /api/health', () => {
    it('reports ok', async () => {
      const response = await request(app).get('/api/health')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ status: 'ok' })
    })
  })

  describe('GET /api/todos', () => {
    it('returns an empty list before any todo is added', async () => {
      const response = await request(app).get('/api/todos')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ todos: [] })
    })

    it('serialises createdAt as an ISO string rather than leaking a Date', async () => {
      await createTodo('Buy milk')

      const response = await request(app).get('/api/todos')

      expect(response.body.todos[0].createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
  })

  describe('POST /api/todos', () => {
    it('creates a todo and returns 201', async () => {
      const response = await createTodo('Buy milk')

      expect(response.status).toBe(201)
      expect(response.body.todo).toMatchObject({ title: 'Buy milk', completed: false })
      expect(response.body.todo.id).toEqual(expect.any(String))
    })

    it('returns 400 INVALID_TITLE for a title that is only whitespace', async () => {
      const response = await createTodo('   ')

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('INVALID_TITLE')
    })

    it(`returns 400 INVALID_TITLE for a title over ${TITLE_MAX_LENGTH} characters`, async () => {
      const response = await createTodo('a'.repeat(TITLE_MAX_LENGTH + 1))

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('INVALID_TITLE')
    })

    it('returns 400 INVALID_REQUEST when title is missing entirely', async () => {
      const response = await request(app).post('/api/todos').send({})

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('INVALID_REQUEST')
    })

    it('returns 400 INVALID_REQUEST when title is not a string', async () => {
      const response = await request(app).post('/api/todos').send({ title: 42 })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('INVALID_REQUEST')
    })
  })

  describe('PATCH /api/todos/:id', () => {
    it('marks a todo as completed', async () => {
      const { body } = await createTodo('Buy milk')

      const response = await request(app)
        .patch(`/api/todos/${body.todo.id}`)
        .send({ completed: true })

      expect(response.status).toBe(200)
      expect(response.body.todo.completed).toBe(true)
    })

    it('returns 404 TODO_NOT_FOUND for an unknown id, not 500', async () => {
      const response = await request(app).patch('/api/todos/nope').send({ completed: true })

      expect(response.status).toBe(404)
      expect(response.body.error.code).toBe('TODO_NOT_FOUND')
    })

    it('returns 400 when neither title nor completed is supplied', async () => {
      const { body } = await createTodo('Buy milk')

      const response = await request(app).patch(`/api/todos/${body.todo.id}`).send({})

      expect(response.status).toBe(400)
    })
  })

  describe('DELETE /api/todos/:id', () => {
    it('removes the todo and returns 204', async () => {
      const { body } = await createTodo('Buy milk')

      const response = await request(app).delete(`/api/todos/${body.todo.id}`)

      expect(response.status).toBe(204)

      const remaining = await request(app).get('/api/todos')
      expect(remaining.body).toEqual({ todos: [] })
    })

    it('returns 404 TODO_NOT_FOUND for an unknown id', async () => {
      const response = await request(app).delete('/api/todos/nope')

      expect(response.status).toBe(404)
      expect(response.body.error.code).toBe('TODO_NOT_FOUND')
    })
  })

  describe('unknown routes', () => {
    it('returns 404 ROUTE_NOT_FOUND', async () => {
      const response = await request(app).get('/api/nonsense')

      expect(response.status).toBe(404)
      expect(response.body.error.code).toBe('ROUTE_NOT_FOUND')
    })
  })
})
