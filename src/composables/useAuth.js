import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';

// Usuarios predefinidos
const USERS = [
  {
    id: 1,
    username: 'romero30',
    password: 'romero_30',
    nombre: 'Antonio Romero',
    role: 'admin'
  },
  {
    id: 2,
    username: 'dianita26',
    password: 'dianita_26',
    nombre: 'Dianita Benalcazar',
    role: 'admin'
  },
  {
    id: 3,
    username: 'vendedor26',
    password: 'vendedor_26',
    nombre: 'Vendedor',
    role: 'vendedor'
  }
];

const currentUser = ref(null);

export function useAuth() {
  const router = useRouter();
  const toast = useToast();

  // Computed properties
  const isAuthenticated = computed(() => !!currentUser.value);
  const userRole = computed(() => currentUser.value?.role || null);
  const isAdmin = computed(() => currentUser.value?.role === 'admin');
  const isVendedor = computed(() => currentUser.value?.role === 'vendedor');
  const userName = computed(() => currentUser.value?.nombre || '');

  // Verificar si hay sesión guardada al cargar
  const checkAuth = () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        currentUser.value = JSON.parse(savedUser);
        return true;
      } catch (error) {
        console.error('Error loading saved session:', error);
        localStorage.removeItem('currentUser');
        return false;
      }
    }
    return false;
  };

  // Login
  const login = (username, password) => {
    // Cargar usuarios más recientes del storage
    const storedUsers = localStorage.getItem('app_users');
    let allUsers = [];
    
    if (storedUsers) {
      allUsers = JSON.parse(storedUsers);
    } else {
      // Fallback a usuarios hardcoded si no hay nada en storage (primera vez)
      allUsers = USERS;
      // Inicializar storage si está vacío
      localStorage.setItem('app_users', JSON.stringify(USERS));
    }

    const user = allUsers.find(
      u => u.username === username && u.password === password
    );

    if (user) {
      if (user.activo === false) {
        toast.error('❌ Usuario deshabilitado. Contacte al administrador.');
        return false;
      }

      // Guardar usuario (sin contraseña)
      const { password: _, ...userWithoutPassword } = user;
      currentUser.value = userWithoutPassword;
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      
      toast.success(`¡Bienvenido, ${user.nombre}!`);
      return true;
    } else {
      toast.error('Usuario o contraseña incorrectos');
      return false;
    }
  };

  // Logout
  const logout = () => {
    currentUser.value = null;
    localStorage.removeItem('currentUser');
    toast.info('Sesión cerrada');
    router.push('/login');
  };

  // Verificar permisos
  const hasPermission = (permission) => {
    if (!currentUser.value) return false;

    const permissions = {
      admin: [
        'view_products',
        'edit_products',
        'delete_products',
        'load_excel',
        'export_data',
        'manage_firebase',
        'generate_proforma',
        'generate_pedido'
      ],
      vendedor: [
        'view_products',
        'generate_proforma',
        'generate_pedido'
      ]
    };

    return permissions[currentUser.value.role]?.includes(permission) || false;
  };

  // Inicializar al importar
  checkAuth();

  return {
    currentUser,
    isAuthenticated,
    userRole,
    isAdmin,
    isVendedor,
    userName,
    login,
    logout,
    checkAuth,
    hasPermission
  };
}
