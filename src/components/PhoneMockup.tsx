import { CalendarDays, Compass, House, MapPin, MessageCircle, Search, Star, UserRound } from 'lucide-react'
import { cn } from '../lib/cn'
import { CategoryBadge } from './CategoryIcon'
import { LogoMark } from './Logo'

const CATS = [
  { icon: 'Sprout', color: '#025FFB', name: 'Jardín' },
  { icon: 'Wrench', color: '#FD69CF', name: 'Mecánica' },
  { icon: 'Scissors', color: '#081B3A', name: 'Barbería' },
  { icon: 'Sparkles', color: '#D1E2FF', name: 'Belleza' },
]

// Maqueta de teléfono con la pantalla de inicio de la app (HTML, no imagen)
export function PhoneMockup({ className }: { className?: string }) {
  return (
    <div className={cn('relative w-[270px] rounded-[44px] bg-navy p-[10px] shadow-[0_40px_80px_-30px_rgb(8_27_58/0.6)]', className)}>
      <div className="relative h-[540px] overflow-hidden rounded-[36px] bg-white">
        <div className="absolute left-1/2 top-2 z-20 h-[22px] w-[86px] -translate-x-1/2 rounded-full bg-navy" />
        <div className="relative bg-navy px-4 pb-8 pt-10 text-white [clip-path:polygon(0_0,100%_0,100%_calc(100%-16px),0_100%)]">
          <div className="absolute -right-6 top-[74px] h-5 w-24 -rotate-[8deg] bg-rosa" />
          <div className="absolute -right-5 top-[94px] h-3 w-20 -rotate-[8deg] bg-brand" />
          <div className="relative flex items-center gap-1.5">
            <LogoMark className="size-5" />
            <span className="text-sm font-extrabold tracking-tight">Cerca</span>
          </div>
          <p className="relative mt-3 text-[10px] text-white/70">Hola, Martina 👋</p>
          <p className="relative max-w-[11ch] text-[17px] font-extrabold leading-tight tracking-tight">¿Qué servicio necesitas hoy?</p>
          <div className="relative mt-3 flex h-9 items-center gap-2 rounded-xl bg-white px-3 text-[10px] text-slate-400">
            <Search className="size-3.5 text-muted" /> cortar el pasto…
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1 px-3 pt-3">
          {CATS.map((c) => (
            <div key={c.name} className="flex flex-col items-center gap-1">
              <CategoryBadge category={c} className="size-10 rounded-xl" />
              <span className="text-[8.5px] font-bold">{c.name}</span>
            </div>
          ))}
        </div>
        <p className="px-3 pt-3 text-[12px] font-extrabold">Cerca de ti</p>
        <div className="mx-3 mt-1.5 overflow-hidden rounded-2xl border border-line">
          <div className="relative h-[92px] bg-[url('https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=480&h=200&q=60')] bg-cover bg-center">
            <span className="absolute left-2 top-2 rounded-full bg-white/90 px-1.5 py-0.5 text-[8px] font-bold">650 m</span>
          </div>
          <div className="flex items-center gap-2 p-2">
            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="" className="size-8 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-extrabold">Barber Nico</p>
              <p className="flex items-center gap-0.5 text-[9px] font-bold">
                <Star className="size-2.5 fill-star text-star" /> 4,9 <span className="text-muted">(212)</span>
              </p>
            </div>
            <span className="text-[10px] font-extrabold">$12.000</span>
          </div>
        </div>
        <div className="mx-3 mt-2 flex items-center gap-2 rounded-2xl bg-mist p-2">
          <MapPin className="size-4 text-brand" />
          <p className="flex-1 text-[9.5px] font-bold">Carlos aceptó tu solicitud ✅</p>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex justify-around border-t border-line bg-white pb-3 pt-2">
          {[House, Compass, CalendarDays, MessageCircle, UserRound].map((Icon, i) => (
            <Icon key={i} className={cn('size-4', i === 0 ? 'text-brand' : 'text-muted')} />
          ))}
        </div>
      </div>
    </div>
  )
}
