import { ref } from 'vue';
import { dbService } from '@/services/db';
import { useToast } from 'vue-toastification';

// Estado global para evitar recargas innecesarias y asegurar consistencia
const productos = ref([]);
const loaded = ref(false);
const loadingPromise = ref(null);

// Filtros globales para persistencia
const filtroBusqueda = ref("");
const terminoBusqueda = ref("");
const filtroMarca = ref("");
const filtroPresentacion = ref("");
const currentPage = ref(1);

export function useProductos() {
  const toast = useToast();

  const loadProductos = async (force = false) => {
    // Si ya se está cargando, devolver la promesa existente
    if (loadingPromise.value && !force) return loadingPromise.value;

    // Si ya está cargado y no se fuerza, no hacer nada
    if (loaded.value && !force) return Promise.resolve();

    loadingPromise.value = (async () => {
      try {
        console.log('🔄 Cargando productos desde DB...');
        productos.value = await dbService.getAll('productos');
        loaded.value = true;
        console.log(`✅ ${productos.value.length} productos cargados.`);
      } catch (e) {
        console.error('Error loading products:', e);
        toast.error('Error al cargar productos de la base de datos');
        throw e;
      } finally {
        loadingPromise.value = null;
      }
    })();

    return loadingPromise.value;
  };

  const addProducto = async (producto) => {
    try {
      // Asegurar que los datos estén cargados antes de añadir (por si el componente llama rápido)
      if (!loaded.value) {
        await loadProductos();
      }

      await dbService.put('productos', producto);

      // Actualizar estado local reactivo
      const exists = productos.value.some(p => p.ID === producto.ID);
      if (!exists) {
        productos.value.push(producto);
      } else {
        const index = productos.value.findIndex(p => p.ID === producto.ID);
        productos.value[index] = producto;
      }

      return true;
    } catch (e) {
      console.error('Error adding product:', e);
      toast.error('Error al guardar producto');
      throw e;
    }
  };

  const updateProducto = async (producto) => {
    try {
      await dbService.put('productos', producto);
      const index = productos.value.findIndex(p => p.ID === producto.ID);
      if (index !== -1) {
        productos.value[index] = { ...producto };
      } else {
        productos.value.push(producto);
      }
      return true;
    } catch (e) {
      console.error('Error updating product:', e);
      toast.error('Error al actualizar producto');
      throw e;
    }
  };

  const deleteProducto = async (id) => {
    try {
      await dbService.delete('productos', id);
      productos.value = productos.value.filter(p => p.ID !== id);
      return true;
    } catch (e) {
      console.error('Error deleting product:', e);
      toast.error('Error al eliminar producto');
      throw e;
    }
  };

  const bulkAddProductos = async (newProductos) => {
    try {
      await dbService.bulkPut('productos', newProductos);
      await loadProductos(true); // Forzar recarga total
      return true;
    } catch (e) {
      console.error('Error bulk adding products:', e);
      toast.error('Error al importar productos');
      throw e;
    }
  };

  const clearAllProductos = async () => {
    try {
      // Usar transacción para limpiar (asumiendo que clear está en dbService)
      await dbService.clear('productos'); 
      productos.value = [];
      return true;
    } catch (e) {
      console.error('Error clearing all products:', e);
      toast.error('Error al eliminar todos los productos');
      throw e;
    }
  };

  // Inicialización automática al usar el composable por primera vez
  if (!loaded.value && !loadingPromise.value) {
    loadProductos();
  }

  return {
    productos,
    loaded,
    loadProductos,
    addProducto,
    updateProducto,
    deleteProducto,
    bulkAddProductos,
    clearAllProductos,
    filtroBusqueda,
    terminoBusqueda,
    filtroMarca,
    filtroPresentacion,
    currentPage
  };
}
