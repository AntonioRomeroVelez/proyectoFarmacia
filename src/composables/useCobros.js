import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { dbService } from '@/services/db';

const cobros = ref([]);
const isLoaded = ref(false);

export function useCobros() {
  const toast = useToast();

  // Cargar cobros desde DB
  const loadCobros = async () => {
    try {
      const data = await dbService.getAll('cobros');
      // Sort desc by date/id
      cobros.value = data.sort((a, b) => b.id.localeCompare(a.id));
      isLoaded.value = true;
    } catch (e) {
      console.error('Error loading cobros:', e);
      toast.error('Error al cargar cobros');
    }
  };

  // Guardar cobro
  const addCobro = async (cobro) => {
    // Clone to remove Vue reactivity
    const plainCobro = JSON.parse(JSON.stringify(cobro));

    const newCobro = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...plainCobro
    };
    
    try {
      await dbService.put('cobros', newCobro);
      cobros.value.unshift(newCobro);
      toast.success('💰 Cobro registrado correctamente');
      return newCobro;
    } catch (e) {
      console.error('Error adding cobro:', e);
      toast.error('Error al registrar cobro');
      throw e;
    }
  };

  // Actualizar cobro
  const updateCobro = async (updatedCobro) => {
    // Clone to remove Vue reactivity
    const plainCobro = JSON.parse(JSON.stringify(updatedCobro));

    try {
      await dbService.put('cobros', plainCobro);
      const index = cobros.value.findIndex(c => c.id === plainCobro.id);
      if (index !== -1) {
        cobros.value[index] = { ...plainCobro };
      }
      toast.success('✏️ Cobro actualizado correctamente');
      return true;
    } catch (e) {
      console.error('Error updating cobro:', e);
      toast.error('Error al actualizar cobro');
      return false;
    }
  };

  // Eliminar cobro
  const deleteCobro = async (id) => {
    try {
      await dbService.delete('cobros', id);
      cobros.value = cobros.value.filter(c => c.id !== id);
      toast.info('Cobro eliminado');
    } catch (e) {
      console.error('Error deleting cobro:', e);
      toast.error('Error al eliminar cobro');
    }
  };

  // Eliminar todos los cobros
  const clearAllCobros = async () => { // Note: This might be dangerous if user has huge amount
    try {
      // In IDB, clearing a store is one transaction
      // But we don't have a clear() method exposed in dbService yet
      // For now, let's delete strictly what is in list or use a bulk delete if simple
      // Actually, IDB 'clear' is standard. Let's assume we might need to add it to dbService or iterate.
      // Iterating delete is slow.
      // Ideally dbService should have .clear('cobros').
      // Check dbService... it doesn't have clear.
      // Let's rely on iterating purely UI side or add clear to dbService.
      // Added instruction: I will update dbService to have clear() next, but for now:
      const db = await import('@/services/db').then(m => m.dbRequest);
      const tx = db.transaction('cobros', 'readwrite');
      await tx.objectStore('cobros').clear();

      cobros.value = [];
      toast.info('Todos los cobros han sido eliminados');
    } catch (e) {
      console.error('Error clearing cobros:', e);
      toast.error('Error al vaciar cobros');
    }
  };

  // Obtener cobros en un rango de fechas (Client side filtering for now)
  const getCobrosRango = (fechaInicio, fechaFin) => {
    return cobros.value.filter(c => {
      const fecha = c.fecha;
      return fecha >= fechaInicio && fecha <= fechaFin;
    });
  };

  // Obtener total de cobros
  const getTotalCobros = (lista = null) => {
    const cobrosACalcular = lista || cobros.value;
    return cobrosACalcular.reduce((total, cobro) => {
      return total + parseFloat(cobro.cantidad || 0);
    }, 0);
  };

  // Inicializar
  if (!isLoaded.value) {
    loadCobros();
  }

  return {
    cobros,
    addCobro,
    updateCobro,
    deleteCobro,
    clearAllCobros,
    getCobrosRango,
    getTotalCobros,
    loadCobros
  };
}
