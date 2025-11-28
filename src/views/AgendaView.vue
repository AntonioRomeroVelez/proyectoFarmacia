<template>
  <div class="container-fluid py-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="fw-bold text-primary mb-1">📅 Agenda y Planificador</h2>
        <p class="text-muted mb-0 small">Organiza tus visitas y recordatorios</p>
      </div>
      <b-button variant="primary" @click="mostrarModalNuevoEvento">
        ➕ Nuevo Evento
      </b-button>
    </div>

    <!-- Calendar Navigation -->
    <b-card class="shadow-sm mb-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <b-button variant="outline-secondary" size="sm" @click="mesAnterior">
          ‹ Anterior
        </b-button>
        <h5 class="mb-0 fw-bold">{{ mesActualTexto }}</h5>
        <b-button variant="outline-secondary" size="sm" @click="mesSiguiente">
          Siguiente ›
        </b-button>
      </div>

      <!-- Calendar Grid (Desktop) -->
      <div class="calendar-grid d-none d-md-grid">
        <div v-for="dia in diasSemana" :key="dia" class="calendar-header">
          {{ dia }}
        </div>
        <div
          v-for="dia in diasDelMes"
          :key="dia.fecha"
          class="calendar-day"
          :class="{
            'other-month': !dia.mesActual,
            'today': dia.esHoy,
            'selected': dia.fecha === fechaSeleccionada,
            'has-events': tieneEventos(dia.fecha)
          }"
          @click="seleccionarDia(dia)"
        >
          <div class="day-number">{{ dia.numero }}</div>
          <div v-if="tieneEventos(dia.fecha)" class="event-indicator">
            <span class="badge bg-primary rounded-circle">{{ contarEventos(dia.fecha) }}</span>
          </div>
        </div>
      </div>

      <!-- Calendar List (Mobile) -->
      <div class="d-md-none">
        <div class="mb-2 text-center text-muted">
          <small>Toca un día para ver o agregar eventos</small>
        </div>
        <div class="mobile-days-grid">
          <div
            v-for="dia in diasDelMesActual"
            :key="dia.fecha"
            class="mobile-day-item"
            :class="{
              'today': dia.esHoy,
              'selected': dia.fecha === fechaSeleccionada,
              'has-events': tieneEventos(dia.fecha)
            }"
            @click="seleccionarDia(dia)"
          >
            <div class="mobile-day-number">{{ dia.numero }}</div>
            <div class="mobile-day-name">{{ getNombreDia(dia.fecha) }}</div>
            <div v-if="tieneEventos(dia.fecha)" class="mobile-event-count">
              <span class="badge bg-primary rounded-pill">{{ contarEventos(dia.fecha) }}</span>
            </div>
          </div>
        </div>
      </div>
    </b-card>

    <!-- Eventos del Día Seleccionado -->
    <b-card v-if="fechaSeleccionada" class="shadow-sm">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0">📋 Eventos del {{ formatearFechaDia(fechaSeleccionada) }}</h5>
        <b-button size="sm" variant="outline-primary" @click="mostrarModalNuevoEvento">
          ➕ Agregar
        </b-button>
      </div>

      <div v-if="eventosDiaSeleccionado.length === 0" class="text-center text-muted py-4">
        <p class="mb-0">No hay eventos programados para este día</p>
      </div>

      <div v-else class="list-group">
        <div
          v-for="evento in eventosDiaSeleccionado"
          :key="evento.id"
          class="list-group-item"
          :class="{ 'bg-light': evento.completada }"
        >
          <div class="d-flex justify-content-between align-items-start">
            <div class="flex-grow-1">
              <h6 class="mb-1" :class="{ 'text-decoration-line-through text-muted': evento.completada }">
                {{ evento.titulo }}
              </h6>
              <p class="mb-1 text-muted small">{{ evento.descripcion }}</p>
              <small class="text-muted">
                <span class="badge" :class="getBadgeClass(evento.tipo)">{{ evento.tipo }}</span>
                <span v-if="evento.completada" class="badge bg-success ms-1">✓ Hecho</span>
                <span v-else class="badge bg-warning text-dark ms-1">Pendiente</span>
              </small>
            </div>
            <div class="d-flex gap-1">
              <b-button
                variant="outline-success"
                size="sm"
                @click="toggleCompletada(evento)"
                :title="evento.completada ? 'Marcar como pendiente' : 'Marcar como hecho'"
              >
                {{ evento.completada ? '↩️' : '✓' }}
              </b-button>
              <b-button variant="outline-primary" size="sm" @click="editarEvento(evento)">
                ✏️
              </b-button>
              <b-button variant="outline-danger" size="sm" @click="confirmarEliminar(evento)">
                🗑️
              </b-button>
            </div>
          </div>
        </div>
      </div>
    </b-card>

    <!-- Modal Nuevo/Editar Evento -->
    <b-modal
      v-model="showModal"
      :title="eventoEditando ? 'Editar Evento' : 'Nuevo Evento'"
      @ok="guardarEvento"
      ok-title="Guardar"
      cancel-title="Cancelar"
    >
      <b-form @submit.prevent="guardarEvento">
        <b-form-group label="Fecha:" label-for="fecha">
          <b-form-input
            id="fecha"
            v-model="formulario.fecha"
            type="date"
            required
          ></b-form-input>
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
          <b-form-input
            id="titulo"
            v-model="formulario.titulo"
            placeholder="Ej: Visita Dr. Pérez - Hospital Central"
            required
          ></b-form-input>
        </b-form-group>

        <b-form-group label="Descripción:" label-for="descripcion">
          <b-form-textarea
            id="descripcion"
            v-model="formulario.descripcion"
            placeholder="Notas adicionales..."
            rows="3"
          ></b-form-textarea>
        </b-form-group>
      </b-form>
    </b-modal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAgenda } from '@/composables/useAgenda';
import { useToast } from 'vue-toastification';
import alertify from 'alertifyjs';

const toast = useToast();
const { eventos, addEvento, updateEvento, deleteEvento, getEventosPorFecha } = useAgenda();

// Estado
const mesActual = ref(new Date().getMonth());
const anioActual = ref(new Date().getFullYear());
const fechaSeleccionada = ref(null);
const showModal = ref(false);
const eventoEditando = ref(null);

const formulario = ref({
  fecha: '',
  tipo: 'Visita',
  titulo: '',
  descripcion: ''
});

const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Computed
const mesActualTexto = computed(() => {
  const fecha = new Date(anioActual.value, mesActual.value);
  return fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
});

const diasDelMes = computed(() => {
  const primerDia = new Date(anioActual.value, mesActual.value, 1);
  const ultimoDia = new Date(anioActual.value, mesActual.value + 1, 0);
  const diasPrevios = primerDia.getDay();
  
  const dias = [];
  
  // Días del mes anterior
  const ultimoDiaMesAnterior = new Date(anioActual.value, mesActual.value, 0).getDate();
  for (let i = diasPrevios - 1; i >= 0; i--) {
    const numero = ultimoDiaMesAnterior - i;
    const fecha = new Date(anioActual.value, mesActual.value - 1, numero);
    dias.push({
      numero,
      fecha: formatearFecha(fecha),
      mesActual: false,
      esHoy: false
    });
  }
  
  // Días del mes actual
  for (let i = 1; i <= ultimoDia.getDate(); i++) {
    const fecha = new Date(anioActual.value, mesActual.value, i);
    const hoy = new Date();
    dias.push({
      numero: i,
      fecha: formatearFecha(fecha),
      mesActual: true,
      esHoy: fecha.toDateString() === hoy.toDateString()
    });
  }
  
  // Días del mes siguiente
  const diasRestantes = 42 - dias.length;
  for (let i = 1; i <= diasRestantes; i++) {
    const fecha = new Date(anioActual.value, mesActual.value + 1, i);
    dias.push({
      numero: i,
      fecha: formatearFecha(fecha),
      mesActual: false,
      esHoy: false
    });
  }
  
  return dias;
});

const diasDelMesConEventos = computed(() => {
  return diasDelMes.value.filter(dia => dia.mesActual && tieneEventos(dia.fecha));
});

const diasDelMesActual = computed(() => {
  return diasDelMes.value.filter(dia => dia.mesActual);
});

const eventosDiaSeleccionado = computed(() => {
  if (!fechaSeleccionada.value) return [];
  return getEventosPorFecha(fechaSeleccionada.value).sort((a, b) => {
    if (a.completada !== b.completada) return a.completada ? 1 : -1;
    return a.createdAt > b.createdAt ? -1 : 1;
  });
});

// Methods
const formatearFecha = (fecha) => {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatearFechaDia = (fechaStr) => {
  if (!fechaStr) return '';
  const [y, m, d] = fechaStr.split('-');
  const fecha = new Date(y, m - 1, d);
  return fecha.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
};

const tieneEventos = (fecha) => {
  return getEventosPorFecha(fecha).length > 0;
};

const contarEventos = (fecha) => {
  return getEventosPorFecha(fecha).length;
};

const getNombreDia = (fechaStr) => {
  if (!fechaStr) return '';
  const [y, m, d] = fechaStr.split('-');
  const fecha = new Date(y, m - 1, d);
  return fecha.toLocaleDateString('es-ES', { weekday: 'short' });
};

const seleccionarDia = (dia) => {
  if (!dia.mesActual) {
    // Si es de otro mes, navegar a ese mes
    if (dia.numero > 15) {
      mesAnterior();
    } else {
      mesSiguiente();
    }
  }
  fechaSeleccionada.value = dia.fecha;
};

const mesAnterior = () => {
  if (mesActual.value === 0) {
    mesActual.value = 11;
    anioActual.value--;
  } else {
    mesActual.value--;
  }
};

const mesSiguiente = () => {
  if (mesActual.value === 11) {
    mesActual.value = 0;
    anioActual.value++;
  } else {
    mesActual.value++;
  }
};

const mostrarModalNuevoEvento = () => {
  eventoEditando.value = null;
  formulario.value = {
    fecha: fechaSeleccionada.value || formatearFecha(new Date()),
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
    descripcion: evento.descripcion
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
  fechaSeleccionada.value = formulario.value.fecha;
};

const toggleCompletada = (evento) => {
  updateEvento(evento.id, { completada: !evento.completada });
};

const confirmarEliminar = (evento) => {
  alertify.confirm(
    'Eliminar Evento',
    `¿Eliminar "${evento.titulo}"?`,
    () => {
      deleteEvento(evento.id);
    },
    () => {}
  ).set('labels', { ok: 'Sí, Eliminar', cancel: 'Cancelar' });
};

const getBadgeClass = (tipo) => {
  const classes = {
    'Visita': 'bg-primary',
    'Recordatorio': 'bg-warning',
    'Reunión': 'bg-success',
    'Seguimiento': 'bg-info'
  };
  return classes[tipo] || 'bg-secondary';
};

// Seleccionar hoy al cargar
fechaSeleccionada.value = formatearFecha(new Date());
</script>

<style scoped>
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #dee2e6;
  border: 1px solid #dee2e6;
}

.calendar-header {
  background-color: #f8f9fa;
  padding: 0.5rem;
  text-align: center;
  font-weight: bold;
  font-size: 0.875rem;
  color: #6c757d;
}

.calendar-day {
  background-color: white;
  padding: 0.5rem;
  min-height: 80px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.calendar-day:hover {
  background-color: #f8f9fa;
}

.calendar-day.other-month {
  background-color: #f8f9fa;
  color: #adb5bd;
}

.calendar-day.today {
  background-color: #fff3cd;
  font-weight: bold;
}

.calendar-day.selected {
  background-color: #cfe2ff;
  border: 2px solid #0d6efd;
}

.calendar-day.has-events {
  background-color: #d1ecf1;
}

.day-number {
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
}

.event-indicator {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
}

.event-indicator .badge {
  width: 20px;
  height: 20px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}

.cursor-pointer {
  cursor: pointer;
}

.list-group-item {
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
}

.gap-1 {
  gap: 0.25rem;
}

/* Mobile Day Grid */
.mobile-days-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
}

.mobile-day-item {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  padding: 0.75rem 0.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.mobile-day-item:active {
  transform: scale(0.95);
}

.mobile-day-item.today {
  background-color: #fff3cd;
  border-color: #ffc107;
}

.mobile-day-item.selected {
  background-color: #cfe2ff;
  border-color: #0d6efd;
  border-width: 2px;
}

.mobile-day-item.has-events {
  background-color: #d1ecf1;
  border-color: #0dcaf0;
}

.mobile-day-number {
  font-size: 1.25rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.mobile-day-name {
  font-size: 0.7rem;
  color: #6c757d;
  text-transform: uppercase;
}

.mobile-event-count {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
}

.mobile-event-count .badge {
  font-size: 0.65rem;
  padding: 0.15rem 0.35rem;
}
</style>
