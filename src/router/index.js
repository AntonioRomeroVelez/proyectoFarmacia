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

const routes = [
  {
    path: "/",
    component: AdminLayout,
    children: [
      { path: "", component: Dashboard },
      { path: "productos", component: Productos },
      { path: "editar-producto/:id", component: EditarProducto },
      { path: "excel", component: Excel },
      { path: "pdf", component: PDF },
      { path: "carrito", component: Carrito },
      { path: "visitas", component: Visitas },
      { path: "comparacion", component: Comparacion },
    ],
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
