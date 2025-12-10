import { ref } from 'vue';
import { dbService } from '@/services/db';
import { useToast } from 'vue-toastification';

const productos = ref([]);
const loaded = ref(false);

export function useProductos() {
  const toast = useToast();

  const loadProductos = async () => {
    try {
      productos.value = await dbService.getAll('productos');
      loaded.value = true;
    } catch (e) {
      console.error('Error loading products:', e);
      toast.error('Error al cargar productos de la base de datos');
    }
  };

  const addProducto = async (producto) => {
    try {
      await dbService.put('productos', producto);
      productos.value.push(producto);
      // toast handled in view usually, but we can add here if standardizing
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
        productos.value[index] = producto;
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

  // Bulk add for Excel import
  const bulkAddProductos = async (newProductos) => {
    try {
      await dbService.bulkPut('productos', newProductos);
      // Refresh local state
      await loadProductos();
      return true;
    } catch (e) {
      console.error('Error bulk adding products:', e);
      toast.error('Error al importar productos');
      throw e;
    }
  };

  // Initialize if needed
  if (!loaded.value) {
    loadProductos();
  }

  return {
    productos,
    loadProductos,
    addProducto,
    updateProducto,
    deleteProducto,
    bulkAddProductos
    // TODO: Add search/filter here if we want to move logic from view
  };
}
