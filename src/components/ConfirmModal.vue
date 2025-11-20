<template>
  <b-modal
    :id="id"
    :title="title"
    hide-footer
    centered
  >
    <p>{{ message }}</p>
    
    <template #footer>
      <div class="d-flex justify-content-end gap-2 w-100">
        <b-button variant="outline-secondary" @click="handleCancel">
          Cancelar
        </b-button>
        <b-button variant="danger" @click="handleConfirm">
          Confirmar
        </b-button>
      </div>
    </template>
  </b-modal>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'Confirmar acción'
  },
  message: {
    type: String,
    default: '¿Estás seguro de que deseas realizar esta acción?'
  }
});

const emit = defineEmits(['confirm', 'cancel']);

const handleConfirm = () => {
  emit('confirm');
  // Cerrar el modal
  const modalElement = document.getElementById(props.id);
  if (modalElement) {
    const bootstrapModal = window.bootstrap.Modal.getInstance(modalElement);
    if (bootstrapModal) {
      bootstrapModal.hide();
    }
  }
};

const handleCancel = () => {
  emit('cancel');
  // Cerrar el modal
  const modalElement = document.getElementById(props.id);
  if (modalElement) {
    const bootstrapModal = window.bootstrap.Modal.getInstance(modalElement);
    if (bootstrapModal) {
      bootstrapModal.hide();
    }
  }
};
</script>

<style scoped>
.gap-2 {
  gap: 0.5rem;
}
</style>
