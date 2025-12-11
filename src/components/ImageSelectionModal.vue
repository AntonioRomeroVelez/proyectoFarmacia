<template>
  <b-modal
    v-model="showModal"
    title="📸 Seleccionar Imágenes para PDF"
    size="xl"
    centered
    hide-footer
    @show="onShow"
  >
    <!-- Date Filters -->
    <div class="filter-section mb-4">
      <div class="row g-3 align-items-end">
        <div class="col-12 col-md-4">
          <label class="form-label fw-bold">📅 Fecha Inicio</label>
          <input 
            type="date" 
            class="form-control" 
            v-model="fechaInicio"
            @change="applyFilters"
          />
        </div>
        <div class="col-12 col-md-4">
          <label class="form-label fw-bold">📅 Fecha Fin</label>
          <input 
            type="date" 
            class="form-control" 
            v-model="fechaFin"
            @change="applyFilters"
          />
        </div>
        <div class="col-12 col-md-4">
          <button class="btn btn-outline-secondary w-100" @click="clearFilters">
            🔄 Limpiar Filtros
          </button>
        </div>
      </div>
    </div>

    <!-- Selection Controls -->
    <div class="selection-controls mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
      <div>
        <span class="badge bg-primary me-2">{{ selectedCount }} seleccionadas</span>
        <span class="badge bg-secondary">{{ filteredImages.length }} disponibles</span>
      </div>
      <div class="btn-group">
        <button class="btn btn-outline-primary btn-sm" @click="selectAll">
          ✅ Seleccionar Todas
        </button>
        <button class="btn btn-outline-secondary btn-sm" @click="deselectAll">
          ⬜ Deseleccionar Todas
        </button>
      </div>
    </div>

    <!-- Images Grid -->
    <div v-if="filteredImages.length === 0" class="text-center text-muted py-5">
      <p class="fs-4">📭</p>
      <p>No hay imágenes en el rango de fechas seleccionado</p>
    </div>

    <div v-else class="images-grid">
      <div 
        v-for="(item, index) in filteredImages" 
        :key="index"
        class="image-card"
        :class="{ 'selected': item.selected }"
      >
        <div class="image-preview" @click="toggleSelection(index)">
          <img :src="item.editedImage || item.image" alt="Comprobante" />
          <div class="selection-overlay">
            <input 
              type="checkbox" 
              :checked="item.selected"
              @click.stop="toggleSelection(index)"
            />
          </div>
          <div v-if="item.edited" class="edited-badge">
            ✂️ Editada
          </div>
        </div>
        
        <div class="image-info">
          <small class="text-muted d-block">{{ item.fecha }}</small>
          <small class="fw-bold text-success">${{ Number(item.cantidad).toFixed(2) }}</small>
          <small class="d-block text-truncate" :title="item.cliente">{{ item.cliente }}</small>
        </div>

        <button 
          class="btn btn-outline-primary btn-sm w-100 mt-2" 
          @click="editImage(index)"
        >
          ✂️ Editar
        </button>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons mt-4 pt-3 border-top d-flex justify-content-end gap-2">
      <button class="btn btn-secondary" @click="cancel">
        Cancelar
      </button>
      <button 
        class="btn btn-success" 
        @click="exportSelected"
        :disabled="selectedCount === 0"
      >
        📄 Exportar {{ selectedCount }} Imagen(es) a PDF
      </button>
    </div>

    <!-- Image Editor Modal -->
    <ImageEditorModal
      v-model="showEditor"
      :image-src="currentEditImage"
      @save="onImageEdited"
    />
  </b-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import ImageEditorModal from './ImageEditorModal.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  cobros: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue', 'export']);

const showModal = ref(props.modelValue);
const fechaInicio = ref('');
const fechaFin = ref('');
const allImages = ref([]);
const showEditor = ref(false);
const currentEditImage = ref('');
const currentEditIndex = ref(-1);

watch(() => props.modelValue, (val) => {
  showModal.value = val;
});

watch(showModal, (val) => {
  emit('update:modelValue', val);
});

const onShow = () => {
  // Flatten all images from cobros
  allImages.value = [];
  props.cobros.forEach(cobro => {
    const imagenes = cobro.imagenes && cobro.imagenes.length > 0
      ? cobro.imagenes
      : (cobro.imagen ? [cobro.imagen] : []);
    
    imagenes.forEach(img => {
      allImages.value.push({
        image: img,
        editedImage: null,
        edited: false,
        selected: true, // Select all by default
        fecha: cobro.fecha,
        cantidad: cobro.cantidad,
        cliente: cobro.cliente,
        cobroId: cobro.id
      });
    });
  });
  
  // Set default date range (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  fechaFin.value = today.toISOString().split('T')[0];
  fechaInicio.value = thirtyDaysAgo.toISOString().split('T')[0];
};

const filteredImages = computed(() => {
  if (!fechaInicio.value && !fechaFin.value) {
    return allImages.value;
  }
  
  return allImages.value.filter(item => {
    const itemDate = item.fecha;
    if (fechaInicio.value && itemDate < fechaInicio.value) return false;
    if (fechaFin.value && itemDate > fechaFin.value) return false;
    return true;
  });
});

const selectedCount = computed(() => {
  return filteredImages.value.filter(img => img.selected).length;
});

const applyFilters = () => {
  // Filters are reactive, no action needed
};

const clearFilters = () => {
  fechaInicio.value = '';
  fechaFin.value = '';
};

const selectAll = () => {
  filteredImages.value.forEach(img => {
    img.selected = true;
  });
};

const deselectAll = () => {
  filteredImages.value.forEach(img => {
    img.selected = false;
  });
};

const toggleSelection = (index) => {
  filteredImages.value[index].selected = !filteredImages.value[index].selected;
};

const editImage = (index) => {
  currentEditIndex.value = index;
  const item = filteredImages.value[index];
  currentEditImage.value = item.editedImage || item.image;
  showEditor.value = true;
};

const onImageEdited = (croppedImage) => {
  if (currentEditIndex.value >= 0) {
    const item = filteredImages.value[currentEditIndex.value];
    item.editedImage = croppedImage;
    item.edited = true;
    item.selected = true;
  }
};

const cancel = () => {
  showModal.value = false;
};

const exportSelected = () => {
  const selectedImages = filteredImages.value
    .filter(img => img.selected)
    .map(img => ({
      image: img.editedImage || img.image,
      fecha: img.fecha,
      cantidad: img.cantidad,
      cliente: img.cliente
    }));
  
  emit('export', selectedImages);
  showModal.value = false;
};
</script>

<style scoped>
.filter-section {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
}

.image-card {
  background: white;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  padding: 0.5rem;
  transition: all 0.2s;
}

.image-card.selected {
  border-color: #0d6efd;
  box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.25);
}

.image-preview {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 4px;
  cursor: pointer;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.selection-overlay {
  position: absolute;
  top: 5px;
  left: 5px;
}

.selection-overlay input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.edited-badge {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
}

.image-info {
  margin-top: 0.5rem;
  font-size: 0.8rem;
}

@media (max-width: 576px) {
  .images-grid {
    grid-template-columns: repeat(2, 1fr);
    max-height: 300px;
  }
}
</style>
