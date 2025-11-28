<template>
  <div class="dashboard-container">
    <!-- Header Section -->
    <div class="d-flex align-items-center mb-4 px-2 flex-column">
      <div class="">
        <span class="text-muted small">{{ fechaActual }}</span>
      </div>
      <div>
        <h2 class="fw-bold text-dark mb-1">Panel de Control</h2>
        <p class="text-muted mb-0">Resumen general y accesos rápidos</p>
      </div>

    </div>

    <!-- Quick Actions Section -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-md-6">
        <router-link to="/productos" class="text-decoration-none">
          <b-card class="h-100 border-0 shadow-sm action-card hover-lift">
            <div class="d-flex align-items-center">
              <div class="icon-circle bg-primary bg-opacity-10 text-primary me-3">
                <i class="bi bi-box-seam fs-4"></i>
              </div>
              <div>
                <h5 class="fw-bold text-dark mb-1">Ir a Productos</h5>
                <p class="text-muted small mb-0">Gestionar productos</p>
              </div>
              <i class="bi bi-arrow-right ms-auto text-muted"></i>
            </div>
          </b-card>
        </router-link>
      </div>
      <div class="col-12 col-md-6">
        <router-link to="/visitas" class="text-decoration-none">
          <b-card class="h-100 border-0 shadow-sm action-card hover-lift">
            <div class="d-flex align-items-center">
              <div class="icon-circle bg-success bg-opacity-10 text-success me-3">
                <i class="bi bi-geo-alt fs-4"></i>
              </div>
              <div>
                <h5 class="fw-bold text-dark mb-1">Ir a Visitas</h5>
                <p class="text-muted small mb-0">Control de visitas a clientes</p>
              </div>
              <i class="bi bi-arrow-right ms-auto text-muted"></i>
            </div>
          </b-card>
        </router-link>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="row g-3 mb-4">
      <!-- Total Productos -->
      <div class="col-6 col-lg-3">
        <b-card class="h-100 border-0 shadow-sm kpi-card">
          <div class="mb-2 text-muted small text-uppercase fw-bold tracking-wide">Productos</div>
          <div class="d-flex align-items-end justify-content-between">
            <h3 class="mb-0 fw-bold text-dark">{{ stats.totalProductos }}</h3>
            <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill">Total</span>
          </div>
        </b-card>
      </div>

      <!-- Visitas -->
      <div class="col-6 col-lg-3">
        <b-card class="h-100 border-0 shadow-sm kpi-card">
          <div class="mb-2 text-muted small text-uppercase fw-bold tracking-wide">Visitas</div>
          <div class="d-flex align-items-end justify-content-between">
            <h3 class="mb-0 fw-bold text-dark">{{ stats.totalVisitas }}</h3>
            <span class="badge bg-success bg-opacity-10 text-success rounded-pill">Realizadas</span>
          </div>
        </b-card>
      </div>

      <!-- Carrito -->
      <div class="col-6 col-lg-3">
        <b-card class="h-100 border-0 shadow-sm kpi-card">
          <div class="mb-2 text-muted small text-uppercase fw-bold tracking-wide">En Carrito</div>
          <div class="d-flex align-items-end justify-content-between">
            <h3 class="mb-0 fw-bold text-dark">{{ stats.itemsCarrito }}</h3>
            <span class="badge bg-info bg-opacity-10 text-info rounded-pill">Items</span>
          </div>
        </b-card>
      </div>

      <!-- Valor Carrito -->
      <div class="col-6 col-lg-3">
        <b-card class="h-100 border-0 shadow-sm kpi-card">
          <div class="mb-2 text-muted small text-uppercase fw-bold tracking-wide">Valor Total</div>
          <div class="d-flex align-items-end justify-content-between">
            <h3 class="mb-0 fw-bold text-dark">${{ stats.valorCarrito.toFixed(2) }}</h3>
            <span class="badge bg-warning bg-opacity-10 text-warning rounded-pill">USD</span>
          </div>
        </b-card>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="row">
      <div class="col-12">
        <b-card class="border-0 shadow-sm">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="fw-bold mb-0">🕒 Actividad Reciente</h5>
            <router-link to="/visitas" class="btn btn-sm btn-light text-primary fw-bold">
              Ver todo
            </router-link>
          </div>

          <!-- List View (Mobile & Desktop) -->
          <div class="activity-list">
            <div v-if="recentVisits.length === 0" class="text-center text-muted py-5">
              <div class="mb-3 opacity-50">
                <i class="bi bi-calendar-x fs-1"></i>
              </div>
              <p>No hay actividad reciente registrada</p>
            </div>

            <div v-else v-for="(visita, index) in recentVisits" :key="index"
              class="activity-item d-flex align-items-start py-3 border-bottom">
              <div class="activity-icon bg-light rounded-circle p-2 me-3 text-muted">
                <i class="bi bi-geo-alt"></i>
              </div>
              <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-start mb-1">
                  <h6 class="fw-bold mb-0 text-dark">{{ visita.lugar }}</h6>
                  <small class="text-muted">{{ formatearFecha(visita.fecha) }}</small>
                </div>
                <p class="text-muted small mb-0 text-truncate-2">
                  {{ visita.observacion || 'Sin observaciones' }}
                </p>
              </div>
            </div>
          </div>
        </b-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useCart } from "@/composables/useCart";

const { cartCount, cartTotal } = useCart();
const recentVisits = ref([]);

const stats = ref({
  totalProductos: 0,
  totalVisitas: 0,
  itemsCarrito: 0,
  valorCarrito: 0,
});

const fechaActual = computed(() => {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

const formatearFecha = (fechaISO) => {
  if (!fechaISO) return "-";
  const fecha = new Date(fechaISO);
  // Si es hoy, mostrar hora
  const hoy = new Date();
  if (fecha.toDateString() === hoy.toDateString()) {
    return `Hoy, ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return fecha.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
};

onMounted(() => {
  // Cargar datos de localStorage
  const productos = JSON.parse(localStorage.getItem("ListaProductos")) || [];
  const visitas = JSON.parse(localStorage.getItem("VisitasDiarias")) || [];

  // Calcular Stats
  stats.value.totalProductos = productos.length;
  stats.value.totalVisitas = visitas.length;
  stats.value.itemsCarrito = cartCount.value;
  stats.value.valorCarrito = cartTotal.value;

  if (visitas.length > 0) {
    // Get last 5 visits reversed
    recentVisits.value = [...visitas].reverse().slice(0, 5);
  }
});
</script>

<style scoped>
.dashboard-container {
  padding: 0.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Cards Styling */
.action-card {
  transition: all 0.3s ease;
  cursor: pointer;
  background: white;
}

.hover-lift:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05) !important;
}

.icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-card {
  background: white;
  transition: transform 0.2s;
}

.tracking-wide {
  letter-spacing: 0.05em;
}

/* Activity List */
.activity-item:last-child {
  border-bottom: 0 !important;
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Responsive Adjustments */
@media (min-width: 768px) {
  .dashboard-container {
    padding: 1.5rem;
  }
}
</style>
