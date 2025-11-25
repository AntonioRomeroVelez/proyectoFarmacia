import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';

const STORAGE_KEY = 'app_users';

// Función para cargar usuarios desde localStorage
const loadUsers = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('Error loading users:', error);
      return getDefaultUsers();
    }
  }
  return getDefaultUsers();
};

// Usuarios por defecto
const getDefaultUsers = () => [
  {
    id: 1,
    username: 'romero30',
    password: 'romero_30',
    nombre: 'Antonio Romero',
    role: 'admin',
    activo: true
  },
  {
    id: 2,
    username: 'dianita26',
    password: 'dianita_26',
    nombre: 'Dianita Benalcazar',
    role: 'admin',
    activo: true
  },
  {
    id: 3,
    username: 'vendedor26',
    password: 'vendedor_26',
    nombre: 'Vendedor',
    role: 'vendedor',
    activo: true
  }
];

const users = ref(loadUsers());

// Guardar usuarios en localStorage
const saveUsers = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users.value));
};

export function useUsuarios() {
  const toast = useToast();

  // Computed
  const activeUsers = computed(() => users.value.filter(u => u.activo));
  const inactiveUsers = computed(() => users.value.filter(u => !u.activo));

  // Obtener todos los usuarios
  const getUsers = () => {
    return users.value;
  };

  // Obtener usuario por ID
  const getUserById = (id) => {
    return users.value.find(u => u.id === id);
  };

  // Crear nuevo usuario
  const createUser = (userData) => {
    // Validar username único
    const exists = users.value.some(u => u.username === userData.username);
    if (exists) {
      toast.error('❌ El nombre de usuario ya existe');
      return false;
    }

    // Generar nuevo ID
    const newId = Math.max(...users.value.map(u => u.id), 0) + 1;

    const newUser = {
      id: newId,
      username: userData.username,
      password: userData.password,
      nombre: userData.nombre,
      role: userData.role,
      activo: true
    };

    users.value.push(newUser);
    saveUsers();
    toast.success('✅ Usuario creado correctamente');
    return true;
  };

  // Actualizar usuario
  const updateUser = (id, userData) => {
    const index = users.value.findIndex(u => u.id === id);
    if (index === -1) {
      toast.error('❌ Usuario no encontrado');
      return false;
    }

    // Validar username único (excepto el mismo usuario)
    const exists = users.value.some(
      u => u.username === userData.username && u.id !== id
    );
    if (exists) {
      toast.error('❌ El nombre de usuario ya existe');
      return false;
    }

    users.value[index] = {
      ...users.value[index],
      username: userData.username,
      password: userData.password,
      nombre: userData.nombre,
      role: userData.role
    };

    saveUsers();
    toast.success('✅ Usuario actualizado correctamente');
    return true;
  };

  // Deshabilitar/Habilitar usuario
  const toggleUserStatus = (id) => {
    const user = users.value.find(u => u.id === id);
    if (!user) {
      toast.error('❌ Usuario no encontrado');
      return false;
    }

    user.activo = !user.activo;
    saveUsers();
    
    const status = user.activo ? 'habilitado' : 'deshabilitado';
    toast.success(`✅ Usuario ${status} correctamente`);
    return true;
  };

  // Eliminar usuario (permanentemente)
  const deleteUser = (id) => {
    const index = users.value.findIndex(u => u.id === id);
    if (index === -1) {
      toast.error('❌ Usuario no encontrado');
      return false;
    }

    users.value.splice(index, 1);
    saveUsers();
    toast.success('✅ Usuario eliminado correctamente');
    return true;
  };

  // Recargar usuarios
  const reloadUsers = () => {
    users.value = loadUsers();
  };

  return {
    users,
    activeUsers,
    inactiveUsers,
    getUsers,
    getUserById,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    reloadUsers
  };
}
