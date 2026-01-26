<template>
  <div class="notification-settings">
    <div class="card">
      <div class="card-header">
        <h5 class="mb-0">
          <i class="bi bi-bell"></i> Configuración de Notificaciones
        </h5>
      </div>
      <div class="card-body">
        <!-- Estado de soporte -->
        <div v-if="!isSupported" class="alert alert-warning">
          <i class="bi bi-exclamation-triangle"></i>
          Las notificaciones PWA no están soportadas en este navegador.
        </div>

        <div v-else>
          <!-- Estado de permisos -->
          <div class="mb-4">
            <h6>Estado de Permisos</h6>
            <div class="d-flex align-items-center gap-3">
              <span 
                class="badge" 
                :class="permissionGranted ? 'bg-success' : 'bg-warning'"
              >
                <i :class="permissionGranted ? 'bi bi-check-circle' : 'bi bi-exclamation-circle'"></i>
                {{ permissionGranted ? 'Activadas' : 'Desactivadas' }}
              </span>
              
              <button 
                v-if="!permissionGranted"
                @click="handleRequestPermission"
                class="btn btn-primary btn-sm"
              >
                <i class="bi bi-bell-fill"></i>
                Activar Notificaciones
              </button>
            </div>
          </div>

          <!-- Información -->
          <div class="alert alert-info mb-4">
            <h6 class="alert-heading">
              <i class="bi bi-info-circle"></i> ¿Qué son las notificaciones PWA?
            </h6>
            <p class="mb-2">
              Las notificaciones te permiten recibir alertas incluso cuando la aplicación esté cerrada:
            </p>
            <ul class="mb-0">
              <li>📅 Recordatorios de eventos de agenda (15 min antes)</li>
              <li>💰 Alertas de cobros pendientes</li>
              <li>🏥 Recordatorios de visitas programadas</li>
            </ul>
          </div>

          <!-- Configuración avanzada -->
          <div v-if="permissionGranted" class="mt-4">
            <h6>Opciones</h6>
            
            <div class="form-check mb-3">
              <input 
                class="form-check-input" 
                type="checkbox" 
                v-model="settings.agendaNotifications"
                @change="saveSettings"
                id="agendaNotif"
              >
              <label class="form-check-label" for="agendaNotif">
                Notificaciones de Agenda
              </label>
            </div>

            <div class="form-check mb-3">
              <input 
                class="form-check-input" 
                type="checkbox" 
                v-model="settings.cobrosNotifications"
                @change="saveSettings"
                id="cobrosNotif"
              >
              <label class="form-check-label" for="cobrosNotif">
                Notificaciones de Cobros
              </label>
            </div>

            <div class="form-check mb-3">
              <input 
                class="form-check-input" 
                type="checkbox" 
                v-model="settings.visitasNotifications"
                @change="saveSettings"
                id="visitasNotif"
              >
              <label class="form-check-label" for="visitasNotif">
                Notificaciones de Visitas
              </label>
            </div>
          </div>

          <!-- Notificaciones programadas -->
          <div v-if="permissionGranted && scheduledNotifications.length > 0" class="mt-4">
            <h6>Notificaciones Programadas ({{ scheduledNotifications.length }})</h6>
            <div class="list-group">
              <div 
                v-for="notif in scheduledNotifications.slice(0, 5)" 
                :key="notif.id"
                class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              >
                <div>
                  <strong>{{ notif.title }}</strong>
                  <br>
                  <small class="text-muted">
                    {{ formatDate(notif.timestamp) }}
                  </small>
                </div>
                <button 
                  @click="cancelNotification(notif.id)"
                  class="btn btn-sm btn-outline-danger"
                >
                  <i class="bi bi-x"></i>
                </button>
              </div>
            </div>
            <small v-if="scheduledNotifications.length > 5" class="text-muted">
              Y {{ scheduledNotifications.length - 5 }} más...
            </small>
          </div>

          <!-- Botón de prueba -->
          <div v-if="permissionGranted" class="mt-4">
            <button 
              @click="sendTestNotification"
              class="btn btn-outline-primary w-100"
              :disabled="sending"
            >
              <i class="bi bi-send"></i>
              {{ sending ? 'Enviando...' : 'Enviar Notificación de Prueba' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useNotifications } from '@/composables/useNotifications';
import { useToast } from 'vue-toastification';

const toast = useToast();
const sending = ref(false);

const {
  isSupported,
  permissionGranted,
  scheduledNotifications,
  requestPermission,
  sendNotification,
  cancelScheduledNotification,
  loadScheduledNotifications,
} = useNotifications();

// Configuración de notificaciones
const settings = reactive({
  agendaNotifications: true,
  cobrosNotifications: true,
  visitasNotifications: true
});

// Cargar configuración guardada
const loadSettings = () => {
  const saved = localStorage.getItem('notificationSettings');
  if (saved) {
    Object.assign(settings, JSON.parse(saved));
  }
};

// Guardar configuración
const saveSettings = () => {
  localStorage.setItem('notificationSettings', JSON.stringify(settings));
  toast.success('Configuración guardada');
};

// Solicitar permisos
const handleRequestPermission = async () => {
  const granted = await requestPermission();
  if (granted) {
    toast.success('¡Notificaciones activadas!');
  } else {
    toast.error('No se pudieron activar las notificaciones');
  }
};

// Enviar notificación de prueba
const sendTestNotification = async () => {
  sending.value = true;
  try {
    await sendNotification('🔔 Notificación de Prueba', {
      body: 'Si ves esto, las notificaciones están funcionando correctamente',
      tag: 'test',
      requireInteraction: false
    });
    toast.success('Notificación enviada');
  } catch (error) {
    toast.error('Error al enviar notificación');
  } finally {
    sending.value = false;
  }
};

// Cancelar notificación
const cancelNotification = async (id) => {
  const success = await cancelScheduledNotification(id);
  if (success) {
    toast.info('Notificación cancelada');
  }
};

// Formatear fecha
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('es-ES', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
};

onMounted(() => {
  loadSettings();
  loadScheduledNotifications();
});
</script>

<style scoped>
.notification-settings {
  max-width: 600px;
  margin: 0 auto;
}

.badge {
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
}

.list-group-item {
  border-left: 3px solid var(--bs-primary);
}

.alert-heading {
  font-size: 1rem;
  margin-bottom: 0.5rem;
}
</style>
