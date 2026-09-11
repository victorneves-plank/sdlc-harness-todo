import { type TodoFilter } from '../types'

interface TodoFiltersProps {
  readonly value: TodoFilter
  readonly counts: Readonly<Record<TodoFilter, number>>
  readonly onChange: (filter: TodoFilter) => void
}

const FILTERS: readonly { readonly value: TodoFilter; readonly label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

export const TodoFilters = ({ value, counts, onChange }: TodoFiltersProps) => (
  <div className="todo-filters" role="tablist" aria-label="Filter todos">
    {FILTERS.map((filter) => (
      <button
        key={filter.value}
        role="tab"
        aria-selected={value === filter.value}
        className={`todo-filters__tab ${value === filter.value ? 'is-selected' : ''}`.trim()}
        onClick={() => onChange(filter.value)}
      >
        {filter.label}
        <span className="todo-filters__count">{counts[filter.value]}</span>
      </button>
    ))}
  </div>
)
