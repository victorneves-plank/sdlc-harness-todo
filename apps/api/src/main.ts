import { CreateTodo } from './application/todo/create-todo.js'
import { ListTodos } from './application/todo/list-todos.js'
import { RemoveTodo } from './application/todo/remove-todo.js'
import { UpdateTodo } from './application/todo/update-todo.js'
import { InMemoryTodoRepository } from './infrastructure/todo/in-memory-todo.repository.js'
import { createApp } from './interface/http/app.js'

/**
 * The composition root: the only file that knows both which implementations exist and
 * which interfaces need them. Everything else receives its dependencies.
 *
 * No DI container. For four use cases a container is pure ceremony — manual wiring is
 * explicit, greppable and type-checked. See docs/sdlc/09-architecture.md.
 */
const todoRepository = new InMemoryTodoRepository()

const app = createApp({
  listTodos: new ListTodos(todoRepository),
  createTodo: new CreateTodo(todoRepository),
  updateTodo: new UpdateTodo(todoRepository),
  removeTodo: new RemoveTodo(todoRepository),
})

const port = Number(process.env['PORT'] ?? 3000)

app.listen(port, () => {
  console.warn(`API listening on http://localhost:${port}`)
  console.warn('Storage is in-memory: all todos are lost when this process exits.')
})
