import { Heart } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useCategories } from '../hooks/useCategories'
import { cn } from '../lib/cn'
import { fmtCompact, timeAgo } from '../lib/format'
import { img } from '../lib/images'
import type { Post } from '../lib/types'
import { Avatar } from './Avatar'
import { Verified } from './ProviderCard'

export function PostCard({ post, liked, onLike }: { post: Post; liked: boolean; onLike: () => void }) {
  const { byId } = useCategories()
  const [burst, setBurst] = useState(false)
  const [broken, setBroken] = useState(false)
  const p = post.provider
  const like = () => {
    if (!liked) {
      setBurst(true)
      setTimeout(() => setBurst(false), 700)
    }
    onLike()
  }
  return (
    <article className="overflow-hidden rounded-card border border-line bg-white shadow-card">
      {p && (
        <Link to={`/app/p/${p.id}`} className="flex items-center gap-2.5 px-3.5 py-3">
          <Avatar src={p.avatar_url} name={p.display_name} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="truncate text-sm font-extrabold">{p.display_name}</span>
              {p.verified && <Verified className="size-4" />}
            </div>
            <p className="truncate text-xs text-muted">
              {byId(p.category_id)?.name} · {p.comuna}
            </p>
          </div>
          <span className="text-xs text-muted">{timeAgo(post.created_at)}</span>
        </Link>
      )}
      <div className="relative aspect-[4/3] bg-ice" onDoubleClick={() => !liked && like()}>
        {broken ? (
          <div className="grid size-full place-items-center bg-[linear-gradient(135deg,#D1E2FF,#025FFB)] p-6 text-center text-lg font-extrabold text-white">{post.caption}</div>
        ) : (
          <img src={img(post.image_url, 640, 480)} alt={post.caption} loading="lazy" onError={() => setBroken(true)} className="size-full object-cover" />
        )}
        {burst && <Heart className="animate-pop absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 fill-white text-white drop-shadow-lg" />}
      </div>
      <div className="flex items-start gap-3 px-3.5 py-3">
        <button onClick={like} aria-pressed={liked} aria-label="Me gusta" className="flex items-center gap-1.5 text-sm font-bold transition active:scale-90">
          <Heart className={cn('size-6 transition', liked ? 'fill-rosa text-rosa' : 'text-navy')} />
          {fmtCompact(post.likes_count)}
        </button>
        <p className="min-w-0 flex-1 text-sm leading-snug">{post.caption}</p>
      </div>
    </article>
  )
}
