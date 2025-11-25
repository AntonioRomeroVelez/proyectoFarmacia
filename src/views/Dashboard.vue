<template>
  <div class="container-fluid py-4 text-center">


    <!-- KPI Cards -->
    <div class="col-12 row g-3 mb-4 text-center">
      <!-- Total Productos -->
      <div class="col-12 col-sm-12 col-xl-3">
        <b-card class="h-100 border-0 shadow-sm kpi-card bg-primary text-white">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="mb-2 opacity-75">Total Productos</h6>
              <h3 class="mb-0 fw-bold">{{ stats.totalProductos }}</h3>
            </div>
            <div class="icon-box bg-white bg-opacity-25 rounded-circle p-3">
              <span class="fs-4">📦</span>
            </div>
          </div>
          <div class="mt-3 small opacity-75">
            {{ stats.productosNuevos }} nuevos esta semana
          </div>
        </b-card>
      </div>

      <!-- Visitas -->
      <div class="col-12 col-sm-12 col-xl-3">
        <b-card class="h-100 border-0 shadow-sm kpi-card bg-success text-white">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="mb-2 opacity-75">Visitas Realizadas</h6>
              <h3 class="mb-0 fw-bold">{{ stats.totalVisitas }}</h3>
            </div>
            <div class="icon-box bg-white bg-opacity-25 rounded-circle p-3">
              <span class="fs-4">📍</span>
            </div>
          </div>
          <div class="mt-3 small opacity-75">
            Última: {{ stats.ultimaVisitaFecha }}
          </div>
        </b-card>
      </div>

      <!-- Carrito -->
      <div class="col-12 col-sm-12 col-xl-3">
        <b-card class="h-100 border-0 shadow-sm kpi-card bg-info text-white">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="mb-2 opacity-75">En Carrito</h6>
              <h3 class="mb-0 fw-bold">{{ stats.itemsCarrito }} Items</h3>
            </div>
            <div class="icon-box bg-white bg-opacity-25 rounded-circle p-3">
              <span class="fs-4">🛒</span>
            </div>
          </div>
          <div class="mt-3 small opacity-75">
            Valor: ${{ stats.valorCarrito.toFixed(2) }}
          </div>
        </b-card>
      </div>
    </div>



    <!-- Recent Activity -->
    <div class="row">
      <div class="col-12">
        <b-card class="shadow-sm border-0">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="card-title mb-0">🕒 Actividad Reciente (Visitas)</h5>
            <router-link to="/visitas" class="text-decoration-none small">Ver todas →</router-link>
          </div>

          <!-- Desktop: Table view -->
          <div class="table-responsive d-none d-md-block">
            <table class="table table-hover align-middle">
              <thead class="table-light">
                <tr>
                  <th>Fecha</th>
                  <th>Lugar</th>
                  <th>Observación</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(visita, index) in recentVisits" :key="index">
                  <td>{{ formatearFecha(visita.fecha) }}</td>
                  <td class="fw-bold">{{ visita.lugar }}</td>
                  <td class="text-muted text-truncate" style="max-width: 300px;">{{ visita.observacion }}</td>
                  <td><b-badge variant="success" pill>Completada</b-badge></td>
                </tr>
                <tr v-if="recentVisits.length === 0">
                  <td colspan="4" class="text-center text-muted py-3">
                    No hay actividad reciente
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile: Card view -->
          <div class="d-block d-md-none">
            <div v-if="recentVisits.length === 0" class="text-center text-muted py-4">
              No hay actividad reciente
            </div>
            <div v-else class="mobile-cards">
              <b-card v-for="(visita, index) in recentVisits" :key="index" class="mb-3 visit-card">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div class="flex-grow-1">
                    <div class="text-muted small mb-1">📅 {{ formatearFecha(visita.fecha) }}</div>
                    <h6 class="fw-bold mb-1">{{ visita.lugar }}</h6>
                    <p class="text-muted small mb-2">{{ visita.observacion }}</p>
                  </div>
                  <b-badge variant="success" pill class="ms-2">Completada</b-badge>
                </div>
              </b-card>
            </div>
          </div>
        </b-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'vue-chartjs';
import { useCart } from '@/composables/useCart';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const { cartCount, cartTotal } = useCart();
const loaded = ref(false);
const recentVisits = ref([]);

const stats = ref({
  totalProductos: 0,
  productosNuevos: 0, // Simulado o calculado si hubiera fecha
  totalVisitas: 0,
  ultimaVisitaFecha: '-',
  itemsCarrito: 0,
  valorCarrito: 0,
  errores: 0
});

// Chart Data Refs
const barChartData = ref({
  labels: [],
  datasets: []
});

const doughnutChartData = ref({
  labels: [],
  datasets: []
});

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: { beginAtZero: true }
  }
};

const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' }
  }
};

const formatearFecha = (fechaISO) => {
  if (!fechaISO) return '-';
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
  // Cargar datos de localStorage
  const productos = JSON.parse(localStorage.getItem('ListaProductos')) || [];
  const visitas = JSON.parse(localStorage.getItem('VisitasDiarias')) || [];

  // Calcular Stats
  stats.value.totalProductos = productos.length;
  stats.value.totalVisitas = visitas.length;
  stats.value.itemsCarrito = cartCount.value;
  stats.value.valorCarrito = cartTotal.value;

  // Contar errores (productos con campos faltantes o inválidos)
  // Usamos una lógica simple similar a ExcelHandler
  stats.value.errores = productos.filter(p => !p.Marca || !p.NombreProducto || isNaN(p.PrecioFarmacia)).length;

  if (visitas.length > 0) {
    const last = visitas[visitas.length - 1];
    stats.value.ultimaVisitaFecha = formatearFecha(last.fecha).split(',')[0];
    // Get last 5 visits reversed
    recentVisits.value = [...visitas].reverse().slice(0, 5);
  }

  // Preparar datos para gráficos
  prepareCharts(productos);
  loaded.value = true;
});

const prepareCharts = (productos) => {
  // 1. Top Marcas
  const marcasCount = {};
  productos.forEach(p => {
    const marca = p.Marca || 'Sin Marca';
    marcasCount[marca] = (marcasCount[marca] || 0) + 1;
  });

  const sortedMarcas = Object.entries(marcasCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  barChartData.value = {
    labels: sortedMarcas.map(m => m[0]),
    datasets: [{
      label: 'Productos',
      backgroundColor: ['#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545'],
      data: sortedMarcas.map(m => m[1]),
      borderRadius: 6
    }]
  };

  // 2. Estado Productos (Simulado basado en validación simple)
  const validos = productos.length - stats.value.errores;
  const errores = stats.value.errores;
  // Asumimos duplicados si hubiera flag, por ahora simple

  doughnutChartData.value = {
    labels: ['Válidos', 'Con Errores'],
    datasets: [{
      backgroundColor: ['#198754', '#dc3545'],
      data: [validos, errores]
    }]
  };
};
</script>

<style scoped>
.kpi-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
}

.kpi-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

.icon-box {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Mobile visit cards */
.visit-card {
  border-left: 4px solid #28a745;
  transition: transform 0.2s, box-shadow 0.2s;
}

.visit-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .container-fluid {
    padding: 0.75rem;
  }
}

@media (max-width: 576px) {
  .container-fluid {
    padding: 0.5rem;
  }

  /* Stack buttons */
  .d-flex.gap-2 {
    flex-direction: column;
  }

  .d-flex.gap-2 a,
  .d-flex.gap-2 .btn {
    width: 100%;
  }
}
</style>
