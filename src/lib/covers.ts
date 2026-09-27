// Portada por defecto para profesionales nuevos (fotos libres de Unsplash)
const U = (id: string) => `https://images.unsplash.com/${id}`
export const CATEGORY_COVERS: Record<string, string> = {
  barberia: U('photo-1647140655214-e4a2d914971f'),
  belleza: U('photo-1634449571010-02389ed0f9b0'),
  masajes: U('photo-1519823551278-64ac92734fb1'),
  entrenador: U('photo-1534258936925-c58bed479fcb'),
  mascotas: U('photo-1648304887391-a6c2cf2228e4'),
  jardineria: U('photo-1690068023694-053da714f95f'),
  mecanica: U('photo-1625047509248-ec889cbff17f'),
  lavado: U('photo-1608506375591-b90e1f955e4b'),
  gasfiteria: U('photo-1749532125405-70950966b0e5'),
  electricidad: U('photo-1621905251189-08b45d6a269e'),
  aseo: U('photo-1646980241033-cd7abda2ee88'),
  maestro: U('photo-1513467535987-fd81bc7d62f8'),
  fletes: U('photo-1601467995997-ac1ae9a8fff4'),
  cerrajeria: U('photo-1756341782434-3020b9d17372'),
  tecnologia: U('photo-1721332154191-ba5f1534266e'),
  clases: U('photo-1758685733907-42e9651721f5'),
}
