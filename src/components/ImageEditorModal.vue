<template>
  <b-modal
    v-model="showModal"
    title="✂️ Editar Imagen"
    size="lg"
    centered
    hide-footer
    @hidden="onHidden"
  >
    <div class="image-editor">
      <div class="cropper-container">
        <VuePictureCropper
          :boxStyle="{
            width: '100%',
            height: '400px',
            backgroundColor: '#f0f0f0',
            margin: 'auto'
          }"
          :img="imageSrc"
          :options="{
            viewMode: 1,
            dragMode: 'move',
            aspectRatio: NaN,
            autoCropArea: 0.8,
            guides: true,
            center: true,
            highlight: true,
            cropBoxMovable: true,
            cropBoxResizable: true
          }"
        />
      </div>

      <div class="editor-controls mt-3">
        <div class="btn-group me-2">
          <button class="btn btn-outline-secondary btn-sm" @click="rotate(-90)" title="Rotar izquierda">
            ↺
          </button>
          <button class="btn btn-outline-secondary btn-sm" @click="rotate(90)" title="Rotar derecha">
            ↻
          </button>
        </div>

        <div class="btn-group me-2">
          <button class="btn btn-outline-secondary btn-sm" @click="zoom(0.1)" title="Acercar">
            🔍+
          </button>
          <button class="btn btn-outline-secondary btn-sm" @click="zoom(-0.1)" title="Alejar">
            🔍-
          </button>
        </div>

        <button class="btn btn-outline-secondary btn-sm me-2" @click="reset" title="Restablecer">
          🔄 Restablecer
        </button>
      </div>

      <div class="action-buttons mt-4 d-flex justify-content-end gap-2">
        <button class="btn btn-secondary" @click="cancel">
          Cancelar
        </button>
        <button class="btn btn-primary" @click="save">
          ✅ Aplicar Recorte
        </button>
      </div>
    </div>
  </b-modal>
</template>

<script setup>
import { ref, watch } from 'vue';
import VuePictureCropper, { cropper } from 'vue-picture-cropper';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  imageSrc: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'save']);

const showModal = ref(props.modelValue);

watch(() => props.modelValue, (val) => {
  showModal.value = val;
});

watch(showModal, (val) => {
  emit('update:modelValue', val);
});

const rotate = (degree) => {
  if (cropper) {
    cropper.rotate(degree);
  }
};

const zoom = (ratio) => {
  if (cropper) {
    cropper.zoom(ratio);
  }
};

const reset = () => {
  if (cropper) {
    cropper.reset();
  }
};

const cancel = () => {
  showModal.value = false;
};

const save = async () => {
  if (cropper) {
    const dataURL = cropper.getDataURL({
      maxWidth: 1200,
      maxHeight: 1200,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    });
    
    if (dataURL) {
      emit('save', dataURL);
      showModal.value = false;
    }
  }
};

const onHidden = () => {
  // Reset on modal close
};
</script>

<style scoped>
.image-editor {
  padding: 1rem;
}

.cropper-container {
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.editor-controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.editor-controls .btn {
  min-width: 40px;
}

@media (max-width: 576px) {
  .cropper-container {
    max-height: 300px;
  }
  
  .editor-controls {
    flex-direction: column;
    align-items: center;
  }
}
</style>
