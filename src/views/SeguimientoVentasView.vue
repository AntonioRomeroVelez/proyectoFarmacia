<template>
  <div class="container-fluid py-4">
    <div class="mb-4">
      <h2 class="fw-bold text-primary mb-2">
        <BIconCashStack class="me-2" />Seguimiento de Ventas y Cobros
      </h2>
      <p class="text-muted">Estado de cuenta detallado por cliente.</p>
    </div>

    <!-- Buscador -->
    <b-card class="shadow-sm mb-4 border-0">
      <div class="d-flex gap-3 align-items-center">
        <div class="flex-grow-1">
          <b-input-group>
            <b-input-group-text>
              <BIconSearch />
            </b-input-group-text>
            <b-form-input v-model="searchQuery" placeholder="Buscar cliente..." type="search"></b-form-input>
          </b-input-group>
        </div>
        <div class="d-flex gap-2">
          <b-form-select v-model="filterStatus" class="w-auto">
            <option value="all">Todos</option>
            <option value="debt">Con Deuda</option>
            <option value="paid">Cancelados</option>
          </b-form-select>
        </div>
      </div>
    </b-card>

    <!-- Lista de Clientes -->
    <div class="accordion" id="accordionClientes">
      <div v-for="cliente in filteredClients" :key="cliente.id"
        class="accordion-item shadow-sm mb-3 border-0 rounded overflow-hidden"
        :class="{ 'border border-success': cliente.balance <= 0.01 }">
        <h2 class="accordion-header">
          <button class="accordion-button collapsed" :class="{ 'paid-client': cliente.balance <= 0.01 }" type="button"
            data-bs-toggle="collapse" :data-bs-target="'#collapse' + cliente.id" aria-expanded="false">
            <div class="d-flex w-100 justify-content-between align-items-center me-3 flex-wrap gap-2">
              <div class="d-flex align-items-center gap-2" style="min-width: 200px;">
                <div class="avatar-circle" :class="{ 'bg-unregistered': !cliente.isRegistered }">
                  {{ cliente.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div class="d-flex align-items-center gap-2">
                    <h6 class="mb-0 fw-bold">{{ cliente.name }}</h6>
                    <b-button v-if="!cliente.isRegistered && cliente.name !== 'Cliente General'"
                      variant="outline-success" size="sm" class="py-0 px-2" style="font-size: 0.75rem;"
                      @click.stop="forceRegisterClient(cliente.name)" title="Registrar en Base de Datos">
                      <i class="bi bi-person-plus-fill"></i> Registrar
                    </b-button>
                  </div>
                  <small class="text-muted">
                    {{ cliente.sales ? cliente.sales.length : 0 }} ventas
                    <span v-if="cliente.proformas && cliente.proformas.length > 0"> • {{ cliente.proformas.length }}
                      proformas</span>
                  </small>
                </div>
              </div>

              <div class="d-flex gap-4 text-end stats-container">
                <div class="stat-box">
                  <small class="text-muted d-block">Total Vendido</small>
                  <span class="fw-bold text-primary">${{ Number(cliente.totalSales).toFixed(2) }}</span>
                </div>
                <div class="stat-box">
                  <small class="text-muted d-block">Total Abono</small>
                  <span class="fw-bold text-success">${{ Number(cliente.totalPaid).toFixed(2) }}</span>
                </div>
                <div class="stat-box">
                  <small class="text-muted d-block">Saldo Pendiente</small>
                  <span class="fw-bold fs-5" :class="cliente.balance > 0.01 ? 'text-danger' : 'text-secondary'">
                    ${{ Number(cliente.balance).toFixed(2) }}
                  </span>
                </div>
              </div>
            </div>
          </button>
        </h2>
        <div :id="'collapse' + cliente.id" class="accordion-collapse collapse" data-bs-parent="#accordionClientes">
          <div class="accordion-body bg-light">
            <!-- Ventas y sus Pagos Vinculados -->
            <div class="mb-4">
              <h6 class="text-primary fw-bold mb-3">
                <BIconBagCheck class="me-2" /> Detalle de Ventas
              </h6>
              <div class="table-responsive shadow-sm rounded bg-white">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Fecha Venta</th>
                      <th>Total</th>
                      <th>Abonado (Vinculado)</th>
                      <th>Saldo Venta</th>
                      <th class="text-end">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="sale in cliente.sales" :key="sale.id">
                      <!-- Fila Principal de Venta -->
                      <tr :class="{ 'table-success': sale.balance < 0.01, 'table-warning': sale.balance > 0.01 }">
                        <td>
                          <strong>{{ formatDate(sale.date) }}</strong>
                          <br>
                          <small class="text-muted">
                            <BIconClock /> {{ getDaysElapsed(sale.date) }}
                          </small>
                        </td>
                        <td class="fw-bold">${{ Number(sale.total).toFixed(2) }}</td>
                        <td class="text-success">${{ Number(sale.paid).toFixed(2) }}</td>
                        <td class="fw-bold" :class="sale.balance > 0.01 ? 'text-danger' : 'text-success'">
                          ${{ Number(sale.balance).toFixed(2) }}
                        </td>
                        <td class="text-end">
                          <span v-if="sale.balance < 0.01" class="badge bg-success">Pagado</span>
                          <span v-else class="badge bg-warning text-dark">Pendiente</span>
                        </td>
                      </tr>
                      <!-- Fila de Pagos Vinculados (si hay) -->
                      <tr v-if="sale.linkedPayments.length > 0">
                        <td colspan="5" class="p-0 border-0">
                          <div class="bg-light p-2 ps-5">
                            <small class="text-muted d-block mb-1">↳ Pagos vinculados:</small>
                            <div v-for="pay in sale.linkedPayments" :key="pay.id"
                              class="d-flex gap-3 text-muted text-sm border-bottom pb-1 mb-1"
                              style="font-size: 0.85rem;">
                              <span>📅 {{ formatDate(pay.fecha) }}</span>
                              <span class="text-success fw-bold">+ ${{ Number(pay.cantidad).toFixed(2) }}</span>
                              <span>({{ pay.metodoPago }})</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </template>
                    <tr v-if="cliente.sales.length === 0">
                      <td colspan="5" class="text-center text-muted py-3">Sin ventas registradas</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Proformas / Cotizaciones -->
            <div v-if="cliente.proformas && cliente.proformas.length > 0" class="mb-4">
              <h6 class="text-secondary fw-bold mb-3">
                <BIconFileText class="me-2" /> Cotizaciones / Proformas
              </h6>
              <div class="table-responsive shadow-sm rounded bg-white" style="max-height: 250px;">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Total</th>
                      <th class="text-end">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="prof in cliente.proformas" :key="prof.id">
                      <td>{{ formatDate(prof.date) }}</td>
                      <td class="fw-bold text-secondary">${{ Number(prof.total).toFixed(2) }}</td>
                      <td class="text-end"><span class="badge bg-secondary">Informativo</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Otros Documentos -->
            <div v-if="cliente.others && cliente.others.length > 0" class="mb-4">
              <h6 class="text-muted fw-bold mb-3"><i class="bi bi-file-earmark-text me-2"></i> Otros Documentos
                (Notas/Listas)</h6>
              <div class="table-responsive shadow-sm rounded bg-white" style="max-height: 200px;">
                <table class="table table-sm table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th class="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="oth in cliente.others" :key="oth.id" class="text-muted">
                      <td>{{ formatDate(oth.date) }}</td>
                      <td>{{ oth.type }}</td>
                      <td class="text-end">${{ Number(oth.total).toFixed(2) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Abonos Generales (Sin Venta Vinculada) -->
            <div v-if="cliente.generalPayments.length > 0">
              <h6 class="text-info fw-bold mb-3">
                <BIconCreditCard class="me-2" /> Abonos Generales / Otros Pagos
              </h6>
              <div class="table-responsive shadow-sm rounded bg-white" style="max-height: 250px;">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Fecha</th>
                      <th>Monto</th>
                      <th>Método</th>
                      <th>Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="pay in cliente.generalPayments" :key="pay.id">
                      <td>{{ formatDate(pay.fecha) }}</td>
                      <td class="fw-bold text-success">${{ Number(pay.cantidad).toFixed(2) }}</td>
                      <td><span class="badge bg-light text-dark border">{{ pay.metodoPago }}</span></td>
                      <td><small class="text-muted">{{ pay.observaciones || '-' }}</small></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <small class="text-muted mt-2 d-block">* Estos pagos reducen el saldo global del cliente pero no están
                asignados a un
                pedido específico.</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado Vacio -->
    <div v-if="filteredClients.length === 0" class="text-center py-5">
      <div class="text-muted fs-1 mb-2">🔍</div>
      <h5 class="text-muted">No se encontraron clientes</h5>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useHistorial } from '@/composables/useHistorial';
import { useCobros } from '@/composables/useCobros';
import { useClientes } from '@/composables/useClientes';
import { useToast } from 'vue-toastification';
import alertify from 'alertifyjs';
import { BIconCashStack, BIconSearch, BIconBagCheck, BIconClock, BIconCreditCard, BIconFileText } from 'bootstrap-icons-vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';

dayjs.extend(relativeTime);
dayjs.locale('es');

// ... existing code

const { documents, loadDocuments } = useHistorial(); // Para ventas
const { cobros, loadCobros } = useCobros();       // Para cobros
const { clientes, addCliente, loadClientes } = useClientes();
const toast = useToast();

const searchQuery = ref('');
const filterStatus = ref('all'); // all, debt, paid

const clientData = computed(() => {
  const clientsMap = {};

  // Helper para normalizar claves
  const normalizeKey = (name) => (name || 'Cliente General').trim().toLowerCase();

  // 1. Procesar Ventas (Solo Pedidos)
  documents.value.forEach(doc => {
    const docType = (doc.type || doc.tipo || '').toLowerCase();

    // Calcular Total con fallback (igual que en useEstadisticas)
    let docTotal = Number(doc.totals?.total || 0);
    if (docTotal === 0 && doc.items && Array.isArray(doc.items)) {
      docTotal = doc.items.reduce((sum, p) => {
        const precio = Number(p.PrecioFarmacia || p.precio || 0);
        const cantidad = Number(p.quantity || p.cantidad || 0);
        return sum + (precio * cantidad);
      }, 0);
    }

    if (docTotal === 0 && docType === 'pedido') return;

    // Fallback para nombre del cliente
    const originalName = doc.clientName || doc.cliente || 'Cliente General';
    const clientKey = normalizeKey(originalName);

    if (!clientsMap[clientKey]) {
      clientsMap[clientKey] = {
        id: clientKey.replace(/\s+/g, '-'),
        name: originalName,
        sales: [],
        proformas: [],
        others: [], // Para otros tipos de documentos
        generalPayments: [],
        totalSales: 0,
        totalPaid: 0
      };
    }

    if (docType === 'pedido') {
      clientsMap[clientKey].sales.push({
        id: doc.id,
        date: doc.date,
        total: docTotal,
        linkedPayments: []
      });
      clientsMap[clientKey].totalSales += docTotal;
    } else if (docType === 'proforma') {
      clientsMap[clientKey].proformas.push({
        id: doc.id,
        date: doc.date,
        total: docTotal
      });
    } else {
      // Cualquier otro tipo (Nota, Lista de Precio, etc)
      clientsMap[clientKey].others.push({
        id: doc.id,
        date: doc.date,
        type: doc.type || doc.tipo || 'Otro',
        total: docTotal
      });
    }
  });

  // 2. Procesar Cobros
  cobros.value.forEach(pay => {
    if (!['Abono', 'Cancelación Total'].includes(pay.tipo)) return;

    const originalName = pay.cliente || 'Cliente General';
    const clientKey = normalizeKey(originalName);
    const payAmount = Number(pay.cantidad || 0);

    if (!clientsMap[clientKey]) {
      clientsMap[clientKey] = {
        id: clientKey.replace(/\s+/g, '-'),
        name: originalName,
        sales: [],
        proformas: [],
        others: [],
        generalPayments: [],
        totalSales: 0,
        totalPaid: 0
      };
    }

    const clientObj = clientsMap[clientKey];
    clientObj.totalPaid += payAmount;

    // Verificar si está vinculado a un pedido
    if (pay.pedidoId) {
      const sale = clientObj.sales.find(s => s.id === pay.pedidoId);
      if (sale) {
        sale.linkedPayments.push(pay);
      } else {
        // ID huérfano (venta borrada o no cargada), a general
        clientObj.generalPayments.push(pay);
      }
    } else {
      // Abono General
      clientObj.generalPayments.push(pay);
    }
  });

  // 3. Calcular saldos por venta y ordenar
  return Object.values(clientsMap).map(c => {
    // Calcular saldo de cada venta individual
    c.sales = c.sales.map(sale => {
      const paidSpecific = sale.linkedPayments.reduce((sum, p) => sum + Number(p.cantidad), 0);
      return {
        ...sale,
        paid: paidSpecific,
        balance: Math.max(0, sale.total - paidSpecific)
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    c.generalPayments = c.generalPayments.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // El balance global sigue siendo Total Ventas - Total Pagos (incluyendo generales)
    // Esto es contablemente correcto, aunque visualmente los generales no estén "asignados"
    c.balance = Math.max(0, c.totalSales - c.totalPaid);

    return c;
  });
});

// Filtrado y búsqueda
const filteredClients = computed(() => {
  let result = clientData.value;

  // Filtro de búsqueda
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(c => c.name.toLowerCase().includes(q));
  }

  // Filtro de estado
  if (filterStatus.value === 'debt') {
    result = result.filter(c => c.balance > 0.01);
  } else if (filterStatus.value === 'paid') {
    result = result.filter(c => c.balance <= 0.01);
  }

  // Verificar registro en BD oficial para cada cliente
  result = result.map(c => {
    // Buscar si existe en la lista oficial (comparación laxa)
    const exists = clientes.value.some(
      official => official.nombre.trim().toLowerCase() === c.name.trim().toLowerCase()
    );
    return { ...c, isRegistered: exists };
  });

  // Ordenar: Deudores primero, luego por nombre
  return result.sort((a, b) => {
    if (b.balance !== a.balance) return b.balance - a.balance;
    return a.name.localeCompare(b.name);
  });
});

// Registrar cliente desde la vista
const forceRegisterClient = (clientName) => {
  if (!clientName || clientName === 'Cliente General') return;

  alertify.confirm(
    'Registrar Cliente',
    `¿Deseas registrar a "<strong>${clientName}</strong>" en tu base de datos de clientes?`,
    async () => {
      try {
        await addCliente({
          nombre: clientName,
          clasificacion: 'C' // Default
        });
        toast.success(`Cliente "${clientName}" registrado exitosamente`);
        // La reactividad actualizará el botón automáticamente gracias al computed
      } catch (e) {
        toast.error('Error al registrar cliente');
      }
    },
    () => { }
  ).set('labels', { ok: 'Registrar', cancel: 'Cancelar' });
};

// Helpers
const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
};

const getDaysElapsed = (date) => {
  if (!date) return '-';
  const start = dayjs(date);
  const now = dayjs();
  const diffDays = now.diff(start, 'day');

  if (diffDays === 0) return 'Hoy';
  return `${diffDays} día${diffDays !== 1 ? 's' : ''}`;
};

// Styles
</script>

<style scoped>
.avatar-circle {
  width: 40px;
  height: 40px;
  background-color: #0d6efd;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}

.bg-unregistered {
  background-color: #6c757d;
  /* Gris para no registrados */
}

.accordion-button:not(.collapsed) {
  background-color: #f0f7ff;
  color: #0d6efd;
}

.accordion-button:focus {
  box-shadow: none;
  border-color: rgba(0, 0, 0, .125);
}

.paid-client {
  background-color: #d1e7dd !important;
  /* Verde suave (success-subtle) */
  color: #0f5132 !important;
}

.paid-client::after {
  filter: hue-rotate(280deg) saturate(3);
  /* Ajustar color de la flecha si es necesario, o dejarlo native */
}

.stat-box {
  min-width: 100px;
  text-align: right;
}

.font-sm {
  font-size: 0.9rem;
}

/* Scrollbar sutil para las tablas */
.table-responsive::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.table-responsive::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

@media (max-width: 768px) {
  .stats-container {
    width: 100%;
    justify-content: space-between;
    margin-top: 10px;
    border-top: 1px solid #eee;
    padding-top: 10px;
  }

  .stat-box {
    text-align: center;
    min-width: auto;
  }
}
</style>
