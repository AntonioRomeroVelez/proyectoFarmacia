<template>
  <div class="crear-producto">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="mb-1">📦 Nuevo Producto</h2>
        <p class="text-muted mb-0">Agrega un nuevo producto al inventario</p>
      </div>
      <b-button variant="outline-secondary" @click="$router.push('/productos')">
        ← Volver
      </b-button>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-body p-4">
        <form @submit.prevent="guardarProducto">
          <div class="row g-3">
            <!-- Código y Marca -->
            <div class="col-md-6">
              <label class="form-label">Código <span class="text-danger">*</span></label>
              <input v-model="form.Codigo" type="text" class="form-control" required placeholder="Ej: ABC001" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Marca <span class="text-danger">*</span></label>
              <input v-model="form.Marca" type="text" class="form-control" required placeholder="Ej: Pfizer" />
            </div>

            <!-- Nombre y Presentación -->
            <div class="col-md-6">
              <label class="form-label">Nombre del Producto <span class="text-danger">*</span></label>
              <input v-model="form.NombreProducto" type="text" class="form-control" required
                placeholder="Ej: Paracetamol" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Presentación</label>
              <input v-model="form.Presentacion" type="text" class="form-control"
                placeholder="Ej: Caja x 10 tabletas" />
            </div>

            <!-- Principio Activo -->
            <div class="col-12">
              <label class="form-label">Principio Activo</label>
              <input v-model="form.PrincipioActivo" type="text" class="form-control"
                placeholder="Ej: Paracetamol 500mg" />
            </div>

            <hr class="my-4">
            <h5 class="mb-3">Precios e Impuestos</h5>

            <!-- Precios -->
            <div class="col-md-4">
              <label class="form-label">Precio Farmacia <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input v-model.number="form.PrecioFarmacia" type="number" step="0.001" min="0" class="form-control"
                  required />
              </div>
            </div>
            <div class="col-md-4">
              <label class="form-label">PVP <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text">$</span>
                <input v-model.number="form.PVP" type="number" step="0.001" min="0" class="form-control" required />
              </div>
            </div>
            <div class="col-md-4">
              <label class="form-label">IVA (%) <span class="text-danger">*</span></label>
              <select v-model.number="form.IVA" class="form-select" required>
                <option :value="0">0%</option>
                <option :value="15">15%</option>
              </select>
            </div>

            <!-- Descuento y Promoción -->
            <div class="col-md-6">
              <label class="form-label">Descuento (%)</label>
              <input v-model.number="form.Descuento" type="number" step="0.01" min="0" max="100" class="form-control" />
            </div>
            <div class="col-md-6">
              <label class="form-label">Promoción</label>
              <input v-model="form.Promocion" type="text" class="form-control" placeholder="Ej: 2+1" />
            </div>
            <div class="col-12">
              <label class="form-label">Observación</label>
              <textarea v-model="form.Observacion" class="form-control" rows="2"
                placeholder="Detalles adicionales..."></textarea>
            </div>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4">
            <b-button variant="outline-secondary" @click="$router.push('/productos')">
              Cancelar
            </b-button>
            <b-button type="submit" variant="primary" :disabled="loading">
              {{ loading ? 'Guardando...' : '💾 Guardar Producto' }}
            </b-button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useProductos } from '@/composables/useProductos';

const router = useRouter();
const toast = useToast();
const loading = ref(false);
const { productos, addProducto, loadProductos, loaded } = useProductos();

const form = reactive({
  Codigo: '',
  Marca: '',
  NombreProducto: '',
  Presentacion: '',
  PrincipioActivo: '',
  PrecioFarmacia: 0,
  PVP: 0,
  IVA: 0,
  Descuento: 0,
  Promocion: '',
  Observacion: ''
});

const guardarProducto = async () => {
  loading.value = true;

  try {
    // Asegurar que los productos estén cargados para validar correctamente
    if (!loaded.value) {
      await loadProductos();
    }

    // Validar código único
    if (productos.value.some(p => p.Codigo === form.Codigo)) {
      toast.error('❌ Ya existe un producto con este código');
      loading.value = false;
      return;
    }

    // Generar nuevo ID
    let maxId = 0;
    if (productos.value.length > 0) {
      productos.value.forEach(p => {
        const idNum = typeof p.ID === 'number' ? p.ID : parseInt(p.ID);
        if (!isNaN(idNum) && idNum > maxId) {
          maxId = idNum;
        }
      });
    }

    const newProduct = {
      ID: maxId + 1,
      ...form,
      isDuplicate: false
    };

    await addProducto(newProduct);

    toast.success('✅ Producto creado correctamente');
    router.push('/productos');
  } catch (error) {
    console.error('Error al guardar producto:', error);
    toast.error('❌ Error al guardar el producto. Intenta de nuevo.');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.form-label {
  font-weight: 500;
  font-size: 0.9rem;
  color: #495057;
}

.card {
  border-radius: 12px;
}
</style>
