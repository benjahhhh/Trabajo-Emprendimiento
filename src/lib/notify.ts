// Notificaciones del sistema (Android/Chrome, escritorio e iOS 16.4+ con la app instalada)
export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window

export const notificationPermission = (): NotificationPermission | 'unsupported' =>
  notificationsSupported() ? Notification.permission : 'unsupported'

export async function requestNotifications(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export async function showSystemNotification(title: string, body: string, url?: string) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  const options: NotificationOptions = { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', data: { url } }
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) return reg.showNotification(title, options)
    new Notification(title, options)
  } catch {
    // algunos navegadores no permiten notificaciones sin service worker
  }
}
