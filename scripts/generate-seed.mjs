// Genera supabase/seed.sql (datos de ejemplo de Santiago de Chile, precios en CLP)
// y supabase/setup.sql (schema + seed en un solo archivo).
// Uso: node scripts/generate-seed.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const photos = JSON.parse(readFileSync(join(root, 'scripts/photos.json'), 'utf8'))

// ---------- PRNG determinista (mismos datos en cada ejecución) ----------
let seed = 20260927
function rand() {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const int = (a, b) => a + Math.floor(rand() * (b - a + 1))
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const uuid = () => {
  const h = () => Math.floor(rand() * 16).toString(16)
  const s = (n) => Array.from({ length: n }, h).join('')
  return `${s(8)}-${s(4)}-4${s(3)}-${pick(['8', '9', 'a', 'b'])}${s(3)}-${s(12)}`
}
const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`)
const round500 = (n) => Math.max(500, Math.round(n / 500) * 500)
const unsplash = (id) => `https://images.unsplash.com/${id}`

// ---------- Categorías ----------
const PALETTE = ['#025FFB', '#FD69CF', '#081B3A', '#D1E2FF']
const CATS = [
  ['jardineria', 'Jardinería', 'Sprout', 'jardin jardinero jardineria pasto cesped corte poda arbol arboles riego plantas maleza paisajismo'],
  ['mecanica', 'Mecánica', 'Wrench', 'mecanico mecanica auto autos carro coche aceite frenos bateria neumatico neumaticos scanner moto revision taller'],
  ['barberia', 'Barbería', 'Scissors', 'barbero barberia pelo corte barba fade degradado peluquero afeitado'],
  ['belleza', 'Belleza', 'Sparkles', 'manicure pedicure unas uñas maquillaje peluqueria peluquera peinado cejas pestañas estetica alisado tintura'],
  ['aseo', 'Aseo', 'SprayCan', 'aseo limpieza limpiar hogar departamento depto oficina ventanas alfombras sofa tapiz colchon'],
  ['gasfiteria', 'Gasfitería', 'Droplets', 'gasfiter gasfiteria plomero fontanero cañeria agua fuga calefont baño llave destape wc lavamanos'],
  ['electricidad', 'Electricidad', 'Zap', 'electricista electricidad enchufe luz cableado tablero corto circuito lampara instalacion'],
  ['maestro', 'Maestro', 'Hammer', 'maestro arreglos reparaciones muebles armado montaje pintura pintor pieza habitacion pared repisa cuadros carpintero'],
  ['mascotas', 'Mascotas', 'PawPrint', 'perro perros paseo paseador gato mascota mascotas cuidado peluqueria canina'],
  ['lavado', 'Lavado de autos', 'CarFront', 'lavado lavar auto autos tapiz encerado detailing pulido'],
  ['cerrajeria', 'Cerrajería', 'KeyRound', 'cerrajero cerrajeria llave llaves chapa cerradura puerta'],
  ['tecnologia', 'Técnico PC', 'Laptop', 'computador pc notebook celular reparacion formateo wifi internet tecnico impresora router'],
  ['clases', 'Clases', 'GraduationCap', 'profesor profesora clases clase particulares matematicas ingles reforzamiento paes musica guitarra'],
  ['masajes', 'Masajes', 'HandHeart', 'masaje masajes masajista kinesiologo kinesiologa kine relajacion descontracturante spa'],
  ['entrenador', 'Entrenador', 'Dumbbell', 'entrenador entrenadora personal trainer ejercicio gym yoga funcional boxeo'],
  ['fletes', 'Fletes', 'Truck', 'flete fletes mudanza mudanzas camion camioneta traslado muebles'],
].map(([id, name, icon, keywords], i) => ({ id, name, icon, keywords, color: PALETTE[i % PALETTE.length], sort: i + 1 }))

// ---------- Comunas de Santiago ----------
const COMUNAS = {
  'Santiago Centro': [-33.4372, -70.6506],
  Providencia: [-33.4314, -70.6093],
  'Ñuñoa': [-33.4569, -70.5979],
  'Las Condes': [-33.4125, -70.565],
  Vitacura: [-33.39, -70.576],
  'La Reina': [-33.445, -70.54],
  Macul: [-33.487, -70.599],
  'San Miguel': [-33.496, -70.651],
  'La Florida': [-33.523, -70.598],
  'Peñalolén': [-33.486, -70.543],
  'Maipú': [-33.51, -70.758],
  'Estación Central': [-33.459, -70.698],
  Recoleta: [-33.406, -70.641],
  Independencia: [-33.415, -70.665],
  'Lo Barnechea': [-33.353, -70.518],
  'Puente Alto': [-33.61, -70.576],
  'San Joaquín': [-33.496, -70.629],
  'Quinta Normal': [-33.429, -70.698],
}

// ---------- Profesionales (3 por categoría) ----------
// [categoria, nombre comercial, persona, género, comuna, titular, bio]
const PROS = [
  ['jardineria', 'Jardines Don Pedro', 'Pedro Contreras', 'm', 'La Reina', 'Corte de pasto y mantención de jardines', 'Más de 15 años cuidando jardines en el oriente de Santiago. Llevo cortadora, orilladora y me llevo los residuos.'],
  ['jardineria', 'Verde Vivo', 'Camila Rojas', 'f', 'Las Condes', 'Paisajismo y poda con herramientas propias', 'Técnica agrícola. Diseño jardines de bajo consumo de agua y hago poda de arbustos y árboles pequeños.'],
  ['jardineria', 'Luis Jardinero', 'Luis Muñoz', 'm', 'Maipú', 'Corte de pasto rápido y a precio justo', 'Corte de pasto, limpieza de maleza y riego. Atiendo Maipú, Cerrillos y Estación Central.'],
  ['mecanica', 'Mecánico a Domicilio Carlos', 'Carlos Soto', 'm', 'Ñuñoa', 'Cambio de aceite y frenos en tu casa', 'Mecánico automotriz titulado. Voy a tu casa o trabajo con todo el equipo. Uso repuestos originales o alternativos, tú eliges.'],
  ['mecanica', 'AutoFix Móvil', 'Diego Fuentes', 'm', 'Providencia', 'Diagnóstico con scanner y mantenciones', 'Scanner multimarca para detectar fallas en el momento. Mantenciones por kilometraje sin ir al taller.'],
  ['mecanica', 'Taller Móvil Rivas', 'Andrés Rivas', 'm', 'La Florida', 'Mecánica general y baterías', 'Cambio de baterías, alternadores y arranques. Si tu auto no parte, voy a buscarte.'],
  ['barberia', 'Barber Nico', 'Nicolás Pérez', 'm', 'Santiago Centro', 'Barbero a domicilio · fades y barba', 'Barbero con 8 años de experiencia. Llevo sillón plegable, capa y todo desinfectado. Fades, tijera y barba con toalla caliente.'],
  ['barberia', 'The Home Barber', 'Matías Silva', 'm', 'Vitacura', 'Cortes clásicos y modernos en tu casa', 'Ideal para oficinas y eventos. Cortes clásicos, texturizados y afeitado tradicional.'],
  ['barberia', 'Kevin Cuts', 'Kevin Morales', 'm', 'San Miguel', 'Degradados y diseños · también niños', 'Especialista en degradados y diseños. Paciencia con los más pequeños.'],
  ['belleza', 'Nails by Fran', 'Francisca Díaz', 'f', 'Providencia', 'Manicure y pedicure semipermanente', 'Manicurista certificada. Esmaltado semipermanente, kapping y nail art. Materiales esterilizados.'],
  ['belleza', 'Glam en Casa', 'Valentina Torres', 'f', 'Las Condes', 'Maquillaje y peinados para eventos', 'Maquilladora profesional para matrimonios, graduaciones y sesiones de fotos. Voy donde te arregles.'],
  ['belleza', 'Estética Javi', 'Javiera González', 'f', 'Ñuñoa', 'Pestañas, cejas y uñas a domicilio', 'Lifting de pestañas, perfilado de cejas y uñas. Atención cálida y puntual.'],
  ['aseo', 'Brillo Total', 'Marcela Herrera', 'f', 'Las Condes', 'Aseo profundo de casas y departamentos', 'Equipo de 2 personas con productos incluidos. Aseo profundo, post mudanza y post obra.'],
  ['aseo', 'Limpieza Rosa', 'Rosa Vargas', 'f', 'Estación Central', 'Aseo general por horas', 'Aseo general, planchado y orden. Referencias de clientes de hace años.'],
  ['aseo', 'Sofá Limpio', 'Jorge Castillo', 'm', 'Macul', 'Limpieza de sofás, alfombras y colchones', 'Lavado de tapiz con máquina de inyección-extracción. Secado rápido.'],
  ['gasfiteria', 'Gásfiter Manuel', 'Manuel Reyes', 'm', 'Santiago Centro', 'Fugas, destapes y calefont', 'Gásfiter con certificación SEC. Reparación de fugas, destapes y mantención de calefont.'],
  ['gasfiteria', 'AquaFix', 'Rodrigo Pizarro', 'm', 'Providencia', 'Gasfitería certificada SEC', 'Instalación de griferías, sanitarios y termos. Trabajo garantizado por 3 meses.'],
  ['gasfiteria', 'Don Raúl Gásfiter', 'Raúl Espinoza', 'm', 'Puente Alto', 'Urgencias de gasfitería', 'Atiendo urgencias en Puente Alto, La Florida y La Pintana.'],
  ['electricidad', 'Electro Sebastián', 'Sebastián Álvarez', 'm', 'Ñuñoa', 'Electricista certificado SEC', 'Instalaciones eléctricas, tableros y certificación TE1. Trabajo limpio y ordenado.'],
  ['electricidad', 'Luz y Fuerza', 'Felipe Navarro', 'm', 'Maipú', 'Instalaciones y tableros eléctricos', 'Ampliaciones eléctricas, cambio de automáticos y diferenciales.'],
  ['electricidad', 'Tomás Electricista', 'Tomás Araya', 'm', 'Recoleta', 'Enchufes, lámparas y cortocircuitos', 'Arreglo cortocircuitos e instalo lámparas, enchufes y focos LED.'],
  ['maestro', 'Maestro Hugo', 'Hugo Sepúlveda', 'm', 'La Florida', 'Arreglos del hogar y armado de muebles', 'Armo muebles de cualquier tienda, instalo repisas, cortinas y cuadros.'],
  ['maestro', 'Pinturas Benja', 'Benjamín Carrasco', 'm', 'Peñalolén', 'Pintura interior y exterior', 'Pintura de departamentos y casas con terminaciones prolijas. Presupuesto sin costo.'],
  ['maestro', 'Todo Arreglo', 'Cristián Figueroa', 'm', 'Independencia', 'Maestro multiuso de confianza', 'Pequeñas reparaciones: puertas, bisagras, cerámica y sellos.'],
  ['mascotas', 'Paseos Sofi', 'Sofía Castro', 'f', 'Providencia', 'Paseo y cuidado de perros', 'Amo los perros. Paseos de 1 hora en grupos pequeños y fotos del paseo por el chat.'],
  ['mascotas', 'Huellitas', 'Ignacio Vera', 'm', 'Ñuñoa', 'Paseador de perros con experiencia', 'Estudiante de veterinaria. Paseos, alimentación y cuidado cuando viajas.'],
  ['mascotas', 'Peluquería Canina Móvil', 'Daniela Molina', 'f', 'Las Condes', 'Baño y corte canino a domicilio', 'Baño, corte y corte de uñas sin estrés para tu mascota.'],
  ['lavado', 'Lava Car Móvil', 'Joaquín Ortiz', 'm', 'Vitacura', 'Lavado ecológico a domicilio', 'Lavado sin manguera con productos biodegradables. Tu auto limpio mientras trabajas.'],
  ['lavado', 'Detailing Pro', 'Martín Guzmán', 'm', 'Lo Barnechea', 'Pulido, encerado y tapiz', 'Detailing completo: pulido de pintura, encerado cerámico y limpieza de tapiz.'],
  ['lavado', 'AutoSpa Express', 'Bastián Tapia', 'm', 'San Joaquín', 'Lavado completo en 1 hora', 'Lavado exterior e interior con aspirado. Precios especiales para flotas.'],
  ['cerrajeria', 'Cerrajería Rápida', 'Patricio Núñez', 'm', 'Santiago Centro', 'Aperturas en 30 minutos', 'Apertura de puertas sin daño, cambio de cilindros y chapas de seguridad.'],
  ['cerrajeria', 'Llaves Don Óscar', 'Óscar Jara', 'm', 'Ñuñoa', 'Cambio de chapas y copias de llaves', 'Cerrajero con 20 años de oficio. Copias de llaves y chapas a domicilio.'],
  ['cerrajeria', 'Cerrajero 24/7', 'Francisco Bravo', 'm', 'Quinta Normal', 'Urgencias de día y de noche', 'Atiendo urgencias todos los días, incluidos festivos.'],
  ['tecnologia', 'TecnoAyuda', 'Gabriel Salinas', 'm', 'Providencia', 'Formateo, virus y respaldo', 'Ingeniero en informática. Formateo, respaldo de fotos y limpieza de virus.'],
  ['tecnologia', 'Fix My Laptop', 'Constanza León', 'f', 'Santiago Centro', 'Reparación de notebooks y celulares', 'Cambio de pantallas, baterías y teclados. Diagnóstico en tu casa.'],
  ['tecnologia', 'Redes Hogar', 'Vicente Cortés', 'm', 'Las Condes', 'Wifi, routers y casa inteligente', 'Mejoro la señal wifi de tu casa e instalo cámaras y domótica.'],
  ['clases', 'Profe Catalina', 'Catalina Muñoz', 'f', 'Ñuñoa', 'Matemáticas y preparación PAES', 'Profesora de matemáticas. Reforzamiento escolar y preparación PAES con ensayos.'],
  ['clases', 'English with Sam', 'Samuel Rojas', 'm', 'Providencia', 'Inglés conversacional', 'Viví 5 años en Canadá. Clases conversacionales para trabajo y viajes.'],
  ['clases', 'Guitarra con Pablo', 'Pablo Mendoza', 'm', 'La Reina', 'Clases de guitarra para todas las edades', 'Músico titulado. Aprende tus canciones favoritas desde la primera clase.'],
  ['masajes', 'Relax Home Spa', 'Antonia Paredes', 'f', 'Vitacura', 'Masajes descontracturantes a domicilio', 'Llevo camilla, aceites y música. Masaje descontracturante, relajante y piedras calientes.'],
  ['masajes', 'Kine en Casa', 'Fernanda Lagos', 'f', 'Providencia', 'Kinesióloga · rehabilitación y masajes', 'Kinesióloga titulada. Rehabilitación de lesiones y adulto mayor a domicilio.'],
  ['masajes', 'Manos Sanadoras', 'Claudia Riquelme', 'f', 'Macul', 'Masaje relajante y reflexología', 'Terapeuta holística. Masaje relajante, reflexología y drenaje linfático.'],
  ['entrenador', 'Coach Ale', 'Alejandro Vidal', 'm', 'Las Condes', 'Entrenamiento funcional en casa', 'Preparador físico. Planes para bajar de peso y ganar fuerza sin ir al gimnasio.'],
  ['entrenador', 'Fit con Ignacia', 'Ignacia Fuentes', 'f', 'Ñuñoa', 'Entrenadora personal y yoga', 'Entrenamiento personalizado y clases de yoga para principiantes.'],
  ['entrenador', 'Box Training', 'Esteban Rojas', 'm', 'San Miguel', 'Boxeo y acondicionamiento físico', 'Ex boxeador amateur. Clases de boxeo recreativo y cardio.'],
  ['fletes', 'Fletes Ramírez', 'José Ramírez', 'm', 'Maipú', 'Fletes y mudanzas pequeñas', 'Camioneta cerrada y ayudante. Fletes dentro de Santiago.'],
  ['fletes', 'Mudanzas Express', 'Mauricio Olivares', 'm', 'La Florida', 'Mudanzas completas con embalaje', 'Camión 3/4, embalaje y armado de muebles incluidos.'],
  ['fletes', 'Flete Ya', 'Ricardo Pino', 'm', 'Recoleta', 'Camioneta disponible hoy', 'Retiro compras de tiendas y traslado electrodomésticos el mismo día.'],
]

// ---------- Servicios por categoría: [título, precio base CLP, minutos, descripción] ----------
const SERVICES = {
  jardineria: [['Corte de pasto (hasta 100 m²)', 18000, 90, 'Corte, orillado y retiro de residuos.'], ['Poda de arbustos', 25000, 120, 'Poda y formación de arbustos y cercos.'], ['Limpieza de maleza', 22000, 120, 'Desmalezado y limpieza de platabandas.'], ['Mantención mensual de jardín', 60000, 240, '4 visitas al mes: corte, poda y riego.']],
  mecanica: [['Cambio de aceite y filtro a domicilio', 45000, 60, 'Incluye 4 litros de aceite sintético y filtro.'], ['Diagnóstico con scanner', 20000, 45, 'Lectura de fallas y borrado de códigos.'], ['Cambio de pastillas de freno', 40000, 90, 'Mano de obra por eje. Repuestos aparte.'], ['Cambio de batería', 15000, 30, 'Instalación y prueba del sistema de carga.']],
  barberia: [['Corte a domicilio', 12000, 45, 'Corte con máquina y tijera, lavado incluido.'], ['Corte + barba', 17000, 60, 'Corte completo y perfilado de barba con toalla caliente.'], ['Perfilado de barba', 8000, 25, 'Perfilado, navaja y bálsamo.'], ['Corte niño', 10000, 30, 'Para menores de 12 años.']],
  belleza: [['Manicure semipermanente', 15000, 60, 'Limado, cutícula y esmaltado semipermanente.'], ['Pedicure spa', 18000, 70, 'Exfoliación, hidratación y esmaltado.'], ['Peinado para evento', 25000, 60, 'Ondas, tomados o brushing.'], ['Maquillaje social', 30000, 60, 'Maquillaje de larga duración.'], ['Lifting de pestañas', 20000, 60, 'Incluye tinte.']],
  aseo: [['Aseo general (4 horas)', 35000, 240, 'Cocina, baños, dormitorios y living.'], ['Limpieza profunda de cocina', 30000, 180, 'Desengrase de campana, horno y muebles.'], ['Limpieza de sofá 3 cuerpos', 28000, 90, 'Lavado con inyección-extracción.'], ['Limpieza de alfombra', 25000, 90, 'Hasta 6 m².']],
  gasfiteria: [['Visita y diagnóstico', 15000, 45, 'Se descuenta si realizas el trabajo.'], ['Destape de cañería', 25000, 60, 'Lavaplatos, lavamanos o WC.'], ['Cambio de llave o monomando', 20000, 60, 'Mano de obra. Grifería aparte.'], ['Mantención de calefont', 30000, 90, 'Limpieza de quemadores y revisión de gases.']],
  electricidad: [['Visita técnica', 15000, 45, 'Diagnóstico de fallas eléctricas.'], ['Instalación de lámpara', 12000, 45, 'Colgante, plafón o aplique.'], ['Cambio de enchufe', 8000, 20, 'Por unidad, material aparte.'], ['Revisión de tablero', 25000, 60, 'Automáticos, diferencial y conexiones.']],
  maestro: [['Armado de muebles', 20000, 90, 'Closets, camas, escritorios y más.'], ['Instalación de repisas o cuadros', 12000, 45, 'Hasta 4 elementos.'], ['Pintura de habitación', 60000, 360, 'Hasta 12 m², pintura aparte.'], ['Reparaciones varias (1 hora)', 15000, 60, 'Puertas, bisagras, sellos, etc.']],
  mascotas: [['Paseo de perro (1 hora)', 6000, 60, 'Paseo individual o en grupo pequeño.'], ['Visita de cuidado', 10000, 45, 'Comida, agua y compañía cuando no estás.'], ['Baño y corte canino', 20000, 90, 'A domicilio, según tamaño.']],
  lavado: [['Lavado exterior + interior', 15000, 60, 'Carrocería, llantas, vidrios y aspirado.'], ['Lavado de tapiz', 35000, 150, 'Asientos, alfombras y techo.'], ['Pulido y encerado', 30000, 120, 'Recupera el brillo de la pintura.']],
  cerrajeria: [['Apertura de puerta', 25000, 30, 'Sin daño en la mayoría de los casos.'], ['Cambio de chapa', 30000, 45, 'Mano de obra. Chapa aparte.'], ['Copia de llaves a domicilio', 8000, 20, 'Hasta 3 copias.']],
  tecnologia: [['Formateo + respaldo', 25000, 120, 'Windows o macOS, con respaldo de archivos.'], ['Mantención de notebook', 20000, 60, 'Limpieza interna y cambio de pasta térmica.'], ['Configuración de wifi', 15000, 45, 'Router, repetidores y red mesh.'], ['Diagnóstico de celular', 10000, 30, 'Pantalla, batería o carga.']],
  clases: [['Clase de matemáticas (1 h)', 15000, 60, 'Básica, media o universitaria.'], ['Preparación PAES (1 h)', 18000, 60, 'Ensayos y técnicas de resolución.'], ['Inglés conversacional (1 h)', 14000, 60, 'Todos los niveles.'], ['Clase de guitarra (1 h)', 13000, 60, 'Acústica o eléctrica.']],
  masajes: [['Masaje descontracturante (60 min)', 28000, 60, 'Espalda, cuello y hombros.'], ['Masaje relajante (60 min)', 25000, 60, 'Aceites esenciales y música.'], ['Sesión de kinesiología', 30000, 60, 'Evaluación y tratamiento a domicilio.']],
  entrenador: [['Sesión personalizada (1 h)', 20000, 60, 'Plan según tu objetivo.'], ['Plan mensual (8 sesiones)', 140000, 60, 'Dos sesiones por semana con seguimiento.'], ['Clase de yoga a domicilio', 18000, 60, 'Principiantes e intermedios.']],
  fletes: [['Flete pequeño (camioneta)', 25000, 60, 'Dentro de Santiago, hasta 20 km.'], ['Mudanza de departamento', 120000, 300, 'Camión 3/4 con 2 ayudantes.'], ['Traslado de electrodomésticos', 20000, 60, 'Refrigerador, lavadora o cocina.']],
}

// ---------- Textos de publicaciones ----------
const CAPTIONS = {
  jardineria: ['Así quedó este jardín en La Reina después del corte 🌿', 'Poda de cerco terminada, listo para la primavera', 'Antes y después: limpieza de maleza completa', 'Mantención mensual al día ✂️🌱', 'Jardín de bajo consumo de agua, ideal para Santiago'],
  mecanica: ['Cambio de aceite hecho en el estacionamiento del cliente 🔧', 'Diagnóstico con scanner: falla de sensor resuelta', 'Frenos nuevos y probados antes de entregar', 'Otra batería instalada en menos de 30 min', 'Mantención de 50.000 km sin ir al taller'],
  barberia: ['Fade limpio recién terminado 💈', 'Corte + barba con toalla caliente', 'Diseño a pedido del cliente', 'Así trabajamos a domicilio: todo desinfectado', 'Clásico que nunca falla'],
  belleza: ['Semipermanente nude para el día a día 💅', 'Nail art para un matrimonio', 'Pedicure spa completo', 'Look de graduación ✨', 'Manicure francesa moderna'],
  aseo: ['Departamento listo para entregar ✨', 'Limpieza profunda de cocina terminada', 'Sofá como nuevo después del lavado', 'Aseo post mudanza en Las Condes', 'Productos incluidos, tú solo relájate'],
  gasfiteria: ['Calefont mantenido y funcionando perfecto 🔥', 'Fuga reparada bajo el lavaplatos', 'Instalación de grifería nueva', 'Destape resuelto en 40 minutos', 'Baño renovado con sanitarios nuevos'],
  electricidad: ['Tablero ordenado y etiquetado ⚡', 'Instalación de iluminación LED', 'Cambio de enchufes en toda la casa', 'Revisión con multímetro antes de entregar', 'Circuito nuevo para la cocina'],
  maestro: ['Closet armado en 1 hora 🛠️', 'Repisas flotantes instaladas', 'Pieza pintada con dos manos de látex', 'Puerta ajustada y bisagras nuevas', 'Trabajo terminado y limpio'],
  mascotas: ['Paseo de la tarde con Toby 🐶', 'Grupo pequeño, paseo tranquilo', 'Después del baño quedó feliz', 'Cuidando a Luna mientras sus dueños viajan', 'Paseo por el parque Inés de Suárez'],
  lavado: ['Lavado completo en el estacionamiento de la oficina 🚗', 'Pulido que recupera el brillo', 'Tapiz lavado y secando', 'Llantas impecables', 'Lavado ecológico sin manguera'],
  cerrajeria: ['Cambio de chapa de seguridad 🔑', 'Apertura sin daño en 15 minutos', 'Copias de llaves a domicilio', 'Candados y cilindros de alta seguridad', 'Urgencia resuelta un domingo en la noche'],
  tecnologia: ['Notebook como nuevo después de la mantención 💻', 'Placa revisada y reparada', 'Wifi en toda la casa con red mesh', 'Respaldo de fotos antes del formateo', 'PC de escritorio optimizado'],
  clases: ['Repasando ecuaciones para la prueba 📚', 'Clase de conversación en inglés', 'Ensayo PAES corregido', 'Primera canción aprendida 🎸', 'Materiales listos para la clase'],
  masajes: ['Sesión descontracturante a domicilio 💆', 'Camilla lista, música y aromaterapia', 'Rehabilitación de rodilla, semana 3', 'Reflexología para cerrar la semana', 'Masaje de piernas después del maratón'],
  entrenador: ['Entrenamiento funcional en el living 🏋️', 'Box jumps para subir el nivel', 'Sesión de fuerza con el cliente', 'Estiramientos después de entrenar', 'Rutina lista para la semana'],
  fletes: ['Mudanza terminada antes de las 13:00 🚚', 'Refrigerador trasladado sin un rasguño', 'Cajas embaladas y rotuladas', 'Flete desde el Sodimac al depto', 'Camioneta lista para salir'],
}

// ---------- Reseñas ----------
const REVIEW_NAMES = ['Josefa M.', 'Tomás R.', 'Catalina S.', 'Felipe A.', 'Martina G.', 'Benjamín C.', 'Isidora P.', 'Agustín V.', 'Florencia L.', 'Vicente O.', 'Emilia T.', 'Maximiliano D.', 'Antonia F.', 'Joaquín B.', 'Trinidad H.', 'Lucas N.', 'Amanda Q.', 'Cristóbal E.', 'Renata U.', 'Gaspar I.', 'Paula K.', 'Rodrigo Z.', 'Fernanda J.', 'Sebastián Y.', 'Carolina W.', 'Ignacio X.']
const REVIEWS_GENERIC = [
  [5, 'Súper puntual y muy amable. Lo recomiendo 100%.'],
  [5, 'Excelente trabajo, llegó a la hora y dejó todo limpio.'],
  [5, 'Muy profesional. Reservar por la app fue facilísimo.'],
  [5, 'Lo contraté un sábado y llegó en menos de una hora. Impecable.'],
  [4, 'Buen trabajo, se demoró un poco más de lo previsto pero quedó bien.'],
  [5, 'Precio justo y muy buena disposición. Volveré a contratar.'],
  [4, 'Muy bien en general, buena comunicación por el chat.'],
  [5, 'Quedé feliz con el resultado. Gracias!'],
  [3, 'Cumplió, aunque llegó 20 minutos tarde.'],
  [5, 'Atento a cada detalle. De los mejores que he contratado.'],
]
const REVIEWS_BY_CAT = {
  jardineria: [[5, 'El pasto quedó perfecto y se llevó todos los residuos.'], [5, 'Muy buena poda, el jardín quedó precioso.']],
  mecanica: [[5, 'Me cambió el aceite en el estacionamiento de mi edificio en 40 minutos.'], [5, 'Encontró la falla con el scanner al tiro. Muy honesto.']],
  barberia: [[5, 'El mejor fade que me han hecho y sin moverme de la casa.'], [5, 'Trajo todo su equipo y dejó el baño impecable.']],
  belleza: [[5, 'Las uñas me duraron 3 semanas perfectas.'], [5, 'Me maquilló para un matrimonio y quedé feliz.']],
  aseo: [[5, 'El depto quedó brillando. Muy detallista.'], [5, 'El sofá quedó como nuevo, increíble.']],
  gasfiteria: [[5, 'Arregló la fuga del calefont rápido y me explicó todo.'], [4, 'Buen trabajo con el destape, precio razonable.']],
  electricidad: [[5, 'Instaló todas las lámparas y dejó el tablero ordenado.'], [5, 'Resolvió un cortocircuito que nadie encontraba.']],
  maestro: [[5, 'Armó el closet completo en una hora y media.'], [5, 'Pintó mi pieza y quedó perfecta, sin manchas.']],
  mascotas: [[5, 'Mi perro la adora. Me manda fotos de cada paseo.'], [5, 'Muy responsable cuidando a mi gata mientras viajé.']],
  lavado: [[5, 'Me lavaron el auto en la oficina, quedó impecable.'], [5, 'El pulido dejó la pintura como nueva.']],
  cerrajeria: [[5, 'Me abrió la puerta en 15 minutos un domingo en la noche.'], [5, 'Cambió la chapa rápido y a buen precio.']],
  tecnologia: [[5, 'Mi notebook volvió a la vida. Respaldó todo antes.'], [5, 'Ahora tengo wifi en toda la casa.']],
  clases: [[5, 'Mi hijo subió de un 4 a un 6 en matemáticas.'], [5, 'Clases muy entretenidas, ya toco mis canciones.']],
  masajes: [[5, 'El mejor masaje descontracturante que me han dado.'], [5, 'Muy profesional con mi mamá en su rehabilitación.']],
  entrenador: [[5, 'En dos meses bajé 5 kilos entrenando en mi casa.'], [5, 'Muy motivador y buen plan de entrenamiento.']],
  fletes: [[5, 'La mudanza fue rápida y no se rompió nada.'], [5, 'Me trasladó el refri el mismo día que lo compré.']],
}
const CLIENT_NAMES = ['Camila Fuentes', 'Diego Morales', 'Valentina Rojas', 'Matías González', 'Javiera Muñoz', 'Sebastián Díaz', 'Constanza Pérez', 'Nicolás Soto', 'Fernanda Silva', 'Felipe Contreras', 'Daniela López', 'Tomás Martínez', 'Catalina Sepúlveda', 'Joaquín Araya', 'Antonia Castillo', 'Benjamín Reyes', 'Francisca Espinoza', 'Vicente Torres', 'Isidora Flores', 'Martín Vargas']

// ---------- Construcción ----------
const out = []
const line = (s = '') => out.push(s)

line('-- =====================================================================')
line('-- CERCA · Datos de ejemplo (Santiago de Chile, precios en CLP)')
line('-- Generado por scripts/generate-seed.mjs. Ejecutar DESPUÉS de schema.sql.')
line('-- Re-ejecutable: actualiza los datos demo sin tocar a los usuarios reales.')
line('-- =====================================================================')
line()
line('begin;')
line()
line('-- Categorías')
line('insert into public.categories (id, name, icon, color, keywords, sort) values')
line(CATS.map((c) => `  (${q(c.id)}, ${q(c.name)}, ${q(c.icon)}, ${q(c.color)}, ${q(c.keywords)}, ${c.sort})`).join(',\n'))
line('on conflict (id) do update set name = excluded.name, icon = excluded.icon, color = excluded.color,')
line('  keywords = excluded.keywords, sort = excluded.sort;')
line()

const menIdx = shuffle(Array.from({ length: 90 }, (_, i) => i + 1))
const womenIdx = shuffle(Array.from({ length: 90 }, (_, i) => i + 1))
const photoPool = Object.fromEntries(Object.entries(photos).map(([k, v]) => [k, shuffle(v)]))
const photoCursor = {}
const nextPhoto = (cat) => {
  const list = photoPool[cat]
  const i = photoCursor[cat] ?? 0
  photoCursor[cat] = i + 1
  return list[i % list.length]
}

const providers = []
const services = []
const posts = []
const reviews = []
const privates = []

for (const [cat, display, person, gender, comuna, headline, bio] of PROS) {
  const id = uuid()
  const [clat, clng] = COMUNAS[comuna]
  const lat = +(clat + (rand() - 0.5) * 0.016).toFixed(6)
  const lng = +(clng + (rand() - 0.5) * 0.018).toFixed(6)
  const avatar = `https://randomuser.me/api/portraits/${gender === 'f' ? 'women' : 'men'}/${gender === 'f' ? womenIdx.pop() : menIdx.pop()}.jpg`
  const cover = unsplash(nextPhoto(cat))
  const ratingCount = int(18, 260)
  const ratingAvg = +(4.4 + rand() * 0.6).toFixed(2)
  const p = {
    id, cat, display, person, comuna, headline, bio, lat, lng, avatar, cover,
    radius: pick([5, 8, 10, 12, 15, 20]),
    years: int(2, 22),
    available: rand() < 0.78,
    verified: rand() < 0.72,
    ratingAvg: Math.min(ratingAvg, 5),
    ratingCount,
    jobs: ratingCount + int(10, 180),
    followers: int(40, 2400),
    response: pick([5, 8, 10, 15, 20, 30, 45]),
  }
  providers.push(p)
  privates.push({ id, phone: `+56 9 ${int(5000, 9999)} ${int(1000, 9999)}` })

  const catServices = SERVICES[cat]
  const n = Math.min(catServices.length, int(2, 4))
  for (const [title, base, minutes, desc] of shuffle(catServices).slice(0, n)) {
    services.push({ id: uuid(), provider: id, title, price: round500(base * (0.85 + rand() * 0.3)), minutes, desc })
  }

  const nPosts = int(2, 4)
  for (let i = 0; i < nPosts; i++) {
    posts.push({
      id: uuid(), provider: id, image: unsplash(nextPhoto(cat)), caption: pick(CAPTIONS[cat]),
      likes: int(8, 480), hoursAgo: int(3, 1400),
    })
  }

  const pool = shuffle([...REVIEWS_BY_CAT[cat], ...REVIEWS_GENERIC])
  const nReviews = int(4, 7)
  const names = shuffle(REVIEW_NAMES)
  for (let i = 0; i < nReviews; i++) {
    const [rating, comment] = pool[i % pool.length]
    const withAvatar = rand() < 0.55
    const g = rand() < 0.5 ? 'women' : 'men'
    reviews.push({
      id: uuid(), provider: id, author: names[i], rating, comment,
      avatar: withAvatar ? `https://randomuser.me/api/portraits/${g}/${int(1, 95)}.jpg` : null,
      hoursAgo: int(10, 2000),
    })
  }
}

line('-- Profesionales de ejemplo (user_id = null → responden solos en modo demo)')
line('insert into public.providers (id, user_id, category_id, display_name, headline, bio, avatar_url, cover_url, comuna, lat, lng,')
line('  service_radius_km, years_experience, available, verified, is_demo, response_minutes) values')
line(providers.map((p) => `  (${q(p.id)}, null, ${q(p.cat)}, ${q(p.display)}, ${q(p.headline)}, ${q(p.bio)}, ${q(p.avatar)}, ${q(p.cover)}, ${q(p.comuna)}, ${p.lat}, ${p.lng}, ${p.radius}, ${p.years}, ${p.available}, ${p.verified}, true, ${p.response})`).join(',\n'))
line('on conflict (id) do update set category_id = excluded.category_id, display_name = excluded.display_name,')
line('  headline = excluded.headline, bio = excluded.bio, avatar_url = excluded.avatar_url, cover_url = excluded.cover_url,')
line('  comuna = excluded.comuna, lat = excluded.lat, lng = excluded.lng, service_radius_km = excluded.service_radius_km,')
line('  years_experience = excluded.years_experience, available = excluded.available, verified = excluded.verified,')
line('  is_demo = true, response_minutes = excluded.response_minutes;')
line()
line('insert into public.provider_private (provider_id, phone) values')
line(privates.map((p) => `  (${q(p.id)}, ${q(p.phone)})`).join(',\n'))
line('on conflict (provider_id) do update set phone = excluded.phone;')
line()
line('-- Servicios')
line('insert into public.services (id, provider_id, title, description, price, duration_min) values')
line(services.map((s) => `  (${q(s.id)}, ${q(s.provider)}, ${q(s.title)}, ${q(s.desc)}, ${s.price}, ${s.minutes})`).join(',\n'))
line('on conflict (id) do update set title = excluded.title, description = excluded.description,')
line('  price = excluded.price, duration_min = excluded.duration_min, active = true;')
line()
line('-- Publicaciones (fotos de Unsplash, licencia libre)')
line('insert into public.posts (id, provider_id, image_url, caption, likes_count, created_at) values')
line(posts.map((p) => `  (${q(p.id)}, ${q(p.provider)}, ${q(p.image)}, ${q(p.caption)}, ${p.likes}, now() - interval '${p.hoursAgo} hours')`).join(',\n'))
line('on conflict (id) do update set image_url = excluded.image_url, caption = excluded.caption;')
line()
line('-- Reseñas de ejemplo')
line('insert into public.reviews (id, provider_id, author_name, author_avatar, rating, comment, created_at) values')
line(reviews.map((r) => `  (${q(r.id)}, ${q(r.provider)}, ${q(r.author)}, ${q(r.avatar)}, ${r.rating}, ${q(r.comment)}, now() - interval '${r.hoursAgo} hours')`).join(',\n'))
line('on conflict (id) do nothing;')
line()

// ---------- Reservas históricas (solo alimentan el panel de negocio) ----------
const bookings = []
for (let i = 0; i < 160; i++) {
  const p = pick(providers)
  const svc = pick(services.filter((s) => s.provider === p.id))
  const r = rand()
  const status = r < 0.82 ? 'completed' : r < 0.9 ? 'cancelled' : r < 0.94 ? 'rejected' : r < 0.98 ? 'accepted' : 'pending'
  // más reservas en los días recientes
  const daysAgo = Math.floor(Math.pow(rand(), 1.4) * 30)
  const hour = int(9, 20)
  bookings.push({ id: uuid(), p, svc, status, daysAgo, hour, client: pick(CLIENT_NAMES), brand: pick(['Visa', 'Mastercard', 'Visa', 'Mastercard', 'American Express']), last4: String(int(1000, 9999)) })
}
line('-- Reservas históricas de ejemplo (no pertenecen a ningún usuario; alimentan el panel de negocio)')
line('insert into public.bookings (id, client_id, client_name, provider_id, service_id, service_title, scheduled_at, address, notes,')
line('  price, commission_rate, commission_amount, provider_amount, status, payment_status, card_brand, card_last4, is_demo,')
line('  created_at, updated_at, accepted_at, completed_at, cancelled_at) values')
line(bookings.map((b) => {
  const commission = Math.round(b.svc.price * 0.1)
  const sched = b.status === 'accepted' || b.status === 'pending'
    ? `date_trunc('hour', now()) + interval '${b.daysAgo % 5 + 1} days ${b.hour - 9} hours'`
    : `date_trunc('hour', now()) - interval '${b.daysAgo} days ${b.hour - 6} hours'`
  const created = `${sched} - interval '${int(6, 72)} hours'`
  const accepted = ['accepted', 'completed'].includes(b.status) ? `${sched} - interval '${int(2, 5)} hours'` : 'null'
  const completed = b.status === 'completed' ? `${sched} + interval '${int(1, 3)} hours'` : 'null'
  const cancelled = ['cancelled', 'rejected'].includes(b.status) ? `${sched} - interval '1 hours'` : 'null'
  const payment = b.status === 'completed' ? 'released' : ['cancelled', 'rejected'].includes(b.status) ? 'refunded' : 'held'
  return `  (${q(b.id)}, null, ${q(b.client)}, ${q(b.p.id)}, ${q(b.svc.id)}, ${q(b.svc.title)}, ${sched}, ${q(b.p.comuna + ', Santiago')}, '', ${b.svc.price}, 0.10, ${commission}, ${b.svc.price - commission}, ${q(b.status)}, ${q(payment)}, ${q(b.brand)}, ${q(b.last4)}, true, ${created}, ${created}, ${accepted}, ${completed}, ${cancelled})`
}).join(',\n'))
line('on conflict (id) do nothing;')
line()
line('-- Métricas públicas de cada perfil (histórico: valoración, trabajos, seguidores)')
line('update public.providers p set rating_avg = v.rating_avg, rating_count = v.rating_count,')
line('  jobs_count = v.jobs_count, followers_count = v.followers_count')
line('from (values')
line(providers.map((p) => `  (${q(p.id)}::uuid, ${p.ratingAvg}, ${p.ratingCount}, ${p.jobs}, ${p.followers})`).join(',\n'))
line(') as v(id, rating_avg, rating_count, jobs_count, followers_count)')
line('where p.id = v.id;')
line()
line('commit;')
line()

const seedSql = out.join('\n')
writeFileSync(join(root, 'supabase/seed.sql'), seedSql)
const schemaSql = readFileSync(join(root, 'supabase/schema.sql'), 'utf8')
writeFileSync(
  join(root, 'supabase/setup.sql'),
  `-- Archivo todo-en-uno: schema.sql + seed.sql (generado por scripts/generate-seed.mjs)\n\n${schemaSql}\n\n${seedSql}`,
)
console.log(`seed.sql: ${providers.length} profesionales, ${services.length} servicios, ${posts.length} publicaciones, ${reviews.length} reseñas, ${bookings.length} reservas`)
