import { createRouter, createWebHistory } from "vue-router";

import AdminLayout from "@/layouts/AdminLayout.vue";

import Dashboard from "@/views/Dashboard.vue";
import Productos from "@/views/ProductosView.vue";
import EditarProducto from "@/views/EditarProductoView.vue";
import Excel from "@/views/ExcelView.vue";
import PDF from "@/views/PDFView.vue";
import Carrito from "@/views/CarritoView.vue";
import Visitas from "@/views/VisitasView.vue";
import Comparacion from "@/views/ComparacionProductosView.vue";
import Login from "@/views/LoginView.vue";
import Historial from "@/views/HistorialView.vue";
import Agenda from "@/views/AgendaView.vue";
import Cobros from "@/views/CobrosView.vue";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { public: true }
  },
  {
    path: "/",
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      { path: "", component: Dashboard },
      { path: "productos", component: Productos },
      {
        path: "editar-producto/:id",
        component: EditarProducto,
        meta: { requiresAdmin: true }
      },
      {
        path: "excel",
        component: Excel,
        meta: { requiresAdmin: true }
      },
      { path: "pdf", component: PDF },
      { path: "carrito", component: Carrito },
      { path: "historial", component: Historial },
      { path: "agenda", component: Agenda },
      { path: "cobros", component: Cobros },
      { path: "visitas", component: Visitas },
      {
        path: "comparacion",
        component: Comparacion,
        meta: { requiresAdmin: true }
      },
      {
        path: "crear-producto",
        component: () => import("@/views/NewProductView.vue"),
        meta: { requiresAdmin: true }
      },
      {
        path: "usuarios",
        component: () => import("@/views/UsersManagementView.vue"),
        meta: { requiresAdmin: true }
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation Guard
router.beforeEach((to, from, next) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === 'admin';

  // Si la ruta es pública, permitir acceso
  if (to.meta.public) {
    // Si está autenticado y va al login, redirigir a productos
    if (isAuthenticated && to.path === '/login') {
      next('/productos');
    } else {
      next();
    }
    return;
  }

  // Si la ruta requiere autenticación
  if (to.meta.requiresAuth || to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      next('/login');
      return;
    }
  }

  // Si la ruta requiere admin
  if (to.meta.requiresAdmin) {
    if (!isAdmin) {
      next('/productos'); // Redirigir a productos si no es admin
      return;
    }
  }

  next();
});

export default router;
