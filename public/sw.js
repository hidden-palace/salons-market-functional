/**
 * Service Worker for Offline Support
 * Handles caching and offline functionality
 */

const CACHE_NAME = 'orchid-republic-v1';
const STATIC_CACHE = 'orchid-republic-static-v1';
const DYNAMIC_CACHE = 'orchid-republic-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/styles.css',
  '/script.js',
  '/favicon.ico',
  // Add other static assets
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/branding',
  '/api/leads/statistics',
  '/api/branding/employee-profiles'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((caughtError) => {
        console.error('Failed to cache static files:', caughtError);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with cache-first or network-first strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // CRITICAL: Bypass service worker for leads export to allow server handling
  if (url.pathname === '/api/leads/export') {
    console.log('🚫 SW: Bypassing service worker for leads export - letting request go to server');
    return; // Don't call event.respondWith(), let the request go to the network/server
  }

  // Handle different types of requests
  if (STATIC_FILES.includes(url.pathname)) {
    // Static files - cache first
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.startsWith('/api/')) {
    // API requests - network first with cache fallback
    event.respondWith(networkFirstWithCache(request));
  } else {
    // Other requests - network first
    event.respondWith(networkFirst(request));
  }
});

/**
 * Cache-first strategy for static files
 */
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (caughtError) {
    console.error('Cache-first strategy failed:', caughtError);
    return new Response('Offline - content not available', { status: 503 });
  }
}

/**
 * Network-first strategy with cache fallback
 */
async function networkFirstWithCache(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful API responses if they're cacheable
      const url = new URL(request.url);
      if (CACHEABLE_APIS.some(api => url.pathname.startsWith(api))) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (caughtError) {
    console.log('Network failed, trying cache for:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add header to indicate this is from cache
      const response = cachedResponse.clone();
      response.headers.set('X-Served-From', 'cache');
      return response;
    }

    // Return offline response for API calls
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({
          err: 'Offline',
          message: 'This data is not available offline'
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response('Offline - content not available', { status: 503 });
  }
}

/**
 * Network-first strategy
 */
async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch (caughtError) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Offline - content not available', { status: 503 });
  }
}

// Handle background sync
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

/**
 * Sync offline actions when connection is restored
 */
async function syncOfflineActions() {
  try {
    // This would integrate with your offline manager
    console.log('Syncing offline actions...');
    
    // Send message to main thread to handle sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_OFFLINE_ACTIONS'
      });
    });
  } catch (caughtError) {
    console.error('Failed to sync offline actions:', caughtError);
  }
}

// Handle push notifications (if needed)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: data.data || {}
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});