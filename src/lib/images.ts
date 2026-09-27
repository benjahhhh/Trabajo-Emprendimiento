// Pide a Unsplash la foto ya recortada al tamaño justo (más rápido en el móvil)
export function img(url: string | null | undefined, w: number, h?: number): string | undefined {
  if (!url) return undefined
  if (url.includes('images.unsplash.com')) {
    const dpr = typeof window !== 'undefined' ? Math.min(2, Math.round(window.devicePixelRatio || 1)) : 1
    const params = new URLSearchParams({ auto: 'format', fit: 'crop', w: String(w * dpr), q: '70' })
    if (h) params.set('h', String(h * dpr))
    return `${url}?${params}`
  }
  return url
}

// Reduce una foto antes de subirla (máx. 1280 px, JPEG)
export async function compressImage(file: File, max = 1280, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen'))), 'image/jpeg', quality),
  )
}
