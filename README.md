# Cerca · Servicios a domicilio cerca de ti

Web app (PWA) que conecta a personas que necesitan un servicio con el profesional **más cercano** o **mejor valorado**: jardineros, mecánicos, barberos a domicilio, gásfiter, electricistas y 16 categorías más. Proyecto de emprendimiento 2026 · Santiago de Chile · precios en CLP.

> "Cerca" es un nombre provisional. Se cambia en `src/config.ts`, `index.html` y `vite.config.ts` (manifest).

## Qué hace

**Cliente**
- Busca en lenguaje normal («alguien que me corte el pasto», «cambio de aceite», «uñas») y ve resultados en **lista o mapa**.
- Ordena por recomendados, más cercanos, mejor valorados o menor precio. Filtros de distancia, valoración y disponibilidad.
- Perfil de cada profesional estilo red social: fotos de trabajos, reseñas, servicios con precio, zona de trabajo, seguidores.
- Reserva (día, hora, dirección) y **paga con tarjeta simulada**: cualquier número de 16 dígitos sirve (botón «Usar tarjeta de prueba»). Nunca se guarda el número completo, solo marca y últimos 4 dígitos.
- Chat en tiempo real, notificaciones (botón campana de Uiverse), historial de reservas, reseñas y favoritos.

**Profesional**
- Alta en 3 minutos: categoría, zona, radio de atención y primer servicio.
- Panel con solicitudes (aceptar / rechazar), agenda, ganancias netas, comisión pagada y trabajos completados.
- Gestión de servicios, fotos de trabajos y perfil público.

**Modelo de negocio (pantalla «Modelo de negocio»)**
1. El cliente paga el precio publicado dentro de la app.
2. La app retiene el dinero hasta que el trabajo se completa (si el profesional rechaza o el cliente cancela, se reembolsa).
3. Al completarse, el profesional recibe el 90% y la app se queda un **10% de comisión por el contacto conseguido**. Sin mensualidad.

La comisión se calcula en el servidor (Supabase) y se puede cambiar en vivo desde el panel de administrador.

## Cuentas demo (para presentar)

En la pantalla de **Entrar** hay dos botones de acceso rápido:

| Cuenta | Correo | Contraseña |
|---|---|---|
| Cliente (y admin del panel de negocio) | `cliente.demo@example.com` | `cerca-demo-2026` |
| Profesional (Seba Barber, recibe solicitudes reales) | `profesional.demo@example.com` | `cerca-demo-2026` |

Los 48 profesionales de ejemplo **aceptan solos** las reservas a los pocos segundos y contestan en el chat, así la demo funciona con un solo teléfono.

## Guion de presentación (5 minutos)

1. **Landing** (`/`): propuesta de valor, insignias App Store / Google Play (abren la instalación de la web app) y sección para profesionales.
2. Teléfono 1 → **Cliente demo**. Buscar «cortar el pasto» → ver lista y **mapa** → abrir un perfil → **Reservar y pagar** → «Usar tarjeta de prueba» → Pagar. A los 3 segundos el profesional acepta.
3. Enseñar la reserva: el **teléfono del profesional se desbloquea** al aceptar (ese es el «contacto» que cobra la app). Abrir el chat y escribir: responde solo.
4. «Confirmar trabajo realizado» → dejar reseña.
5. Teléfono 2 → **Profesional demo**. Desde el teléfono 1 reservar a *Seba Barber*: la solicitud llega en vivo al panel del teléfono 2 → Aceptar → Marcar completado → ver **ganancia neta y comisión**.
6. **Perfil → Modelo de negocio**: comisiones ganadas, reparto 90/10, comisión por día y por categoría. Subir la comisión al 12% en vivo y hacer otra reserva.

Si presentáis fuera de Santiago: *Modelo de negocio → Traer profesionales demo a mi ubicación*.

## Tecnología

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4, React Router, Leaflet (mapas OpenStreetMap/CARTO), PWA instalable (vite-plugin-pwa).
- **Backend:** Supabase: Postgres con RLS en todas las tablas, Auth, Storage (fotos), Realtime (chat, reservas y notificaciones en vivo) y funciones SQL para reservas, pagos, comisión y búsqueda por cercanía (Haversine).
- **Hosting:** Vercel.
- **Diseño:** paleta de ridenow.tech (blanco, azul marino `#081B3A`, azul `#025FFB`, rosa `#FD69CF`, celeste `#D1E2FF`), botones de Uiverse (*botón elegante* de iZOXVL y *campana* de vinodjangid07).

```
src/
  pages/          Landing, Login, Registro, Modelo de negocio
  pages/app/      Inicio, Buscar (lista/mapa), Perfil profesional, Reservar+Pagar,
                  Reservas, Chat, Notificaciones, Perfil
  pages/pro/      Alta de profesional, Panel, Servicios, Fotos, Editar perfil
  components/     Botones Uiverse, mapa, tarjeta de pago animada, gráficas…
  context/        Sesión, ubicación, avisos y tiempo real
supabase/
  schema.sql      Tablas, seguridad RLS, funciones, storage y realtime
  seed.sql        Datos de ejemplo (48 profesionales en 18 comunas)
  setup.sql       schema + seed en un solo archivo
  demo-accounts.sql  Datos de las cuentas demo
scripts/          Generadores de datos de ejemplo e iconos
```

## Montarlo desde cero

### 1. Supabase
1. Crea un proyecto en [supabase.com](https://supabase.com) (región São Paulo, la más cercana a Chile).
2. **SQL Editor → New query**: pega `supabase/setup.sql` y pulsa **Run**.
3. **Authentication → Sign In / Providers → Email**: desactiva **Confirm email** (para entrar sin confirmar correo en la demo).
4. (Opcional) Registra en la app las dos cuentas demo y ejecuta `supabase/demo-accounts.sql`.
5. Para hacerte admin: `update profiles set is_admin = true where id = (select id from auth.users where email = 'tu@correo.cl');`

### 2. Variables de entorno
Copia `.env.example` a `.env.local` y rellena con los datos de **Project Settings → API Keys**:

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

La clave publicable es pública por diseño: los datos están protegidos con RLS. Nunca uses la *secret key* en el frontend.

### 3. Local
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # comprueba tipos y genera dist/
```

### 4. Vercel
1. **Add New → Project** → importa este repositorio (Vercel detecta Vite).
2. Añade las dos variables de entorno anteriores.
3. Deploy. `vercel.json` ya incluye las rutas de la SPA.
4. En Supabase → **Authentication → URL Configuration**, pon la URL de Vercel como *Site URL*.

## Personalizar

| Qué | Dónde |
|---|---|
| Nombre de la app | `src/config.ts` (`APP_NAME`), `index.html`, `vite.config.ts` |
| Comisión | Panel *Modelo de negocio* (admin) o tabla `platform_settings` en Supabase |
| Ciudad por defecto | `DEFAULT_LOCATION` en `src/config.ts` |
| Categorías y datos demo | `scripts/generate-seed.mjs` → `node scripts/generate-seed.mjs` |
| Colores | `@theme` en `src/index.css` |

## Créditos
- Botones: [Uiverse.io](https://uiverse.io) (iZOXVL, vinodjangid07). Icono de campana: Font Awesome Free (CC BY 4.0).
- Fotos de ejemplo: [Unsplash](https://unsplash.com). Retratos: [randomuser.me](https://randomuser.me).
- Mapas: © OpenStreetMap, © CARTO. Iconos: Lucide.
