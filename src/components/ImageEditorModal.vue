<template>
  <b-modal v-model="showModal" title="✂️ Editar Imagen" size="lg" centered hide-footer @hidden="onHidden">
    <div class="image-editor">
      <div class="cropper-container">
        <VuePictureCropper :boxStyle="cropperBoxStyle" :img="imageSrc" :options="{
          viewMode: 2,
            dragMode: 'move',
            aspectRatio: NaN,
            autoCropArea: 0.8,
            guides: true,
            center: true,
            highlight: true,
            cropBoxMovable: true,
  cropBoxResizable: true,
  minContainerWidth: 280,
  minContainerHeight: 200
}" />
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
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import VuePictureCropper, { cropper } from 'vue-picture-cropper';

const isMobile = ref(window.innerWidth <= 576);

const updateIsMobile = () => {
  isMobile.value = window.innerWidth <= 576;
};

onMounted(() => {
  window.addEventListener('resize', updateIsMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile);
});

const cropperBoxStyle = computed(() => ({
  width: '100%',
  height: isMobile.value ? '50vh' : '400px',
  backgroundColor: '#f0f0f0',
  margin: 'auto'
}));

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
  padding: 0.5rem;
}

.cropper-container {
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
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
  .image-editor {
      padding: 0.25rem;
    }
  .cropper-container {
    border-radius: 4px;
  }

  .editor-controls {
    flex-direction: row;
    align-items: center;
    gap: 0.25rem;
    }
    
    .editor-controls .btn {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
  }
}
</style>
