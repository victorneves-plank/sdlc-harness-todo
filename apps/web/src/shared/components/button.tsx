import { type ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: Variant
}

/**
 * Knows nothing about todos. shared/ must never import from features/ — that is the
 * same dependency rule as the backend, one layer up, and it is enforced by ESLint.
 */
export const Button = ({ variant = 'primary', className = '', ...props }: ButtonProps) => (
  <button {...props} className={`button button--${variant} ${className}`.trim()} />
)
