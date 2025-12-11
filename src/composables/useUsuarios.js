import { ref, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { dbService } from '@/services/db';

const users = ref([]);
const isLoaded = ref(false);

const getDefaultUsers = () => [
  {
    username: 'romero30',
    password: 'romero_30',
    nombre: 'Antonio Romero',
    role: 'admin',
    activo: true
  },
  {
    username: 'dianita26',
    password: 'dianita_26',
    nombre: 'Dianita Benalcazar',
    role: 'admin',
    activo: true
  },
  {
    username: 'vendedor26',
    password: 'vendedor_26',
    nombre: 'Vendedor',
    role: 'vendedor',
    activo: true
  }
];

export function useUsuarios() {
  const toast = useToast();

  const loadUsers = async () => {
    try {
      const storedUsers = await dbService.getAll('usuarios');

      if (storedUsers.length === 0) {
        // Initialize with default users if empty (and migration didn't run or empty LS)
        const defaults = getDefaultUsers();
        // Add IDs and save
        const defaultsWithIds = defaults.map((u, i) => ({ ...u, id: i + 1 }));
        await dbService.bulkPut('usuarios', defaultsWithIds);
        users.value = defaultsWithIds;
      } else {
        users.value = storedUsers;
      }
      isLoaded.value = true;
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error al cargar usuarios');
    }
  };

  // Auto-load on first use if not loaded
  if (!isLoaded.value) {
    loadUsers();
  }

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
  const createUser = async (userData) => {
    if (!userData.username || !userData.password) {
      toast.warning('Datos incompletos');
      return false;
    }

    // Validar username único
    const exists = users.value.some(u => u.username === userData.username);
    if (exists) {
      toast.error('❌ El nombre de usuario ya existe');
      return false;
    }

    // Generar nuevo ID (max + 1)
    const newId = users.value.length > 0
      ? Math.max(...users.value.map(u => Number(u.id) || 0)) + 1
      : 1;

    const newUser = {
      id: newId,
      username: userData.username,
      password: userData.password, // In real app, hash this!
      nombre: userData.nombre,
      role: userData.role,
      activo: true
    };

    try {
    // Optimistic update
      users.value.push(newUser);
      await dbService.add('usuarios', newUser);
      toast.success('✅ Usuario creado correctamente');
      return true;
    } catch (e) {
      console.error('Error creating user:', e);
      toast.error('Error al guardar usuario');
      // Revert optimistic update
      const idx = users.value.findIndex(u => u.id === newUser.id);
      if (idx !== -1) users.value.splice(idx, 1);
      return false;
    }
  };

  // Actualizar usuario
  const updateUser = async (id, userData) => {
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

    const updatedUser = {
      ...users.value[index],
      username: userData.username,
      password: userData.password,
      nombre: userData.nombre,
      role: userData.role
    };

    try {
      users.value[index] = updatedUser;
      await dbService.update('usuarios', updatedUser);
      toast.success('✅ Usuario actualizado correctamente');
      return true;
    } catch (e) {
      console.error('Error updating user:', e);
      toast.error('Error al actualizar usuario');
      return false;
    }
  };

  // Deshabilitar/Habilitar usuario
  const toggleUserStatus = async (id) => {
    const user = users.value.find(u => u.id === id);
    if (!user) {
      toast.error('❌ Usuario no encontrado');
      return false;
    }

    const newStatus = !user.activo;

    try {
      user.activo = newStatus;
      await dbService.update('usuarios', { ...user });

      const statusText = newStatus ? 'habilitado' : 'deshabilitado';
      toast.success(`✅ Usuario ${statusText} correctamente`);
      return true;
    } catch (e) {
      console.error('Error toggling user status:', e);
      toast.error('Error al cambiar estado del usuario');
      // Revert
      user.activo = !newStatus;
      return false;
    }
  };

  // Eliminar usuario (permanentemente)
  const deleteUser = async (id) => {
    const index = users.value.findIndex(u => u.id === id);
    if (index === -1) {
      toast.error('❌ Usuario no encontrado');
      return false;
    }

    const deletedUser = users.value[index];

    try {
      users.value.splice(index, 1);
      await dbService.delete('usuarios', id);
      toast.success('✅ Usuario eliminado correctamente');
      return true;
    } catch (e) {
      console.error('Error deleting user:', e);
      toast.error('Error al eliminar usuario');
      // Revert
      users.value.splice(index, 0, deletedUser);
      return false;
    }
  };

  // Recargar usuarios
  const reloadUsers = async () => {
    isLoaded.value = false;
    await loadUsers();
  };

  return {
    users,
    isLoaded,
    activeUsers,
    inactiveUsers,
    getUsers,
    getUserById,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    reloadUsers,
    loadUsers
  };
}

