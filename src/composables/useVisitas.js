import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { dbService, dbRequest } from '@/services/db';
import { useNotifications } from './useNotifications';

const visitas = ref([]);
const isLoaded = ref(false);

export function useVisitas() {
  const toast = useToast();

  const loadVisitas = async () => {
    try {
      const stored = await dbService.getAll('visitas');
      // Sort by date desc
      visitas.value = stored.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      isLoaded.value = true;
    } catch (e) {
      console.error('Error loading visitas:', e);
      toast.error('Error al cargar visitas');
    }
  };

  const addVisita = async (visitaData) => {
    const nuevaVisita = {
      id: `visita_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fecha: new Date().toISOString(),
      ...visitaData
    };

    try {
      await dbService.put('visitas', nuevaVisita);
      visitas.value.unshift(nuevaVisita);
      toast.success('Visita registrada');

      // Programar notificación PWA solo si la visita tiene una fecha futura (no bloquea si falla)
      try {
        const { notifyVisita, permissionGranted } = useNotifications();

        // Verificar si la fecha de la visita es futura (más de 1 hora desde ahora)
        const visitaDate = new Date(nuevaVisita.fecha);
        const unaHoraDelante = new Date(Date.now() + 60 * 60 * 1000);

        if (permissionGranted.value && visitaDate > unaHoraDelante) {
          // Solo programar si la fecha es futura
          await notifyVisita(nuevaVisita);
          console.log('✅ Notificación programada para visita:', nuevaVisita.id);
        }
      } catch (notifError) {
        // Si falla la notificación, NO afecta la creación de la visita
        console.warn('⚠️ No se pudo programar notificación para visita:', notifError);
      }

      return nuevaVisita;
    } catch (e) {
      console.error('Error adding visita:', e);
      toast.error('Error al guardar visita');
    }
  };

  const updateVisita = async (id, updates) => {
    // Find item to merge updates
    const index = visitas.value.findIndex(v => v.id === id);
    if (index === -1) return;

    const updatedVisita = { ...visitas.value[index], ...updates };

    try {
      await dbService.put('visitas', updatedVisita);
      visitas.value[index] = updatedVisita;
      toast.success('Visita actualizada');
      return updatedVisita;
    } catch (e) {
      console.error('Error updating visita:', e);
      toast.error('Error al actualizar visita');
    }
  };

  const deleteVisita = async (id) => {
    try {
      await dbService.delete('visitas', id);
      visitas.value = visitas.value.filter(v => v.id !== id);

      // Cancelar notificación programada si existe
      try {
        const { cancelScheduledNotification } = useNotifications();
        await cancelScheduledNotification(`visita-${id}`);
      } catch (notifError) {
        console.warn('⚠️ No se pudo cancelar notificación:', notifError);
      }

      toast.info('Visita eliminada');
    } catch (e) {
      console.error('Error deleting visita:', e);
      toast.error('Error al eliminar visita');
    }
  };
  
  const deleteAllVisitas = async () => {
    try {
        const db = await dbRequest;
        const tx = db.transaction('visitas', 'readwrite');
        await tx.objectStore('visitas').clear();
        await tx.done;
        visitas.value = [];
        toast.info('Todas las visitas eliminadas');
    } catch (e) {
        console.error('Error clearing visitas:', e);
        toast.error('Error al vaciar visitas');
    }
  };

  // Auto load
  if (!isLoaded.value) {
    loadVisitas();
  }

  return {
    visitas,
    loadVisitas,
    addVisita,
    updateVisita,
    deleteVisita,
    deleteAllVisitas
  };
}
