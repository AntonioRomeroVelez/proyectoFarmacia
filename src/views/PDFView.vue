<template>
  <div class="pdf-view">
    <b-container>
      <b-row>
        <b-col>
          <h2 class="mb-4">
            <i class="bi bi-file-earmark-pdf"></i> Generación de PDF
          </h2>
          <PDFGenerator />
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script setup>
import PDFGenerator from '@/components/PDFGenerator.vue'
</script>