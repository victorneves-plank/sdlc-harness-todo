import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type Todo } from '../types'
import { TodoApp } from './todo-app'

/**
 * Tests go through the UI the way a user would: query by role and accessible name,
 * never by test id or class. A component you cannot query by role is a component a
 * screen reader cannot navigate, so the testing discipline and the accessibility
 * discipline are the same discipline.
 *
 * Only `fetch` is faked. Everything from the API client inward is the real code.
 */
const todo = (overrides: Partial<Todo> = {}): Todo => ({
  id: crypto.randomUUID(),
  title: 'Buy milk',
  completed: false,
  createdAt: new Date().toISOString(),
  ...overrides,
})

const jsonResponse = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }))

describe('TodoApp', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const renderWithTodos = async (todos: Todo[]) => {
    fetchMock.mockReturnValueOnce(jsonResponse({ todos }))
    render(<TodoApp />)
    await waitForElementToBeRemoved(() => screen.queryByText('Loading…'))
  }

  it('shows an empty state before any todo exists', async () => {
    await renderWithTodos([])

    expect(screen.getByText(/nothing here yet/i)).toBeInTheDocument()
  })

  it('lists the todos returned by the API', async () => {
    await renderWithTodos([todo({ title: 'Buy milk' }), todo({ title: 'Walk the dog' })])

    expect(screen.getByText('Buy milk')).toBeInTheDocument()
    expect(screen.getByText('Walk the dog')).toBeInTheDocument()
  })

  it('adds a todo and clears the input', async () => {
    await renderWithTodos([])
    fetchMock.mockReturnValueOnce(jsonResponse({ todo: todo({ title: 'Buy milk' }) }, 201))

    const input = screen.getByLabelText(/what needs doing/i)
    await userEvent.type(input, 'Buy milk')
    await userEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(await screen.findByText('Buy milk')).toBeInTheDocument()
    expect(input).toHaveValue('')
  })

  it('does not submit a title that is only whitespace', async () => {
    await renderWithTodos([])
    const callsAfterLoad = fetchMock.mock.calls.length

    await userEvent.type(screen.getByLabelText(/what needs doing/i), '   ')

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
    expect(fetchMock.mock.calls).toHaveLength(callsAfterLoad)
  })

  it('marks a todo as completed when its checkbox is clicked', async () => {
    const existing = todo({ title: 'Buy milk' })
    await renderWithTodos([existing])
    fetchMock.mockReturnValueOnce(jsonResponse({ todo: { ...existing, completed: true } }))

    await userEvent.click(screen.getByRole('checkbox', { name: 'Buy milk' }))

    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: 'Buy milk' })).toBeChecked()
    })
  })

  it('removes a todo when its delete button is clicked', async () => {
    await renderWithTodos([todo({ title: 'Buy milk' })])
    fetchMock.mockReturnValueOnce(Promise.resolve(new Response(null, { status: 204 })))

    await userEvent.click(screen.getByRole('button', { name: 'Delete Buy milk' }))

    await waitFor(() => {
      expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
    })
  })

  describe('filters', () => {
    beforeEach(async () => {
      await renderWithTodos([
        todo({ title: 'Buy milk', completed: false }),
        todo({ title: 'Walk the dog', completed: true }),
      ])
    })

    it('shows only outstanding todos under Active', async () => {
      await userEvent.click(screen.getByRole('tab', { name: /active/i }))

      expect(screen.getByText('Buy milk')).toBeInTheDocument()
      expect(screen.queryByText('Walk the dog')).not.toBeInTheDocument()
    })

    it('shows only finished todos under Completed', async () => {
      await userEvent.click(screen.getByRole('tab', { name: /completed/i }))

      expect(screen.getByText('Walk the dog')).toBeInTheDocument()
      expect(screen.queryByText('Buy milk')).not.toBeInTheDocument()
    })

    it('explains the empty state per filter rather than showing a blank list', async () => {
      await userEvent.click(screen.getByRole('tab', { name: /active/i }))
      fetchMock.mockReturnValueOnce(
        jsonResponse({ todo: { ...todo({ title: 'Buy milk' }), completed: true } }),
      )

      await userEvent.click(screen.getByRole('checkbox', { name: 'Buy milk' }))

      expect(await screen.findByText(/nothing outstanding/i)).toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('explains that the API is unreachable rather than showing a blank screen', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      render(<TodoApp />)

      expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach the api/i)
    })

    it('offers a retry that succeeds', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
      render(<TodoApp />)
      await screen.findByRole('alert')

      fetchMock.mockReturnValueOnce(jsonResponse({ todos: [todo({ title: 'Buy milk' })] }))
      await userEvent.click(screen.getByRole('button', { name: /try again/i }))

      expect(await screen.findByText('Buy milk')).toBeInTheDocument()
    })

    it('surfaces the API error message when creating a todo fails', async () => {
      await renderWithTodos([])
      fetchMock.mockReturnValueOnce(
        jsonResponse({ error: { code: 'INVALID_TITLE', message: 'Title must not be empty' } }, 400),
      )

      await userEvent.type(screen.getByLabelText(/what needs doing/i), 'x')
      await userEvent.click(screen.getByRole('button', { name: 'Add' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Title must not be empty')
    })

    it('rolls back an optimistic toggle when the request fails', async () => {
      await renderWithTodos([todo({ title: 'Buy milk', completed: false })])
      fetchMock.mockReturnValueOnce(
        jsonResponse({ error: { code: 'TODO_NOT_FOUND', message: 'No such todo' } }, 404),
      )

      await userEvent.click(screen.getByRole('checkbox', { name: 'Buy milk' }))

      // A UI that silently disagrees with the server is worse than a slow one.
      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: 'Buy milk' })).not.toBeChecked()
      })
      expect(screen.getByRole('alert')).toHaveTextContent('No such todo')
    })
  })
})
