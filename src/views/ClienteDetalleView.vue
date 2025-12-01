<template>
  <div class="container-fluid py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div class="d-flex align-items-center gap-3">
        <b-button variant="outline-secondary" @click="volver">
          <i class="bi bi-arrow-left"></i> Volver
        </b-button>
        <div>
          <h2 class="fw-bold text-primary mb-0">{{ cliente?.nombre || 'Cliente' }}</h2>
          <small class="text-muted">{{ cliente?.empresa || 'Sin empresa' }}</small>
        </div>
      </div>
      <span class="badge" :class="getBadgeClass(cliente?.clasificacion)" style="font-size: 1rem; padding: 0.5rem 1rem;">
        Clase {{ cliente?.clasificacion }}
      </span>
    </div>

    <div v-if="!cliente" class="text-center py-5">
      <p class="text-muted">Cliente no encontrado</p>
    </div>

    <div v-else>
      <!-- Información del Cliente -->
      <b-card class="shadow-sm mb-4">
        <div class="row g-3">
          <div class="col-md-6">
            <h5 class="fw-bold mb-3">📋 Información de Contacto</h5>
            <div class="info-list">
              <div class="info-item" v-if="cliente.telefono">
                <i class="bi bi-telephone-fill text-primary"></i>
                <div>
                  <small class="text-muted">Teléfono</small>
                  <p class="mb-0">{{ cliente.telefono }}</p>
                </div>
              </div>
              <div class="info-item" v-if="cliente.email">
                <i class="bi bi-envelope-fill text-primary"></i>
                <div>
                  <small class="text-muted">Email</small>
                  <p class="mb-0">{{ cliente.email }}</p>
                </div>
              </div>
              <div class="info-item" v-if="cliente.direccion">
                <i class="bi bi-geo-alt-fill text-primary"></i>
                <div>
                  <small class="text-muted">Dirección</small>
                  <p class="mb-0">{{ cliente.direccion }}</p>
                  <small v-if="cliente.ciudad" class="text-muted">{{ cliente.ciudad }}</small>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <h5 class="fw-bold mb-3">📝 Notas</h5>
            <p class="text-muted" v-if="!cliente.notas">Sin notas</p>
            <p v-else>{{ cliente.notas }}</p>
            <small class="text-muted">
              Creado: {{ formatearFecha(cliente.createdAt) }}
            </small>
          </div>
        </div>
      </b-card>

      <!-- Estadísticas del Cliente -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="stat-card bg-primary">
            <div class="stat-icon">📅</div>
            <div class="stat-info">
              <h3>{{ visitas.length }}</h3>
              <p>Visitas</p>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card bg-success">
            <div class="stat-icon">💰</div>
            <div class="stat-info">
              <h3>${{ totalCobrado.toFixed(2) }}</h3>
              <p>Cobrado</p>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card bg-info">
            <div class="stat-icon">📦</div>
            <div class="stat-info">
              <h3>{{ pedidos.length }}</h3>
              <p>Pedidos</p>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="stat-card bg-warning">
            <div class="stat-icon">💵</div>
            <div class="stat-info">
              <h3>${{ totalCompras.toFixed(2) }}</h3>
              <p>Total Compras</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Pestañas de Historial -->
      <b-card class="shadow-sm">
        <b-tabs content-class="mt-3">
          <!-- Visitas -->
          <b-tab title="📅 Visitas" active>
            <div v-if="visitas.length === 0" class="text-center text-muted py-4">
              <p>No hay visitas registradas</p>
            </div>
            <div v-else class="list-group">
              <div v-for="visita in visitas" :key="visita.id" class="list-group-item">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 class="mb-1">{{ visita.lugar }}</h6>
                    <p class="mb-1 text-muted small">{{ visita.observacion || 'Sin observaciones' }}</p>
                    <small class="text-muted">
                      <i class="bi bi-calendar"></i> {{ formatearFecha(visita.fecha) }}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </b-tab>

          <!-- Cobros -->
          <b-tab title="💰 Cobros">
            <div v-if="cobros.length === 0" class="text-center text-muted py-4">
              <p>No hay cobros registrados</p>
            </div>
            <div v-else class="list-group">
              <div v-for="cobro in cobros" :key="cobro.id" class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 class="mb-1">{{ cobro.cliente }}</h6>
                    <small class="text-muted">
                      {{ cobro.tipo }} - {{ cobro.metodoPago }}
                      <span v-if="cobro.numeroFactura"> | Factura: {{ cobro.numeroFactura }}</span>
                    </small>
                    <br>
                    <small class="text-muted">
                      <i class="bi bi-calendar"></i> {{ formatearFecha(cobro.fecha) }}
                    </small>
                  </div>
                  <span class="fw-bold text-success">${{ Number(cobro.cantidad).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </b-tab>

          <!-- Pedidos -->
          <b-tab title="📦 Pedidos">
            <div v-if="pedidos.length === 0" class="text-center text-muted py-4">
              <p>No hay pedidos registrados</p>
            </div>
            <div v-else class="list-group">
              <div v-for="pedido in pedidos" :key="pedido.id" class="list-group-item">
                <div class="d-flex justify-content-between align-items-start">
                  <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <h6 class="mb-0">{{ pedido.cliente }}</h6>
                      <span class="badge bg-primary">{{ pedido.tipo }}</span>
                    </div>
                    <small class="text-muted d-block mb-2">
                      <i class="bi bi-calendar"></i> {{ formatearFecha(pedido.fecha) }}
                    </small>
                    <div class="productos-list">
                      <small v-for="(producto, idx) in pedido.productos" :key="idx" class="d-block text-muted">
                        {{ producto.cantidad }}x {{ producto.nombre }} - ${{ (producto.precio * producto.cantidad).toFixed(2) }}
                      </small>
                    </div>
                  </div>
                  <div class="text-end">
                    <strong class="text-success">${{ calcularTotalPedido(pedido).toFixed(2) }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </b-tab>
        </b-tabs>
      </b-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useClientes } from '@/composables/useClientes';

const route = useRoute();
const router = useRouter();

const {
  getClienteById,
  getVisitasCliente,
  getCobrosCliente,
  getPedidosCliente,
  getTotalComprasCliente
} = useClientes();

const cliente = ref(null);
const visitas = ref([]);
const cobros = ref([]);
const pedidos = ref([]);

onMounted(() => {
  const clienteId = route.params.id;
  cliente.value = getClienteById(clienteId);
  
  if (cliente.value) {
    visitas.value = getVisitasCliente(clienteId);
    cobros.value = getCobrosCliente(clienteId);
    pedidos.value = getPedidosCliente(clienteId);
  }
});

const totalCobrado = computed(() => {
  return cobros.value.reduce((sum, c) => sum + (Number(c.cantidad) || 0), 0);
});

const totalCompras = computed(() => {
  return cliente.value ? getTotalComprasCliente(cliente.value.id) : 0;
});

const getBadgeClass = (clasificacion) => {
  const classes = {
    'A': 'bg-success',
    'B': 'bg-primary',
    'C': 'bg-secondary'
  };
  return classes[clasificacion] || 'bg-secondary';
};

const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const calcularTotalPedido = (pedido) => {
  return pedido.productos?.reduce((sum, p) => sum + (p.precio * p.cantidad), 0) || 0;
};

const volver = () => {
  router.push('/clientes');
};
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 12px;
  color: white;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-3px);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-info h3 {
  font-size: 1.75rem;
  margin: 0;
  font-weight: bold;
  line-height: 1;
}

.stat-info p {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  opacity: 0.9;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: start;
  gap: 1rem;
}

.info-item i {
  font-size: 1.25rem;
  margin-top: 0.25rem;
}

.info-item p {
  font-weight: 500;
}

.list-group-item {
  border-radius: 8px;
  margin-bottom: 0.5rem;
  border: 1px solid #e2e8f0;
}

.productos-list {
  background: #f8f9fa;
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .stat-card {
    padding: 1rem;
  }

  .stat-icon {
    font-size: 2rem;
  }

  .stat-info h3 {
    font-size: 1.5rem;
  }
}
</style>
