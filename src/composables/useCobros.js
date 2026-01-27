import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { dbService } from '@/services/db';
import { useNotifications } from './useNotifications';

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

      // Programar notificación PWA si tiene fecha de vencimiento futura (no bloquea si falla)
      try {
        const { notifyCobroPendiente, permissionGranted } = useNotifications();

        // Verificar que existe fechaVencimiento y que es futura
        if (permissionGranted.value && newCobro.fechaVencimiento) {
          const fechaVenc = new Date(newCobro.fechaVencimiento);
          const mañana = new Date(Date.now() + 24 * 60 * 60 * 1000);

          // Solo programar si el vencimiento es futuro (más de 1 día adelante)
          if (fechaVenc > mañana) {
            const cliente = newCobro.cliente || 'Cliente';
            const monto = parseFloat(newCobro.cantidad || 0);
            await notifyCobroPendiente(cliente, monto, newCobro.fechaVencimiento);
            console.log('✅ Notificación programada para cobro:', newCobro.id);
          }
        }
      } catch (notifError) {
        // Si falla la notificación, NO afecta la creación del cobro
        console.warn('⚠️ No se pudo programar notificación para cobro:', notifError);
      }

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
      const cobroAEliminar = cobros.value.find(c => c.id === id);

      await dbService.delete('cobros', id);
      cobros.value = cobros.value.filter(c => c.id !== id);

      // Cancelar notificación programada si existe
      if (cobroAEliminar && cobroAEliminar.fechaVencimiento) {
        try {
          const { cancelScheduledNotification } = useNotifications();
          const notificationId = `cobro-${cobroAEliminar.cliente}-${cobroAEliminar.fechaVencimiento}`;
          await cancelScheduledNotification(notificationId);
        } catch (notifError) {
          console.warn('⚠️ No se pudo cancelar notificación:', notifError);
        }
      }

      toast.info('Cobro eliminado');
    } catch (e) {
      console.error('Error deleting cobro:', e);
      toast.error('Error al eliminar cobro');
    }
  };

  // Eliminar todos los cobros
  const clearAllCobros = async () => {
    try {
      await dbService.clear('cobros');
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
