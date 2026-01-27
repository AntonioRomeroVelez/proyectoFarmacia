import { ref, computed } from 'vue';
import { dbService } from '@/services/db';

// Estado compartido
const permissionGranted = ref(false);
const isSupported = ref(false);
const scheduledNotifications = ref([]);

export function useNotifications() {
  
  // Verificar soporte del navegador
  const checkSupport = () => {
    isSupported.value = 'Notification' in window && 'serviceWorker' in navigator;
    if (isSupported.value && Notification.permission === 'granted') {
      permissionGranted.value = true;
    }
    return isSupported.value;
  };

  // Solicitar permisos de notificación
  const requestPermission = async () => {
    if (!checkSupport()) {
      console.warn('Notificaciones no soportadas en este navegador');
      return false;
    }

    if (Notification.permission === 'granted') {
      permissionGranted.value = true;
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('Permisos de notificación denegados');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      permissionGranted.value = permission === 'granted';
      
      // Guardar en localStorage
      localStorage.setItem('notificationsPermission', permission);
      
      return permissionGranted.value;
    } catch (error) {
      console.error('Error al solicitar permisos:', error);
      return false;
    }
  };

  // Enviar notificación inmediata
  const sendNotification = async (title, options = {}) => {
    if (!permissionGranted.value) {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    const defaultOptions = {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [200, 100, 200],
      tag: 'default',
      requireInteraction: false,
      ...options
    };

    try {
      // Si hay service worker registrado, usar showNotification
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, defaultOptions);
      } else {
        // Fallback a Notification API
        new Notification(title, defaultOptions);
      }
      return true;
    } catch (error) {
      console.error('Error al mostrar notificación:', error);
      return false;
    }
  };

  // Programar notificación para una fecha/hora específica
  const scheduleNotification = async (id, title, body, timestamp, data = {}) => {
    if (!permissionGranted.value) {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    const notification = {
      id,
      title,
      body,
      timestamp,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data,
      shown: false, // NUEVO: Flag para controlar si ya se mostró
      createdAt: Date.now()
    };

    try {
      // Guardar en IndexedDB
      await dbService.put('notifications', notification);
      scheduledNotifications.value.push(notification);

      // NUEVO: Notificar al Service Worker para que inicie/actualice verificación
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration.active) {
            // Enviar mensaje al SW usando MessageChannel para recibir respuesta
            const messageChannel = new MessageChannel();

            registration.active.postMessage({
              type: 'SCHEDULE_NOTIFICATION',
              notificationId: id
            }, [messageChannel.port2]);

            console.log('✅ Notification scheduled in SW:', id);
          }
        } catch (swError) {
          console.warn('⚠️ Could not notify SW, but notification is saved:', swError);
        }
      }

      // Si la notificación es para dentro de menos de 2 minutos Y la app está abierta,
      // también usar setTimeout como fallback inmediato
      const delay = timestamp - Date.now();
      if (delay > 0 && delay < 120000) { // Menos de 2 minutos
        setTimeout(() => {
          sendNotification(title, {
            body,
            tag: id,
            data: { ...data, notificationId: id }
          });
        }, delay);
      }

      return true;
    } catch (error) {
      console.error('Error al programar notificación:', error);
      return false;
    }
  };

  // Cargar notificaciones programadas
  const loadScheduledNotifications = async () => {
    try {
      const stored = await dbService.getAll('notifications');
      scheduledNotifications.value = stored || [];
      
      console.log(`📬 Loaded ${scheduledNotifications.value.length} scheduled notifications`);

      // NUEVO: No usar setTimeout aquí, el Service Worker se encarga
      // Solo notificar al SW que hay notificaciones pendientes
      if ('serviceWorker' in navigator && scheduledNotifications.value.length > 0) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration.active) {
            registration.active.postMessage({ type: 'CHECK_NOTIFICATIONS' });
          }
        } catch (swError) {
          console.warn('⚠️ Could not notify SW to check notifications:', swError);
        }
      }
    } catch (error) {
      console.error('Error al cargar notificaciones programadas:', error);
    }
  };

  // Cancelar notificación programada
  const cancelScheduledNotification = async (id) => {
    try {
      await dbService.delete('notifications', id);
      scheduledNotifications.value = scheduledNotifications.value.filter(n => n.id !== id);
      return true;
    } catch (error) {
      console.error('Error al cancelar notificación:', error);
      return false;
    }
  };

  // Limpiar notificaciones antiguas (más de 7 días)
  const cleanOldNotifications = async () => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    try {
      const all = await dbService.getAll('notifications');
      const toDelete = all.filter(n => n.timestamp < sevenDaysAgo);
      
      for (const notif of toDelete) {
        await dbService.delete('notifications', notif.id);
      }
      
      scheduledNotifications.value = scheduledNotifications.value.filter(
        n => n.timestamp >= sevenDaysAgo
      );
    } catch (error) {
      console.error('Error al limpiar notificaciones:', error);
    }
  };

  // Registrar Service Worker
  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers no soportados');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registrado:', registration);

      // Escuchar mensajes del service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Mensaje del SW:', event.data);
        
        if (event.data.type === 'NOTIFICATION_CLICK') {
          // Manejar click en notificación
          const { notificationId, action } = event.data;
          console.log('Click en notificación:', notificationId, action);
        }
      });

      return registration;
    } catch (error) {
      console.error('Error al registrar Service Worker:', error);
      return null;
    }
  };

  // Notificaciones para eventos de agenda
  const notifyAgendaEvent = async (evento) => {
    const eventDate = new Date(evento.fecha);
    const now = new Date();
    
    // Notificación 15 minutos antes
    const notificationTime = new Date(eventDate.getTime() - 15 * 60 * 1000);
    
    if (notificationTime > now) {
      await scheduleNotification(
        `agenda-${evento.id}`,
        '📅 Recordatorio de Evento',
        `${evento.titulo} - ${evento.fecha}`,
        notificationTime.getTime(),
        { type: 'agenda', eventoId: evento.id }
      );
    }

    // Notificación en el momento del evento
    if (eventDate > now) {
      await scheduleNotification(
        `agenda-now-${evento.id}`,
        '📅 Evento Ahora',
        `${evento.titulo} - ${evento.descripcion || ''}`,
        eventDate.getTime(),
        { type: 'agenda', eventoId: evento.id }
      );
    }
  };

  // Notificaciones para cobros pendientes
  const notifyCobroPendiente = async (cliente, monto, fechaVencimiento) => {
    const vencimiento = new Date(fechaVencimiento);
    const now = new Date();
    
    // Notificación 1 día antes del vencimiento
    const notificationTime = new Date(vencimiento.getTime() - 24 * 60 * 60 * 1000);
    
    if (notificationTime > now) {
      await scheduleNotification(
        `cobro-${cliente}-${fechaVencimiento}`,
        '💰 Recordatorio de Cobro',
        `Cobro pendiente: ${cliente} - $${monto.toFixed(2)}`,
        notificationTime.getTime(),
        { type: 'cobro', cliente, monto, fechaVencimiento }
      );
    }
  };

  // Notificaciones para visitas programadas
  const notifyVisita = async (visita) => {
    const visitaDate = new Date(visita.fecha);
    const now = new Date();
    
    // Notificación 1 hora antes
    const notificationTime = new Date(visitaDate.getTime() - 60 * 60 * 1000);
    
    if (notificationTime > now) {
      await scheduleNotification(
        `visita-${visita.id}`,
        '🏥 Recordatorio de Visita',
        `Visita programada: ${visita.cliente || visita.nombre || 'Cliente'}`,
        notificationTime.getTime(),
        { type: 'visita', visitaId: visita.id }
      );
    }
  };

  // Inicializar sistema de notificaciones
  const initialize = async () => {
    checkSupport();
    
    if (isSupported.value) {
      await registerServiceWorker();
      await loadScheduledNotifications();
      await cleanOldNotifications();
      
      // Verificar permisos guardados
      const savedPermission = localStorage.getItem('notificationsPermission');
      if (savedPermission === 'granted') {
        permissionGranted.value = true;
      }

      // NUEVO: Iniciar verificación periódica en el Service Worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration.active) {
            const messageChannel = new MessageChannel();
            registration.active.postMessage({ type: 'START_PERIODIC_CHECK' }, [messageChannel.port2]);
            console.log('✅ Periodic notification check started in SW');
          }
        } catch (swError) {
          console.warn('⚠️ Could not start periodic check in SW:', swError);
        }
      }
    }
  };

  return {
    // Estado
    permissionGranted,
    isSupported,
    scheduledNotifications,
    
    // Métodos generales
    checkSupport,
    requestPermission,
    sendNotification,
    scheduleNotification,
    cancelScheduledNotification,
    loadScheduledNotifications,
    cleanOldNotifications,
    registerServiceWorker,
    initialize,
    
    // Métodos específicos por módulo
    notifyAgendaEvent,
    notifyCobroPendiente,
    notifyVisita
  };
}
