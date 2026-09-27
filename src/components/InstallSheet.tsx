import { Plus, Share, SquarePlus } from 'lucide-react'
import { useState } from 'react'
import { APP_NAME } from '../config'
import { canPromptInstall, isIOS, isStandalone, promptInstall } from '../lib/pwa'
import { ElegantButton } from './Buttons'
import { LogoMark } from './Logo'
import { Sheet } from './ui'

// Devuelve una función para instalar la app y el sheet con instrucciones cuando el navegador no permite el aviso directo
export function useInstall() {
  const [open, setOpen] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android'>('android')
  const install = async (target?: 'ios' | 'android') => {
    if (isStandalone()) {
      window.location.href = '/app'
      return
    }
    if (canPromptInstall() && target !== 'ios') {
      const ok = await promptInstall()
      if (ok) return
    }
    setPlatform(target ?? (isIOS() ? 'ios' : 'android'))
    setOpen(true)
  }
  const sheet = <InstallSheet open={open} onClose={() => setOpen(false)} platform={platform} />
  return { install, sheet }
}

function InstallSheet({ open, onClose, platform }: { open: boolean; onClose: () => void; platform: 'ios' | 'android' }) {
  const steps =
    platform === 'ios'
      ? [
          { icon: <Share className="size-5" />, text: 'Abre esta página en Safari y toca Compartir' },
          { icon: <SquarePlus className="size-5" />, text: 'Elige «Añadir a pantalla de inicio»' },
          { icon: <Plus className="size-5" />, text: `Pulsa «Añadir» y abre ${APP_NAME} desde tu pantalla` },
        ]
      : [
          { icon: <span className="text-lg font-black leading-none">⋮</span>, text: 'Abre el menú de Chrome (arriba a la derecha)' },
          { icon: <SquarePlus className="size-5" />, text: 'Toca «Instalar aplicación» o «Añadir a pantalla de inicio»' },
          { icon: <Plus className="size-5" />, text: `Confirma y abre ${APP_NAME} como cualquier app` },
        ]
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="flex items-center gap-3">
        <LogoMark className="size-14" />
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Instala {APP_NAME}</h2>
          <p className="text-sm text-muted">Funciona como una app: pantalla completa, icono y notificaciones.</p>
        </div>
      </div>
      <ol className="mt-5 space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex items-center gap-3 rounded-2xl bg-mist p-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-sm">{s.icon}</span>
            <span className="text-[15px] font-semibold">{s.text}</span>
          </li>
        ))}
      </ol>
      <ElegantButton block className="mt-5" onClick={onClose}>
        Entendido
      </ElegantButton>
    </Sheet>
  )
}
