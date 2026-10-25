import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Logo } from '../components/Logo'
import { TopBar } from '../components/ui'

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh pb-10">
      <TopBar transparent right={<Link to="/app" className="px-3 text-sm font-bold text-brand">Explorar sin cuenta</Link>} />
      <div className="relative overflow-hidden px-6 pt-2">
        <div className="pointer-events-none absolute -right-16 top-6 h-8 w-64 -rotate-[8deg] bg-rosa" />
        <div className="pointer-events-none absolute -right-12 top-[58px] h-5 w-56 -rotate-[8deg] bg-brand" />
        <Logo className="relative" />
        <h1 className="relative mt-8 text-[2.2rem] font-extrabold leading-[1.05] tracking-[-0.05em]">{title}</h1>
        <p className="relative mt-2 text-muted">{subtitle}</p>
      </div>
      <div className="px-6 pt-7">{children}</div>
    </div>
  )
}
