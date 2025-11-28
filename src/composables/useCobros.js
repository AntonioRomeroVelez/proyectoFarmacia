import { ref } from 'vue';
import { useToast } from 'vue-toastification';

const STORAGE_KEY = 'farmacia_cobros';

// Estado compartido
const cobros = ref([]);
const isLoaded = ref(false);

export function useCobros() {
  const toast = useToast();

  // Cargar cobros
  const loadCobros = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        cobros.value = JSON.parse(stored);
      } catch (e) {
        console.error('Error parsing cobros from localStorage', e);
        cobros.value = [];
      }
    }
    isLoaded.value = true;
  };

  // Guardar cobro
  const addCobro = (cobro) => {
    const newCobro = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...cobro
    };
    
    cobros.value.unshift(newCobro);
    saveToStorage();
    toast.success('💰 Cobro registrado correctamente');
    return newCobro;
  };

  // Eliminar cobro
  const deleteCobro = (id) => {
    cobros.value = cobros.value.filter(c => c.id !== id);
    saveToStorage();
    toast.info('Cobro eliminado');
  };

  // Eliminar todos los cobros
  const clearAllCobros = () => {
    cobros.value = [];
    localStorage.removeItem(STORAGE_KEY);
    toast.info('Todos los cobros han sido eliminados');
  };

  // Helper para guardar
  const saveToStorage = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cobros.value));
  };

  // Obtener cobros en un rango de fechas
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
    deleteCobro,
    clearAllCobros,
    getCobrosRango,
    getTotalCobros,
    loadCobros
  };
}
