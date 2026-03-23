<template>
  <div class="container-fluid py-3">
    <!-- Header Section -->
   <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-3">
      <div class="text-center">
        <h2 class="fw-bold text-primary mb-1">Catálogo de Productos</h2>
      </div>
      <b-badge variant="success" pill class="fs-6 px-3 py-2 shadow-sm" style="border-radius: 5px !important">
        {{ productosFiltrados.length }} productos registrados
      </b-badge>
    </div>

    <!-- Filtros Card -->
   <div class="bg-white p-3 rounded-2 shadow-sm mb-2 border">
      <b-row class="g-3">
        <!-- Buscador Principal -->
        <b-col md="12" lg="6">
          <div class="input-group">
           <b-form-input v-model="filtroBusqueda" class="form-control border-start-0 border-end-0 ps-0 text-center"
              placeholder="Buscar por nombre o principio activo" @keyup.enter="aplicarBusqueda" />
            <!-- Botón X para limpiar búsqueda -->
            <button v-if="filtroBusqueda" type="button"
              class="btn btn-outline-secondary border-start-0 border-end-0 px-2 limpiar-btn rounded-end"
              style="margin:0px 10px 0px 0px" @click="limpiarBusqueda" title="Limpiar búsqueda">
              ✕
            </button>
            <b-button variant="primary" @click="aplicarBusqueda">
              Buscar
            </b-button>
          </div>
        </b-col>

        <!-- Filtros Select -->
        <b-col md="12" lg="3">
          <input v-model="filtroMarca" list="marcas-list" class="form-control" placeholder="🏷️ Buscar marca..."
            @input="onMarcaInput" />
          <datalist id="marcas-list">
            <option v-for="m in opcionesMarcas" :key="m" :value="m">{{ m }}</option>
          </datalist>
        </b-col>

        <!-- <b-col md="12" lg="3">
          <b-form-select v-model="filtroPresentacion" class="form-select">
            <option value="">Presentación</option>
            <option v-for="p in opcionesPresentaciones" :key="p" :value="p">{{ p }}</option>
          </b-form-select>
        </b-col> -->

        <!-- Botón Limpiar (solo visible si hay filtros activos) -->
        <b-col cols="12" class="d-flex justify-content-end" v-if="filtroBusqueda || filtroMarca || filtroPresentacion">
          <b-button variant="link" class="text-decoration-none text-muted p-0" @click="limpiarFiltros">
            ✖ Limpiar filtros
          </b-button>
        </b-col>
      </b-row>
    </div>

    <!-- Loading state -->
    <div v-if="cargando" class="text-center py-5">
      <b-spinner variant="primary" style="width: 3rem; height: 3rem;"></b-spinner>
      <p class="text-muted mt-3">Cargando productos...</p>
    </div>

    <!-- Grid de productos -->
    <div v-else-if="productosFiltrados.length > 0">
      <div class="row g-3 mb-4">
        <div v-for="producto in paginatedProducts" :key="producto.ID" class="col-12 col-sm-6 col-md-6 col-lg-4">
          <Producto :producto="producto" :es-agregado="producto.isDuplicate" @ver-detalle="mostrarDetalle" />
        </div>
      </div>

      <!-- Paginación Responsiva -->
     <!-- Paginación Responsiva -->
      <div class="d-flex justify-content-center align-items-center gap-2 gap-md-3 mb-4">
       <b-button variant="outline-primary" :disabled="currentPage === 1" @click="currentPage--" class="px-2 px-md-3">
          ← Anterior
        </b-button>

      <span class="text-muted text-center small mx-1 my-0">
          Página <strong>{{ currentPage }}</strong> de <strong>{{ totalPages }}</strong>
        </span>

        <b-button variant="outline-primary" :disabled="currentPage === totalPages" @click="currentPage++"
         class="px-2 px-md-3">
          Siguiente →
        </b-button>
      </div>
    </div>

    <!-- Estado vacío -->
    <b-card v-else class="text-center py-5 shadow-sm">
      <div style="font-size: 3rem; color: #6c757d;">📦</div>
      <h5 class="text-muted mt-3">No se encontraron productos</h5>
      <p class="text-muted mb-3">
        {{ productos.length === 0
  ? 'Carga productos desde la página de Excel para comenzar'
  : 'Intenta ajustar los filtros de búsqueda'
        }}
      </p>
      <router-link to="/excel" v-if="productos.length === 0">
        <b-button variant="primary">
          📊 Ir a cargar productos
        </b-button>
      </router-link>
    </b-card>

    <!-- Modal de detalle -->
    <b-modal v-model="showModal" :title="productoSeleccionado?.NombreProducto || 'Detalle del Producto'" size="lg">
      <div v-if="productoSeleccionado">
        <b-row>
          <b-col md="6">
            <p><strong>Código:</strong> {{ productoSeleccionado.Codigo }}</p>
            <p><strong>Marca:</strong> {{ productoSeleccionado.Marca }}</p>
            <p><strong>Presentación:</strong> {{ productoSeleccionado.Presentacion }}</p>
            <p><strong>Principio Activo:</strong> {{ productoSeleccionado.PrincipioActivo }}</p>
          </b-col>
          <b-col md="6">
            <p><strong>Precio Farmacia:</strong> <span class="text-success">${{
  Number(productoSeleccionado.PrecioFarmacia || 0).toFixed(3)
                }}</span></p>
            <p><strong>PVP:</strong> <del class="text-danger">${{ Number(productoSeleccionado.PVP || 0).toFixed(3)
               }}</del></p>
           <div class="text-muted small bg-warning rounded p-2" v-if="productoSeleccionado.Observacion">
              <strong>Observación:</strong> {{
                productoSeleccionado.Observacion
              }}
            </div>


            <p v-if="productoSeleccionado.Descuento"><strong>Descuento:</strong> {{ productoSeleccionado.Descuento }}%
            </p>
            <p><strong>IVA:</strong> {{ productoSeleccionado.IVA }}%</p>
            <p v-if="productoSeleccionado.Promocion"><strong>Promoción:</strong> {{ productoSeleccionado.Promocion }}
            </p>
          </b-col>
        </b-row>
      </div>

      <!-- Custom Footer -->
      <template #footer>
        <div class="d-flex justify-content-between w-100">
          <div class="d-flex gap-2">
            <b-button v-if="isAdmin" variant="outline-danger" @click="mostrarModalEliminar">
              🗑️ Eliminar
            </b-button>
          </div>
          <div class="d-flex gap-2">
            <b-button variant="outline-secondary" @click="showModal = false">
              Cerrar
            </b-button>
            <b-button v-if="isAdmin" variant="primary" @click="editarProducto">
              ✏️ Editar
            </b-button>
          </div>
        </div>
      </template>
    </b-modal>

  </div>
</template>


<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import alertify from "alertifyjs";
import Producto from "@/components/Productos/Producto.vue";
import { useCart } from "@/composables/useCart";
import { useAuth } from "@/composables/useAuth";
import { useProductos } from "@/composables/useProductos";

const router = useRouter();
const toast = useToast();
const { cartCount } = useCart();
const { isAdmin } = useAuth();
const {
  productos,
  loadProductos,
  deleteProducto,
  loaded,
  filtroBusqueda,
  terminoBusqueda,
  filtroMarca,
  filtroPresentacion,
  currentPage
} = useProductos();

const productoSeleccionado = ref(null);
const showModal = ref(false);
const cargando = ref(!loaded.value);

const itemsPerPage = ref(50);

// Filtrado Reactivo y Permanente
const productosFiltrados = computed(() => {
  const text = terminoBusqueda.value.toLowerCase();

  return productos.value.filter((p) => {
    // Filtro de búsqueda
    if (text) {
      const matchesSearch =
        p.NombreProducto?.toLowerCase().includes(text) ||
        p.Marca?.toLowerCase().includes(text) ||
        p.PrincipioActivo?.toLowerCase().includes(text);

      if (!matchesSearch) return false;
    }

    // Filtro de marca
    if (filtroMarca.value && p.Marca !== filtroMarca.value) return false;

    // Filtro de presentación
    if (filtroPresentacion.value && p.Presentacion !== filtroPresentacion.value) return false;

    return true;
  });
});

const totalPages = computed(() => Math.ceil(productosFiltrados.value.length / itemsPerPage.value));

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return productosFiltrados.value.slice(start, end);
});

const opcionesMarcas = ref([]);
const opcionesPresentaciones = ref([]);

// Extraer opciones de marcas y presentaciones cada vez que los productos cambien
watch(productos, (lista) => {
  const marcas = new Set();
  const presentaciones = new Set();

  for (const p of lista) {
    if (p.Marca) marcas.add(p.Marca);
    if (p.Presentacion) presentaciones.add(p.Presentacion);
  }

  opcionesMarcas.value = Array.from(marcas).sort();
  opcionesPresentaciones.value = Array.from(presentaciones).sort();
}, { immediate: true, deep: true });

// Validar marca ingresada (opcional, solo para feedback visual si se desea)
const onMarcaInput = () => {
  // No limpiar automáticamente, permitir búsquedas parciales
};

onMounted(async () => {
  if (!loaded.value) {
    await loadProductos();
  }
  cargando.value = false;
});

// Forzar recarga total de productos si se requiere
const cargarProductos = async () => {
  cargando.value = true;
  await loadProductos(true);
  cargando.value = false;
};

// Sincronizar búsqueda cuando la lista base cambie (ediciones, etc)
watch(productos, () => {
  // Solo sincronizar si el input no coincide con lo aplicado, 
  // esto ayuda a que después de editar se vea el cambio inmediatamente en la lista filtrada
  if (filtroBusqueda.value && terminoBusqueda.value !== filtroBusqueda.value) {
    terminoBusqueda.value = filtroBusqueda.value;
  }
}, { deep: true });

// Resetear página al cambiar cualquier filtro
watch([terminoBusqueda, filtroMarca, filtroPresentacion], () => {
  currentPage.value = 1;
});

const limpiarFiltros = () => {
  filtroBusqueda.value = "";
  terminoBusqueda.value = "";
  filtroMarca.value = "";
  filtroPresentacion.value = "";
};

// Limpiar solo el buscador principal
const limpiarBusqueda = () => {
  filtroBusqueda.value = "";
  terminoBusqueda.value = "";
};

const aplicarBusqueda = () => {
  terminoBusqueda.value = filtroBusqueda.value;
};

const mostrarDetalle = (producto) => {
  productoSeleccionado.value = producto;
  showModal.value = true;
};

// Navigate to edit view
const editarProducto = () => {
  if (productoSeleccionado.value) {
    router.push(`/editar-producto/${productoSeleccionado.value.ID}`);
  }
};

// Delete product with modal confirmation
const mostrarModalEliminar = () => {
  if (!productoSeleccionado.value) return;
  confirmarEliminacion();
};

const confirmarEliminacion = () => {
  if (!productoSeleccionado.value) return;

  alertify.confirm(
    "Confirmar Eliminación",
    "¿Estás seguro de que deseas eliminar este producto?",
    async () => {
      try {
        await deleteProducto(productoSeleccionado.value.ID);
        toast.success('🗑️ Producto eliminado correctamente');
        showModal.value = false;
        cargarProductos();
      } catch (error) {
        // toast handled in composable
      }
    },
    () => {
      // Cancel action
    }
  ).set('labels', { ok: 'Sí, Eliminar', cancel: 'Cancelar' });
};
</script>

<style scoped>
.container-fluid {
  max-width: 1400px;
}

.gap-2 {
  gap: 0.5rem;
}

/* Botón X del buscador */
.limpiar-btn {
  background: white;
  color: #999;
  border-color: #ced4da !important;
  font-size: 0.85rem;
  line-height: 1;
  transition: color 0.15s;
}

.limpiar-btn:hover {
  color: #dc3545;
  background: #fff5f5;
}
</style>
