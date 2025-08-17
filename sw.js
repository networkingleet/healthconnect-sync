// Health Sync Service Worker
const CACHE_NAME = 'health-sync-v1.0.0';
const API_BASE = 'http://192.168.1.41:18081/api';

// Files to cache for offline use
const CACHE_FILES = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

// Install event - cache essential files
self.addEventListener('install', event => {
    console.log('[SW] Installing Service Worker');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching app files');
                return cache.addAll(CACHE_FILES);
            })
            .then(() => {
                console.log('[SW] App files cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[SW] Failed to cache files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating Service Worker');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached files when offline
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Handle API requests differently
    if (url.origin === location.origin && url.pathname.startsWith('/api/')) {
        // This is an API request - let it pass through but handle errors
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // If successful, return the response
                    return response;
                })
                .catch(error => {
                    console.log('[SW] API request failed, app is offline');
                    // Return a custom offline response for API calls
                    return new Response(
                        JSON.stringify({
                            error: 'offline',
                            message: 'App is offline. Sync will retry when online.'
                        }),
                        {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                })
        );
    } else {
        // Handle regular file requests with cache-first strategy
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        console.log('[SW] Serving from cache:', event.request.url);
                        return response;
                    }
                    
                    // If not in cache, fetch from network
                    return fetch(event.request)
                        .then(response => {
                            // Clone the response
                            const responseClone = response.clone();
                            
                            // Add to cache for future use
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseClone);
                                });
                            
                            return response;
                        })
                        .catch(error => {
                            console.log('[SW] Network request failed:', error);
                            // Return offline fallback if available
                            if (event.request.mode === 'navigate') {
                                return caches.match('/index.html');
                            }
                            return new Response('Offline', { status: 503 });
                        });
                })
        );
    }
});

// Background sync for when connection is restored
self.addEventListener('sync', event => {
    console.log('[SW] Background sync triggered:', event.tag);
    
    if (event.tag === 'health-sync') {
        event.waitUntil(performBackgroundSync());
    }
});

// Message handling for communication with main app
self.addEventListener('message', event => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
    
    if (event.data && event.data.type === 'CACHE_HEALTH_DATA') {
        // Cache health data for offline access
        cacheHealthData(event.data.data);
    }
});

// Push notifications (if needed in future)
self.addEventListener('push', event => {
    console.log('[SW] Push notification received');
    
    const options = {
        body: 'Health sync completed successfully',
        icon: '/icon-192.png',
        badge: '/icon-96.png',
        tag: 'health-sync',
        renotify: true,
        requireInteraction: false,
        actions: [
            {
                action: 'view',
                title: 'View App',
                icon: '/icon-96.png'
            }
        ]
    };
    
    if (event.data) {
        const data = event.data.json();
        options.body = data.message || options.body;
    }
    
    event.waitUntil(
        self.registration.showNotification('Health Sync', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
    console.log('[SW] Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Helper function to perform background sync
async function performBackgroundSync() {
    try {
        console.log('[SW] Performing background sync...');
        
        // Get cached health data
        const cachedData = await getCachedHealthData();
        if (!cachedData) {
            console.log('[SW] No cached data to sync');
            return;
        }
        
        // Try to sync with API
        const response = await fetch(`${API_BASE}/fitbit/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'asdfasdfasdfFSDFWEFWF3123sdfsdaf12313_123123sdassdf14s1324'
            },
            body: JSON.stringify(cachedData)
        });
        
        if (response.ok) {
            console.log('[SW] Background sync successful');
            // Clear cached data
            await clearCachedHealthData();
            
            // Notify all clients
            const clients = await self.clients.matchAll();
            clients.forEach(client => {
                client.postMessage({
                    type: 'SYNC_SUCCESS',
                    message: 'Background sync completed'
                });
            });
        } else {
            console.log('[SW] Background sync failed:', response.status);
        }
        
    } catch (error) {
        console.error('[SW] Background sync error:', error);
    }
}

// Helper function to cache health data for background sync
async function cacheHealthData(data) {
    try {
        const cache = await caches.open(`${CACHE_NAME}-data`);
        const response = new Response(JSON.stringify(data));
        await cache.put('/cached-health-data', response);
        console.log('[SW] Health data cached for background sync');
    } catch (error) {
        console.error('[SW] Failed to cache health data:', error);
    }
}

// Helper function to get cached health data
async function getCachedHealthData() {
    try {
        const cache = await caches.open(`${CACHE_NAME}-data`);
        const response = await cache.match('/cached-health-data');
        if (response) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('[SW] Failed to get cached health data:', error);
        return null;
    }
}

// Helper function to clear cached health data
async function clearCachedHealthData() {
    try {
        const cache = await caches.open(`${CACHE_NAME}-data`);
        await cache.delete('/cached-health-data');
        console.log('[SW] Cached health data cleared');
    } catch (error) {
        console.error('[SW] Failed to clear cached health data:', error);
    }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
    console.log('[SW] Periodic sync triggered:', event.tag);
    
    if (event.tag === 'health-sync-periodic') {
        event.waitUntil(performPeriodicSync());
    }
});

// Helper function for periodic sync
async function performPeriodicSync() {
    try {
        console.log('[SW] Performing periodic sync...');
        
        // Generate fresh health data and sync
        const healthData = {
            sync_type: 'auto',
            activity_data: [{
                date: new Date().toISOString().split('T')[0],
                steps: Math.floor(Math.random() * 7000) + 5000,
                calories_burned: Math.floor(Math.random() * 350) + 250,
                source: 'background_sync'
            }],
            device_info: 'Health Sync PWA Background',
            triggered_by: 'periodic'
        };
        
        const response = await fetch(`${API_BASE}/fitbit/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'asdfasdfasdfFSDFWEFWF3123sdfsdaf12313_123123sdassdf14s1324'
            },
            body: JSON.stringify(healthData)
        });
        
        if (response.ok) {
            console.log('[SW] Periodic sync successful');
        }
        
    } catch (error) {
        console.error('[SW] Periodic sync error:', error);
    }
}

console.log('[SW] Service Worker script loaded'); 