const CACHE_NAME = 'ocr-scanner-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, then cache fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response for caching
        const responseClone = response.clone();
        
        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', function (event) {
  console.log('Push notification received:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'New notification',
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/icon-192x192.png',
        tag: data.tag || 'ocr-notification',
        vibrate: [100, 50, 100],
        requireInteraction: data.requireInteraction || false,
        data: {
          dateOfArrival: Date.now(),
          primaryKey: '1',
          url: data.url || '/',
        },
        actions: [
          {
            action: 'open',
            title: 'Open',
            icon: '/icons/icon-192x192.png',
          },
          {
            action: 'close',
            title: 'Close',
            icon: '/icons/icon-192x192.png',
          },
        ],
      };
      
      event.waitUntil(
        self.registration.showNotification(data.title || 'OCR Scanner', options)
      );
    } catch (error) {
      console.error('Error processing push notification:', error);
      // Fallback for non-JSON push data
      event.waitUntil(
        self.registration.showNotification('OCR Scanner', {
          body: event.data.text ? event.data.text() : 'New notification',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png',
        })
      );
    }
  }
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', function (event) {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  const notificationData = event.notification.data;
  const urlToOpen = notificationData?.url || '/';
  
  if (event.action === 'close') {
    return;
  }
  
  // Check if there's already a window/tab with the target URL
  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Look for an existing window/tab with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // If not found, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event - optional: track when users dismiss notifications
self.addEventListener('notificationclose', function (event) {
  console.log('Notification closed:', event.notification.tag);
  // You can send analytics data here
});
