/**
 * Service Worker for Web Push Notifications + Offline Caching.
 *
 * Handles incoming push events and notification click actions.
 * Also caches static assets and API responses for offline browsing.
 * Registered by the PushPermissionBanner component.
 */

const CACHE_NAME = 'echocity-v1'
const STATIC_ASSETS = ['/', '/offers', '/manifest.json']

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: network-first for API offers, cache-first for navigations
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Cache API responses for offers (network-first with cache fallback)
  if (url.pathname.startsWith('/api/offers')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return response
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // For navigation requests: network-first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return response
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
    )
    return
  }
})

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
