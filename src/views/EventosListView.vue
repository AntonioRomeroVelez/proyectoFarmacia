<template>
  <div class="container-fluid py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold text-primary mb-1">📋 Todos los Eventos</h2>
        <p class="text-muted mb-0 small">Lista completa de eventos registrados</p>
      </div>
      <div class="d-flex gap-2">
        <b-button variant="success" @click="mostrarModalNuevoEvento">
          ➕ Nuevo Evento
        </b-button>
        <b-button variant="primary" @click="irAAgenda">
          📅 Ir a Agenda
        </b-button>
      </div>
    </div>

    <!-- Filtros y Estadísticas -->
    <b-card class="shadow-sm mb-4">
      <div class="d-flex flex-wrap gap-3">
        <!-- Estadísticas -->
        <span class="flex-grow-1">
          <span class="stat-card total">
            <span class="stat-icon">📊</span>
            <span class="stat-info">
              <h3>{{ totalEventos }}</h3>
              <p>Total Eventos</p>
            </span>
          </span>
        </span>
        <span class="flex-grow-1">
          <div class="stat-card pending">
            <div class="stat-icon">⏳</div>
            <div class="stat-info">
              <h3>{{ eventosPendientes }}</h3>
              <p>Pendientes</p>
            </div>
          </div>
        </span>
        <span class="flex-grow-1">
          <div class="stat-card completed">
            <div class="stat-icon">✅</div>
            <div class="stat-info">
              <h3>{{ eventosRealizados }}</h3>
              <p>Realizados</p>
            </div>
          </div>
        </span>
        <span class="flex-grow-1">
          <div class="stat-card upcoming">
            <div class="stat-icon">🔜</div>
            <div class="stat-info">
              <h3>{{ eventosProximos }}</h3>
              <p>Próximos</p>
            </div>
          </div>
        </span>
        <span class="flex-grow-1">
          <div class="stat-card overdue">
            <div class="stat-icon">⚠️</div>
            <div class="stat-info">
              <h3>{{ eventosVencidos }}</h3>
              <p>Vencidos</p>
            </div>
          </div>
        </span>
      </div>

      <!-- Filtros -->
      <div class="row g-3 mt-3">
        <div class="col-md-3">
          <label class="form-label small fw-bold">Filtrar por estado:</label>
          <select v-model="filtroEstado" class="form-select">
            <option value="todos">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="realizado">Realizados</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label small fw-bold">Filtrar por tipo:</label>
          <select v-model="filtroTipo" class="form-select">
            <option value="todos">Todos</option>
            <option value="Visita">Visita</option>
            <option value="Recordatorio">Recordatorio</option>
            <option value="Reunión">Reunión</option>
            <option value="Seguimiento">Seguimiento</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label small fw-bold">Buscar:</label>
          <input v-model="busqueda" type="text" class="form-control" placeholder="Buscar por título o descripción..." />
        </div>
        <div class="col-md-2">
          <label class="form-label small fw-bold">Ordenar:</label>
          <select v-model="ordenamiento" class="form-select">
            <option value="reciente">Más recientes</option>
            <option value="antiguo">Más antiguos</option>
            <option value="fecha-asc">Fecha (ascendente)</option>
            <option value="fecha-desc">Fecha (descendente)</option>
          </select>
        </div>
      </div>
    </b-card>

    <!-- Lista de Eventos -->
    <b-card class="shadow-sm">
      <div v-if="eventosFiltrados.length === 0" class="text-center text-muted py-5">
        <h3 class="mb-3">📭</h3>
        <p class="mb-0">No se encontraron eventos con los filtros aplicados</p>
      </div>

      <div v-else class="eventos-list">
        <div v-for="evento in eventosFiltrados" :key="evento.id" class="evento-item" :class="{
          'completado': evento.completada,
          'vencido': esEventoVencido(evento)
        }">
          <div class="evento-header">
            <div class="evento-fecha">
              <div class="fecha-dia">{{ formatearDia(evento.fecha) }}</div>
              <div class="fecha-mes">{{ formatearMes(evento.fecha) }}</div>
            </div>
            <div class="evento-contenido">
              <h5 :class="{ 'text-decoration-line-through text-muted': evento.completada }">
                {{ evento.titulo }}
              </h5>
              <p class="evento-descripcion">{{ evento.descripcion || 'Sin descripción' }}</p>
              <div class="evento-meta">
                <span class="badge" :class="getBadgeClass(evento.tipo)">
                  {{ evento.tipo }}
                </span>
                <span v-if="esEventoVencido(evento)" class="badge bg-danger ms-2">
                  ⚠️ Vencido
                </span>
                <span v-else class="badge ms-2" :class="evento.completada ? 'bg-success' : 'bg-warning text-dark'">
                  {{ evento.completada ? '✓ Realizado' : '⏳ Pendiente' }}
                </span>
                <span class="text-muted small ms-3">
                  📅 {{ formatearFechaCompleta(evento.fecha) }}
                </span>
              </div>
            </div>
          </div>
          <div class="evento-acciones">
            <b-button variant="outline-success" size="sm" @click="toggleCompletada(evento)"
              :title="evento.completada ? 'Marcar como pendiente' : 'Marcar como realizado'">
              {{ evento.completada ? '↩️' : '✓' }}
            </b-button>
            <b-button variant="outline-primary" size="sm" @click="editarEvento(evento)" title="Editar evento">
              ✏️
            </b-button>
            <b-button variant="outline-danger" size="sm" @click="confirmarEliminar(evento)" title="Eliminar evento">
              🗑️
            </b-button>
          </div>
        </div>
      </div>

      <!-- Paginación Info -->
      <div v-if="eventosFiltrados.length > 0" class="mt-3 text-center text-muted">
        <small>Mostrando {{ eventosFiltrados.length }} evento(s)</small>
      </div>
    </b-card>

    <!-- Modal Nuevo/Editar Evento -->
    <b-modal v-model="showModal" :title="eventoEditando ? 'Editar Evento' : 'Nuevo Evento'" @ok="guardarEvento"
      ok-title="Guardar" cancel-title="Cancelar">
      <b-form @submit.prevent="guardarEvento">
        <b-form-group label="Fecha:" label-for="fecha">
          <b-form-input id="fecha" v-model="formulario.fecha" type="date" required></b-form-input>
        </b-form-group>

        <b-form-group label="Tipo:" label-for="tipo">
          <b-form-select id="tipo" v-model="formulario.tipo" required>
            <option value="Visita">Visita</option>
            <option value="Recordatorio">Recordatorio</option>
            <option value="Reunión">Reunión</option>
            <option value="Seguimiento">Seguimiento</option>
          </b-form-select>
        </b-form-group>

        <b-form-group label="Título:" label-for="titulo">
          <b-form-input id="titulo" v-model="formulario.titulo" placeholder="Ej: Visita Dr. Pérez - Hospital Central"
            required></b-form-input>
        </b-form-group>

        <b-form-group label="Descripción:" label-for="descripcion">
          <b-form-textarea id="descripcion" v-model="formulario.descripcion" placeholder="Notas adicionales..."
            rows="3"></b-form-textarea>
        </b-form-group>
      </b-form>
    </b-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAgenda } from '@/composables/useAgenda';
import { useToast } from 'vue-toastification';
import alertify from 'alertifyjs';

const router = useRouter();
const toast = useToast();
const { eventos, addEvento, updateEvento, deleteEvento } = useAgenda();

// Filtros
const filtroEstado = ref('todos');
const filtroTipo = ref('todos');
const busqueda = ref('');
const ordenamiento = ref('reciente');

// Modal state
const showModal = ref(false);
const eventoEditando = ref(null);
const formulario = ref({
  fecha: '',
  tipo: 'Visita',
  titulo: '',
  descripcion: ''
});

// Computed - Estadísticas
const totalEventos = computed(() => eventos.value.length);

const eventosPendientes = computed(() =>
  eventos.value.filter(e => !e.completada).length
);

const eventosRealizados = computed(() =>
  eventos.value.filter(e => e.completada).length
);

const eventosProximos = computed(() => {
  const hoy = new Date().toISOString().split('T')[0];
  return eventos.value.filter(e => e.fecha >= hoy && !e.completada).length;
});

const eventosVencidos = computed(() => {
  const hoy = new Date().toISOString().split('T')[0];
  return eventos.value.filter(e => e.fecha < hoy && !e.completada).length;
});

// Computed - Eventos filtrados
const eventosFiltrados = computed(() => {
  let resultado = [...eventos.value];

  // Filtrar por estado
  if (filtroEstado.value === 'pendiente') {
    resultado = resultado.filter(e => !e.completada);
  } else if (filtroEstado.value === 'realizado') {
    resultado = resultado.filter(e => e.completada);
  }

  // Filtrar por tipo
  if (filtroTipo.value !== 'todos') {
    resultado = resultado.filter(e => e.tipo === filtroTipo.value);
  }

  // Filtrar por búsqueda
  if (busqueda.value.trim()) {
    const termino = busqueda.value.toLowerCase();
    resultado = resultado.filter(e =>
      e.titulo.toLowerCase().includes(termino) ||
      (e.descripcion && e.descripcion.toLowerCase().includes(termino))
    );
  }

  // Ordenar
  resultado.sort((a, b) => {
    switch (ordenamiento.value) {
      case 'reciente':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'antiguo':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'fecha-asc':
        return a.fecha.localeCompare(b.fecha);
      case 'fecha-desc':
        return b.fecha.localeCompare(a.fecha);
      default:
        return 0;
    }
  });

  return resultado;
});

// Methods
const esEventoVencido = (evento) => {
  if (evento.completada) return false;
  const hoy = new Date().toISOString().split('T')[0];
  return evento.fecha < hoy;
};
const formatearDia = (fechaStr) => {
  const [y, m, d] = fechaStr.split('-');
  return d;
};

const formatearMes = (fechaStr) => {
  const [y, m, d] = fechaStr.split('-');
  const fecha = new Date(y, m - 1, d);
  return fecha.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
};

const formatearFechaCompleta = (fechaStr) => {
  const [y, m, d] = fechaStr.split('-');
  const fecha = new Date(y, m - 1, d);
  return fecha.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const getBadgeClass = (tipo) => {
  const classes = {
    'Visita': 'bg-primary',
    'Recordatorio': 'bg-warning text-dark',
    'Reunión': 'bg-success',
    'Seguimiento': 'bg-info'
  };
  return classes[tipo] || 'bg-secondary';
};

const toggleCompletada = (evento) => {
  updateEvento(evento.id, { completada: !evento.completada });
};

const irAAgenda = () => {
  router.push('/agenda');
};

const mostrarModalNuevoEvento = () => {
  eventoEditando.value = null;
  formulario.value = {
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'Visita',
    titulo: '',
    descripcion: ''
  };
  showModal.value = true;
};

const editarEvento = (evento) => {
  eventoEditando.value = evento;
  formulario.value = {
    fecha: evento.fecha,
    tipo: evento.tipo,
    titulo: evento.titulo,
    descripcion: evento.descripcion || ''
  };
  showModal.value = true;
};

const guardarEvento = () => {
  if (!formulario.value.titulo.trim()) {
    toast.warning('El título es obligatorio');
    return;
  }

  if (eventoEditando.value) {
    updateEvento(eventoEditando.value.id, formulario.value);
  } else {
    addEvento(formulario.value);
  }

  showModal.value = false;
};

const confirmarEliminar = (evento) => {
  alertify.confirm(
    'Eliminar Evento',
    `¿Eliminar "${evento.titulo}"?`,
    () => {
      deleteEvento(evento.id);
    },
    () => { }
  ).set('labels', { ok: 'Sí, Eliminar', cancel: 'Cancelar' });
};
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 2px;
  border-radius: 12px;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-3px);
}

.stat-card.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-card.pending {
  background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
  color: #2d3436;
}

.stat-card.completed {
  background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
  color: white;
}

.stat-card.upcoming {
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
  color: white;
}

.stat-card.overdue {
  background: linear-gradient(135deg, #ff7675 0%, #d63031 100%);
  color: white;
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

.eventos-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.evento-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-left: 4px solid #667eea;
  border-radius: 8px;
  transition: all 0.3s;
}

.evento-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateX(5px);
}

.evento-item.completado {
  border-left-color: #00b894;
  background: #f8f9fa;
  opacity: 0.8;
}

.evento-item.vencido {
  border-left-color: #d63031;
  background: #fff5f5;
}

.evento-header {
  display: flex;
  gap: 1.5rem;
  flex: 1;
}

.evento-fecha {
  text-align: center;
  min-width: 60px;
}

.fecha-dia {
  font-size: 1.75rem;
  font-weight: bold;
  color: #2c3e50;
  line-height: 1;
}

.fecha-mes {
  font-size: 0.8rem;
  color: #7f8c8d;
  font-weight: 600;
  margin-top: 0.25rem;
  letter-spacing: 0.5px;
}

.evento-contenido {
  flex: 1;
}

.evento-contenido h5 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.evento-descripcion {
  color: #7f8c8d;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.evento-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.evento-acciones {
  display: flex;
  gap: 0.5rem;
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

  .stat-info p {
    font-size: 0.75rem;
  }

  .evento-header {
    flex-direction: column;
    gap: 1rem;
  }

  .evento-fecha {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .fecha-dia {
    font-size: 1.5rem;
  }

  .evento-item {
    flex-direction: column;
    gap: 1rem;
  }

  .evento-acciones {
    width: 100%;
    justify-content: flex-end;
  }

  .d-flex.gap-2 {
    flex-direction: column;
    gap: 0.5rem !important;
    width: 100%;
  }

  .d-flex.gap-2 .btn {
    width: 100%;
  }
}
</style>
