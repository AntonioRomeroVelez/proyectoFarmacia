import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { dbService } from '@/services/db';
import { useNotifications } from './useNotifications';

// Estado compartido
const eventos = ref([]);
const isLoaded = ref(false);
let loadingPromise = null;

export function useAgenda() {
  const toast = useToast();

  // Cargar eventos (Asíncrono)
  const loadEventos = async () => {
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
      try {
        const stored = await dbService.getAll('agenda');
        eventos.value = stored.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        isLoaded.value = true;
      } catch (e) {
        console.error('Error loading agenda:', e);
        toast.error('Error al cargar la agenda');
      } finally {
        loadingPromise = null;
      }
    })();
    return loadingPromise;
  };

  // Guardar evento
  const addEvento = async (evento) => {
    const newEvento = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completada: false,
      ...evento
    };
    
    try {
    // Optimistic Update
      eventos.value.push(newEvento);
      await dbService.add('agenda', newEvento);
      toast.success('Evento agendado correctamente');

      // Programar notificación PWA (no bloquea si falla)
      try {
        const { notifyAgendaEvent, permissionGranted } = useNotifications();
        if (permissionGranted.value) {
          await notifyAgendaEvent(newEvento);
          console.log('✅ Notificaciones programadas para evento:', newEvento.id);
        }
      } catch (notifError) {
        // Si falla la notificación, NO afecta la creación del evento
        console.warn('⚠️ No se pudo programar notificación:', notifError);
      }

      return newEvento;
    } catch (e) {
      console.error('Error adding evento:', e);
      toast.error('Error al guardar evento');
      // Revert
      eventos.value = eventos.value.filter(ev => ev.id !== newEvento.id);
      return null;
    }
  };

  // Actualizar evento
  const updateEvento = async (id, updates) => {
    const index = eventos.value.findIndex(e => e.id === id);
    if (index !== -1) {
      const updatedEvento = { ...eventos.value[index], ...updates };

      try {
        eventos.value[index] = updatedEvento;
        await dbService.update('agenda', updatedEvento);
        toast.success('Evento actualizado');
        return true;
      } catch (e) {
        console.error('Error updating evento:', e);
        toast.error('Error al actualizar evento');
        return false;
      }
    }
    return false;
  };

  // Eliminar evento
  const deleteEvento = async (id) => {
    const index = eventos.value.findIndex(e => e.id === id);
    if (index !== -1) {
      const deleted = eventos.value[index];

      try {
        eventos.value = eventos.value.filter(e => e.id !== id);
        await dbService.delete('agenda', id);
        toast.info('Evento eliminado');
        return true;
      } catch (e) {
        console.error('Error deleting evento:', e);
        toast.error('Error al eliminar evento');
        // Revert
        eventos.value.splice(index, 0, deleted);
        return false;
      }
    }
    return false;
  };

  // Obtener eventos de una fecha específica (YYYY-MM-DD)
  const getEventosPorFecha = (fechaStr) => {
    return eventos.value.filter(e => e.fecha === fechaStr);
  };

  // Obtener eventos pendientes de hoy
  const getEventosPendientesHoy = () => {
    const hoy = new Date().toISOString().split('T')[0];
    return eventos.value.filter(e => e.fecha === hoy && !e.completada);
  };

  // Mostrar notificación de eventos del día
  const notificarEventosDelDia = () => {
    const eventosPendientes = getEventosPendientesHoy();
    
    if (eventosPendientes.length > 0) {
      const lista = eventosPendientes.map(e => `• ${e.titulo}`).join('\n');
      toast.info(
        `📅 Recordatorio: Tienes ${eventosPendientes.length} evento(s) pendiente(s) hoy:\n\n${lista}`,
        {
          timeout: 8000,
          closeButton: true,
          position: 'top-right'
        }
      );
    }
  };

  // Configurar intervalo de notificaciones (cada 30 minutos)
  let notificationInterval = null;
  
  const iniciarNotificaciones = async () => {
    if (!isLoaded.value) {
      await loadEventos();
    }

    // Notificar inmediatamente al cargar si hay eventos hoy
    // Pequeño delay para asegurar que la app esté lista
    setTimeout(() => {
        notificarEventosDelDia();
    }, 1000);

    // Configurar intervalo cada 30 minutos (30 * 60 * 1000 ms)
    if (!notificationInterval) {
      notificationInterval = setInterval(() => {
        notificarEventosDelDia();
      }, 30 * 60 * 1000);
    }
  };

  const detenerNotificaciones = () => {
    if (notificationInterval) {
      clearInterval(notificationInterval);
      notificationInterval = null;
    }
  };

  // Inicializar automáticamente si no se ha cargado
  if (!isLoaded.value && !loadingPromise) {
    // Iniciar carga y notificaciones
    (async () => {
      await loadEventos();
      iniciarNotificaciones();
    })();
  }

  return {
    eventos,
    isLoaded,
    addEvento,
    updateEvento,
    deleteEvento,
    getEventosPorFecha,
    getEventosPendientesHoy,
    iniciarNotificaciones,
    detenerNotificaciones,
    loadEventos
  };
}

