import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cn } from '../lib/cn'

type Variant = 'navy' | 'blue' | 'rosa' | 'light' | 'danger'
type Common = { variant?: Variant; size?: 'md' | 'sm'; block?: boolean; className?: string; children: ReactNode }

const classes = ({ variant = 'navy', size = 'md', block, className }: Omit<Common, 'children'>) =>
  cn(
    'boton-elegante',
    variant !== 'navy' && `boton-elegante--${variant}`,
    size === 'sm' && 'boton-elegante--sm',
    block && 'boton-elegante--block',
    className,
  )

// Botón con la forma y animación del "botón elegante" de Uiverse
export function ElegantButton({ variant, size, block, className, children, loading, ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button {...rest} disabled={rest.disabled || loading} className={classes({ variant, size, block, className })}>
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  )
}

export function ElegantLink({ variant, size, block, className, children, ...rest }: Common & LinkProps) {
  return (
    <Link {...rest} className={classes({ variant, size, block, className })}>
      {children}
    </Link>
  )
}

export function IconButton({ className, children, label, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      {...rest}
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-full bg-white/90 text-navy shadow-card backdrop-blur transition active:scale-90',
        className,
      )}
    >
      {children}
    </button>
  )
}
