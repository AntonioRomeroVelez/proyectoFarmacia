import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { dbService } from '@/services/db';
import { useCobros } from './useCobros';
import { useHistorial } from './useHistorial';
import { useVisitas } from './useVisitas';

const clientes = ref([]);
const isLoaded = ref(false);

export function useClientes() {
  const toast = useToast();

  // Initialize other composables for relations
  const { cobros } = useCobros();
  const { documents: historial } = useHistorial();
  const { visitas } = useVisitas(); // Assuming useVisitas is created

  // Cargar clientes
  const loadClientes = async () => {
    try {
      const stored = await dbService.getAll('clientes');
      clientes.value = stored.sort((a, b) => a.nombre.localeCompare(b.nombre));
      isLoaded.value = true;
    } catch (error) {
      console.error('Error loading clientes:', error);
      toast.error('Error al cargar clientes');
    }
  };

  // Generar ID único
  const generateId = () => {
    return `cliente_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Calcular clasificación
  const calcularClasificacion = (totalCompras) => {
    if (totalCompras >= 5000) return 'A';
    if (totalCompras >= 2000) return 'B';
    return 'C';
  };

  // Agregar cliente
  const addCliente = async (clienteData) => {
    const nuevoCliente = {
      id: generateId(),
      nombre: clienteData.nombre || '',
      empresa: clienteData.empresa || '',
      telefono: clienteData.telefono || '',
      email: clienteData.email || '',
      direccion: clienteData.direccion || '',
      ciudad: clienteData.ciudad || '',
      clasificacion: clienteData.clasificacion || 'C',
      notas: clienteData.notas || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await dbService.put('clientes', nuevoCliente);
      clientes.value.push(nuevoCliente);
      // Re-sort?
      clientes.value.sort((a, b) => a.nombre.localeCompare(b.nombre));
      toast.success(`Cliente ${nuevoCliente.nombre} agregado`);
      return nuevoCliente;
    } catch (e) {
      console.error('Error adding cliente:', e);
      toast.error('Error al guardar cliente');
    }
  };

  // Actualizar cliente
  const updateCliente = async (id, updates) => {
    const index = clientes.value.findIndex(c => c.id === id);
    if (index !== -1) {
      const updatedClient = {
        ...clientes.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      try {
        await dbService.put('clientes', updatedClient);
        clientes.value[index] = updatedClient;
        toast.success('Cliente actualizado');
        return updatedClient;
      } catch (e) {
        console.error('Error updating cliente:', e);
        toast.error('Error al actualizar cliente');
      }
    } else {
      toast.error('Cliente no encontrado');
    }
    return null;
  };

  // Eliminar cliente
  const deleteCliente = async (id) => {
    const index = clientes.value.findIndex(c => c.id === id);
    if (index !== -1) {
      const nombre = clientes.value[index].nombre;
      try {
        await dbService.delete('clientes', id);
        clientes.value.splice(index, 1);
        toast.success(`Cliente ${nombre} eliminado`);
        return true;
      } catch (e) {
        console.error('Error deleting cliente:', e);
        toast.error('Error al eliminar cliente');
      }
    } else {
      toast.error('Cliente no encontrado');
    }
    return false;
  };

  // Obtener cliente por ID
  const getClienteById = (id) => {
    return clientes.value.find(c => c.id === id);
  };

  // Obtener historial de visitas del cliente
  const getVisitasCliente = (clienteId) => {
    // Assuming visitas stores clienteId??
    // VisitasView stores: { lugar, observacion, fecha }. No clienteId mentioned in VisitasView logic!
    // Wait. VisitasView is "Visitas Diarias" (general log), not linked to a specific client?
    // Let's check the old useClientes:
    // It read 'VisitasDiarias' and filtered by `v.clienteId === clienteId`.
    // But VisitasView doesn't add clienteId!
    // So `getVisitasCliente` likely returns [] always unless other components add visits with clienteId.
    // I will preserve the logic: verify if field exists.
    return visitas.value.filter(v => v.clienteId === clienteId);
  };

  // Obtener historial de cobros del cliente
  const getCobrosCliente = (clienteId) => {
    // Check key in cobros. Usually 'clienteId' or 'cliente.id'.
    // Old useClientes used `c.clienteId === clienteId`.
    return cobros.value.filter(c => c.clienteId === clienteId || (c.cliente && c.cliente.id === clienteId));
  };

  // Obtener historial de pedidos del cliente
  const getPedidosCliente = (clienteId) => {
    // Old used `h.clienteId === clienteId`.
    return historial.value.filter(h => h.clienteId === clienteId || (h.cliente && h.cliente.id === clienteId));
  };

  // Calcular total de compras del cliente
  const getTotalComprasCliente = (clienteId) => {
    const pedidos = getPedidosCliente(clienteId);
    return pedidos.reduce((total, pedido) => {
      const subtotal = pedido.productos?.reduce((sum, p) => sum + (p.precio * p.cantidad), 0) || 0;
      return total + subtotal;
    }, 0);
  };

  // Actualizar clasificación automática
  const actualizarClasificacion = (clienteId) => {
    const total = getTotalComprasCliente(clienteId);
    const nuevaClasificacion = calcularClasificacion(total);
    updateCliente(clienteId, { clasificacion: nuevaClasificacion });
  };

  // Computed: Clientes ordenados por nombre
  const clientesOrdenados = computed(() => {
    return [...clientes.value].sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  // Computed: Clientes por clasificación
  const clientesPorClasificacion = computed(() => {
    return {
      A: clientes.value.filter(c => c.clasificacion === 'A'),
      B: clientes.value.filter(c => c.clasificacion === 'B'),
      C: clientes.value.filter(c => c.clasificacion === 'C')
    };
  });

  // Buscar clientes
  const buscarClientes = (termino) => {
    if (!termino) return clientes.value;
    const terminoLower = termino.toLowerCase();
    return clientes.value.filter(c =>
      c.nombre.toLowerCase().includes(terminoLower) ||
      c.empresa.toLowerCase().includes(terminoLower) ||
      c.telefono.includes(termino) ||
      c.email.toLowerCase().includes(terminoLower)
    );
  };

  // Auto-load
  if (!isLoaded.value) {
    loadClientes();
  }

  return {
    clientes,
    clientesOrdenados,
    clientesPorClasificacion,
    addCliente,
    updateCliente,
    deleteCliente,
    getClienteById,
    getVisitasCliente,
    getCobrosCliente,
    getPedidosCliente,
    getTotalComprasCliente,
    actualizarClasificacion,
    buscarClientes
  };
}
