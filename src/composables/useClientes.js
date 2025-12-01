import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';

const STORAGE_KEY = 'farmacia_clientes';
const toast = useToast();

// Estado reactivo compartido
const clientes = ref([]);

// Cargar clientes del localStorage
const loadClientes = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      clientes.value = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading clientes:', error);
    toast.error('Error al cargar clientes');
  }
};

// Guardar clientes en localStorage
const saveClientes = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes.value));
  } catch (error) {
    console.error('Error saving clientes:', error);
    toast.error('Error al guardar clientes');
  }
};

export function useClientes() {
  // Cargar al inicializar
  if (clientes.value.length === 0) {
    loadClientes();
  }

  // Generar ID único
  const generateId = () => {
    return `cliente_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Calcular clasificación basada en total de compras
  const calcularClasificacion = (totalCompras) => {
    if (totalCompras >= 5000) return 'A';
    if (totalCompras >= 2000) return 'B';
    return 'C';
  };

  // Agregar cliente
  const addCliente = (clienteData) => {
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

    clientes.value.push(nuevoCliente);
    saveClientes();
    toast.success(`Cliente ${nuevoCliente.nombre} agregado`);
    return nuevoCliente;
  };

  // Actualizar cliente
  const updateCliente = (id, updates) => {
    const index = clientes.value.findIndex(c => c.id === id);
    if (index !== -1) {
      clientes.value[index] = {
        ...clientes.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      saveClientes();
      toast.success('Cliente actualizado');
      return clientes.value[index];
    }
    toast.error('Cliente no encontrado');
    return null;
  };

  // Eliminar cliente
  const deleteCliente = (id) => {
    const index = clientes.value.findIndex(c => c.id === id);
    if (index !== -1) {
      const nombre = clientes.value[index].nombre;
      clientes.value.splice(index, 1);
      saveClientes();
      toast.success(`Cliente ${nombre} eliminado`);
      return true;
    }
    toast.error('Cliente no encontrado');
    return false;
  };

  // Obtener cliente por ID
  const getClienteById = (id) => {
    return clientes.value.find(c => c.id === id);
  };

  // Obtener historial de visitas del cliente
  const getVisitasCliente = (clienteId) => {
    try {
      const visitas = JSON.parse(localStorage.getItem('VisitasDiarias')) || [];
      return visitas.filter(v => v.clienteId === clienteId);
    } catch (error) {
      console.error('Error loading visitas:', error);
      return [];
    }
  };

  // Obtener historial de cobros del cliente
  const getCobrosCliente = (clienteId) => {
    try {
      const cobros = JSON.parse(localStorage.getItem('farmacia_cobros')) || [];
      return cobros.filter(c => c.clienteId === clienteId);
    } catch (error) {
      console.error('Error loading cobros:', error);
      return [];
    }
  };

  // Obtener historial de pedidos del cliente
  const getPedidosCliente = (clienteId) => {
    try {
      const historial = JSON.parse(localStorage.getItem('farmacia_historial')) || [];
      return historial.filter(h => h.clienteId === clienteId);
    } catch (error) {
      console.error('Error loading pedidos:', error);
      return [];
    }
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
