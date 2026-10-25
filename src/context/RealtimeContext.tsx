import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { showSystemNotification } from '../lib/notify'
import { supabase } from '../lib/supabase'
import type { AppNotification, Booking, Message } from '../lib/types'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

export type RealtimeEvent =
  | { type: 'message'; message: Message }
  | { type: 'notification'; notification: AppNotification }
  | { type: 'booking'; booking: Booking }

type RealtimeState = {
  unreadNotifications: number
  unreadMessages: number
  ringKey: number
  refreshCounts: () => Promise<void>
  setActiveConversation: (id: string | null) => void
  subscribe: (fn: (e: RealtimeEvent) => void) => () => void
}

const RealtimeContext = createContext<RealtimeState | null>(null)

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user, provider } = useAuth()
  const toast = useToast()
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [ringKey, setRingKey] = useState(0)
  const listeners = useRef(new Set<(e: RealtimeEvent) => void>())
  const activeConversation = useRef<string | null>(null)
  const uid = user?.id

  const emit = (e: RealtimeEvent) => listeners.current.forEach((fn) => fn(e))

  const refreshCounts = useCallback(async () => {
    if (!uid) {
      setUnreadNotifications(0)
      setUnreadMessages(0)
      return
    }
    const [n, c] = await Promise.all([
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('read', false),
      supabase.from('conversations').select('client_id, last_message, last_message_at, client_last_read_at, provider_last_read_at'),
    ])
    setUnreadNotifications(n.count ?? 0)
    const convs = (c.data ?? []) as {
      client_id: string
      last_message: string
      last_message_at: string
      client_last_read_at: string
      provider_last_read_at: string
    }[]
    setUnreadMessages(
      convs.filter((x) => {
        if (!x.last_message) return false
        const read = x.client_id === uid ? x.client_last_read_at : x.provider_last_read_at
        return new Date(x.last_message_at) > new Date(read)
      }).length,
    )
  }, [uid])

  useEffect(() => {
    void refreshCounts()
  }, [refreshCounts, provider?.id])

  useEffect(() => {
    if (!uid) return
    const channel = supabase
      .channel(`live-${uid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` }, (payload) => {
        const n = payload.new as AppNotification
        setUnreadNotifications((x) => x + 1)
        setRingKey((k) => k + 1)
        toast({ kind: 'info', title: n.title, body: n.body, link: n.link ?? undefined })
        if (document.visibilityState === 'hidden') void showSystemNotification(n.title, n.body, n.link ?? undefined)
        emit({ type: 'notification', notification: n })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new as Message
        emit({ type: 'message', message: m })
        if (m.sender_id === uid) return
        if (activeConversation.current === m.conversation_id) return
        void refreshCounts()
        if (m.sender_role !== 'system') {
          toast({ kind: 'info', title: 'Nuevo mensaje', body: m.body, link: `/app/mensajes/${m.conversation_id}` })
          if (document.visibilityState === 'hidden') void showSystemNotification('Nuevo mensaje', m.body, `/app/mensajes/${m.conversation_id}`)
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        if (payload.new && 'id' in payload.new) emit({ type: 'booking', booking: payload.new as Booking })
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  const setActiveConversation = useCallback((id: string | null) => {
    activeConversation.current = id
  }, [])

  const subscribe = useCallback((fn: (e: RealtimeEvent) => void) => {
    listeners.current.add(fn)
    return () => {
      listeners.current.delete(fn)
    }
  }, [])

  const value = useMemo(
    () => ({ unreadNotifications, unreadMessages, ringKey, refreshCounts, setActiveConversation, subscribe }),
    [unreadNotifications, unreadMessages, ringKey, refreshCounts, setActiveConversation, subscribe],
  )
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

export function useRealtime() {
  const ctx = useContext(RealtimeContext)
  if (!ctx) throw new Error('useRealtime fuera de RealtimeProvider')
  return ctx
}

// Ejecuta fn cuando llega un evento en vivo (mensajes, reservas, notificaciones)
export function useRealtimeEvent(fn: (e: RealtimeEvent) => void) {
  const { subscribe } = useRealtime()
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => subscribe((e) => ref.current(e)), [subscribe])
}
