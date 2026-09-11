import cors from 'cors'
import express, { type Express } from 'express'
import { errorHandler, notFoundHandler } from './errors.js'
import { createTodoRouter, type TodoUseCases } from './todo.routes.js'

export const createApp = (useCases: TodoUseCases): Express => {
  const app = express()

  app.use(cors())
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/todos', createTodoRouter(useCases))

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
