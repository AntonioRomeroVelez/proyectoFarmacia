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

    <!-- Eventos de Hoy -->
    <div class="row mb-4">
      <div class="col-12 col-lg-6">
        <b-card class="border-0 shadow-sm h-100">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-bold mb-0">📅 Eventos de Hoy</h5>
            <router-link to="/agenda" class="btn btn-sm btn-light text-primary fw-bold">
              Ver Agenda
            </router-link>
          </div>

          <div v-if="eventosHoy.length === 0" class="text-center text-muted py-4">
            <i class="bi bi-calendar-check fs-1 opacity-50"></i>
            <p class="mb-0 mt-2">No tienes eventos programados para hoy</p>
          </div>

          <div v-else class="list-group list-group-flush">
            <div v-for="evento in eventosHoy" :key="evento.id" class="list-group-item px-0 border-bottom"
              :class="{ 'opacity-50': evento.completada }">
              <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                  <h6 class="mb-1" :class="{ 'text-decoration-line-through': evento.completada }">
                    {{ evento.titulo }}
                  </h6>
                  <small class="text-muted">{{ evento.descripcion }}</small>
                  <div class="mt-1">
                    <span class="badge bg-primary me-1">{{ evento.tipo }}</span>
                    <span v-if="evento.completada" class="badge bg-success">✓ Hecho</span>
                    <span v-else class="badge bg-warning text-dark">Pendiente</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </b-card>
      </div>

      <div class="col-12 col-lg-6">
        <b-card class="border-0 shadow-sm h-100">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-bold mb-0">💰 Cobros de Hoy</h5>
            <router-link to="/cobros" class="btn btn-sm btn-light text-primary fw-bold">
              Ver Cobros
            </router-link>
          </div>

          <div v-if="cobrosHoy.length === 0" class="text-center text-muted py-4">
            <i class="bi bi-cash-coin fs-1 opacity-50"></i>
            <p class="mb-0 mt-2">No hay cobros registrados hoy</p>
          </div>

          <div v-else>
            <div class="mb-3 p-3 bg-success bg-opacity-10 rounded text-center">
              <small class="text-muted d-block mb-1">Total Cobrado Hoy</small>
              <h3 class="mb-0 text-success fw-bold">${{ totalCobrosHoy.toFixed(2) }}</h3>
              <small class="text-muted">{{ cobrosHoy.length }} cobro(s)</small>
            </div>

            <div class="list-group list-group-flush" style="max-height: 200px; overflow-y: auto;">
              <div v-for="cobro in cobrosHoy.slice(0, 5)" :key="cobro.id" class="list-group-item px-0 border-bottom">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-0">{{ cobro.cliente }}</h6>
                    <small class="text-muted">{{ cobro.tipo }} - {{ cobro.metodoPago }}</small>
                  </div>
                  <span class="fw-bold text-success">${{ Number(cobro.cantidad).toFixed(2) }}</span>
                </div>
              </div>
            </div>
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
import { useAgenda } from "@/composables/useAgenda";
import { useCobros } from "@/composables/useCobros";

const { cartCount, cartTotal } = useCart();
const { getEventosPorFecha } = useAgenda();
const { cobros, getTotalCobros } = useCobros();

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

// Eventos de hoy
const eventosHoy = computed(() => {
  const hoy = new Date().toISOString().split('T')[0];
  return getEventosPorFecha(hoy);
});

// Cobros de hoy
const cobrosHoy = computed(() => {
  const hoy = new Date().toISOString().split('T')[0];
  return cobros.value.filter(c => c.fecha === hoy);
});

const totalCobrosHoy = computed(() => {
  return getTotalCobros(cobrosHoy.value);
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
