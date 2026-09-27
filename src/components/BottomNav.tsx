import { CalendarDays, Compass, House, MessageCircle, UserRound } from 'lucide-react'
import { NavLink } from 'react-router'
import { useRealtime } from '../context/RealtimeContext'
import { cn } from '../lib/cn'

export function BottomNav() {
  const { unreadMessages } = useRealtime()
  const items = [
    { to: '/app', icon: House, label: 'Inicio', end: true },
    { to: '/app/buscar', icon: Compass, label: 'Explorar' },
    { to: '/app/reservas', icon: CalendarDays, label: 'Reservas' },
    { to: '/app/mensajes', icon: MessageCircle, label: 'Mensajes', badge: unreadMessages },
    { to: '/app/perfil', icon: UserRound, label: 'Perfil' },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line/80 bg-white/92 backdrop-blur-lg pb-safe">
      <ul className="mx-auto flex max-w-lg">
        {items.map(({ to, icon: Icon, label, end, badge }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn('relative flex flex-col items-center gap-0.5 pb-2 pt-2.5 text-[11px] font-bold transition', isActive ? 'text-brand' : 'text-muted')
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute top-0 h-1 w-8 rounded-b-full bg-brand" />}
                  <span className="relative">
                    <Icon className="size-6" strokeWidth={isActive ? 2.3 : 1.9} />
                    {!!badge && (
                      <span className="absolute -right-2 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-white bg-rosa px-1 text-[10px] font-extrabold text-navy">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
