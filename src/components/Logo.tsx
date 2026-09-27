import { APP_NAME } from '../config'
import { cn } from '../lib/cn'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={cn('shrink-0', className)} aria-hidden="true">
      <rect width="512" height="512" rx="120" fill="#081B3A" />
      <path d="M 353 159 A 137 137 0 1 0 353 353" fill="none" stroke="#025FFB" strokeWidth="58" strokeLinecap="round" />
      <circle cx="256" cy="256" r="46" fill="#FD69CF" />
    </svg>
  )
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className="size-8" />
      <span className={cn('text-[1.45rem] font-extrabold tracking-[-0.04em]', light ? 'text-white' : 'text-navy')}>{APP_NAME}</span>
    </span>
  )
}
