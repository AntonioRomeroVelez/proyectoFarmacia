<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar-open': isSidebarOpen, 'desktop-closed': !isDesktopSidebarOpen }">
      <div class="sidebar-header position-relative">
        <div class="d-flex align-items-center gap-4">
          <span class="brand-text text-center">App ventas</span>
          <button class="toggle-btn d-none d-md-block btn position-absolute top-0 end-0" @click="toggleDesktopSidebar"
            :title="isDesktopSidebarOpen ? 'Ocultar menú' : 'Mostrar menú'">
            <BIconX v-if="isDesktopSidebarOpen" />
            <BIconList v-else />
          </button>
        </div>
        <button class="close-btn d-md-none" @click="closeSidebar">×</button>
      </div>

      <!-- User Profile in Sidebar -->
      <div class="sidebar-user">
        <div class="user-avatar">{{ userInitial }}</div>
        <div class="user-info">
          <span class="user-name">Hola, {{ userName }}</span>
          <small :class="isAdmin ? 'badge-admin' : 'badge-vendedor'" class="text-center">
            {{ isAdmin ? 'Administrador' : 'Vendedor' }}
          </small>
        </div>
      </div>

      <nav class="sidebar-nav">
        <!-- Principal -->
        <router-link to="/" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-house-door-fill"></i> Inicio
        </router-link>

        <!-- Ventas -->
        <div class="nav-section-title">Ventas</div>
        <router-link to="/productos" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-box-seam"></i> Catálogo de Productos
        </router-link>
        <router-link to="/carrito" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-cart3"></i> Carrito de Compras
        </router-link>
        <router-link v-if="documents.length > 0" to="/historial" class="nav-item" active-class="active"
          @click="closeSidebarOnMobile">
          <i class="bi bi-clock-history"></i> Historial de Ventas
        </router-link>

        <!-- Gestión Comercial -->
        <div class="nav-section-title">Gestión Comercial</div>
        <router-link to="/clientes" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-people-fill"></i> Clientes
        </router-link>
        <router-link to="/visitas" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-geo-alt-fill"></i> Visitas Diarias
        </router-link>
        <router-link to="/cobros" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-cash-coin"></i> Gestión de Cobros
        </router-link>
        <router-link to="/seguimiento-ventas" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-wallet2"></i> Seguimiento de Ventas
        </router-link>

        <!-- Agenda -->
        <div class="nav-section-title">Agenda</div>
        <router-link to="/agenda" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-calendar3"></i> Calendario
        </router-link>
        <router-link to="/eventos-list" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-list-check"></i> Lista de Eventos
        </router-link>

        <!-- Reportes -->
        <div class="nav-section-title">Reportes</div>
        <router-link to="/inventario-visual" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-grid-3x3-gap-fill"></i> Inventario Visual
        </router-link>
        <router-link to="/estadisticas" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-bar-chart-fill"></i> Estadísticas
        </router-link>
        <router-link to="/pdf" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-file-earmark-pdf"></i> Generar PDF
        </router-link>

        <!-- Administración (solo admin) -->
        <template v-if="isAdmin">
          <div class="nav-section-title">Administración</div>
          <router-link to="/crear-producto" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
            <i class="bi bi-plus-circle"></i> Crear Producto
          </router-link>
          <router-link to="/excel" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
            <i class="bi bi-file-earmark-excel"></i> Importar/Exportar
          </router-link>
          <router-link to="/comparacion" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
            <i class="bi bi-diagram-3"></i> Comparar Productos
          </router-link>
          <router-link to="/usuarios" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
            <i class="bi bi-people"></i> Gestión de Usuarios
          </router-link>
          <router-link to="/backup" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
            <i class="bi bi-database"></i> Respaldo de Datos
          </router-link>
        </template>
      </nav>

      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout">
          🚪 Cerrar Sesión
        </button>
        <small class="text-muted d-block mt-2">v1.0.0</small>
      </div>
    </aside>

    <!-- Overlay for mobile -->
    <div class="sidebar-overlay" :class="{ 'show': isSidebarOpen }" @click="closeSidebar"></div>

    <!-- Vista de Menú Móvil a Pantalla Completa -->
    <Transition name="menu-fullscreen">
      <div v-if="isSidebarOpen && isMobile" class="mobile-menu-fullscreen">
        <div class="mobile-menu-container">
          <!-- Header del menú móvil -->
          <div class="mobile-menu-header">
            <div class="mobile-menu-brand">
              <span class="brand-icon">📱</span>
              <span class="brand-title">App Ventas</span>
            </div>
            <button class="mobile-menu-close" @click="closeSidebar">
              <span>×</span>
            </button>
          </div>

          <!-- Perfil de usuario -->
          <div class="mobile-menu-user">
            <div class="mobile-user-avatar">{{ userInitial }}</div>
            <div class="mobile-user-info">
              <span class="mobile-user-name">{{ userName }}</span>
              <span :class="isAdmin ? 'mobile-badge-admin' : 'mobile-badge-vendedor'">
                {{ isAdmin ? 'Administrador' : 'Vendedor' }}
              </span>
            </div>
          </div>

          <!-- Navegación -->
          <nav class="mobile-menu-nav">
            <!-- Principal -->
            <router-link to="/" class="mobile-nav-item" @click="closeSidebar">
              <i class="bi bi-house-door-fill"></i>
              <span>Inicio</span>
            </router-link>

            <div class="mobile-nav-divider">Ventas</div>
            <router-link to="/productos" class="mobile-nav-item" @click="closeSidebar">
              <i class="bi bi-box-seam"></i>
              <span>Catálogo de Productos</span>
            </router-link>
            <router-link to="/carrito" class="mobile-nav-item" @click="closeSidebar">
              <i class="bi bi-cart3"></i>
              <span>Carrito de Compras</span>
            </router-link>
            <router-link v-if="documents.length > 0" to="/historial" class="mobile-nav-item" @click="closeSidebar">
              <i class="bi bi-clock-history"></i>
              <span>Historial de Ventas</span>
            </router-link>

            <div class="mobile-nav-divider">Gestión Comercial</div>
            <router-link to="/clientes" class="mobile-nav-item" @click="closeSidebar">
              <i class="bi bi-people-fill"></i>
              <span>Clientes</span>
            </router-link>
            <router-link to="/visitas" class="mobile-nav-item" @click="closeSidebar">
              <i class="bi bi-geo-alt-fill"></i>
              <span>Visitas Diarias</span>
            </router-link>
            <router-link to="/cobros" class="mobile-nav-item" @click="closeSidebar">
              <i class="bi bi-cash-coin"></i>
              <span>Gestión de Cobros</span>
            </router-link>
            <router-link to="/seguimiento-ventas" class="mobile-nav-item" @click="closeSidebar">
              <i class="bi bi-wallet2"></i>
              <span>Seguimiento de Ventas</span>
            </router-link>

            <div class="mobile-nav-divider">Agenda</div>
            <router-link to="/agenda" class="mobile-nav-item" @click="closeSidebar">
              <i class="bi bi-calendar3"></i>
              <span>Calendario</span>
            </router-link>
            <router-link to="/eventos-list" class="mobile-nav-item" @click="closeSidebar">
              <i class="bi bi-list-check"></i>
              <span>Lista de Eventos</span>
            </router-link>

            <div class="mobile-nav-divider">Reportes</div>
            <router-link to="/inventario-visual" class="mobile-nav-item" @click="closeSidebar">
              <i class="bi bi-grid-3x3-gap-fill"></i>
              <span>Inventario Visual</span>
            </router-link>
            <router-link to="/estadisticas" class="mobile-nav-item" @click="closeSidebar">
              <i class="bi bi-bar-chart-fill"></i>
              <span>Estadísticas</span>
            </router-link>
            <router-link to="/pdf" class="mobile-nav-item" @click="closeSidebar">
              <i class="bi bi-file-earmark-pdf"></i>
              <span>Generar PDF</span>
            </router-link>

            <template v-if="isAdmin">
              <div class="mobile-nav-divider">Administración</div>
              <router-link to="/crear-producto" class="mobile-nav-item" @click="closeSidebar">
                <i class="bi bi-plus-circle"></i>
                <span>Crear Producto</span>
              </router-link>
              <router-link to="/excel" class="mobile-nav-item" @click="closeSidebar">
                <i class="bi bi-file-earmark-excel"></i>
                <span>Importar/Exportar</span>
              </router-link>
              <router-link to="/comparacion" class="mobile-nav-item" @click="closeSidebar">
                <i class="bi bi-diagram-3"></i>
                <span>Comparar Productos</span>
              </router-link>
              <router-link to="/usuarios" class="mobile-nav-item" @click="closeSidebar">
                <i class="bi bi-people"></i>
                <span>Gestión de Usuarios</span>
              </router-link>
              <router-link to="/backup" class="mobile-nav-item" @click="closeSidebar">
                <i class="bi bi-database"></i>
                <span>Respaldo de Datos</span>
              </router-link>
            </template>
          </nav>

          <!-- Footer con logout -->
          <div class="mobile-menu-footer">
            <button class="mobile-logout-btn" @click="handleLogout">
              🚪 Cerrar Sesión
            </button>
            <small class="text-muted">v1.0.0</small>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Floating Toggle Button (Mobile Only) -->
    <button class="floating-toggle d-md-none" @click="toggleSidebar" v-if="!isSidebarOpen">
      <BIconList />
    </button>

    <!-- Desktop Re-open Button -->
    <button class="desktop-toggle-btn d-none d-md-flex" @click="toggleDesktopSidebar" v-if="!isDesktopSidebarOpen"
      title="Mostrar menú">
      <BIconList />
    </button>

    <!-- Main Content Wrapper -->
    <div class="main-wrapper" :class="{ 'desktop-expanded': !isDesktopSidebarOpen }">
      <!-- Page Content -->
      <main class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { BIconList, BIconX } from 'bootstrap-icons-vue';
import { useAuth } from '@/composables/useAuth';
import { useHistorial } from '@/composables/useHistorial';

const { userName, isAdmin, logout } = useAuth();
const { documents } = useHistorial();
import { onMounted, onUnmounted } from 'vue';
import { useToast } from 'vue-toastification';

const toast = useToast();
const isSidebarOpen = ref(false);
const isDesktopSidebarOpen = ref(true);
const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value < 768);
let inactivityTimer = null;
const INACTIVITY_LIMIT = 3600000; // 1 hora en milisegundos

// Función para reiniciar el temporizador
const resetInactivityTimer = () => {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    handleInactivityLogout();
  }, INACTIVITY_LIMIT);
};

// Logout por inactividad
const handleInactivityLogout = () => {
  toast.warning("Sesión cerrada por inactividad (1 hora sin uso)");
  logout();
};

// Configurar listeners de actividad
const setupActivityListeners = () => {
  const events = ['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll', 'click'];
  events.forEach(event => {
    window.addEventListener(event, resetInactivityTimer);
  });
  resetInactivityTimer(); // Iniciar temporizador
};

// Limpiar listeners
const removeActivityListeners = () => {
  const events = ['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll', 'click'];
  events.forEach(event => {
    window.removeEventListener(event, resetInactivityTimer);
  });
  if (inactivityTimer) clearTimeout(inactivityTimer);
};

import { useAgenda } from '@/composables/useAgenda';

const { eventos } = useAgenda();

onMounted(() => {
  setupActivityListeners();

  // Listener para detectar cambios de tamaño de pantalla
  window.addEventListener('resize', () => {
    windowWidth.value = window.innerWidth;
  });

  // Verificar eventos vencidos al cargar - REMOVIDO PARA EVITAR DUPLICIDAD CON EL DASHBOARD
  // const hoy = new Date().toISOString().split('T')[0];
  // const vencidos = eventos.value.filter(e => e.fecha < hoy && !e.completada).length;

  // if (vencidos > 0) {
  //   // Pequeño delay para asegurar que la UI cargó
  //   setTimeout(() => {
  //     toast.error(`⚠️ Tienes ${vencidos} evento(s) vencido(s). Revisa tu agenda.`, {
  //       timeout: 5000,
  //       closeOnClick: true,
  //       pauseOnFocusLoss: true,
  //       pauseOnHover: true,
  //       draggable: true,
  //       draggablePercent: 0.6,
  //       showCloseButtonOnHover: false,
  //       hideProgressBar: false,
  //       closeButton: "button",
  //       icon: true,
  //       rtl: false
  //     });
  //   }, 1000);
  // }
});

onUnmounted(() => {
  removeActivityListeners();
});

const userInitial = computed(() => {
  return userName.value.charAt(0).toUpperCase();
});

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const toggleDesktopSidebar = () => {
  isDesktopSidebarOpen.value = !isDesktopSidebarOpen.value;
};

const closeSidebar = () => {
  isSidebarOpen.value = false;
};

const closeSidebarOnMobile = () => {
  if (window.innerWidth < 768) {
    closeSidebar();
  }
};

const handleLogout = () => {
  logout();
};
</script>

<style scoped>
/* Layout Variables */
:root {
  --sidebar-width: 260px;
  --primary-color: #0d6efd;
  --bg-light: #f8f9fa;
}

.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f3f4f6;
  overflow-x: hidden;
}

/* Sidebar Styles */
.sidebar {
  width: 260px;
  background: white;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1050;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  border-bottom: 1px solid #eee;
}

.brand-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0d6efd;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  padding: 0;
  line-height: 1;
}

/* Sidebar User Profile */
.sidebar-user {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: #0d6efd;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.1rem;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.sidebar-nav {
  flex: 1;
  padding: 1.5rem 1rem;
  overflow-y: auto;
}

.nav-section-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9ca3af;
  padding: 1rem 1rem 0.5rem;
  margin-top: 0.5rem;
}

.nav-section-title:first-child {
  margin-top: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: #4b5563;
  text-decoration: none;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s;
  font-weight: 500;
}

.nav-item i {
  margin-right: 0.75rem;
  font-size: 1.1rem;
}

.nav-item:hover {
  background-color: #f3f4f6;
  color: #0d6efd;
}

.nav-item.active {
  background-color: #e7f1ff;
  color: #0d6efd;
}

/* Badge Styles */
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

.sidebar-footer {
  padding: 1rem;
  text-align: center;
  border-top: 1px solid #eee;
}

.logout-btn {
  width: 100%;
  padding: 10px 16px;
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
}

.logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
  background: linear-gradient(135deg, #c82333 0%, #bd2130 100%);
}

.logout-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 4px rgba(220, 53, 69, 0.3);
}

/* Overlay */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1040;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s;
  backdrop-filter: blur(2px);
}

.sidebar-overlay.show {
  opacity: 1;
  visibility: visible;
}

/* Main Content Wrapper */
.main-wrapper {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.3s;
}

/* Mobile Header */
.mobile-header {
  height: 60px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.mobile-brand {
  font-weight: 700;
  font-size: 1.1rem;
  color: #333;
}

.toggle-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #4b5563;
  padding: 0.25rem;
  cursor: pointer;
  transition: color 0.2s;
}

.toggle-btn:hover {
  color: #0d6efd;
}

/* Content Area */
.content-area {
  padding: 1.5rem;
  flex: 1;
}

/* Floating Toggle Button */
.floating-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1040;
  background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  box-shadow: 0 8px 20px rgba(13, 110, 253, 0.4);
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  color: white !important;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
  backdrop-filter: blur(4px);
}

.floating-toggle:hover {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 12px 25px rgba(13, 110, 253, 0.5);
  background: linear-gradient(135deg, #0b5ed7 0%, #084298 100%);
}

.floating-toggle:active {
  transform: scale(0.95);
  box-shadow: 0 4px 10px rgba(13, 110, 253, 0.3);
}

/* Desktop Toggle Button (when closed) */
.desktop-toggle-btn {
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 1040;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #4b5563;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.desktop-toggle-btn:hover {
  background: #f8f9fa;
  color: #0d6efd;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Responsive Styles */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar-open {
    transform: translateX(0);
  }

  .main-wrapper {
    margin-left: 0;
  }

  /* Eliminar padding del content-area en móvil */
  .content-area {
    padding: 0.5rem !important;
  }

  .mobile-header {
    display: flex;
  }

  .floating-toggle {
    display: block;
  }
}

@media (min-width: 769px) {
  .sidebar.desktop-closed {
    transform: translateX(-100%);
  }

  .main-wrapper.desktop-expanded {
    margin-left: 0;
  }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
