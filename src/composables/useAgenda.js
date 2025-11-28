import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';

const STORAGE_KEY = 'farmacia_agenda';

// Estado compartido
const eventos = ref([]);
const isLoaded = ref(false);

export function useAgenda() {
  const toast = useToast();

  // Cargar eventos
  const loadEventos = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        eventos.value = JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing agenda from localStorage', e);
        eventos.value = [];
      }
    }
    isLoaded.value = true;
  };

  // Guardar evento
  const addEvento = (evento) => {
    const newEvento = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completada: false,
      ...evento
    };
    
    eventos.value.push(newEvento);
    saveToStorage();
    toast.success('Evento agendado correctamente');
    return newEvento;
  };

  // Actualizar evento
  const updateEvento = (id, updates) => {
    const index = eventos.value.findIndex(e => e.id === id);
    if (index !== -1) {
      eventos.value[index] = { ...eventos.value[index], ...updates };
      saveToStorage();
      toast.success('Evento actualizado');
    }
  };

  // Eliminar evento
  const deleteEvento = (id) => {
    eventos.value = eventos.value.filter(e => e.id !== id);
    saveToStorage();
    toast.info('Evento eliminado');
  };

  // Helper para guardar
  const saveToStorage = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eventos.value));
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
  
  const iniciarNotificaciones = () => {
    // Notificar inmediatamente al cargar si hay eventos hoy
    const eventosPendientes = getEventosPendientesHoy();
    if (eventosPendientes.length > 0) {
      setTimeout(() => {
        notificarEventosDelDia();
      }, 2000); // Esperar 2 segundos después de cargar la app
    }

    // Configurar intervalo cada 30 minutos (30 * 60 * 1000 ms)
    notificationInterval = setInterval(() => {
      notificarEventosDelDia();
    }, 30 * 60 * 1000);
  };

  const detenerNotificaciones = () => {
    if (notificationInterval) {
      clearInterval(notificationInterval);
      notificationInterval = null;
    }
  };

  // Inicializar notificaciones automáticamente
  if (!isLoaded.value) {
    loadEventos();
    iniciarNotificaciones();
  }

  return {
    eventos,
    addEvento,
    updateEvento,
    deleteEvento,
    getEventosPorFecha,
    getEventosPendientesHoy,
    iniciarNotificaciones,
    detenerNotificaciones
  };
}
