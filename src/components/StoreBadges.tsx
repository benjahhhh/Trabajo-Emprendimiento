import { cn } from '../lib/cn'

// Insignias de tienda (solo publicidad para la presentación: la app es una web app instalable)
export function AppStoreBadge({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn('inline-flex h-[52px] items-center gap-2.5 rounded-[9px] bg-navy px-4 text-left text-white transition hover:bg-navy-2 active:scale-95', className)}>
      <svg viewBox="0 0 384 512" className="size-7 fill-white" aria-hidden="true">
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
      </svg>
      <span className="leading-none">
        <span className="block text-[10px] font-medium opacity-80">Descárgala en el</span>
        <span className="block text-[19px] font-bold tracking-tight">App Store</span>
      </span>
    </button>
  )
}

export function GooglePlayBadge({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn('inline-flex h-[52px] items-center gap-2.5 rounded-[9px] bg-navy px-4 text-left text-white transition hover:bg-navy-2 active:scale-95', className)}>
      <svg viewBox="0 0 512 512" className="size-6" aria-hidden="true">
        <path fill="#00d7fe" d="M47 16C38 21 32 31 32 44v424c0 13 6 23 15 28l246-240z" />
        <path fill="#ffce00" d="M376 176l-83 80 83 80 94-53c27-15 27-39 0-54z" />
        <path fill="#ff3a44" d="M293 256L47 496c9 5 21 4 34-3l295-157z" />
        <path fill="#00f076" d="M81 19c-13-7-25-8-34-3l246 240 83-80z" />
      </svg>
      <span className="leading-none">
        <span className="block text-[10px] font-medium uppercase tracking-wide opacity-80">Disponible en</span>
        <span className="block text-[19px] font-bold tracking-tight">Google Play</span>
      </span>
    </button>
  )
}
