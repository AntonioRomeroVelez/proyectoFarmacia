// Service Worker personalizado para manejar notificaciones PWA
// Compatible con vite-plugin-pwa injectManifest strategy

import { precacheAndRoute } from 'workbox-precaching';

// Precache de archivos generados por Vite
precacheAndRoute(self.__WB_MANIFEST || []);

const CACHE_NAME = 'farmacia-dynamic-v1';

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
  
  if (event.tag === 'check-upcoming-events') {
    event.waitUntil(checkUpcomingEvents());
  }
});

// Función para verificar eventos próximos
async function checkUpcomingEvents() {
  try {
    // Abrir IndexedDB para verificar eventos
    const db = await openDatabase();
    const now = Date.now();
    const fifteenMinutes = 15 * 60 * 1000;
    const oneHour = 60 * 60 * 1000;
    
    // Verificar eventos de agenda
    const eventos = await getFromDB(db, 'agenda');
    const upcomingEventos = eventos.filter(evento => {
      const eventTime = new Date(evento.fecha).getTime();
      const diff = eventTime - now;
      return diff > 0 && diff <= fifteenMinutes && !evento.notified;
    });
    
    // Enviar notificaciones para eventos próximos
    for (const evento of upcomingEventos) {
      await self.registration.showNotification('📅 Evento Próximo', {
        body: `${evento.titulo} - En 15 minutos`,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: `agenda-${evento.id}`,
        data: { type: 'agenda', eventoId: evento.id }
      });
    }
    
    // Verificar visitas próximas
    const visitas = await getFromDB(db, 'visitas');
    const upcomingVisitas = visitas.filter(visita => {
      const visitTime = new Date(visita.fecha).getTime();
      const diff = visitTime - now;
      return diff > 0 && diff <= oneHour && !visita.notified;
    });
    
    // Enviar notificaciones para visitas próximas
    for (const visita of upcomingVisitas) {
      await self.registration.showNotification('🏥 Visita Próxima', {
        body: `Visita programada en 1 hora - ${visita.cliente || visita.nombre || 'Cliente'}`,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: `visita-${visita.id}`,
        data: { type: 'visita', visitaId: visita.id }
      });
    }
  } catch (error) {
    console.error('[SW] Error checking upcoming events:', error);
  }
}

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
    checkUpcomingEvents();
  }
});

console.log('[SW] Service Worker loaded');

