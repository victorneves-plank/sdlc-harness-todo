import { Router } from 'express'
import { z } from 'zod'
import { type CreateTodo } from '../../application/todo/create-todo.js'
import { type ListTodos } from '../../application/todo/list-todos.js'
import { type RemoveTodo } from '../../application/todo/remove-todo.js'
import { type TodoChanges, type UpdateTodo } from '../../application/todo/update-todo.js'
import { toTodoId } from '../../domain/todo/todo-id.js'
import { HttpError } from './errors.js'
import { toTodoDto } from './todo.dto.js'

export interface TodoUseCases {
  readonly listTodos: ListTodos
  readonly createTodo: CreateTodo
  readonly updateTodo: UpdateTodo
  readonly removeTodo: RemoveTodo
}

/**
 * zod validates the *shape* of the request — is `title` a string at all? The domain
 * validates the *rule* — is it a valid title? Duplicating the rule here would give it
 * two homes and let a future non-HTTP caller bypass it.
 */
const createTodoBody = z.object({
  title: z.string({
    required_error: 'title is required',
    invalid_type_error: 'title must be a string',
  }),
})

const updateTodoBody = z
  .object({
    title: z.string().optional(),
    completed: z.boolean().optional(),
  })
  .refine((body) => body.title !== undefined || body.completed !== undefined, {
    message: 'Provide at least one of title or completed',
  })

const parse = <T>(schema: z.ZodType<T>, payload: unknown): T => {
  const result = schema.safeParse(payload)

  if (!result.success) {
    const [issue] = result.error.issues
    throw new HttpError(400, 'INVALID_REQUEST', issue?.message ?? 'Invalid request body')
  }

  return result.data
}

export const createTodoRouter = (useCases: TodoUseCases): Router => {
  const router = Router()

  router.get('/', (_req, res) => {
    res.json({ todos: useCases.listTodos.execute().map(toTodoDto) })
  })

  router.post('/', (req, res) => {
    const { title } = parse(createTodoBody, req.body)
    res.status(201).json({ todo: toTodoDto(useCases.createTodo.execute(title)) })
  })

  router.patch('/:id', (req, res) => {
    const body = parse(updateTodoBody, req.body)
    const changes: TodoChanges = {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.completed !== undefined ? { completed: body.completed } : {}),
    }
    const todo = useCases.updateTodo.execute(toTodoId(req.params.id), changes)
    res.json({ todo: toTodoDto(todo) })
  })

  router.delete('/:id', (req, res) => {
    useCases.removeTodo.execute(toTodoId(req.params.id))
    res.status(204).send()
  })

  return router
}
