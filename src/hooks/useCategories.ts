import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Category } from '../lib/types'

let cache: Category[] | null = null
let pending: Promise<Category[]> | null = null

export function loadCategories() {
  if (cache) return Promise.resolve(cache)
  pending ??= Promise.resolve(
    supabase
      .from('categories')
      .select('*')
      .order('sort')
      .then(({ data }) => {
        cache = (data as Category[]) ?? []
        return cache
      }),
  )
  return pending
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(cache ?? [])
  useEffect(() => {
    let alive = true
    void loadCategories().then((c) => alive && setCategories(c))
    return () => {
      alive = false
    }
  }, [])
  const byId = (id?: string) => categories.find((c) => c.id === id)
  return { categories, byId }
}
