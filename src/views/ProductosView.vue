<template>
  <div class="container-fluid py-1">
    <div class="d-flex justify-content-center align-items-center mb-4 flex-wrap gap-2">
      <h2 class="fw-bold text-primary mb-0">Productos</h2>
      <div class="d-flex align-items-center gap-2 flex-wrap">
        <b-badge variant="info" pill class="fs-6">
          {{ productosFiltrados.length }} productos
        </b-badge>
        <router-link to="/carrito">
          <b-button variant="success" size="sm">
            🛒 Ver Carrito ({{ cartCount }})
          </b-button>
        </router-link>
      </div>
    </div>

    <!-- Filtros -->
    <b-card class="shadow-sm mb-4">
      <b-row>
        <b-col md="12" sm="12">
          <div class="d-flex gap-2 mb-2">
            <b-form-input v-model="filtroBusqueda" class="form-control"
              placeholder="🔍 Buscar por nombre, código, marca, principio activo..." size="sm"
              @keyup.enter="aplicarBusqueda" />
            <b-button variant="primary" size="sm" @click="aplicarBusqueda" style="white-space: nowrap;">
              🔍 Buscar
            </b-button>
          </div>
        </b-col>

        <b-col md="12" sm="12" class="mb-2">
          <b-form-select v-model="filtroMarca" class="form-select" size="sm">
            <option value="">📦 Todas las marcas</option>
            <option v-for="m in opcionesMarcas" :key="m" :value="m">{{ m }}</option>
          </b-form-select>
        </b-col>

        <b-col md="12" sm="12" class="mb-2">
          <b-form-select v-model="filtroPresentacion" class="form-select" size="sm">
            <option value="">💊 Todas las presentaciones</option>
            <option v-for="p in opcionesPresentaciones" :key="p" :value="p">{{ p }}</option>
          </b-form-select>
        </b-col>

        <b-col md="12" sm="12">
          <b-button variant="outline-secondary" size="sm" class="w-10" @click="limpiarFiltros">
            ✖ Limpiar
          </b-button>
        </b-col>
      </b-row>
    </b-card>

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
      <div class="d-flex flex-column flex-md-row justify-content-center align-items-center gap-3 mb-4">
        <b-button variant="outline-primary" :disabled="currentPage === 1" @click="currentPage--"
          class="w-100 w-md-auto">
          ← Anterior
        </b-button>

        <span class="text-muted text-center my-2 my-md-0">
          Página <strong>{{ currentPage }}</strong> de <strong>{{ totalPages }}</strong>
        </span>

        <b-button variant="outline-primary" :disabled="currentPage === totalPages" @click="currentPage++"
          class="w-100 w-md-auto">
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
            <b-button variant="outline-danger" @click="mostrarModalEliminar">
              🗑️ Eliminar
            </b-button>
          </div>
          <div class="d-flex gap-2">
            <b-button variant="outline-secondary" @click="showModal = false">
              Cerrar
            </b-button>
            <b-button variant="primary" @click="editarProducto">
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

const router = useRouter();
const toast = useToast();
const { cartCount } = useCart();

const productos = ref([]);
const productosFiltrados = ref([]);
const productoSeleccionado = ref(null);
const showModal = ref(false);
const cargando = ref(true);

const filtroBusqueda = ref("");
const terminoBusqueda = ref(""); // Actual search term applied
const filtroMarca = ref("");
const filtroPresentacion = ref("");

// Paginación
const currentPage = ref(1);
const itemsPerPage = ref(50);

const totalPages = computed(() => Math.ceil(productosFiltrados.value.length / itemsPerPage.value));

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return productosFiltrados.value.slice(start, end);
});

const opcionesMarcas = ref([]);
const opcionesPresentaciones = ref([]);

onMounted(() => {
  cargarProductos();
});

const cargarProductos = () => {
  cargando.value = true;

  // Simulate async loading
  setTimeout(() => {
    const lista = JSON.parse(localStorage.getItem("ListaProductos")) || [];
    productos.value = lista;

    // Extraer marcas y presentaciones únicas
    const marcas = new Set();
    const presentaciones = new Set();

    for (const p of lista) {
      if (p.Marca) marcas.add(p.Marca);
      if (p.Presentacion) presentaciones.add(p.Presentacion);
    }

    opcionesMarcas.value = Array.from(marcas).sort();
    opcionesPresentaciones.value = Array.from(presentaciones).sort();

    productosFiltrados.value = lista;
    cargando.value = false;
  }, 300);
};

// Filtrar productos
watch(
  [productos, terminoBusqueda, filtroMarca, filtroPresentacion],
  () => {
    const text = terminoBusqueda.value.toLowerCase();

    productosFiltrados.value = productos.value.filter((p) => {
      // Filtro de búsqueda
      if (text) {
        const matchesSearch =
          p.NombreProducto?.toLowerCase().includes(text) ||
          p.Marca?.toLowerCase().includes(text) ||
          p.PrincipioActivo?.toLowerCase().includes(text) ||
          String(p.Codigo || "").toLowerCase().includes(text);

        if (!matchesSearch) return false;
      }

      // Filtro de marca
      if (filtroMarca.value && p.Marca !== filtroMarca.value) return false;

      // Filtro de presentación
      if (filtroPresentacion.value && p.Presentacion !== filtroPresentacion.value) return false;

      return true;
    });
  },
  { deep: true }
);

// Resetear página al filtrar
watch(productosFiltrados, () => {
  currentPage.value = 1;
});

const limpiarFiltros = () => {
  filtroBusqueda.value = "";
  terminoBusqueda.value = "";
  filtroMarca.value = "";
  filtroPresentacion.value = "";
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
    () => {
      try {
        const productos = JSON.parse(localStorage.getItem('ListaProductos')) || [];
        const filtered = productos.filter(p => p.ID !== productoSeleccionado.value.ID);
        localStorage.setItem('ListaProductos', JSON.stringify(filtered));

        toast.success('🗑️ Producto eliminado correctamente');
        showModal.value = false;
        cargarProductos();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Error al eliminar el producto');
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
</style>
