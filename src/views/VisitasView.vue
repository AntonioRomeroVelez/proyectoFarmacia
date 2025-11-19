<template>
 <div class="container-fluid py-4">
  <div class="d-flex justify-content-between align-items-center mb-4">
   <h2 class="fw-bold text-primary mb-0">
    📝 Registro de Visitas Diarias
   </h2>
   <b-button variant="success" @click="copiarParaWhatsApp" :disabled="visitas.length === 0">
    📋 Copiar para WhatsApp
   </b-button>
  </div>

  <!-- Formulario de nueva visita -->
  <b-card class="shadow-sm mb-4">
   <h5 class="mb-3">{{ editandoIndex !== null ? '✏️ Editar Visita' : '➕ Nueva Visita' }}</h5>
   <b-form @submit.prevent="agregarOActualizarVisita">
    <b-row>
     <b-col md="12">
      <b-form-group label="Lugar de Visita:" label-for="lugar">
       <b-form-textarea id="lugar" v-model="nuevaVisita.lugar" placeholder="Ej: Farmacia San José, Calle Principal #123"
        rows="3" required></b-form-textarea>
      </b-form-group>
     </b-col>
     <b-col md="12">
      <b-form-group label="Observación:" label-for="observacion">
       <b-form-textarea id="observacion" v-model="nuevaVisita.observacion"
        placeholder="Ej: Cliente interesado en productos de promoción..." rows="3" required></b-form-textarea>
      </b-form-group>
     </b-col>
    </b-row>
    <div class="d-flex gap-2">
     <b-button type="submit" variant="primary">
      {{ editandoIndex !== null ? '💾 Actualizar' : '➕ Agregar Visita' }}
     </b-button>
     <b-button v-if="editandoIndex !== null" variant="outline-secondary" @click="cancelarEdicion">
      ✕ Cancelar
     </b-button>
    </div>
   </b-form>
  </b-card>

  <!-- Lista de visitas -->
  <b-card class="shadow-sm" v-if="visitas.length > 0">
   <div class="d-flex justify-content-between align-items-center mb-3">
    <h5 class="mb-0">📋 Visitas Registradas ({{ visitas.length }})</h5>
    <b-button variant="outline-danger" size="sm" @click="borrarTodasLasVisitas">
     🗑️ Borrar Todas
    </b-button>
   </div>

   <div class="row g-3">
    <div v-for="(visita, index) in visitas" :key="index" class="col-12 col-md-12 col-lg-6">
     <b-card class="h-100 visita-card">
      <template #header>
       <div class="d-flex justify-content-between align-items-start">
        <strong class="text-primary">Visita #{{ index + 1 }}</strong>
        <div class="d-flex gap-1">
         <b-button variant="outline-primary" size="sm" @click="editarVisita(index)">
          ✏️
         </b-button>
         <b-button variant="outline-danger" size="sm" @click="eliminarVisita(index)">
          🗑️
         </b-button>
        </div>
       </div>
      </template>

      <div class="mb-2">
       <strong class="text-muted small">📍 Lugar:</strong>
       <p class="mb-0 mt-1">{{ visita.lugar }}</p>
      </div>

      <div>
       <strong class="text-muted small">💬 Observación:</strong>
       <p class="mb-0 mt-1 text-muted">{{ visita.observacion }}</p>
      </div>

      <template #footer>
       <small class="text-muted">
        🕒 {{ formatearFecha(visita.fecha) }}
       </small>
      </template>
     </b-card>
    </div>
   </div>
  </b-card>

  <!-- Estado vacío -->
  <b-card v-else class="text-center py-5 shadow-sm">
   <div style="font-size: 4rem; color: #6c757d;">📝</div>
   <h5 class="text-muted mt-3">No hay visitas registradas</h5>
   <p class="text-muted mb-0">Completa el formulario para agregar tu primera visita</p>
  </b-card>
 </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';

const toast = useToast();

// Estado
const visitas = ref([]);
const nuevaVisita = ref({
 lugar: '',
 observacion: ''
});
const editandoIndex = ref(null);

// Cargar visitas desde localStorage
onMounted(() => {
 const visitasGuardadas = localStorage.getItem('VisitasDiarias');
 if (visitasGuardadas) {
  visitas.value = JSON.parse(visitasGuardadas);
 }
});

// Guardar en localStorage
const guardarEnLocalStorage = () => {
 localStorage.setItem('VisitasDiarias', JSON.stringify(visitas.value));
};

// Agregar o actualizar visita
const agregarOActualizarVisita = () => {
 if (!nuevaVisita.value.lugar.trim() || !nuevaVisita.value.observacion.trim()) {
  toast.warning('⚠️ Por favor completa todos los campos');
  return;
 }

 if (editandoIndex.value !== null) {
  // Actualizar visita existente
  visitas.value[editandoIndex.value] = {
   ...nuevaVisita.value,
   fecha: visitas.value[editandoIndex.value].fecha // Mantener fecha original
  };
  toast.success('✅ Visita actualizada correctamente');
  editandoIndex.value = null;
 } else {
  // Agregar nueva visita
  visitas.value.push({
   ...nuevaVisita.value,
   fecha: new Date().toISOString()
  });
  toast.success('✅ Visita agregada correctamente');
 }

 // Limpiar formulario
 nuevaVisita.value = {
  lugar: '',
  observacion: ''
 };

 guardarEnLocalStorage();
};

// Editar visita
const editarVisita = (index) => {
 editandoIndex.value = index;
 nuevaVisita.value = {
  lugar: visitas.value[index].lugar,
  observacion: visitas.value[index].observacion
 };

 // Scroll al formulario
 window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Cancelar edición
const cancelarEdicion = () => {
 editandoIndex.value = null;
 nuevaVisita.value = {
  lugar: '',
  observacion: ''
 };
};

// Eliminar visita con confirmación toast
let deleteConfirmation = null;
const eliminarVisita = (index) => {
 if (deleteConfirmation === index) {
  visitas.value.splice(index, 1);
  guardarEnLocalStorage();
  toast.success('🗑️ Visita eliminada');
  deleteConfirmation = null;
 } else {
  deleteConfirmation = index;
  toast.warning(
   `⚠️ ¿Eliminar visita #${index + 1}?\n\nHaz clic nuevamente en eliminar para confirmar.`,
   { timeout: 5000 }
  );
  setTimeout(() => {
   deleteConfirmation = null;
  }, 5000);
 }
};

// Borrar todas las visitas
let deleteAllConfirmation = false;
const borrarTodasLasVisitas = () => {
 if (deleteAllConfirmation) {
  visitas.value = [];
  guardarEnLocalStorage();
  toast.success('🗑️ Todas las visitas han sido eliminadas');
  deleteAllConfirmation = false;
 } else {
  deleteAllConfirmation = true;
  toast.warning(
   `⚠️ ¿Eliminar TODAS las ${visitas.value.length} visitas?\n\nHaz clic nuevamente en 'Borrar Todas' para confirmar.`,
   { timeout: 5000 }
  );
  setTimeout(() => {
   deleteAllConfirmation = false;
  }, 5000);
 }
};

// Copiar para WhatsApp
const copiarParaWhatsApp = () => {
 if (visitas.value.length === 0) {
  toast.warning('⚠️ No hay visitas para copiar');
  return;
 }

 // Formato: cada visita en una línea separada
 const texto = visitas.value
  .map(v => `${v.lugar}: ${v.observacion}`)
  .join('\n');

 // Copiar al portapapeles
 navigator.clipboard.writeText(texto)
  .then(() => {
   toast.success('📋 Visitas copiadas al portapapeles\n\nYa puedes pegarlas en WhatsApp');
  })
  .catch(() => {
   toast.error('❌ Error al copiar al portapapeles');
  });
};

// Formatear fecha
const formatearFecha = (fechaISO) => {
 const fecha = new Date(fechaISO);
 return fecha.toLocaleString('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
 });
};
</script>

<style scoped>
.visita-card {
 transition: transform 0.2s, box-shadow 0.2s;
}

.visita-card:hover {
 transform: translateY(-2px);
 box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.gap-2 {
 gap: 0.5rem;
}
</style>
