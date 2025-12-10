import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { dbService, dbRequest } from '@/services/db';

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
