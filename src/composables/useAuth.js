import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toastification";
import { useUsuarios } from "./useUsuarios";

// Configuración de inactividad
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hora en milisegundos
const WARNING_TIME = 60 * 1000; // 1 minuto en milisegundos

const currentUser = ref(null);
const showInactivityWarning = ref(false);
const remainingSeconds = ref(60);

export function useAuth() {
  const router = useRouter();
  const toast = useToast();
  // We use useUsuarios inside login to avoid early initialization issues or circular deps if any,
  // but it's safe to import here as useUsuarios doesn't import useAuth.

  // Computed properties
  const isAuthenticated = computed(() => !!currentUser.value);
  const userRole = computed(() => currentUser.value?.role || null);
  const isAdmin = computed(() => currentUser.value?.role === "admin");
  const isVendedor = computed(() => currentUser.value?.role === "vendedor");
  const userName = computed(() => currentUser.value?.nombre || "");

  // Verificar si hay sesión guardada al cargar
  const checkAuth = () => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        currentUser.value = userObj;
        return true;
      } catch (error) {
        console.error("Error loading saved session:", error);
        localStorage.removeItem("currentUser");
        return false;
      }
    }
    return false;
  };

  // Variables para temporizadores
  let inactivityTimer = null;
  let warningTimer = null;
  let countdownInterval = null;

  // Función para resetear el temporizador de inactividad
  const resetInactivityTimer = () => {
    // Solo funciona si hay usuario autenticado
    if (!currentUser.value) return;

    // Guardar timestamp de última actividad para PWA
    localStorage.setItem('lastActivityTime', Date.now().toString());

    // Limpiar temporizadores existentes
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (warningTimer) clearTimeout(warningTimer);
    if (countdownInterval) clearInterval(countdownInterval);

    // Ocultar advertencia si está visible
    showInactivityWarning.value = false;
    remainingSeconds.value = 60;

    // Configurar nuevo temporizador de advertencia
    warningTimer = setTimeout(() => {
      startWarningCountdown();
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    // Configurar temporizador de cierre forzado
    inactivityTimer = setTimeout(() => {
      forceLogout();
    }, INACTIVITY_TIMEOUT);
  };

  // Función para iniciar el countdown de advertencia
  const startWarningCountdown = () => {
    showInactivityWarning.value = true;
    remainingSeconds.value = 60;

    countdownInterval = setInterval(() => {
      remainingSeconds.value--;
      if (remainingSeconds.value <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
  };

  // Función para cerrar sesión forzadamente
  const forceLogout = () => {
    if (countdownInterval) clearInterval(countdownInterval);
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (warningTimer) clearTimeout(warningTimer);

    showInactivityWarning.value = false;
    currentUser.value = null;
    localStorage.removeItem("currentUser");
    localStorage.removeItem("lastActivityTime");

    // Remover listeners
    removeInactivityListeners();

    toast.warning("⏱️ Sesión cerrada por inactividad");

    // Forzar recarga completa hacia el login
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
  };

  // Función para cancelar la advertencia
  const dismissWarning = () => {
    showInactivityWarning.value = false;
    resetInactivityTimer();
    toast.success("✅ Sesión extendida");
  };

  // Función para verificar tiempo transcurrido (para PWA)
  const checkElapsedTime = () => {
    if (!currentUser.value) return;

    const lastActivity = localStorage.getItem('lastActivityTime');
    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity);

      // Si pasó el tiempo de inactividad, cerrar sesión
      if (elapsed >= INACTIVITY_TIMEOUT) {
        forceLogout();
        return;
      }

      // Si está cerca del límite, mostrar advertencia
      const timeUntilWarning = INACTIVITY_TIMEOUT - WARNING_TIME - elapsed;
      if (timeUntilWarning <= 0 && elapsed < INACTIVITY_TIMEOUT) {
        // Calcular segundos restantes
        const secondsRemaining = Math.ceil((INACTIVITY_TIMEOUT - elapsed) / 1000);
        remainingSeconds.value = secondsRemaining;
        startWarningCountdown();
      }
    }
  };

  // Listener para cuando la app vuelve a estar visible (PWA)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      checkElapsedTime();
    }
  };

  // Configurar listeners de actividad
  const setupInactivityListeners = () => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Agregar listener de visibilidad para PWA
    document.addEventListener('visibilitychange', handleVisibilityChange);
  };

  // Remover listeners de actividad
  const removeInactivityListeners = () => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((event) => {
      window.removeEventListener(event, resetInactivityTimer);
    });

    // Remover listener de visibilidad
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };

  // Login
  const login = async (username, password) => {
    // Usar useUsuarios para obtener la lista de usuarios (asegura carga e inicialización)
    const { users, isLoaded, loadUsers } = useUsuarios();

    if (!isLoaded.value) {
      await loadUsers();
    }

    const user = users.value.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      if (user.activo === false) {
        toast.error("❌ Usuario deshabilitado. Contacte al administrador.");
        return false;
      }

      // Guardar usuario (sin contraseña)
      const { password: _, ...userWithoutPassword } = user;
      currentUser.value = userWithoutPassword;
      localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword));

      // Iniciar sistema de inactividad
      setupInactivityListeners();
      resetInactivityTimer();

      toast.success(`¡Bienvenido, ${user.nombre}!`);
      return true;
    } else {
      toast.error("Usuario o contraseña incorrectos");
      return false;
    }
  };

  // Logout
  const logout = () => {
    // Limpiar temporizadores
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (warningTimer) clearTimeout(warningTimer);
    if (countdownInterval) clearInterval(countdownInterval);

    // Remover listeners
    removeInactivityListeners();

    currentUser.value = null;
    localStorage.removeItem("currentUser");
    localStorage.removeItem("lastActivityTime");
    showInactivityWarning.value = false;

    toast.info("Sesión cerrada");
    router.push("/login");
  };

  // Verificar permisos
  const hasPermission = (permission) => {
    if (!currentUser.value) return false;

    const permissions = {
      admin: [
        "view_products",
        "edit_products",
        "delete_products",
        "load_excel",
        "export_data",
        "manage_firebase",
        "generate_proforma",
        "generate_pedido",
      ],
      vendedor: ["view_products", "generate_proforma", "generate_pedido"],
    };

    return permissions[currentUser.value.role]?.includes(permission) || false;
  };

  // Inicializar al importar
  checkAuth();

  // Si hay sesión guardada, iniciar sistema de inactividad
  if (currentUser.value) {
    setupInactivityListeners();
    resetInactivityTimer();
  }

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
    hasPermission,
    showInactivityWarning,
    remainingSeconds,
    dismissWarning,
  };
}

