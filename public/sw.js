// Service Worker personalizado para manejar notificaciones PWA
// Compatible con vite-plugin-pwa injectManifest strategy

import { precacheAndRoute } from 'workbox-precaching';

// Precache de archivos generados por Vite
precacheAndRoute(self.__WB_MANIFEST || []);

const CACHE_NAME = 'farmacia-dynamic-v1';
const CHECK_INTERVAL = 60000; // Verificar cada 60 segundos
let intervalId = null;

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  // Activar inmediatamente sin esperar
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('farmacia-')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Iniciar verificación periódica de notificaciones al activarse
      console.log('[SW] Starting periodic notification check...');
      startPeriodicCheck();
      // Verificar inmediatamente
      return checkScheduledNotifications();
    })
  );
  
  // Tomar control inmediatamente
  return self.clients.claim();
});

// Estrategia de fetch: Network First, luego Cache
self.addEventListener('fetch', (event) => {
  // Solo cachear GET requests
  if (event.request.method !== 'GET') return;
  
  // Ignorar requests a chrome-extension y analytics
  if (event.request.url.includes('chrome-extension') || 
      event.request.url.includes('analytics')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Solo cachear respuestas exitosas
        if (response && response.status === 200) {
          const responseClone = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar desde caché
        return caches.match(event.request);
      })
  );
});

// NUEVO: Iniciar verificación periódica
function startPeriodicCheck() {
  // Limpiar intervalo anterior si existe
  if (intervalId) {
    clearInterval(intervalId);
  }

  // Verificar cada minuto
  intervalId = setInterval(() => {
    console.log('[SW] Periodic check triggered...');
    checkScheduledNotifications();
  }, CHECK_INTERVAL);
}

// NUEVO: Verificar notificaciones programadas en IndexedDB
async function checkScheduledNotifications() {
  try {
    const db = await openDatabase();
    const notifications = await getFromDB(db, 'notifications');
    const now = Date.now();
    // NUEVO: Margen de tolerancia - mostrar notificaciones hasta 30 segundos antes
    const tolerance = 30000;

    console.log(`[SW] Checking ${notifications.length} scheduled notifications...`);

    // Filtrar notificaciones que deben mostrarse
    const toShow = notifications.filter(notif => {
      // Mostrar si la hora programada ya pasó O si falta menos del margen de tolerancia
      return (notif.timestamp <= now + tolerance) && !notif.shown;
    });

    console.log(`[SW] Found ${toShow.length} notifications to show`);

    // Mostrar cada notificación
    for (const notif of toShow) {
      try {
        await self.registration.showNotification(notif.title, {
          body: notif.body,
          icon: notif.icon || '/icon-192x192.png',
          badge: notif.badge || '/icon-192x192.png',
          vibrate: [200, 100, 200],
          tag: notif.id,
          requireInteraction: false,
          data: notif.data || {}
        });

        console.log('[SW] Notification shown:', notif.id);

        // Marcar como mostrada
        await updateNotificationStatus(db, notif.id);
      } catch (error) {
        console.error('[SW] Error showing notification:', notif.id, error);
      }
    }

    // Limpiar notificaciones antiguas (más de 7 días)
    await cleanOldNotifications(db);

  } catch (error) {
    console.error('[SW] Error checking scheduled notifications:', error);
  }
}

// NUEVO: Actualizar estado de notificación en IndexedDB
async function updateNotificationStatus(db, notificationId) {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction('notifications', 'readwrite');
      const store = transaction.objectStore('notifications');
      const getRequest = store.get(notificationId);

      getRequest.onsuccess = () => {
        const notification = getRequest.result;
        if (notification) {
          notification.shown = true;
          const updateRequest = store.put(notification);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    } catch (error) {
      resolve(); // No fallar si hay error
    }
  });
}

// NUEVO: Limpiar notificaciones antiguas
async function cleanOldNotifications(db) {
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction('notifications', 'readwrite');
      const store = transaction.objectStore('notifications');
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.timestamp < sevenDaysAgo && cursor.value.shown) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => resolve();
    } catch (error) {
      resolve();
    }
  });
}

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  let notificationData = {
    title: 'Sistema de Gestión',
    body: 'Tienes una nueva notificación',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200]
  };
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon || '/icon-192x192.png',
      badge: notificationData.badge || '/icon-192x192.png',
      vibrate: notificationData.vibrate || [200, 100, 200],
      tag: notificationData.tag || 'default',
      requireInteraction: notificationData.requireInteraction || false,
      data: notificationData.data || {}
    })
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification);
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const { type, eventoId, visitaId, cliente } = notificationData;
  
  // Determinar URL a abrir según el tipo de notificación
  let urlToOpen = '/';
  
  if (type === 'agenda') {
    urlToOpen = '/agenda';
  } else if (type === 'visita') {
    urlToOpen = '/visitas';
  } else if (type === 'cobro') {
    urlToOpen = '/cobros';
  }
  
  // Abrir o enfocar la ventana de la app
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Buscar si ya hay una ventana abierta
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }).then((windowClient) => {
      // Enviar mensaje a la app con los datos de la notificación
      if (windowClient) {
        windowClient.postMessage({
          type: 'NOTIFICATION_CLICK',
          notificationData
        });
      }
    })
  );
});

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification);
});

// Sincronización periódica en segundo plano (Background Sync)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync event:', event.tag);
  
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkScheduledNotifications());
  }
});

// Función auxiliar para abrir IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('farmaciaDB', 5);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Función auxiliar para obtener datos de IndexedDB
function getFromDB(db, storeName) {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    } catch (error) {
      // Si el store no existe, retornar array vacío
      resolve([]);
    }
  });
}

// Manejar mensajes desde la app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_NOTIFICATIONS') {
    checkScheduledNotifications();
  }

  if (event.data && event.data.type === 'START_PERIODIC_CHECK') {
    startPeriodicCheck();
    event.ports[0]?.postMessage({ success: true });
  }

  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    // La notificación ya está en IndexedDB, solo confirmar
    console.log('[SW] Notification scheduled:', event.data.notificationId);
    checkScheduledNotifications(); // Verificar inmediatamente
    event.ports[0]?.postMessage({ success: true });
  }
});

console.log('[SW] Service Worker loaded');

