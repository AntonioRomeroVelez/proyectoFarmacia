<template>
  <div class="container-fluid py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h2 class="fw-bold text-primary mb-1">👥 Gestión de Clientes</h2>
        <p class="text-muted mb-0 small">Administra tu cartera de clientes</p>
      </div>
      <b-button variant="success" @click="mostrarModalNuevo">
        ➕ Nuevo Cliente
      </b-button>
    </div>

    <!-- Estadísticas -->
    <div class="row g-3 mb-4">
      <div class="col-6 col-md-3">
        <div class="stat-card stat-total">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <h3>{{ clientes.length }}</h3>
            <p>Total Clientes</p>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="stat-card stat-a">
          <div class="stat-icon">⭐</div>
          <div class="stat-info">
            <h3>{{ clientesPorClasificacion.A.length }}</h3>
            <p>Clase A</p>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="stat-card stat-b">
          <div class="stat-icon">✨</div>
          <div class="stat-info">
            <h3>{{ clientesPorClasificacion.B.length }}</h3>
            <p>Clase B</p>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3">
        <div class="stat-card stat-c">
          <div class="stat-icon">📋</div>
          <div class="stat-info">
            <h3>{{ clientesPorClasificacion.C.length }}</h3>
            <p>Clase C</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros y Búsqueda -->
    <b-card class="shadow-sm mb-4">
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label small fw-bold">Buscar:</label>
          <input v-model="busqueda" type="text" class="form-control" placeholder="Nombre, empresa, teléfono, email..." />
        </div>
        <div class="col-md-3">
          <label class="form-label small fw-bold">Clasificación:</label>
          <select v-model="filtroClasificacion" class="form-select">
            <option value="todos">Todos</option>
            <option value="A">Clase A</option>
            <option value="B">Clase B</option>
            <option value="C">Clase C</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label small fw-bold">Ordenar:</label>
          <select v-model="ordenamiento" class="form-select">
            <option value="nombre">Nombre</option>
            <option value="empresa">Empresa</option>
            <option value="clasificacion">Clasificación</option>
            <option value="reciente">Más reciente</option>
          </select>
        </div>
      </div>
    </b-card>

    <!-- Lista de Clientes -->
    <b-card class="shadow-sm">
      <div v-if="clientesFiltrados.length === 0" class="text-center text-muted py-5">
        <h3 class="mb-3">📭</h3>
        <p class="mb-0">No se encontraron clientes</p>
      </div>

      <div v-else class="clientes-grid">
        <div v-for="cliente in clientesFiltrados" :key="cliente.id" class="cliente-card" @click="verDetalle(cliente.id)">
          <div class="cliente-header">
            <div class="cliente-avatar">{{ cliente.nombre.charAt(0).toUpperCase() }}</div>
            <div class="cliente-info flex-grow-1">
              <h6 class="mb-0 fw-bold">{{ cliente.nombre }}</h6>
              <small class="text-muted">{{ cliente.empresa || 'Sin empresa' }}</small>
            </div>
            <span class="badge" :class="getBadgeClass(cliente.clasificacion)">
              {{ cliente.clasificacion }}
            </span>
          </div>
          <div class="cliente-body">
            <div class="info-item" v-if="cliente.telefono">
              <i class="bi bi-telephone"></i>
              <span>{{ cliente.telefono }}</span>
            </div>
            <div class="info-item" v-if="cliente.email">
              <i class="bi bi-envelope"></i>
              <span>{{ cliente.email }}</span>
            </div>
            <div class="info-item" v-if="cliente.ciudad">
              <i class="bi bi-geo-alt"></i>
              <span>{{ cliente.ciudad }}</span>
            </div>
          </div>
          <div class="cliente-footer">
            <small class="text-muted">
              <i class="bi bi-clock"></i>
              Creado: {{ formatearFecha(cliente.createdAt) }}
            </small>
            <div class="cliente-actions" @click.stop>
              <b-button variant="outline-primary" size="sm" @click="editarCliente(cliente)">
                ✏️
              </b-button>
              <b-button v-if="isAdmin" variant="outline-danger" size="sm" @click="confirmarEliminar(cliente)">
                🗑️
              </b-button>
            </div>
          </div>
        </div>
      </div>
    </b-card>

    <!-- Modal Crear/Editar Cliente -->
    <b-modal v-model="showModal" :title="clienteEditando ? 'Editar Cliente' : 'Nuevo Cliente'" @ok="guardarCliente"
      ok-title="Guardar" cancel-title="Cancelar" size="lg">
      <b-form @submit.prevent="guardarCliente">
        <div class="row g-3">
          <div class="col-md-6">
            <b-form-group label="Nombre:" label-for="nombre">
              <b-form-input id="nombre" v-model="formulario.nombre" placeholder="Nombre completo" required></b-form-input>
            </b-form-group>
          </div>
          <div class="col-md-6">
            <b-form-group label="Empresa:" label-for="empresa">
              <b-form-input id="empresa" v-model="formulario.empresa" placeholder="Nombre de la empresa"></b-form-input>
            </b-form-group>
          </div>
          <div class="col-md-6">
            <b-form-group label="Teléfono:" label-for="telefono">
              <b-form-input id="telefono" v-model="formulario.telefono" placeholder="Número de teléfono"></b-form-input>
            </b-form-group>
          </div>
          <div class="col-md-6">
            <b-form-group label="Email:" label-for="email">
              <b-form-input id="email" v-model="formulario.email" type="email" placeholder="correo@ejemplo.com"></b-form-input>
            </b-form-group>
          </div>
          <div class="col-md-8">
            <b-form-group label="Dirección:" label-for="direccion">
              <b-form-input id="direccion" v-model="formulario.direccion" placeholder="Dirección completa"></b-form-input>
            </b-form-group>
          </div>
          <div class="col-md-4">
            <b-form-group label="Ciudad:" label-for="ciudad">
              <b-form-input id="ciudad" v-model="formulario.ciudad" placeholder="Ciudad"></b-form-input>
            </b-form-group>
          </div>
          <div class="col-12">
            <b-form-group label="Clasificación:" label-for="clasificacion">
              <select id="clasificacion" v-model="formulario.clasificacion" class="form-select">
                <option value="A">Clase A (Alto valor)</option>
                <option value="B">Clase B (Medio valor)</option>
                <option value="C">Clase C (Bajo valor)</option>
              </select>
            </b-form-group>
          </div>
          <div class="col-12">
            <b-form-group label="Notas:" label-for="notas">
              <b-form-textarea id="notas" v-model="formulario.notas" placeholder="Observaciones o notas adicionales..."
                rows="3"></b-form-textarea>
            </b-form-group>
          </div>
        </div>
      </b-form>
    </b-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useClientes } from '@/composables/useClientes';
import { useAuth } from '@/composables/useAuth';
import alertify from 'alertifyjs';

const router = useRouter();
const { isAdmin } = useAuth();
const {
  clientes,
  clientesPorClasificacion,
  addCliente,
  updateCliente,
  deleteCliente,
  buscarClientes
} = useClientes();

// Estado
const busqueda = ref('');
const filtroClasificacion = ref('todos');
const ordenamiento = ref('nombre');
const showModal = ref(false);
const clienteEditando = ref(null);

const formulario = ref({
  nombre: '',
  empresa: '',
  telefono: '',
  email: '',
  direccion: '',
  ciudad: '',
  clasificacion: 'C',
  notas: ''
});

// Computed
const clientesFiltrados = computed(() => {
  let resultado = busqueda.value ? buscarClientes(busqueda.value) : [...clientes.value];

  // Filtrar por clasificación
  if (filtroClasificacion.value !== 'todos') {
    resultado = resultado.filter(c => c.clasificacion === filtroClasificacion.value);
  }

  // Ordenar
  resultado.sort((a, b) => {
    switch (ordenamiento.value) {
      case 'nombre':
        return a.nombre.localeCompare(b.nombre);
      case 'empresa':
        return (a.empresa || '').localeCompare(b.empresa || '');
      case 'clasificacion':
        return a.clasificacion.localeCompare(b.clasificacion);
      case 'reciente':
        return new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return 0;
    }
  });

  return resultado;
});

// Methods
const getBadgeClass = (clasificacion) => {
  const classes = {
    'A': 'bg-success',
    'B': 'bg-primary',
    'C': 'bg-secondary'
  };
  return classes[clasificacion] || 'bg-secondary';
};

const formatearFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

const mostrarModalNuevo = () => {
  clienteEditando.value = null;
  formulario.value = {
    nombre: '',
    empresa: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    clasificacion: 'C',
    notas: ''
  };
  showModal.value = true;
};

const editarCliente = (cliente) => {
  clienteEditando.value = cliente;
  formulario.value = { ...cliente };
  showModal.value = true;
};

const guardarCliente = () => {
  if (!formulario.value.nombre.trim()) {
    return;
  }

  if (clienteEditando.value) {
    updateCliente(clienteEditando.value.id, formulario.value);
  } else {
    addCliente(formulario.value);
  }

  showModal.value = false;
};

const confirmarEliminar = (cliente) => {
  alertify.confirm(
    'Eliminar Cliente',
    `¿Eliminar a "${cliente.nombre}"? Esta acción no se puede deshacer.`,
    () => {
      deleteCliente(cliente.id);
    },
    () => {}
  ).set('labels', { ok: 'Sí, Eliminar', cancel: 'Cancelar' });
};

const verDetalle = (clienteId) => {
  router.push(`/clientes/${clienteId}`);
};
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 12px;
  transition: transform 0.3s;
  color: white;
}

.stat-card:hover {
  transform: translateY(-3px);
}

.stat-card.stat-total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card.stat-a {
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
}

.stat-card.stat-b {
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
}

.stat-card.stat-c {
  background: linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-info h3 {
  font-size: 2rem;
  margin: 0;
  font-weight: bold;
  line-height: 1;
}

.stat-info p {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  opacity: 0.9;
}

.clientes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.cliente-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1rem;
  transition: all 0.3s;
  cursor: pointer;
  background: white;
}

.cliente-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.cliente-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.cliente-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: bold;
}

.cliente-info h6 {
  color: #2c3e50;
}

.cliente-body {
  margin-bottom: 0.75rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  color: #64748b;
}

.info-item i {
  width: 16px;
  color: #94a3b8;
}

.cliente-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.cliente-actions {
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .clientes-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-icon {
    font-size: 2rem;
  }

  .stat-info h3 {
    font-size: 1.5rem;
  }

  .stat-info p {
    font-size: 0.75rem;
  }
}
</style>
