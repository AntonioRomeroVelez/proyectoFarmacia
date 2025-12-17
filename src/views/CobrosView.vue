<template>
  <div class="container-fluid py-4">
    <!-- Header -->
    <div class="d-flex justify-content-center align-items-center mb-4  flex-wrap flex-column">
      <div class="text-center">
        <p class="text-muted mb-0 small">Gestiona los pagos recibidos</p>
      </div>
      <div class="d-flex gap-2">
        <b-button variant="primary" @click="showRegistroModal = true">
          ➕ Registrar Cobro
        </b-button>
        <b-button variant="danger" @click="exportarPDF" :disabled="cobros.length === 0">
          📄 Exportar PDF
        </b-button>
        <b-button variant="success" @click="exportarPDFImagenes" :disabled="!hayImagenes">
          📸 PDF Imágenes
        </b-button>
      </div>
    </div>

    <!-- Modal de Registro -->
    <b-modal v-model="showRegistroModal" :title="editingId ? '✏️ Editar Cobro' : '➕ Registrar Nuevo Cobro'" size="lg"
      hide-footer>
      <b-form @submit.prevent="registrarCobro">
        <b-row>
          <b-col md="6">
            <b-form-group label="Cliente:" label-for="cliente">
              <b-form-input id="cliente" v-model="formulario.cliente" placeholder="Seleccione o escriba un cliente..."
                list="lista-clientes" autocomplete="off" required></b-form-input>
              <datalist id="lista-clientes">
                <option v-for="c in clientes" :key="c.id" :value="c.nombre">
                  {{ c.empresa ? c.empresa + ' - ' : '' }} {{ c.telefono ? '📞 ' + c.telefono : '' }}
                </option>
              </datalist>
            </b-form-group>
          </b-col>

          <b-col md="12" v-if="pedidosPendientes.length > 0">
            <b-form-group label="Asignar a Pedido (Opcional):" label-for="pedidoId" class="border rounded p-2 bg-light">
              <b-form-select id="pedidoId" v-model="formulario.pedidoId">
                <option :value="null">-- Abono General (Sin asignar) --</option>
                <option v-for="pedido in pedidosPendientes" :key="pedido.id" :value="pedido.id">
                  📅 {{ formatearFecha(pedido.date) }} - Saldo: ${{ Number(pedido.saldo).toFixed(2) }}
                  (Total: ${{ Number(pedido.total).toFixed(2) }})
                </option>
              </b-form-select>
              <small class="text-info mt-1 d-block">
                <BIconInfoCircle /> Selecciona un pedido para autocompletar el monto.
              </small>
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

          <b-col md="12">
            <b-form-group label="Imágenes del Comprobante:" label-for="imagen">
              <input type="file" id="imagen" class="form-control" @change="handleImagenChange" accept="image/*" multiple
                ref="fileInput" />
              <small class="text-muted">Opcional: Subir una o más imágenes (JPG, PNG)</small>
            </b-form-group>

            <!-- Vista previa de imágenes -->
            <div v-if="imagenesPreview.length > 0" class="d-flex flex-wrap gap-2 mt-2">
              <div v-for="(img, index) in imagenesPreview" :key="index" class="position-relative"
                style="width: 100px; height: 100px;">
                <img :src="img" alt="Vista previa" class="img-fluid rounded border w-100 h-100"
                  style="object-fit: cover;" />
                <b-button variant="danger" size="sm"
                  class="position-absolute top-0 end-0 m-1 p-0 d-flex align-items-center justify-content-center"
                  style="width: 20px; height: 20px; font-size: 12px;" @click="eliminarImagen(index)">
                  ✖
                </b-button>
              </div>
            </div>
          </b-col>
        </b-row>

        <div class="d-flex gap-2 justify-content-end mt-3">
          <b-button variant="secondary" @click="showRegistroModal = false">
            Cancelar
          </b-button>
          <b-button variant="outline-secondary" @click="limpiarFormulario">
            Limpiar
          </b-button>
          <b-button type="submit" variant="primary">
            💾 Guardar Cobro
          </b-button>
        </div>
      </b-form>
    </b-modal>

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
              <th>Imagen</th>
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
              <td>
                <div class="d-flex align-items-center gap-1">
                  <!-- Caso: Array de imágenes -->
                  <template v-if="cobro.imagenes && cobro.imagenes.length > 0">
                    <div class="position-relative">
                      <img :src="cobro.imagenes[0]" alt="Comprobante" class="rounded"
                        style="width: 50px; height: 50px; object-fit: cover; cursor: pointer;"
                        @click="verImagenModal(cobro.imagenes[0])" />
                      <span v-if="cobro.imagenes.length > 1"
                        class="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-danger"
                        style="font-size: 0.6rem;">
                        +{{ cobro.imagenes.length - 1 }}
                      </span>
                    </div>
                  </template>
                  <!-- Caso: Imagen única (legacy) -->
                  <template v-else-if="cobro.imagen">
                    <img :src="cobro.imagen" alt="Comprobante" class="rounded"
                      style="width: 50px; height: 50px; object-fit: cover; cursor: pointer;"
                      @click="verImagenModal(cobro.imagen)" />
                  </template>
                  <small v-else class="text-muted">-</small>
                </div>
              </td>
              <td class="text-end">
                <b-button variant="outline-primary" size="sm" class="me-1" @click="prepararEdicion(cobro)">
                  ✏️
                </b-button>
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

          <!-- Imágenes en móvil -->
          <div v-if="(cobro.imagenes && cobro.imagenes.length > 0) || cobro.imagen" class="mb-2">
            <div class="d-flex flex-wrap gap-2">
              <template v-if="cobro.imagenes && cobro.imagenes.length > 0">
                <img v-for="(img, idx) in cobro.imagenes" :key="idx" :src="img" alt="Comprobante"
                  class="img-fluid rounded border"
                  style="width: 80px; height: 80px; object-fit: cover; cursor: pointer;" @click="verImagenModal(img)" />
              </template>
              <template v-else-if="cobro.imagen">
                <img :src="cobro.imagen" alt="Comprobante" class="img-fluid rounded border"
                  style="max-height: 200px; cursor: pointer;" @click="verImagenModal(cobro.imagen)" />
              </template>
            </div>
          </div>

          <div class="text-end">
            <b-button variant="outline-primary" size="sm" class="me-1" @click="prepararEdicion(cobro)">
              ✏️ Editar
            </b-button>
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

    <!-- Modal de Selección de Imágenes -->
    <ImageSelectionModal v-model="showImageSelection" :cobros="cobrosConImagen" @export="handleImageExport" />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue';
import { useCobros } from '@/composables/useCobros';
import { useHistorial } from '@/composables/useHistorial';
import { useClientes } from '@/composables/useClientes'; // Importar clientes
import { useToast } from 'vue-toastification';
import { usePDFGenerator } from '@/utils/pdfGenerator';
import { BIconInfoCircle } from 'bootstrap-icons-vue';
import alertify from 'alertifyjs';
import ImageSelectionModal from '@/components/ImageSelectionModal.vue';

const toast = useToast();
const { cobros, addCobro, updateCobro, deleteCobro, clearAllCobros, getTotalCobros } = useCobros();
const { documents } = useHistorial();
const { clientes, buscarClientes } = useClientes(); // Usar composable de clientes
const { exportCobros } = usePDFGenerator();

const showRegistroModal = ref(false);
const editingId = ref(null); 

const formulario = ref({
  cliente: '',
  clienteId: null, // Nuevo campo para robustez
  fecha: new Date().toISOString().split('T')[0],
  cantidad: null,
  tipo: 'Abono',
  metodoPago: 'Efectivo',
  numeroFactura: '',
  numeroRecibo: '',
  observaciones: '',
  imagenes: [],
  pedidoId: null
});

const pedidosPendientes = ref([]);

// Watcher: cuando cambia el cliente, buscar sus pedidos pendientes
watch(() => formulario.value.cliente, (newCliente) => {
  if (newCliente && newCliente.length > 0) {
    // Intentar encontrar el cliente en la lista oficial para obtener su ID
    const clienteEncontrado = clientes.value.find(c => c.nombre.trim().toLowerCase() === newCliente.trim().toLowerCase());

    if (clienteEncontrado) {
      formulario.value.clienteId = clienteEncontrado.id;
    } else {
      formulario.value.clienteId = null; // Es un cliente manual o no coincide exacto
    }

    buscarPedidosPendientes(newCliente, formulario.value.clienteId);
  } else {
    pedidosPendientes.value = [];
    formulario.value.clienteId = null;
  }
});

// Watcher: cuando selecciona un pedido, autocompletar el monto
watch(() => formulario.value.pedidoId, (newId) => {
  if (newId) {
    const pedido = pedidosPendientes.value.find(p => p.id === newId);
    if (pedido) {
      formulario.value.cantidad = Number(pedido.saldo).toFixed(2);
      formulario.value.observaciones = `Pago a pedido del ${formatearFecha(pedido.date)}`;
    }
  }
});

const buscarPedidosPendientes = (clienteNombre, clienteId = null) => {
  const nombreNormalizado = clienteNombre.toLowerCase().trim();

  // 1. Filtrar ventas de este cliente (por ID si existe, o por Nombre)
  const ventasCliente = documents.value.filter(d => {
    if (d.type !== 'Pedido') return false;

    // Si tenemos ID y el documento tiene ID de cliente, priorizar esa coincidencia
    if (clienteId && d.clienteId) {
      return d.clienteId === clienteId;
    }

    // Fallback: coincidencia por nombre
    return (d.clientName || '').toLowerCase().trim() === nombreNormalizado;
  });

  // 2. Calcular saldo de cada venta
  const pendientes = [];

  ventasCliente.forEach(venta => {
    const totalVenta = Number(venta.totals?.total || 0);

    // ESTRATEGIA: Calcular saldo "vivo" restando todos los pagos vinculados a este ID.
    const pagosVinculados = cobros.value.filter(c => c.pedidoId === venta.id);
    const totalPagado = pagosVinculados.reduce((sum, c) => sum + Number(c.cantidad || 0), 0);

    const saldo = totalVenta - totalPagado;

    if (saldo > 0.01) {
      pendientes.push({
        id: venta.id,
        date: venta.date,
        total: totalVenta,
        saldo: saldo
      });
    }
  });

  // Ordenar por fecha (más antiguos primero)
  pedidosPendientes.value = pendientes.sort((a, b) => new Date(a.date) - new Date(b.date));
};

const imagenesPreview = ref([]);
const fileInput = ref(null);

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

const hayImagenes = computed(() => {
  return cobros.value.some(c => (c.imagenes && c.imagenes.length > 0) || c.imagen);
});

// Methods
const registrarCobro = async () => {
  if (!formulario.value.cantidad || formulario.value.cantidad <= 0) {
    toast.warning('La cantidad debe ser mayor a 0');
    return;
  }

  // Validar que no pague más del saldo si hay pedido seleccionado
  if (formulario.value.pedidoId) {
    const pedido = pedidosPendientes.value.find(p => p.id === formulario.value.pedidoId);
    if (pedido && Number(formulario.value.cantidad) > (pedido.saldo + 0.1)) { // +0.1 tolerancia
      const confirmar = await new Promise(resolve => {
        alertify.confirm('Exceso de Pago',
          `Estás registrando un pago mayor al saldo del pedido ($${Number(pedido.saldo).toFixed(2)}). ¿Continuar?`,
          () => resolve(true),
          () => resolve(false)
        );
      });
      if (!confirmar) return;
    }
  }

  try {
    if (editingId.value) {
      // Modo Edición
      updateCobro({ ...formulario.value, id: editingId.value });
    } else {
      // Modo Creación
      addCobro({ ...formulario.value });
    }

    // Cerrar modal primero
    showRegistroModal.value = false;

    // Esperar a que Vue procese el cambio de estado antes de limpiar
    await nextTick();
    limpiarFormulario();

  } catch (error) {
    console.error('Error al registrar cobro:', error);
  }
};

const prepararEdicion = (cobro) => {
  editingId.value = cobro.id;
  formulario.value = {
    cliente: cobro.cliente,
    clienteId: cobro.clienteId || null,
    fecha: cobro.fecha,
    cantidad: cobro.cantidad,
    tipo: cobro.tipo,
    metodoPago: cobro.metodoPago,
    numeroFactura: cobro.numeroFactura || '',
    numeroRecibo: cobro.numeroRecibo || '',
    observaciones: cobro.observaciones || '',
    imagenes: cobro.imagenes ? [...cobro.imagenes] : (cobro.imagen ? [cobro.imagen] : []),
    pedidoId: cobro.pedidoId || null
  };

  // Cargar pedidos pendientes para este cliente
  if (cobro.cliente) {
    buscarPedidosPendientes(cobro.cliente, cobro.clienteId);
  }

  imagenesPreview.value = [...formulario.value.imagenes];
  showRegistroModal.value = true;
};

const limpiarFormulario = () => {
  editingId.value = null; 
  formulario.value = {
    cliente: '',
    clienteId: null,
    fecha: new Date().toISOString().split('T')[0],
    cantidad: null,
    tipo: 'Abono',
    metodoPago: 'Efectivo',
    numeroFactura: '',
    numeroRecibo: '',
    observaciones: '',
    imagenes: [],
    pedidoId: null
  };
  pedidosPendientes.value = [];
  imagenesPreview.value = [];
  if (fileInput.value) {
    fileInput.value.value = '';
  }
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
    () => { }
  ).set('labels', { ok: 'Sí, Eliminar', cancel: 'Cancelar' });
};

const confirmarBorrarTodos = () => {
  alertify.confirm(
    'Eliminar Todos los Cobros',
    `⚠️ ¿Eliminar TODOS los ${cobros.value.length} cobros?<br><br>Esta acción NO se puede deshacer.`,
    () => {
      clearAllCobros();
    },
    () => { }
  ).set('labels', { ok: 'Sí, Borrar Todos', cancel: 'Cancelar' });
};

const exportarPDF = () => {
  if (cobrosFiltrados.value.length === 0) {
    toast.warning('No hay cobros para exportar');
    return;
  }

  exportCobros(cobrosFiltrados.value, filtros.value);
};

// Manejar selección de imágenes
const handleImagenChange = async (event) => {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  // Validar y procesar cada archivo
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      toast.error(`El archivo ${file.name} no es una imagen válida`);
      continue;
    }

    try {
      const base64 = await convertirImagenABase64(file);
      formulario.value.imagenes.push(base64);
      imagenesPreview.value.push(base64);
    } catch (error) {
      console.error('Error al procesar imagen:', error);
      toast.error(`Error al procesar la imagen ${file.name}`);
    }
  }

  toast.success(`✅ ${files.length} imagen(es) cargada(s)`);

  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// Convertir imagen a Base64
// Convertir imagen a Base64 con compresión
const convertirImagenABase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionar si es muy grande (max 1000px)
        const maxSize = 1000;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height *= maxSize / width;
            width = maxSize;
          } else {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Comprimir a JPEG con calidad 0.7
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedBase64);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Eliminar imagen seleccionada
const eliminarImagen = (index) => {
  formulario.value.imagenes.splice(index, 1);
  imagenesPreview.value.splice(index, 1);
};

// Limpiar todas las imágenes (opcional, si se requiere)
const limpiarImagenes = () => {
  formulario.value.imagenes = [];
  imagenesPreview.value = [];
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// Exportar PDF con imágenes
const showImageSelection = ref(false);

const cobrosConImagen = computed(() => {
  return cobros.value.filter(c => (c.imagenes && c.imagenes.length > 0) || c.imagen);
});

const exportarPDFImagenes = () => {
  if (cobrosConImagen.value.length === 0) {
    toast.warning('No hay cobros con imágenes para exportar');
    return;
  }

  showImageSelection.value = true;
};

const handleImageExport = (selectedImages) => {
  if (!selectedImages || selectedImages.length === 0) {
    toast.warning('No hay imágenes seleccionadas');
    return;
  }

  const { exportCobrosImagenesFromSelection } = usePDFGenerator();
  exportCobrosImagenesFromSelection(selectedImages);
};

// Ver imagen en modal
const verImagenModal = (imagenSrc) => {
  const dialog = alertify.dialog('alert');
  dialog.set({
    title: 'Comprobante de Pago',
    message: `<img src="${imagenSrc}" style="max-width: 100%; height: auto; border-radius: 8px;" />`,
    transition: 'fade'
  });
  dialog.show();
};
</script>

<style scoped>
.gap-2 {
  gap: 0.5rem;
}
</style>
