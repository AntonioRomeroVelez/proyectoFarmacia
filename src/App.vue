<template>
  <div id="app" class="bg-light min-vh-100">
    <!-- Contenido principal -->
    <b-container fluid class="">
      <router-view />
    </b-container>
  </div>
</template>

<script setup>
// No necesitamos nada aquí ahora, el login y usuario están en AdminLayout
</script>

<style>
/* =============================== */
/*    ESTILO GENERAL DEL SITIO     */
/* =============================== */

#app {
  font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #333;
}

/* Prevent pull-to-refresh on mobile */
html,
body {
  overscroll-behavior-y: none;
}

/* Eliminar padding en móvil */
@media (max-width: 768px) {
  #app .container-fluid {
    padding-left: 0 !important;
    padding-right: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  /* También eliminar padding de las vistas */
  .container-fluid.py-4 {
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }
}

/* =============================== */
/*    BOTONES MINIMALISTAS         */
/* =============================== */

.btn {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #dee2e6;
  transition: all 0.3s ease;
  font-weight: 500;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.btn-outline-secondary {
  background-color: white;
  border-color: #6c757d;
  color: #6c757d;
}

.btn-outline-secondary:hover {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}

.btn-outline-primary {
  background-color: white;
  border-color: #0d6efd;
  color: #0d6efd;
}

.btn-outline-primary:hover {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: white;
}

.btn-outline-danger {
  background-color: white;
  border-color: #dc3545;
  color: #dc3545;
}

.btn-outline-danger:hover {
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
}

.btn-outline-success {
  background-color: white;
  border-color: #198754;
  color: #198754;
}

.btn-outline-success:hover {
  background-color: #198754;
  border-color: #198754;
  color: white;
}

.btn-primary {
  background-color: #0d6efd;
  border-color: #0d6efd;
  color: white;
}

.btn-primary:hover {
  background-color: #0b5ed7;
  border-color: #0a58ca;
}

.card {
  border-radius: 12px;
  border: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
</style>
