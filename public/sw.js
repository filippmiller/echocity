/**
 * Service Worker for Web Push Notifications.
 *
 * Handles incoming push events and notification click actions.
 * Registered by the PushPermissionBanner component.
 */

self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'ГдеСейчас'
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
    actions: data.actions || [],
    tag: data.type || 'default',
    renotify: true,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  // Handle action button clicks
  if (event.action) {
    // Actions can be extended here per notification type
    const url = event.notification.data?.url || '/'
    event.waitUntil(clients.openWindow(url))
    return
  }

  // Default click — open the target URL
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
      // If a window with the target URL is already open, focus it
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i]
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise open a new window
      return clients.openWindow(url)
    })
  )
})
