import { APP_NAME } from '../config'
import { cn } from '../lib/cn'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={cn('shrink-0', className)} aria-hidden="true">
      <rect width="512" height="512" rx="120" fill="#081B3A" />
      <path d="M 116 264 L 256 142 L 396 264" fill="none" stroke="#025FFB" strokeWidth="50" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 162 232 V 350 Q 162 382 194 382 H 318 Q 350 382 350 350 V 232" fill="none" stroke="#025FFB" strokeWidth="50" strokeLinecap="butt" strokeLinejoin="round" />
      <circle cx="256" cy="298" r="40" fill="#FD69CF" />
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
