<template>
  <div class="container-fluid py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold text-primary mb-1">📊 Estadísticas y Reportes</h2>
        <p class="text-muted mb-0 small">Análisis de ventas, cobros y actividad comercial</p>
      </div>
      <select v-model="periodoSeleccionado" class="form-select" style="width: auto;">
        <option value="semana">Última Semana</option>
        <option value="mes">Último Mes</option>
        <option value="trimestre">Último Trimestre</option>
        <option value="año">Último Año</option>
      </select>
    </div>

    <!-- KPIs -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-md-3">
        <b-card class="h-100 border-0 shadow-sm kpi-card">
          <div class="mb-2 text-muted small text-uppercase fw-bold">Ventas Totales</div>
          <h3 class="mb-0 fw-bold text-success">${{ kpis.totalVentas.toFixed(2) }}</h3>
          <small class="text-muted">{{ kpis.totalPedidos }} pedidos</small>
        </b-card>
      </div>
      <div class="col-6 col-md-3">
        <b-card class="h-100 border-0 shadow-sm kpi-card">
          <div class="mb-2 text-muted small text-uppercase fw-bold">Total Cobrado</div>
          <h3 class="mb-0 fw-bold text-primary">${{ kpis.totalCobrado.toFixed(2) }}</h3>
          <small class="text-muted">En el período</small>
        </b-card>
      </div>
      <div class="col-6 col-md-3">
        <b-card class="h-100 border-0 shadow-sm kpi-card">
          <div class="mb-2 text-muted small text-uppercase fw-bold">Promedio Venta</div>
          <h3 class="mb-0 fw-bold text-info">${{ kpis.promedioVenta.toFixed(2) }}</h3>
          <small class="text-muted">Por pedido</small>
        </b-card>
      </div>
      <div class="col-6 col-md-3">
        <b-card class="h-100 border-0 shadow-sm kpi-card">
          <div class="mb-2 text-muted small text-uppercase fw-bold">Visitas</div>
          <h3 class="mb-0 fw-bold text-warning">{{ kpis.totalVisitas }}</h3>
          <small class="text-muted">{{ kpis.tasaConversion.toFixed(1) }}% conversión</small>
        </b-card>
      </div>
    </div>

    <!-- Gráficos -->
    <div class="row g-4">
      <!-- Ventas en el Tiempo -->
      <div class="col-12 col-lg-6">
        <b-card class="h-100 border-0 shadow-sm">
          <h5 class="fw-bold mb-3">📈 Ventas en el Tiempo</h5>
          <div class="chart-container">
            <Line :data="ventasChartData" :options="lineChartOptions" />
          </div>
        </b-card>
      </div>

      <!-- Top Productos -->
      <div class="col-12 col-lg-6">
        <b-card class="h-100 border-0 shadow-sm">
          <h5 class="fw-bold mb-3">🏆 Top 10 Productos</h5>
          <div class="chart-container">
            <Bar :data="productosChartData" :options="barChartOptions" />
          </div>
        </b-card>
      </div>

      <!-- Distribución de Cobros -->
      <div class="col-12 col-lg-6">
        <b-card class="h-100 border-0 shadow-sm">
          <h5 class="fw-bold mb-3">💰 Distribución de Cobros</h5>
          <div class="chart-container">
            <Doughnut :data="cobrosChartData" :options="doughnutChartOptions" />
          </div>
          <div class="mt-3 text-center">
            <small class="text-muted">
              Total: ${{ estadisticasCobros.total.toFixed(2) }}
            </small>
          </div>
        </b-card>
      </div>

      <!-- Visitas por Período -->
      <div class="col-12 col-lg-6">
        <b-card class="h-100 border-0 shadow-sm">
          <h5 class="fw-bold mb-3">📅 Visitas por Período</h5>
          <div class="chart-container">
            <Bar :data="visitasChartData" :options="barChartOptions" />
          </div>
        </b-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Line, Bar, Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useEstadisticas } from '@/composables/useEstadisticas';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const {
  getEstadisticasVentas,
  getTopProductos,
  getEstadisticasCobros,
  getEstadisticasVisitas,
  getKPIs
} = useEstadisticas();

const periodoSeleccionado = ref('mes');

// KPIs
const kpis = computed(() => getKPIs(periodoSeleccionado.value));

// Estadísticas de ventas
const estadisticasVentas = computed(() => getEstadisticasVentas(periodoSeleccionado.value));
const estadisticasProductos = computed(() => getTopProductos(periodoSeleccionado.value));
const estadisticasCobros = computed(() => getEstadisticasCobros(periodoSeleccionado.value));
const estadisticasVisitas = computed(() => getEstadisticasVisitas(periodoSeleccionado.value));

// Configuración de gráficos responsivos
const responsiveOptions = {
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: window.innerWidth < 768 ? 1.2 : 2,
  plugins: {
    legend: {
      display: true,
      position: window.innerWidth < 768 ? 'bottom' : 'top',
      labels: {
        boxWidth: 12,
        padding: 10,
        font: {
          size: window.innerWidth < 768 ? 10 : 12
        }
      }
    },
    tooltip: {
      enabled: true,
      mode: 'index',
      intersect: false
    }
  },
  scales: {
    x: {
      ticks: {
        font: {
          size: window.innerWidth < 768 ? 9 : 11
        },
        maxRotation: 45,
        minRotation: 45
      }
    },
    y: {
      ticks: {
        font: {
          size: window.innerWidth < 768 ? 9 : 11
        }
      }
    }
  }
};

// Datos para gráfico de ventas (línea)
const ventasChartData = computed(() => ({
  labels: estadisticasVentas.value.labels,
  datasets: [
    {
      label: 'Ventas ($)',
      data: estadisticasVentas.value.data,
      borderColor: '#0d6efd',
      backgroundColor: 'rgba(13, 110, 253, 0.1)',
      fill: true,
      tension: 0.4
    }
  ]
}));

// Datos para gráfico de productos (barras)
const productosChartData = computed(() => ({
  labels: estadisticasProductos.value.labels,
  datasets: [
    {
      label: 'Cantidad Vendida',
      data: estadisticasProductos.value.data,
      backgroundColor: '#198754',
      borderColor: '#146c43',
      borderWidth: 1
    }
  ]
}));

// Datos para gráfico de cobros (dona)
const cobrosChartData = computed(() => ({
  labels: estadisticasCobros.value.labels,
  datasets: [
    {
      data: estadisticasCobros.value.data,
      backgroundColor: ['#0dcaf0', '#ffc107'],
      borderColor: ['#0aa2c0', '#cc9a06'],
      borderWidth: 2
    }
  ]
}));

// Datos para gráfico de visitas (barras)
const visitasChartData = computed(() => ({
  labels: estadisticasVisitas.value.labels,
  datasets: [
    {
      label: 'Visitas',
      data: estadisticasVisitas.value.data,
      backgroundColor: '#fd7e14',
      borderColor: '#ca6510',
      borderWidth: 1
    }
  ]
}));

// Opciones específicas por tipo de gráfico
const lineChartOptions = computed(() => ({
  ...responsiveOptions,
  plugins: {
    ...responsiveOptions.plugins,
    legend: {
      ...responsiveOptions.plugins.legend,
      display: false
    }
  }
}));

const barChartOptions = computed(() => ({
  ...responsiveOptions,
  plugins: {
    ...responsiveOptions.plugins,
    legend: {
      ...responsiveOptions.plugins.legend,
      display: false
    }
  }
}));

const doughnutChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: window.innerWidth < 768 ? 1.5 : 2,
  plugins: {
    legend: {
      display: true,
      position: window.innerWidth < 768 ? 'bottom' : 'right',
      labels: {
        boxWidth: 12,
        padding: 10,
        font: {
          size: window.innerWidth < 768 ? 10 : 12
        }
      }
    },
    tooltip: {
      enabled: true,
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.parsed || 0;
          return `${label}: $${value.toFixed(2)}`;
        }
      }
    }
  }
}));
</script>

<style scoped>
.kpi-card {
  background: white;
  transition: transform 0.2s;
}

.kpi-card:hover {
  transform: translateY(-3px);
}

.chart-container {
  position: relative;
  width: 100%;
  min-height: 250px;
}

@media (max-width: 768px) {
  .chart-container {
    min-height: 200px;
  }
  
  .kpi-card h3 {
    font-size: 1.5rem;
  }
  
  .kpi-card small {
    font-size: 0.7rem;
  }
}
</style>
