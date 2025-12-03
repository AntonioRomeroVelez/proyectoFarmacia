<template>
  <div class="container-fluid py-3">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
      <div>
        <h2 class="fw-bold text-primary mb-1">📦 Inventario Visual</h2>
        <p class="text-muted mb-0 small">Productos organizados por marca</p>
      </div>
      <b-badge variant="success" pill class="fs-6 px-3 py-2 shadow-sm">
        {{ totalProductos }} productos
      </b-badge>
    </div>

    <!-- Buscador -->
    <div class="bg-white p-3 rounded-2 shadow-sm mb-4 border">
      <div class="input-group">
        <span class="input-group-text bg-light border-end-0">🔍</span>
        <input 
          v-model="busqueda" 
          class="form-control border-start-0 ps-0"
          placeholder="Buscar por marca, nombre o principio activo..."
          @keyup.enter="aplicarBusqueda"
        />
        <b-button variant="primary" @click="aplicarBusqueda">
          Buscar
        </b-button>
        <b-button v-if="terminoBusqueda" variant="outline-secondary" @click="limpiarBusqueda">
          ✖
        </b-button>
      </div>
    </div>

    <!-- Controles Superiores -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-center mb-3 gap-3">
      <!-- Botones de Vista -->
      <div class="d-flex gap-2">
        <button 
          class="btn btn-sm d-flex align-items-center gap-2"
          :class="viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'"
          @click="setViewMode('grid')"
          title="Vista Cuadrícula"
          type="button"
        >
          <BIconGridFill />
          <span>Grid</span>
        </button>
        <button 
          class="btn btn-sm d-flex align-items-center gap-2"
          :class="viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'"
          @click="setViewMode('list')"
          title="Vista Lista Compacta"
          type="button"
        >
          <BIconListUl />
          <span>Lista</span>
        </button>
      </div>

      <!-- Botones de Expansión -->
      <div class="d-flex gap-2">
        <b-button variant="outline-secondary" size="sm" @click="expandirTodo(true)">
          Expandir Todo
        </b-button>
        <b-button variant="outline-secondary" size="sm" @click="expandirTodo(false)">
          Colapsar Todo
        </b-button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="cargando" class="text-center py-5">
      <b-spinner variant="primary" style="width: 3rem; height: 3rem;"></b-spinner>
      <p class="text-muted mt-3">Cargando inventario...</p>
    </div>

    <!-- Inventario por Marca -->
    <div v-else>
      <div v-for="(datos, marca) in productosPorMarcaFiltrados" :key="marca" class="marca-section mb-4">
        <!-- Header de Marca (Acordeón) -->
        <div class="marca-header" @click="toggleMarca(marca)">
          <div class="header-content">
            <!-- Línea principal: icono, nombre y total -->
            <div class="header-main">
              <span class="toggle-icon">{{ marcasExpandidas[marca] ? '▼' : '▶' }}</span>
              <h4 class="mb-0 marca-nombre">{{ marca }}</h4>
              <b-badge variant="primary" pill class="total-badge">{{ datos.total }}</b-badge>
            </div>
            
            <!-- Badges de presentación (ocultos en móvil) -->
            <div class="presentaciones-badges d-none d-md-flex">
              <b-badge 
                v-for="(count, pres) in datos.porPresentacion" 
                :key="pres"
                variant="light"
                class="presentacion-badge"
              >
                {{ pres }}: {{ count }}
              </b-badge>
            </div>
          </div>
        </div>

        <!-- Productos de la Marca (Expandible) -->
        <transition name="slide-fade">
          <div v-if="marcasExpandidas[marca]" :class="viewMode === 'grid' ? 'productos-grid' : 'productos-list'">
            <!-- VISTA GRID -->
            <template v-if="viewMode === 'grid'">
              <div 
                v-for="producto in datos.productos" 
                :key="'grid-' + producto.ID"
                class="producto-card"
              >
                <!-- Producto Info -->
                <div class="producto-header">
                  <h6 class="producto-nombre mb-1">{{ producto.NombreProducto }}</h6>
                  <small class="text-muted">{{ producto.Presentacion }}</small>
                </div>

                <div class="producto-body">
                  <!-- Código -->
                  <div class="info-row">
                    <span class="info-label">Código:</span>
                    <span class="info-value">{{ producto.Codigo }}</span>
                  </div>

                  <!-- Principio Activo -->
                  <div class="info-row" v-if="producto.PrincipioActivo">
                    <span class="info-label">P. Activo:</span>
                    <span class="info-value text-muted small">{{ producto.PrincipioActivo }}</span>
                  </div>

                  <!-- Precios -->
                  <div class="precios-section">
                    <div class="precio-item">
                      <small class="text-muted">P. Farmacia</small>
                      <strong class="text-success">${{ formatPrice(producto.PrecioFarmacia) }}</strong>
                    </div>
                    <div class="precio-item">
                      <small class="text-muted">PVP</small>
                      <strong class="text-primary">${{ formatPrice(producto.PVP) }}</strong>
                    </div>
                  </div>

                  <!-- Badges de Novedades -->
                  <div class="badges-section">
                    <b-badge v-if="producto.Promocion" variant="success" class="me-1">
                      🎁 {{ producto.Promocion }}
                    </b-badge>
                    <b-badge v-if="producto.Descuento" variant="warning" class="text-dark me-1">
                      💰 {{ producto.Descuento }}% desc.
                    </b-badge>
                    <b-badge v-if="producto.IVA > 0" variant="info" class="me-1">
                      IVA {{ producto.IVA }}%
                    </b-badge>
                  </div>
                </div>
              </div>
            </template>

            <!-- VISTA LISTA COMPACTA -->
            <template v-else>
              <div 
                v-for="producto in datos.productos" 
                :key="'list-' + producto.ID"
                class="producto-list-item"
              >
                <div class="d-flex justify-content-between align-items-start w-100">
                  <div class="flex-grow-1">
                    <div class="d-flex align-items-center gap-2 mb-1">
                      <span class="fw-bold text-dark">{{ producto.NombreProducto }}</span>
                      <small class="text-muted border px-1 rounded">{{ producto.Presentacion }}</small>
                    </div>
                    <div class="small text-muted mb-1" v-if="producto.PrincipioActivo">
                      {{ producto.PrincipioActivo }}
                    </div>
                    <div class="d-flex gap-2 align-items-center">
                      <span class="price-tag text-success">Farm: ${{ formatPrice(producto.PrecioFarmacia) }}</span>
                      <span class="price-tag text-primary">PVP: ${{ formatPrice(producto.PVP) }}</span>
                    </div>
                  </div>
                  
                  <div class="d-flex flex-column align-items-end gap-1">
                     <b-badge v-if="producto.Promocion" variant="success" pill class="compact-badge">🎁</b-badge>
                     <b-badge v-if="producto.Descuento" variant="warning" pill class="compact-badge text-dark">%</b-badge>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </transition>
      </div>

      <!-- Estado vacío -->
      <b-card v-if="Object.keys(productosPorMarcaFiltrados).length === 0" class="text-center py-5 shadow-sm">
        <div style="font-size: 3rem; color: #6c757d;">🔍</div>
        <h5 class="text-muted mt-3">No se encontraron productos</h5>
        <p class="text-muted mb-0">Intenta ajustar tu búsqueda</p>
      </b-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { BIconGridFill, BIconListUl } from 'bootstrap-icons-vue';

const viewMode = ref('grid'); // 'grid' | 'list'
const cargando = ref(true);
const busqueda = ref(''); // Input del usuario
const terminoBusqueda = ref(''); // Término aplicado al filtro
const productos = ref([]);
const marcasExpandidas = ref({});

// Cambiar modo de vista
const setViewMode = (mode) => {
  viewMode.value = mode;
};

// Expandir/Colapsar todo
const expandirTodo = (expandir) => {
  Object.keys(marcasExpandidas.value).forEach(marca => {
    marcasExpandidas.value[marca] = expandir;
  });
};

// Aplicar búsqueda
const aplicarBusqueda = () => {
  terminoBusqueda.value = busqueda.value;
};

// Limpiar búsqueda
const limpiarBusqueda = () => {
  busqueda.value = '';
  terminoBusqueda.value = '';
};

// Formatear precio
const formatPrice = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? '0.000' : num.toFixed(3);
};

// Cargar productos
onMounted(() => {
  setTimeout(() => {
    const lista = JSON.parse(localStorage.getItem('ListaProductos')) || [];
    productos.value = lista;
    
    // Inicializar todas las marcas como colapsadas (false)
    const marcas = new Set(lista.map(p => p.Marca));
    marcas.forEach(marca => {
      marcasExpandidas.value[marca] = false;
    });
    
    cargando.value = false;
  }, 300);
});

// Agrupar productos por marca
const productosPorMarca = computed(() => {
  const agrupados = {};
  
  productos.value.forEach(producto => {
    const marca = producto.Marca || 'Sin Marca';
    
    if (!agrupados[marca]) {
      agrupados[marca] = {
        productos: [],
        total: 0,
        porPresentacion: {}
      };
    }
    
    agrupados[marca].productos.push(producto);
    agrupados[marca].total++;
    
    // Contar por presentación
    const pres = producto.Presentacion || 'Sin presentación';
    agrupados[marca].porPresentacion[pres] = (agrupados[marca].porPresentacion[pres] || 0) + 1;
  });
  
  // Ordenar marcas alfabéticamente
  return Object.keys(agrupados)
    .sort()
    .reduce((acc, key) => {
      acc[key] = agrupados[key];
      return acc;
    }, {});
});

// Filtrar por búsqueda
const productosPorMarcaFiltrados = computed(() => {
  if (!terminoBusqueda.value.trim()) return productosPorMarca.value;
  
  const termino = terminoBusqueda.value.toLowerCase();
  const filtrados = {};
  
  Object.entries(productosPorMarca.value).forEach(([marca, datos]) => {
    // Filtrar por marca
    if (marca.toLowerCase().includes(termino)) {
      filtrados[marca] = datos;
      return;
    }
    
    // Filtrar por productos
    const productosFiltrados = datos.productos.filter(p => 
      (p.NombreProducto || '').toLowerCase().includes(termino) ||
      (p.PrincipioActivo || '').toLowerCase().includes(termino)
    );
    
    if (productosFiltrados.length > 0) {
      // Recalcular contadores
      const porPresentacion = {};
      productosFiltrados.forEach(p => {
        const pres = p.Presentacion || 'Sin presentación';
        porPresentacion[pres] = (porPresentacion[pres] || 0) + 1;
      });
      
      filtrados[marca] = {
        productos: productosFiltrados,
        total: productosFiltrados.length,
        porPresentacion
      };
    }
  });
  
  return filtrados;
});

// Total de productos
const totalProductos = computed(() => productos.value.length);

// Toggle expandir/colapsar marca
const toggleMarca = (marca) => {
  marcasExpandidas.value[marca] = !marcasExpandidas.value[marca];
};
</script>

<style scoped>
.container-fluid {
  max-width: 1400px;
}

/* Marca Section */
.marca-section {
  background: white;
  border-radius: 12px;
  overflow: hidden; /* Previene desbordamiento */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%; /* Asegura que no exceda el contenedor */
}

.marca-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 1rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 2px solid #dee2e6;
  user-select: none;
}

.marca-header:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
}

.marca-header:active {
  background: linear-gradient(135deg, #dee2e6 0%, #ced4da 100%);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.toggle-icon {
  font-size: 0.9rem;
  color: #6c757d;
  transition: transform 0.3s ease;
  min-width: 20px;
}

.marca-nombre {
  color: #0d6efd;
  font-size: 1.2rem;
  flex: 1;
  word-break: break-word; /* Previene desbordamiento de texto */
  min-width: 0; /* Permite que el flex item se encoja */
}

.total-badge {
  font-size: 0.85rem;
  padding: 0.4rem 0.8rem;
  flex-shrink: 0; /* Evita que el badge se aplaste */
}

.presentaciones-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding-left: 2rem;
}

.presentacion-badge {
  font-size: 0.75rem;
  padding: 0.4rem 0.6rem;
  background: white !important;
  color: #6c757d !important;
  border: 1px solid #dee2e6;
}

/* Responsive para móvil */
@media (max-width: 768px) {
  .marca-header {
    padding: 0.75rem 1rem;
  }
  
  .marca-nombre {
    font-size: 1rem;
  }
  
  .total-badge {
    font-size: 0.75rem;
    padding: 0.3rem 0.6rem;
  }
  
  .header-main {
    gap: 0.5rem;
  }
  
  .presentaciones-badges {
    padding-left: 0; /* Reset padding en móvil */
  }
}

/* Productos Grid */
.productos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); /* Reducido a 250px */
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
}

@media (max-width: 768px) {
  .productos-grid {
    grid-template-columns: 1fr;
    padding: 0.75rem; /* Menos padding en móvil */
  }
}

/* Producto Card */
.producto-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 2px solid transparent;
  height: 100%; /* Altura completa en grid */
}

.producto-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #0d6efd;
  transform: translateY(-2px);
}

.producto-header {
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e9ecef;
}

.producto-nombre {
  color: #212529;
  font-size: 0.95rem;
  font-weight: 600;
  word-break: break-word;
}

.producto-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.info-label {
  color: #6c757d;
  font-weight: 500;
}

.info-value {
  color: #212529;
  text-align: right;
}

.precios-section {
  display: flex;
  justify-content: space-around;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  margin: 0.5rem 0;
  flex-wrap: wrap; /* Permitir wrap en precios */
}

.precio-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.badges-section {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

/* Animations */
.slide-fade-enter-active {
  transition: all 0.3s ease-out; /* Suavizado */
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* Estilos Vista Lista Compacta */
.productos-list {
  display: flex;
  flex-direction: column;
  background: white;
  border-top: 1px solid #dee2e6;
}

.producto-list-item {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
  width: 100%;
}

.producto-list-item:last-child {
  border-bottom: none;
}

.producto-list-item:hover {
  background-color: #f8f9fa;
}

.price-tag {
  font-size: 0.85rem;
  font-weight: 600;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap; /* Evita quiebre de precios */
}

.compact-badge {
  font-size: 0.7rem;
  padding: 0.25rem 0.4rem;
}

/* Utilitario para iconos en botones */
.btn svg {
  pointer-events: none;
}
</style>
