<template>
  <div class="container-fluid py-4">
    <!-- Header -->
   <div class="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
      <div class="text-center text-md-start">
        <h2 class="fw-bold text-primary mb-1">📊 Estadísticas y Reportes</h2>
        <p class="text-muted mb-0 small">Análisis de ventas, cobros y actividad comercial</p>
      </div>
     <div class="d-flex align-items-center justify-content-center w-100 w-md-auto">
        <select v-model="periodoSeleccionado" class="form-select me-2" style="width: auto; min-width: 140px;">
          <option value="semana">Última Semana</option>
          <option value="mes">Último Mes</option>
          <option value="trimestre">Último Trimestre</option>
          <option value="año">Último Año</option>
        </select>
       <b-button variant="outline-success" size="sm" @click="exportarReporteExcel" class="text-nowrap">
          Excel Pro 📊
        </b-button>
      </div>
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

      <!-- Ventas vs Año Anterior -->
      <div class="col-12 col-lg-6">
        <b-card class="h-100 border-0 shadow-sm">
          <h5 class="fw-bold mb-3">⚖️ Crecimiento Anual (Ventas)</h5>
          <div class="chart-container">
            <Line :data="comparativaAnualChartData" :options="lineChartOptions" />
          </div>
          <div class="mt-2 text-center small text-muted">
            <span class="me-3">🔵 Año Actual</span>
            <span>⚪ Año Anterior</span>
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

    <!-- Tabla de Clientes con Saldo Pendiente -->
    <div class="row mt-4">
      <div class="col-12">
        <b-card class="border-0 shadow-sm">
          <h5 class="fw-bold mb-3">📋 Pedidos con Saldo Pendiente</h5>
          <div v-if="isLoading" class="text-center py-4">
            <b-spinner variant="primary"></b-spinner>
          </div>
          <div v-else-if="pedidosPendientes.length === 0" class="text-center py-4 bg-light rounded">
            <p class="text-muted mb-0">No hay pedidos con saldo pendiente</p>
          </div>
         <!-- Vista Desktop: Tabla -->
          <div class="d-none d-md-block table-responsive">
            <table class="table table-hover align-middle text-nowrap">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th class="text-end">Total</th>
                  <th class="text-end">Abonado</th>
                  <th class="text-end">Saldo</th>
                  <th class="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ped in pedidosPendientes" :key="ped.id">
                  <td>
                    <span class="text-muted small d-block">{{ formatearFecha(ped.fecha) }}</span>
                    <small class="text-primary font-monospace">#{{ ped.id.substring(0, 8) }}</small>
                  </td>
                  <td>
                    <span class="fw-bold">{{ ped.cliente }}</span>
                  </td>
                  <td class="text-end">${{ Number(ped.total).toFixed(2) }}</td>
                  <td class="text-end text-success">${{ Number(ped.abonado).toFixed(2) }}</td>
                  <td class="text-end fw-bold text-danger">
                    ${{ Number(ped.saldo).toFixed(2) }}
                  </td>
                  <td class="text-center">
                    <b-button variant="outline-primary" size="sm" @click="verEstadoCuenta(ped.cliente)"
                      title="Estado de Cuenta">
                      <BIconCardList />
                    </b-button>
                  </td>
                </tr>
              </tbody>
              <tfoot v-if="pedidosPendientes.length > 0" class="table-light">
                <tr class="fw-bold">
                  <td colspan="2">TOTAL PENDIENTE</td>
                  <td class="text-end">${{ totalPendienteCalc.total.toFixed(2) }}</td>
                  <td class="text-end text-success">${{ totalPendienteCalc.abonado.toFixed(2) }}</td>
                  <td class="text-end text-danger">${{ totalPendienteCalc.saldo.toFixed(2) }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <!-- Vista Móvil: Cards -->
          <div class="d-md-none">
            <div v-for="ped in pedidosPendientes" :key="'mobile-' + ped.id" class="mb-3">
              <b-card no-body class="border shadow-sm">
                <b-card-body class="p-3">
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 class="fw-bold mb-1 text-primary">{{ ped.cliente }}</h6>
                      <small class="text-muted d-block">
                        📅 {{ formatearFecha(ped.fecha) }}
                        <span class="font-monospace ms-1">#{{ ped.id.substring(0, 8) }}</span>
                      </small>
                    </div>
                    <b-button variant="outline-primary" size="sm" class="py-1 px-2"
                      @click="verEstadoCuenta(ped.cliente)">
                      <BIconCardList />
                    </b-button>
                  </div>

                  <hr class="my-2" />

                  <div class="d-flex justify-content-between mb-1">
                    <span class="text-muted small">Total Pedido:</span>
                    <span class="fw-bold">${{ Number(ped.total).toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-content-between mb-1">
                    <span class="text-muted small">Abonado:</span>
                    <span class="text-success">${{ Number(ped.abonado).toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                    <strong class="text-danger small text-uppercase">Saldo Pendiente</strong>
                    <strong class="text-danger fs-5">${{ Number(ped.saldo).toFixed(2) }}</strong>
                  </div>
                </b-card-body>
              </b-card>
            </div>

            <!-- Resumen Total Móvil -->
            <b-card v-if="pedidosPendientes.length > 0" bg-variant="light" class="border-0 shadow-sm mt-3">
              <h6 class="fw-bold mb-3 text-center border-bottom pb-2">RESUMEN GENERAL</h6>
              <div class="d-flex justify-content-between mb-1">
                <span>Total:</span>
                <strong>${{ totalPendienteCalc.total.toFixed(2) }}</strong>
              </div>
              <div class="d-flex justify-content-between mb-1">
                <span>Abonado:</span>
                <strong class="text-success">${{ totalPendienteCalc.abonado.toFixed(2) }}</strong>
              </div>
              <div class="d-flex justify-content-between mt-2 pt-2 border-top border-dark">
                <strong class="text-danger">TOTAL PENDIENTE</strong>
                <strong class="text-danger">${{ totalPendienteCalc.saldo.toFixed(2) }}</strong>
              </div>
            </b-card>
          </div>
        </b-card>
      </div>
    </div>

    <!-- Modal Estado de Cuenta -->
    <b-modal v-model="showEstadoCuentaModal" :title="'📑 Estado de Cuenta: ' + clienteDetalleNombre" size="lg"
      hide-footer>
      <div v-if="estadoCuentaData.length > 0" class="table-responsive">
        <table class="table table-sm table-hover border">
          <thead class="bg-light">
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Ref</th>
              <th class="text-end">Debe (+)</th>
              <th class="text-end">Haber (-)</th>
              <th class="text-end">Saldo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(mov, idx) in estadoCuentaData" :key="idx">
              <td>{{ formatearFecha(mov.fecha) }}</td>
              <td><small>{{ mov.tipo }}</small></td>
              <td><small class="text-muted">{{ mov.referencia }}</small></td>
              <td class="text-end">{{ mov.debe > 0 ? '$' + mov.debe.toFixed(2) : '-' }}</td>
              <td class="text-end text-success">{{ mov.haber > 0 ? '$' + mov.haber.toFixed(2) : '-' }}</td>
              <td class="text-end fw-bold" :class="mov.saldo > 0 ? 'text-danger' : 'text-dark'">
                ${{ mov.saldo.toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>
        <div class="d-flex justify-content-end mt-3">
          <b-button variant="primary" size="sm" @click="descargarPDFEstadoCuenta">
            📥 Descargar PDF
          </b-button>
        </div>
      </div>
      <div v-else class="text-center py-5">
        <p class="text-muted">Cargando movimientos...</p>
      </div>
    </b-modal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

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
import { usePDFGenerator } from '@/utils/pdfGenerator';
import { useToast } from 'vue-toastification';
import { useHistorial } from '@/composables/useHistorial';
import { useCobros } from '@/composables/useCobros';
import { useVisitas } from '@/composables/useVisitas';
import { BIconCardList, BIconFileEarmarkPdf } from 'bootstrap-icons-vue';

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
  getKPIs,
  getSaldosPendientes,
  getPedidosPendientes,
  getEstadoCuenta,
  getComparativaAnual,
  getResumenGeneral
} = useEstadisticas();

const { documents } = useHistorial();
const { cobros } = useCobros();
const { visitas } = useVisitas();

const { generatePDFFromData } = usePDFGenerator();
const toast = useToast();

const periodoSeleccionado = ref('mes');
const isLoading = ref(true);

// Initial State
const kpis = ref({
  totalVentas: 0,
  totalCobrado: 0,
  totalPedidos: 0,
  totalVisitas: 0,
  promedioVenta: 0,
  tasaConversion: 0
});

const estadisticasVentas = ref({ labels: [], data: [], total: 0 });
const estadisticasProductos = ref({ labels: [], data: [] });
const estadisticasCobros = ref({ labels: [], data: [], counts: [], total: 0 });
const estadisticasVisitas = ref({ labels: [], data: [], total: 0 });
const saldosPendientes = ref([]); // Kept for potential other uses, but not for the table
const pedidosPendientes = ref([]);
const comparativaAnualData = ref({ labels: [], actual: [], anterior: [] });

const showEstadoCuentaModal = ref(false);
const clienteDetalleNombre = ref('');
const estadoCuentaData = ref([]);

// Computed para sumar totales de pedidos pendientes
const totalPendienteCalc = computed(() => {
  return pedidosPendientes.value.reduce((acc, p) => ({
    total: acc.total + p.total,
    abonado: acc.abonado + p.abonado,
    saldo: acc.saldo + p.saldo
  }), { total: 0, abonado: 0, saldo: 0 });
});

// Load Data Function
const loadData = async () => {
  isLoading.value = true;
  try {
    const periodo = periodoSeleccionado.value;

    // Fetch all in parallel
    const [kpiData, ventasData, prodData, cobrosData, visitasData] = await Promise.all([
      getKPIs(periodo),
      getEstadisticasVentas(periodo),
      getTopProductos(periodo),
      getEstadisticasCobros(periodo),
      getEstadisticasVisitas(periodo)
    ]);

    kpis.value = kpiData;
    estadisticasVentas.value = ventasData;
    estadisticasProductos.value = prodData;
    estadisticasCobros.value = cobrosData;
    estadisticasVisitas.value = visitasData;

    // Cargar comparativa anual
    const compData = await getComparativaAnual();
    comparativaAnualData.value = compData;

    // Cargar saldos pendientes (sin filtro de periodo)
    const saldosData = await getSaldosPendientes();
    saldosPendientes.value = saldosData;

    // Cargar pedidos pendientes (NUEVO)
    const pPendientes = await getPedidosPendientes();
    pedidosPendientes.value = pPendientes;

  } catch (e) {
    console.error('Error loading dashboard data:', e);
    toast.error('Error al cargar datos');
  } finally {
    isLoading.value = false;
  }
};

// Watchers and lifecycle
watch([periodoSeleccionado, documents, cobros, visitas], () => {
  loadData();
}, { deep: true });

onMounted(() => {
  window.addEventListener('resize', handleResize);
  loadData();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// Windows Size Reactivity
const windowWidth = ref(window.innerWidth);
const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

// Configuración de gráficos responsivos
const responsiveOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: windowWidth.value < 768 ? 1.2 : 2,
  plugins: {
    legend: {
      display: true,
      position: windowWidth.value < 768 ? 'bottom' : 'top',
      labels: {
        boxWidth: 12,
        padding: 10,
        font: {
          size: windowWidth.value < 768 ? 10 : 12
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
          size: windowWidth.value < 768 ? 9 : 11
        },
        maxRotation: 45,
        minRotation: 45
      }
    },
    y: {
      ticks: {
        font: {
          size: windowWidth.value < 768 ? 9 : 11
        }
      }
    }
  }
}));

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

// Datos para comparativa anual (2 líneas)
const comparativaAnualChartData = computed(() => ({
  labels: comparativaAnualData.value.labels,
  datasets: [
    {
      label: 'Año Actual',
      data: comparativaAnualData.value.actual,
      borderColor: '#0d6efd',
      backgroundColor: 'rgba(13, 110, 253, 0.1)',
      borderWidth: 3,
      tension: 0.1,
      fill: false
    },
    {
      label: 'Año Anterior',
      data: comparativaAnualData.value.anterior,
      borderColor: '#dee2e6',
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderDash: [5, 5],
      tension: 0.1,
      fill: false
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
  ...responsiveOptions.value,
  plugins: {
    ...responsiveOptions.value.plugins,
    legend: {
      ...responsiveOptions.value.plugins.legend,
      display: false
    }
  }
}));

const barChartOptions = computed(() => ({
  ...responsiveOptions.value,
  plugins: {
    ...responsiveOptions.value.plugins,
    legend: {
      ...responsiveOptions.value.plugins.legend,
      display: false
    }
  }
}));

const doughnutChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: windowWidth.value < 768 ? 1.5 : 2,
  plugins: {
    legend: {
      display: true,
      position: windowWidth.value < 768 ? 'bottom' : 'right',
      labels: {
        boxWidth: 12,
        padding: 10,
        font: {
          size: windowWidth.value < 768 ? 10 : 12
        }
      }
    },
    tooltip: {
      enabled: true,
      callbacks: {
        label: function (context) {
          const label = context.label || '';
          const value = context.parsed || 0;
          return `${label}: $${value.toFixed(2)}`;
        }
      }
    }
  }
}));

// Funciones para Estado de Cuenta
const verEstadoCuenta = async (cliente) => {
  clienteDetalleNombre.value = cliente;
  estadoCuentaData.value = [];
  showEstadoCuentaModal.value = true;

  try {
    const data = await getEstadoCuenta(cliente);
    estadoCuentaData.value = data;
  } catch (e) {
    console.error('Error al cargar estado de cuenta:', e);
  }
};

const formatearFecha = (f) => {
  if (!f) return '-';
  const d = new Date(f);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const descargarPDFEstadoCuenta = () => {
  const dataForPDF = estadoCuentaData.value.map(mov => ({
    Fecha: formatearFecha(mov.fecha),
    Tipo: mov.tipo,
    Referencia: mov.referencia,
    Debe: mov.debe > 0 ? `$${mov.debe.toFixed(2)}` : '-',
    Haber: mov.haber > 0 ? `$${mov.haber.toFixed(2)}` : '-',
    Saldo: `$${mov.saldo.toFixed(2)}`
  }));

  generatePDFFromData(dataForPDF, `Estado_Cuenta_${clienteDetalleNombre.value}.pdf`, {
    title: 'Estado de Cuenta del Cliente',
    subtitle: `Cliente: ${clienteDetalleNombre.value} | Generado: ${new Date().toLocaleDateString()}`
  });
};

const exportarReporteExcel = async () => {
  try {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();

    // 1. Obtener datos detallados
    const resumen = await getResumenGeneral();
    const clientesTodo = await getSaldosPendientes(false);

    // --- HOJA DE RESUMEN ---
    const sheetKpi = workbook.addWorksheet('Resumen General');

    sheetKpi.columns = [
      { header: 'Concepto', key: 'concepto', width: 35 },
      { header: 'Monto', key: 'monto', width: 22 }
    ];

    // Estilo encabezado
    sheetKpi.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D6EFD' } }; // Azul Primary
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });

    const kpiRows = [
      { concepto: 'Ventas Totales', monto: Number(resumen.totalVentas.toFixed(2)) },
      { concepto: 'Total Abonos (Cobros)', monto: Number(resumen.totalAbonos.toFixed(2)) },
      { concepto: 'Saldos Pendientes', monto: Number(resumen.totalSaldos.toFixed(2)) },
      { concepto: 'TOTAL GENERAL', monto: Number(resumen.totalGeneral.toFixed(2)) }
    ];

    kpiRows.forEach(data => {
      const row = sheetKpi.addRow(data);
      if (data.concepto === 'TOTAL GENERAL') row.font = { bold: true, size: 11 };
      row.getCell('monto').numFmt = '"$"#,##0.00';
      row.eachCell(cell => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { vertical: 'middle' };
      });
    });

    // --- HOJA DE DETALLE DE CLIENTES ---
    const sheetDetalle = workbook.addWorksheet('Reporte Detallado');

    sheetDetalle.columns = [
      { header: 'Nombre del Cliente', key: 'cliente', width: 45 },
      { header: 'Ventas Totales', key: 'ventas', width: 18 },
      { header: 'Total Abonos', key: 'abonos', width: 18 },
      { header: 'Saldo Pendiente', key: 'saldo', width: 18 }
    ];

    // Estilo encabezado
    sheetDetalle.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF198754' } }; // Verde Success
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    clientesTodo.forEach(c => {
      const row = sheetDetalle.addRow({
        cliente: c.cliente,
        ventas: Number(c.ventas.toFixed(2)),
        abonos: Number(c.abonos.toFixed(2)),
        saldo: Number(c.saldo.toFixed(2))
      });

      row.getCell('cliente').alignment = { wrapText: true, vertical: 'middle' };
      row.getCell('ventas').numFmt = '"$"#,##0.00';
      row.getCell('abonos').numFmt = '"$"#,##0.00';
      row.getCell('saldo').numFmt = '"$"#,##0.00';

      if (c.saldo > 0.01) {
        row.getCell('saldo').font = { color: { argb: 'FFFF0000' }, bold: true };
      }

      row.eachCell(cell => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { vertical: 'middle' };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Reporte_General_Farmacia_${new Date().toISOString().split('T')[0]}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);

  } catch (e) {
    console.error('Error al exportar Excel detallado:', e);
  }
};
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
.spin {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>
