import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import { BottomNav } from './components/BottomNav'
import { PageLoader } from './components/ui'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LocationProvider } from './context/LocationContext'
import { LoginPromptProvider } from './context/LoginPromptContext'
import { RealtimeProvider } from './context/RealtimeContext'
import { ToastProvider } from './context/ToastContext'
import Home from './pages/app/Home'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Search = lazy(() => import('./pages/app/Search'))
const ProviderProfile = lazy(() => import('./pages/app/ProviderProfile'))
const Book = lazy(() => import('./pages/app/Book'))
const Bookings = lazy(() => import('./pages/app/Bookings'))
const BookingDetail = lazy(() => import('./pages/app/BookingDetail'))
const Messages = lazy(() => import('./pages/app/Messages'))
const Chat = lazy(() => import('./pages/app/Chat'))
const Notifications = lazy(() => import('./pages/app/Notifications'))
const Profile = lazy(() => import('./pages/app/Profile'))
const EditProfile = lazy(() => import('./pages/app/EditProfile'))
const Favorites = lazy(() => import('./pages/app/Favorites'))
const ProDashboard = lazy(() => import('./pages/pro/ProDashboard'))
const ProOnboarding = lazy(() => import('./pages/pro/ProOnboarding'))
const ProServices = lazy(() => import('./pages/pro/ProServices'))
const ProPosts = lazy(() => import('./pages/pro/ProPosts'))
const ProProfileEdit = lazy(() => import('./pages/pro/ProProfileEdit'))
const Business = lazy(() => import('./pages/Business'))
const NotFound = lazy(() => import('./pages/NotFound'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return <>{children}</>
}

// Marco tipo app móvil (en escritorio se centra con ancho de teléfono)
function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-mist/60">
      <div className="relative mx-auto min-h-dvh max-w-lg bg-white sm:shadow-[0_0_60px_-20px_rgb(8_27_58/0.25)]">{children}</div>
    </div>
  )
}

function TabsLayout() {
  return (
    <Shell>
      <div className="pb-[calc(84px+env(safe-area-inset-bottom))]">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </div>
      <BottomNav />
    </Shell>
  )
}

function PlainLayout() {
  return (
    <Shell>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </Shell>
  )
}

const auth = (el: ReactNode) => <RequireAuth>{el}</RequireAuth>

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <ToastProvider>
          <RealtimeProvider>
            <LoginPromptProvider>
              <ScrollToTop />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route element={<PlainLayout />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/registro" element={<Register />} />
                    <Route path="/app/p/:id" element={<ProviderProfile />} />
                    <Route path="/app/reservar/:serviceId" element={auth(<Book />)} />
                    <Route path="/app/reservas/:id" element={auth(<BookingDetail />)} />
                    <Route path="/app/mensajes/:id" element={auth(<Chat />)} />
                    <Route path="/app/perfil/editar" element={auth(<EditProfile />)} />
                    <Route path="/app/notificaciones" element={auth(<Notifications />)} />
                    <Route path="/app/guardados" element={auth(<Favorites />)} />
                    <Route path="/pro" element={auth(<ProDashboard />)} />
                    <Route path="/pro/alta" element={auth(<ProOnboarding />)} />
                    <Route path="/pro/servicios" element={auth(<ProServices />)} />
                    <Route path="/pro/publicaciones" element={auth(<ProPosts />)} />
                    <Route path="/pro/perfil" element={auth(<ProProfileEdit />)} />
                    <Route path="/negocio" element={auth(<Business />)} />
                  </Route>
                  <Route path="/app" element={<TabsLayout />}>
                    <Route index element={<Home />} />
                    <Route path="buscar" element={<Search />} />
                    <Route path="reservas" element={auth(<Bookings />)} />
                    <Route path="mensajes" element={auth(<Messages />)} />
                    <Route path="perfil" element={<Profile />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </LoginPromptProvider>
          </RealtimeProvider>
        </ToastProvider>
      </LocationProvider>
    </AuthProvider>
  )
}
