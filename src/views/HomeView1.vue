<template>
  <div class="home">
    <b-container>
      <b-row class="text-center mb-5">
        <b-col>
          <h1 class="display-4">Bienvenido a Vue 3 App</h1>
          <p class="lead">
            Aplicación con Composition API, BootstrapVue 3 y utilidades
            avanzadas
          </p>
        </b-col>
      </b-row>

      <b-row>
        <b-col md="6" class="mb-4">
          <b-card class="h-100 shadow-sm">
            <template #header>
              <h5 class="mb-0">
                <b-icon-file-earmark-excel /> Manejo de Excel
              </h5>
            </template>
            <p>Lee y exporta archivos Excel con facilidad</p>
            <b-button variant="success" to="/excel"> Ir a Excel </b-button>
          </b-card>
        </b-col>

        <b-col md="6" class="mb-4">
          <b-card class="h-100 shadow-sm">
            <template #header>
              <h5 class="mb-0">
                <b-icon-file-earmark-pdf /> Generación de PDF
              </h5>
            </template>
            <p>Genera y descarga documentos PDF</p>
            <b-button variant="primary" to="/pdf"> Ir a PDF </b-button>
          </b-card>
        </b-col>

        <b-col md="6" class="mb-4">
          <b-card class="h-100 shadow-sm">
            <template #header>
              <h5 class="mb-0">
                <b-icon-file-earmark-pdf /> Ver los productos
              </h5>
            </template>
            <p>Listar los productos registrados</p>
            <b-button variant="warning" to="/productos"> Productos </b-button>
          </b-card>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script setup>
// Vista principal
</script>
