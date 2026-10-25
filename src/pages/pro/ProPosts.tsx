import { Camera, Heart, ImagePlus, Trash } from 'lucide-react'
import { useRef, useState } from 'react'
import { Navigate } from 'react-router'
import { ElegantButton } from '../../components/Buttons'
import { EmptyState, PageLoader, Sheet, TopBar } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { fmtCompact } from '../../lib/format'
import { img } from '../../lib/images'
import { errorMessage, supabase } from '../../lib/supabase'
import type { Post } from '../../lib/types'
import { uploadImage } from '../app/Profile'

export default function ProPosts() {
  const toast = useToast()
  const { user, provider } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [open, setOpen] = useState<Post | null>(null)

  const posts = useAsync(async () => {
    if (!provider) return []
    const { data } = await supabase.from('posts').select('*').eq('provider_id', provider.id).order('created_at', { ascending: false })
    return (data ?? []) as Post[]
  }, [provider?.id])

  if (!provider) return <Navigate to="/pro/alta" replace />
  if (!posts.data) return <PageLoader />

  const pick = (f?: File) => {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setCaption('')
  }

  const publish = async () => {
    if (!file || !user) return
    setUploading(true)
    try {
      const url = await uploadImage(user.id, file, 'post')
      const { error } = await supabase.from('posts').insert({ provider_id: provider.id, image_url: url, caption: caption.trim() })
      if (error) throw error
      toast({ kind: 'success', title: 'Publicado', body: 'Tu trabajo ya aparece en tu perfil y en el inicio.' })
      setFile(null)
      setPreview(null)
      void posts.reload(true)
    } catch (e) {
      toast({ kind: 'error', title: 'No se pudo publicar', body: errorMessage(e) })
    } finally {
      setUploading(false)
    }
  }

  const remove = async (p: Post) => {
    if (!window.confirm('¿Eliminar esta publicación?')) return
    const { error } = await supabase.from('posts').delete().eq('id', p.id)
    if (error) toast({ kind: 'error', title: errorMessage(error) })
    else {
      setOpen(null)
      void posts.reload(true)
    }
  }

  return (
    <div className="pb-10">
      <TopBar
        title="Mis trabajos"
        right={
          <button onClick={() => fileRef.current?.click()} className="grid size-10 place-items-center rounded-full bg-brand text-white" aria-label="Subir foto">
            <ImagePlus className="size-5" />
          </button>
        }
      />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      <div className="px-4 pt-4">
        <p className="mb-4 text-sm text-muted">Sube fotos de tus trabajos: los perfiles con fotos reciben muchas más reservas.</p>
        {posts.data.length === 0 ? (
          <EmptyState icon={<Camera className="size-8" />} title="Sin fotos todavía" action={<ElegantButton onClick={() => fileRef.current?.click()}>Subir primera foto</ElegantButton>} />
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {posts.data.map((p) => (
              <button key={p.id} onClick={() => setOpen(p)} className="relative aspect-square overflow-hidden rounded-xl bg-ice">
                <img src={img(p.image_url, 240, 240)} alt={p.caption} loading="lazy" className="size-full object-cover" />
                <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded-full bg-navy/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  <Heart className="size-3 fill-white" /> {fmtCompact(p.likes_count)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Sheet open={!!preview} onClose={() => setPreview(null)} title="Nueva publicación">
        {preview && <img src={preview} alt="" className="max-h-72 w-full rounded-2xl object-cover" />}
        <textarea className="field mt-3 min-h-20 resize-none" placeholder="Describe el trabajo (ej: Fade + barba en Providencia)" value={caption} maxLength={220} onChange={(e) => setCaption(e.target.value)} />
        <ElegantButton variant="blue" block className="mt-3" loading={uploading} onClick={() => void publish()}>
          Publicar
        </ElegantButton>
      </Sheet>

      <Sheet open={!!open} onClose={() => setOpen(null)}>
        {open && (
          <div>
            <img src={img(open.image_url, 720)} alt={open.caption} className="w-full rounded-2xl" />
            <p className="mt-3 font-semibold">{open.caption}</p>
            <ElegantButton variant="danger" block className="mt-4" onClick={() => void remove(open)}>
              <Trash className="size-4" /> Eliminar
            </ElegantButton>
          </div>
        )}
      </Sheet>
    </div>
  )
}
