/**
 * A branded identifier. The brand is erased at runtime — it exists purely to stop
 * a string that happens to be a user id being passed where a todo id belongs, which
 * the compiler cannot otherwise catch because both are `string`.
 *
 * See docs/sdlc/08-coding-standards.md — "make illegal states unrepresentable".
 */
export type TodoId = string & { readonly __brand: 'TodoId' }

export const toTodoId = (value: string): TodoId => value as TodoId
