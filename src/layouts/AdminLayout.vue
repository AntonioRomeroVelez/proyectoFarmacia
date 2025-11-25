<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar-open': isSidebarOpen, 'desktop-closed': !isDesktopSidebarOpen }">
      <div class="sidebar-header">
        <div class="d-flex align-items-center gap-4">
          <span class="brand-text">MH</span>
          <button class="toggle-btn d-none d-md-block btn" @click="toggleDesktopSidebar" title="Ocultar menú">
            <BIconList />
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
        <router-link to="/" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-house-door"></i> Dashboard
        </router-link>
        <router-link to="/productos" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-box-seam"></i> Productos
        </router-link>
        <router-link v-if="isAdmin" to="/crear-producto" class="nav-item" active-class="active"
          @click="closeSidebarOnMobile">
          <i class="bi bi-plus-circle"></i> Nuevo Producto
        </router-link>
        <router-link v-if="isAdmin" to="/usuarios" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-people"></i> Usuarios
        </router-link>
        <router-link to="/carrito" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-cart"></i> Carrito
        </router-link>
        <router-link to="/visitas" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-journal-text"></i> Visitas
        </router-link>
        <router-link v-if="isAdmin" to="/excel" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-file-earmark-excel"></i> Carga Excel
        </router-link>
        <router-link v-if="isAdmin" to="/comparacion" class="nav-item" active-class="active"
          @click="closeSidebarOnMobile">
          <i class="bi bi-diagram-3"></i> Comparación
        </router-link>
        <router-link to="/pdf" class="nav-item" active-class="active" @click="closeSidebarOnMobile">
          <i class="bi bi-file-earmark-pdf"></i> Reportes PDF
        </router-link>
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
import { BIconList } from 'bootstrap-icons-vue';
import { useAuth } from '@/composables/useAuth';

const { userName, isAdmin, logout } = useAuth();

const isSidebarOpen = ref(false);
const isDesktopSidebarOpen = ref(true);

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
