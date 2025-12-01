<template>
  <div class="container-fluid py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold text-primary mb-1">💰 Registro de Cobros</h2>
        <p class="text-muted mb-0 small">Gestiona los pagos recibidos</p>
      </div>
      <b-button variant="danger" @click="exportarPDF" :disabled="cobros.length === 0">
        📄 Exportar PDF
      </b-button>
    </div>

    <!-- Formulario de Registro -->
    <b-card class="shadow-sm mb-4">
      <h5 class="mb-3">➕ Registrar Nuevo Cobro</h5>
      <b-form @submit.prevent="registrarCobro">
        <b-row>
          <b-col md="6">
            <b-form-group label="Cliente:" label-for="cliente">
              <b-form-input id="cliente" v-model="formulario.cliente" placeholder="Nombre del cliente"
                required></b-form-input>
            </b-form-group>
          </b-col>

          <b-col md="3">
            <b-form-group label="Fecha:" label-for="fecha">
              <b-form-input id="fecha" v-model="formulario.fecha" type="date" required></b-form-input>
            </b-form-group>
          </b-col>

          <b-col md="3">
            <b-form-group label="Cantidad:" label-for="cantidad">
              <b-form-input id="cantidad" v-model.number="formulario.cantidad" type="number" step="0.01"
                placeholder="0.00" required></b-form-input>
            </b-form-group>
          </b-col>

          <b-col md="3">
            <b-form-group label="Tipo:" label-for="tipo">
              <b-form-select id="tipo" v-model="formulario.tipo" required>
                <option value="Abono">Abono</option>
                <option value="Cancelación Total">Cancelación Total</option>
              </b-form-select>
            </b-form-group>
          </b-col>

          <b-col md="3">
            <b-form-group label="Método de Pago:" label-for="metodoPago">
              <b-form-select id="metodoPago" v-model="formulario.metodoPago" required>
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Cheque">Cheque</option>
                <option value="Otro">Otro</option>
              </b-form-select>
            </b-form-group>
          </b-col>

          <b-col md="3">
            <b-form-group label="Nº Factura:" label-for="numeroFactura">
              <b-form-input id="numeroFactura" v-model="formulario.numeroFactura"
                placeholder="001-001-000123"></b-form-input>
            </b-form-group>
          </b-col>

          <b-col md="3">
            <b-form-group label="Nº Recibo:" label-for="numeroRecibo">
              <b-form-input id="numeroRecibo" v-model="formulario.numeroRecibo" placeholder="REC-001"></b-form-input>
            </b-form-group>
          </b-col>

          <b-col md="12">
            <b-form-group label="Observaciones:" label-for="observaciones">
              <b-form-textarea id="observaciones" v-model="formulario.observaciones" placeholder="Notas adicionales..."
                rows="2"></b-form-textarea>
            </b-form-group>
          </b-col>
        </b-row>

        <div class="d-flex gap-2">
          <b-button type="submit" variant="primary">
            💾 Guardar Cobro
          </b-button>
          <b-button variant="outline-secondary" @click="limpiarFormulario">
            ✖ Limpiar
          </b-button>
        </div>
      </b-form>
    </b-card>

    <!-- Filtros y Resumen -->
    <b-card class="shadow-sm mb-4">
      <b-row class="align-items-end">
        <b-col md="3">
          <b-form-group label="Fecha Inicio:" label-for="filtroInicio">
            <b-form-input id="filtroInicio" v-model="filtros.fechaInicio" type="date"></b-form-input>
          </b-form-group>
        </b-col>

        <b-col md="3">
          <b-form-group label="Fecha Fin:" label-for="filtroFin">
            <b-form-input id="filtroFin" v-model="filtros.fechaFin" type="date"></b-form-input>
          </b-form-group>
        </b-col>

        <b-col md="2">
          <b-form-group label="Tipo:" label-for="filtroTipo">
            <b-form-select id="filtroTipo" v-model="filtros.tipo">
              <option value="">Todos</option>
              <option value="Abono">Abono</option>
              <option value="Cancelación Total">Cancelación Total</option>
            </b-form-select>
          </b-form-group>
        </b-col>

        <b-col md="2">
          <b-form-group label="Método:" label-for="filtroMetodo">
            <b-form-select id="filtroMetodo" v-model="filtros.metodoPago">
              <option value="">Todos</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Cheque">Cheque</option>
              <option value="Otro">Otro</option>
            </b-form-select>
          </b-form-group>
        </b-col>

        <b-col md="2">
          <b-button variant="outline-secondary" class="w-100" @click="limpiarFiltros">
            Limpiar Filtros
          </b-button>
        </b-col>
      </b-row>

      <div class="mt-3 p-3 bg-light rounded">
        <div class="row text-center">
          <div class="col-6 col-md-3">
            <small class="text-muted d-block">Total Cobros</small>
            <h4 class="mb-0 text-primary">{{ cobrosFiltrados.length }}</h4>
          </div>
          <div class="col-6 col-md-3">
            <small class="text-muted d-block">Monto Total</small>
            <h4 class="mb-0 text-success">${{ totalFiltrado.toFixed(2) }}</h4>
          </div>
          <div class="col-6 col-md-3">
            <small class="text-muted d-block">Abonos</small>
            <h4 class="mb-0 text-info">{{ contarPorTipo('Abono') }}</h4>
          </div>
          <div class="col-6 col-md-3">
            <small class="text-muted d-block">Cancelaciones</small>
            <h4 class="mb-0 text-warning">{{ contarPorTipo('Cancelación Total') }}</h4>
          </div>
        </div>
      </div>
    </b-card>

    <!-- Tabla de Cobros (Desktop) -->
    <b-card v-if="cobrosFiltrados.length > 0" class="shadow-sm d-none d-md-block">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">📋 Lista de Cobros ({{ cobrosFiltrados.length }})</h5>
        <b-button variant="outline-danger" size="sm" @click="confirmarBorrarTodos">
          🗑️ Borrar Todos
        </b-button>
      </div>

      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Cantidad</th>
              <th>Tipo</th>
              <th>Método</th>
              <th>Nº Factura</th>
              <th>Nº Recibo</th>
              <th>Observaciones</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cobro in cobrosFiltrados" :key="cobro.id">
              <td>{{ formatearFecha(cobro.fecha) }}</td>
              <td class="fw-medium">{{ cobro.cliente }}</td>
              <td class="fw-bold text-success">${{ Number(cobro.cantidad).toFixed(2) }}</td>
              <td>
                <span :class="getTipoBadgeClass(cobro.tipo)" class="badge">
                  {{ cobro.tipo }}
                </span>
              </td>
              <td>
                <span class="badge bg-secondary">{{ cobro.metodoPago }}</span>
              </td>
              <td><small>{{ cobro.numeroFactura || '-' }}</small></td>
              <td><small>{{ cobro.numeroRecibo || '-' }}</small></td>
              <td><small class="text-muted">{{ cobro.observaciones || '-' }}</small></td>
              <td class="text-end">
                <b-button variant="outline-danger" size="sm" @click="confirmarEliminar(cobro)">
                  🗑️
                </b-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </b-card>

    <!-- Vista Móvil (Cards) -->
    <div v-if="cobrosFiltrados.length > 0" class="d-md-none">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">📋 Cobros ({{ cobrosFiltrados.length }})</h5>
        <b-button variant="outline-danger" size="sm" @click="confirmarBorrarTodos">
          🗑️ Borrar Todos
        </b-button>
      </div>

      <div v-for="cobro in cobrosFiltrados" :key="cobro.id" class="card mb-3 shadow-sm">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h6 class="fw-bold mb-1">{{ cobro.cliente }}</h6>
              <small class="text-muted">{{ formatearFecha(cobro.fecha) }}</small>
            </div>
            <div class="text-end">
              <div class="fw-bold text-success fs-5">${{ Number(cobro.cantidad).toFixed(2) }}</div>
            </div>
          </div>

          <div class="mb-2">
            <span :class="getTipoBadgeClass(cobro.tipo)" class="badge me-1">{{ cobro.tipo }}</span>
            <span class="badge bg-secondary">{{ cobro.metodoPago }}</span>
          </div>

          <div v-if="cobro.numeroFactura || cobro.numeroRecibo" class="mb-2">
            <small class="text-muted">
              <span v-if="cobro.numeroFactura">Fact: {{ cobro.numeroFactura }}</span>
              <span v-if="cobro.numeroRecibo" class="ms-2">Rec: {{ cobro.numeroRecibo }}</span>
            </small>
          </div>

          <div v-if="cobro.observaciones" class="mb-2">
            <small class="text-muted">{{ cobro.observaciones }}</small>
          </div>

          <div class="text-end">
            <b-button variant="outline-danger" size="sm" @click="confirmarEliminar(cobro)">
              🗑️ Eliminar
            </b-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <b-card v-if="cobros.length === 0" class="text-center py-5 shadow-sm">
      <div style="font-size: 3rem; color: #6c757d;">💰</div>
      <h5 class="text-muted mt-3">No hay cobros registrados</h5>
      <p class="text-muted mb-0">Completa el formulario para registrar tu primer cobro</p>
    </b-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useCobros } from '@/composables/useCobros';
import { useToast } from 'vue-toastification';
import { usePDFGenerator } from '@/utils/pdfGenerator';
import alertify from 'alertifyjs';

const toast = useToast();
const { cobros, addCobro, deleteCobro, clearAllCobros, getTotalCobros } = useCobros();
const { exportCobros } = usePDFGenerator();

const formulario = ref({
  cliente: '',
  fecha: new Date().toISOString().split('T')[0],
  cantidad: null,
  tipo: 'Abono',
  metodoPago: 'Efectivo',
  numeroFactura: '',
  numeroRecibo: '',
  observaciones: ''
});

const filtros = ref({
  fechaInicio: '',
  fechaFin: '',
  tipo: '',
  metodoPago: ''
});

// Computed
const cobrosFiltrados = computed(() => {
  let resultado = [...cobros.value];

  if (filtros.value.fechaInicio) {
    resultado = resultado.filter(c => c.fecha >= filtros.value.fechaInicio);
  }

  if (filtros.value.fechaFin) {
    resultado = resultado.filter(c => c.fecha <= filtros.value.fechaFin);
  }

  if (filtros.value.tipo) {
    resultado = resultado.filter(c => c.tipo === filtros.value.tipo);
  }

  if (filtros.value.metodoPago) {
    resultado = resultado.filter(c => c.metodoPago === filtros.value.metodoPago);
  }

  return resultado;
});

const totalFiltrado = computed(() => {
  return getTotalCobros(cobrosFiltrados.value);
});

// Methods
const registrarCobro = () => {
  if (!formulario.value.cantidad || formulario.value.cantidad <= 0) {
    toast.warning('La cantidad debe ser mayor a 0');
    return;
  }

  addCobro({ ...formulario.value });
  limpiarFormulario();
};

const limpiarFormulario = () => {
  formulario.value = {
    cliente: '',
    fecha: new Date().toISOString().split('T')[0],
    cantidad: null,
    tipo: 'Abono',
    metodoPago: 'Efectivo',
    numeroFactura: '',
    numeroRecibo: '',
    observaciones: ''
  };
};

const limpiarFiltros = () => {
  filtros.value = {
    fechaInicio: '',
    fechaFin: '',
    tipo: '',
    metodoPago: ''
  };
};

const formatearFecha = (fechaStr) => {
  if (!fechaStr) return '-';
  const [y, m, d] = fechaStr.split('-');
  return `${d}/${m}/${y}`;
};

const getTipoBadgeClass = (tipo) => {
  return tipo === 'Abono' ? 'bg-info' : 'bg-warning text-dark';
};

const contarPorTipo = (tipo) => {
  return cobrosFiltrados.value.filter(c => c.tipo === tipo).length;
};

const confirmarEliminar = (cobro) => {
  alertify.confirm(
    'Eliminar Cobro',
    `¿Eliminar el cobro de ${cobro.cliente} por $${cobro.cantidad}?`,
    () => {
      deleteCobro(cobro.id);
    },
    () => {}
  ).set('labels', { ok: 'Sí, Eliminar', cancel: 'Cancelar' });
};

const confirmarBorrarTodos = () => {
  alertify.confirm(
    'Eliminar Todos los Cobros',
    `⚠️ ¿Eliminar TODOS los ${cobros.value.length} cobros?<br><br>Esta acción NO se puede deshacer.`,
    () => {
      clearAllCobros();
    },
    () => {}
  ).set('labels', { ok: 'Sí, Borrar Todos', cancel: 'Cancelar' });
};

const exportarPDF = () => {
  if (cobrosFiltrados.value.length === 0) {
    toast.warning('No hay cobros para exportar');
    return;
  }

  exportCobros(cobrosFiltrados.value);
};
</script>

<style scoped>
.gap-2 {
  gap: 0.5rem;
}
</style>
