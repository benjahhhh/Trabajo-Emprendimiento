import {
  CarFront,
  Dumbbell,
  Droplets,
  GraduationCap,
  Hammer,
  HandHeart,
  KeyRound,
  Laptop,
  PawPrint,
  Scissors,
  Sparkles,
  SprayCan,
  Sprout,
  Truck,
  Wrench,
  Zap,
  type LucideIcon,
  LayoutGrid,
} from 'lucide-react'
import { cn } from '../lib/cn'
import type { Category } from '../lib/types'

const ICONS: Record<string, LucideIcon> = {
  Sprout,
  Wrench,
  Scissors,
  Sparkles,
  SprayCan,
  Droplets,
  Zap,
  Hammer,
  PawPrint,
  CarFront,
  KeyRound,
  Laptop,
  GraduationCap,
  HandHeart,
  Dumbbell,
  Truck,
}

export const iconFor = (name?: string): LucideIcon => (name && ICONS[name]) || LayoutGrid

// El celeste de la paleta necesita icono oscuro para contrastar
export const onColor = (hex: string) => (hex.toLowerCase() === '#d1e2ff' || hex.toLowerCase() === '#fd69cf' ? '#081B3A' : '#FFFFFF')

export function CategoryBadge({ category, size = 'md', className }: { category?: Pick<Category, 'icon' | 'color'>; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const Icon = iconFor(category?.icon)
  const color = category?.color ?? '#025FFB'
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-2xl', size === 'sm' ? 'size-8 rounded-xl' : size === 'lg' ? 'size-16' : 'size-12', className)}
      style={{ background: color, color: onColor(color) }}
    >
      <Icon className={size === 'sm' ? 'size-4' : size === 'lg' ? 'size-7' : 'size-6'} strokeWidth={1.8} />
    </span>
  )
}
