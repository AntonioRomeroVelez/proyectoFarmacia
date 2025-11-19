<template>
  <div class="excel-view">
    <b-container>
      <b-row>
        <b-col>
          <h2 class="mb-4">
            <i class="bi bi-file-earmark-excel"></i> Manejo de Archivos Excel
          </h2>
          <ExcelHandler />
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script setup>
import ExcelHandler from '@/components/ExcelHandler.vue'
</script>