<template>
  <div class="container-fluid py-4">
    <b-card class="shadow-sm">
      <template #header>
        <div class="d-flex justify-content-between align-items-center">
          <h4 class="mb-0">✏️ Editar Producto</h4>
          <b-button variant="outline-secondary" size="sm" @click="$router.push('/productos')">
            ← Volver
          </b-button>
        </div>
      </template>

      <b-form @submit.prevent="guardarProducto">
        <b-row>
          <!-- Columna Izquierda -->
          <b-col md="6">
            <b-form-group label="Nombre del Producto:" label-for="nombre">
              <b-form-input
                id="nombre"
                v-model="form.NombreProducto"
                placeholder="Ingrese el nombre del producto"
                required
              />
            </b-form-group>

            <b-form-group label="Código:" label-for="codigo">
              <b-form-input
                id="codigo"
                v-model="form.Codigo"
                placeholder="Código del producto"
              />
            </b-form-group>

            <b-form-group label="Marca:" label-for="marca">
              <b-form-input
                id="marca"
                v-model="form.Marca"
                placeholder="Marca del producto"
              />
            </b-form-group>

            <b-form-group label="Presentación:" label-for="presentacion">
              <b-form-input
                id="presentacion"
                v-model="form.Presentacion"
                placeholder="Ej: Caja x 30 tabletas"
              />
            </b-form-group>

            <b-form-group label="Principio Activo:" label-for="principio">
              <b-form-input
                id="principio"
                v-model="form.PrincipioActivo"
                placeholder="Principio activo"
              />
            </b-form-group>
          </b-col>

          <!-- Columna Derecha -->
          <b-col md="6">
            <b-form-group label="Precio Farmacia:" label-for="precio-farmacia">
              <b-form-input
                id="precio-farmacia"
                v-model.number="form.PrecioFarmacia"
                type="number"
                step="0.01"
                placeholder="0.00"
                required
              />
            </b-form-group>

            <b-form-group label="PVP:" label-for="pvp">
              <b-form-input
                id="pvp"
                v-model.number="form.PVP"
                type="number"
                step="0.01"
                placeholder="0.00"
              />
            </b-form-group>

            <b-form-group label="Descuento (%):" label-for="descuento">
              <b-form-input
                id="descuento"
                v-model.number="form.Descuento"
                type="number"
                step="1"
                placeholder="0"
              />
            </b-form-group>

            <b-form-group label="IVA (%):" label-for="iva">
              <b-form-input
                id="iva"
                v-model.number="form.IVA"
                type="number"
                step="1"
                placeholder="0"
              />
            </b-form-group>

            <b-form-group label="Promoción:" label-for="promocion">
              <b-form-input
                id="promocion"
                v-model="form.Promocion"
                placeholder="Ej: 5+1 10+2"
              />
              <small class="text-muted">Formato: cantidad+bonificación (separar con espacios)</small>
            </b-form-group>
          </b-col>
        </b-row>

        <!-- Botones -->
        <div class="d-flex justify-content-end gap-2 mt-4">
          <b-button variant="outline-secondary" @click="$router.push('/productos')">
            Cancelar
          </b-button>
          <b-button variant="primary" type="submit">
            💾 Guardar Cambios
          </b-button>
        </div>
      </b-form>
    </b-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const form = ref({
  ID: null,
  NombreProducto: '',
  Codigo: '',
  Marca: '',
  Presentacion: '',
  PrincipioActivo: '',
  PrecioFarmacia: 0,
  PVP: 0,
  Descuento: 0,
  IVA: 0,
  Promocion: ''
})

onMounted(() => {
  const productId = route.params.id
  console.log('Route param ID:', productId, 'Type:', typeof productId)
  
  const productos = JSON.parse(localStorage.getItem('ListaProductos')) || []
  console.log('Total products:', productos.length)
  
  // Try to find product by comparing both as strings and numbers
  const producto = productos.find(p => {
    return p.ID == productId || p.ID === parseInt(productId) || String(p.ID) === String(productId)
  })
  
  console.log('Found product:', producto)

  if (producto) {
    form.value = { ...producto }
  } else {
    toast.error('Producto no encontrado')
    router.push('/productos')
  }
})

const guardarProducto = () => {
  try {
    const productos = JSON.parse(localStorage.getItem('ListaProductos')) || []
    const index = productos.findIndex(p => p.ID === form.value.ID)

    if (index !== -1) {
      productos[index] = { ...form.value }
      localStorage.setItem('ListaProductos', JSON.stringify(productos))
      toast.success('✅ Producto actualizado correctamente')
      router.push('/productos')
    } else {
      toast.error('Error al actualizar el producto')
    }
  } catch (error) {
    console.error('Error saving product:', error)
    toast.error('Error al guardar los cambios')
  }
}
</script>

<style scoped>
.gap-2 {
  gap: 0.5rem;
}
</style>
