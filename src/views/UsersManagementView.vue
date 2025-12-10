<template>
  <div class="gestion-usuarios">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="mb-1">👥 Gestión de Usuarios</h2>
        <p class="text-muted mb-0">Administra el acceso al sistema</p>
      </div>
      <b-button variant="primary" @click="abrirModalCrear">
        ➕ Nuevo Usuario
      </b-button>
    </div>

    <!-- Vista de Escritorio (Tabla) -->
    <div class="card border-0 shadow-sm d-none d-md-block">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-4">Usuario</th>
                <th>Nombre</th>
                <th>Contraseña</th>
                <th>Rol</th>
                <th>Estado</th>
                <th class="text-end pe-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td class="ps-4">
                  <div class="d-flex align-items-center gap-2">
                    <div class="user-avatar-sm">{{ user.username.charAt(0).toUpperCase() }}</div>
                    <span class="fw-medium">{{ user.username }}</span>
                  </div>
                </td>
                <td>{{ user.nombre }}</td>
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <span class="password-field">{{ showPassword[user.id] ? user.password : '••••••••' }}</span>
                    <button 
                      class="btn btn-sm btn-outline-secondary p-1" 
                      @click="togglePassword(user.id)"
                      title="Mostrar/Ocultar"
                    >
                      {{ showPassword[user.id] ? '🙈' : '👁️' }}
                    </button>
                  </div>
                </td>
                <td>
                  <span :class="user.role === 'admin' ? 'badge-admin' : 'badge-vendedor'">
                    {{ user.role === 'admin' ? 'Administrador' : 'Vendedor' }}
                  </span>
                </td>
                <td>
                  <span :class="['badge-status', user.activo ? 'status-active' : 'status-inactive']">
                    {{ user.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="text-end pe-4">
                  <div class="d-flex justify-content-end gap-2">
                    <b-button 
                      size="sm" 
                      :variant="user.activo ? 'outline-warning' : 'outline-success'"
                      @click="toggleStatus(user)"
                      :title="user.activo ? 'Deshabilitar' : 'Habilitar'"
                    >
                      {{ user.activo ? '🚫' : '✅' }}
                    </b-button>
                    <b-button 
                      size="sm" 
                      variant="outline-primary" 
                      @click="editarUsuario(user)"
                      title="Editar"
                    >
                      ✏️
                    </b-button>
                    <b-button 
                      size="sm" 
                      variant="outline-danger" 
                      @click="confirmarEliminar(user)"
                      title="Eliminar"
                    >
                      🗑️
                    </b-button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Vista Móvil (Tarjetas) -->
    <div class="d-md-none">
      <div v-for="user in users" :key="user.id" class="card border-0 shadow-sm mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div class="d-flex align-items-center gap-2">
              <div class="user-avatar-sm">{{ user.username.charAt(0).toUpperCase() }}</div>
              <div>
                <h6 class="mb-0 fw-bold">{{ user.username }}</h6>
                <small class="text-muted">{{ user.nombre }}</small>
              </div>
            </div>
            <span :class="['badge-status', user.activo ? 'status-active' : 'status-inactive']">
              {{ user.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
          
          <div class="mb-2">
            <small class="text-muted d-block mb-1">Contraseña:</small>
            <div class="d-flex align-items-center gap-2">
              <span class="password-field">{{ showPassword[user.id] ? user.password : '••••••••' }}</span>
              <button 
                class="btn btn-sm btn-outline-secondary p-1" 
                @click="togglePassword(user.id)"
              >
                {{ showPassword[user.id] ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center">
            <span :class="user.role === 'admin' ? 'badge-admin' : 'badge-vendedor'">
              {{ user.role === 'admin' ? 'Administrador' : 'Vendedor' }}
            </span>
            
            <div class="d-flex gap-2">
              <b-button 
                size="sm" 
                :variant="user.activo ? 'outline-warning' : 'outline-success'"
                @click="toggleStatus(user)"
              >
                {{ user.activo ? '🚫' : '✅' }}
              </b-button>
              <b-button 
                size="sm" 
                variant="outline-primary" 
                @click="editarUsuario(user)"
              >
                ✏️
              </b-button>
              <b-button 
                size="sm" 
                variant="outline-danger" 
                @click="confirmarEliminar(user)"
              >
                🗑️
              </b-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Crear/Editar Usuario -->
    <b-modal
      v-model="showModal"
      :title="isEditing ? 'Editar Usuario' : 'Nuevo Usuario'"
      hide-footer
      centered
    >
      <form @submit.prevent="guardarUsuario">
        <div class="mb-3">
          <label class="form-label">Nombre Completo</label>
          <input
            v-model="form.nombre"
            type="text"
            class="form-control"
            required
            placeholder="Ej: Juan Pérez"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Nombre de Usuario</label>
          <input
            v-model="form.username"
            type="text"
            class="form-control"
            required
            placeholder="Ej: jperez"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Contraseña</label>
          <input
            v-model="form.password"
            type="text"
            class="form-control"
            :required="!isEditing"
            :placeholder="isEditing ? 'Dejar en blanco para mantener actual' : 'Contraseña'"
          />
          <small v-if="isEditing" class="text-muted">
            Solo llena este campo si deseas cambiar la contraseña
          </small>
        </div>

        <div class="mb-3">
          <label class="form-label">Rol</label>
          <select v-model="form.role" class="form-select" required>
            <option value="vendedor">Vendedor</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div class="d-flex justify-content-end gap-2 mt-4">
          <b-button variant="outline-secondary" @click="showModal = false">
            Cancelar
          </b-button>
          <b-button type="submit" variant="primary">
            {{ isEditing ? 'Actualizar' : 'Crear Usuario' }}
          </b-button>
        </div>
      </form>
    </b-modal>
  </div>
</template>

<script setup>
// Vista de gestión de usuarios
import { ref, reactive } from 'vue';
import { useUsuarios } from '@/composables/useUsuarios';
import alertify from 'alertifyjs';

const { users, createUser, updateUser, toggleUserStatus, deleteUser } = useUsuarios();

const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref(null);
const showPassword = ref({}); // Para controlar visibilidad de contraseñas

const form = reactive({
  nombre: '',
  username: '',
  password: '',
  role: 'vendedor'
});

// Toggle para mostrar/ocultar contraseña
const togglePassword = (userId) => {
  showPassword.value[userId] = !showPassword.value[userId];
};

const resetForm = () => {
  form.nombre = '';
  form.username = '';
  form.password = '';
  form.role = 'vendedor';
  isEditing.value = false;
  editingId.value = null;
};

const abrirModalCrear = () => {
  resetForm();
  showModal.value = true;
};

const editarUsuario = (user) => {
  form.nombre = user.nombre;
  form.username = user.username;
  form.password = ''; // No mostramos la contraseña actual
  form.role = user.role;
  isEditing.value = true;
  editingId.value = user.id;
  showModal.value = true;
};

const guardarUsuario = async () => {
  if (isEditing.value) {
    // Si es edición y password está vacío, mantenemos el anterior
    // Esto requiere que el composable maneje esa lógica o pasemos el objeto completo
    // En este caso simple, pasamos lo que tenemos
    const userData = { ...form };
    if (!userData.password) {
      // Recuperar password anterior si no se cambió
      const oldUser = users.value.find(u => u.id === editingId.value);
      userData.password = oldUser.password;
    }
    
    if (await updateUser(editingId.value, userData)) {
      showModal.value = false;
    }
  } else {
    if (await createUser(form)) {
      showModal.value = false;
    }
  }
};

const toggleStatus = async (user) => {
  await toggleUserStatus(user.id);
};

const confirmarEliminar = (user) => {
  alertify.confirm(
    'Eliminar Usuario',
    `¿Estás seguro de eliminar al usuario <b>${user.nombre}</b>?`,
    async () => {
      await deleteUser(user.id);
    },
    () => {}
  ).set('labels', { ok: 'Sí, Eliminar', cancel: 'Cancelar' });
};
</script>

<style scoped>
.user-avatar-sm {
  width: 32px;
  height: 32px;
  background: #e9ecef;
  color: #495057;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
}

.badge-status {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.status-active {
  background-color: #d1e7dd;
  color: #0f5132;
}

.status-inactive {
  background-color: #f8d7da;
  color: #842029;
}

/* Reutilizamos estilos de badges del layout */
.badge-admin {
  font-size: 0.75rem;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 600;
  background: #28a745;
  color: white;
  display: inline-block;
}

.badge-vendedor {
  font-size: 0.75rem;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 600;
  background: #ffc107;
  color: #333;
  display: inline-block;
}

.password-field {
  font-family: monospace;
  font-size: 0.9rem;
  color: #495057;
  min-width: 80px;
}
</style>
