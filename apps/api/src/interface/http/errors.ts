import { type NextFunction, type Request, type Response } from 'express'
import {
  DomainError,
  InvalidTodoTitleError,
  TodoNotFoundError,
} from '../../domain/todo/todo.errors.js'

/**
 * The single place that knows domain errors have HTTP meanings. The domain does not
 * import this file, and nothing in it knows a status code exists.
 */
const STATUS_BY_CODE: Record<string, number> = {
  INVALID_TITLE: 400,
  TODO_NOT_FOUND: 404,
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  // Express identifies an error handler by its four-parameter arity, so `next` must
  // stay in the signature even though it is unused.
  _next: NextFunction,
): void => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } })
    return
  }

  if (error instanceof DomainError) {
    res.status(STATUS_BY_CODE[error.code] ?? 500).json({
      error: { code: error.code, message: error.message },
    })
    return
  }

  // Anything reaching here is a bug rather than an expected condition, so it is logged
  // in full and reported opaquely — an internal message could leak implementation
  // detail to a client that can do nothing useful with it.
  console.error('Unhandled error:', error)
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  })
}

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'No such route' } })
}

export { InvalidTodoTitleError, TodoNotFoundError }
