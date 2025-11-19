<template>
  <div class="pdf-generator">
    <b-card title="📄 Generador de PDF del Carrito" class="shadow-sm">
      <!-- Debug info -->
      <b-alert v-if="cart && cart.length > 0" variant="success" show class="mb-3">
        ✅ Carrito cargado: {{ cart.length }} productos
      </b-alert>

      <!-- Información del carrito -->
      <b-alert v-if="!cart || cart.length === 0" variant="warning" show>
        ⚠️ No hay productos en el carrito. Agrega productos desde la vista de
        Productos para generar un PDF.
      </b-alert>

      <div v-else>
        <!-- Resumen -->
        <div class="mb-3">
          <h5>📦 Productos en el carrito: {{ cart.length }}</h5>
          <p class="text-muted mb-0">
            Personaliza el título y selecciona las columnas para el PDF
          </p>
        </div>

        <!-- Campo de título personalizado -->
        <b-card class="mb-3 bg-light">
          <h6 class="mb-3">📝 Título del PDF:</h6>
          <b-form-group label="Escribe un título personalizado" label-for="pdf-title-input">
            <b-form-input id="pdf-title-input" v-model="pdfTitle" placeholder="" size="lg"></b-form-input>
          </b-form-group>
        </b-card>


        <!-- Botones de acción -->
        <div class="d-flex gap-2 mb-3 ">
          <b-button variant="primary" @click="generatePDF" :disabled="selectedColumns.length === 0">
            📥 Generar PDF
          </b-button>
          <b-button variant="outline-secondary" @click="handleClearCart">
            🗑️ Vaciar carrito
          </b-button>
        </div>

        <small v-if="selectedColumns.length === 0" class="text-danger d-block mt-2">
          ⚠️ Selecciona al menos una columna para generar el PDF
        </small>


        <!-- Selector de columnas -->
        <b-card v-else class="mb-3 bg-light">
          <h6 class="mb-3">🔘 Seleccionar columnas para el PDF:</h6>
          <b-row>
            <b-col v-for="column in availableColumns" :key="column.key" cols="6" md="4" lg="3" class="mb-2">
              <b-form-checkbox v-model="selectedColumns" :value="column.key" class="column-checkbox">
                {{ column.label }}
              </b-form-checkbox>
            </b-col>
          </b-row>

          <div class="mt-3 d-flex gap-2">
            <b-button variant="outline-primary" size="sm" @click="selectAllColumns">
              ✓ Seleccionar todas
            </b-button>
            <b-button variant="outline-secondary" size="sm" @click="deselectAllColumns">
              ✕ Deseleccionar todas
            </b-button>
          </div>
        </b-card>

        <!-- Vista previa de la tabla -->
        <b-card class="mb-3">
          <h6 class="mb-3">👁️ Vista previa:</h6>
          <div class="table-responsive" style="max-height: 400px; overflow-y: auto">
            <b-table :items="cart" :fields="selectedFields" striped hover small responsive>
              <template #cell(PrecioFarmacia)="data">
                ${{ Number(data.value || 0).toFixed(2) }}
              </template>

              <template #cell(PVP)="data">
                ${{ Number(data.value || 0).toFixed(2) }}
              </template>

              <template #cell(quantity)="data">
                {{ data.value }}
              </template>
            </b-table>
          </div>
        </b-card>

        <!-- Totales -->
        <b-card class="mb-3 bg-light">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-0">💰 Total del pedido:</h5>
            <h4 class="mb-0 text-success">
              ${{ totalCarrito.toFixed(2) }}
            </h4>
          </div>
        </b-card>


      </div>
    </b-card>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useCart } from "@/composables/useCart";
import { usePDFGenerator } from "@/utils/pdfGenerator";
import { useToast } from "vue-toastification";

const { cart, clearCart } = useCart();
const { generatePDFFromData } = usePDFGenerator();
const toast = useToast();

// Título personalizado para el PDF
const pdfTitle = ref("Pedido de Productos - Farmacia");

// Columnas disponibles
const availableColumns = ref([
  { key: "Marca", label: "Marca" },
  { key: "NombreProducto", label: "Nombre" },
  { key: "Presentacion", label: "Presentación" },
  { key: "PrincipioActivo", label: "Principio Activo" },
  { key: "PrecioFarmacia", label: "Precio Farmacia" },
  { key: "Descuento", label: "Descuento (%)" },
  { key: "PVP", label: "PVP" },
  { key: "IVA", label: "IVA (%)" },
  { key: "quantity", label: "Cantidad" },
  { key: "Codigo", label: "Código" },
]);

// Columnas seleccionadas por defecto
const selectedColumns = ref([
  "Marca",
  "NombreProducto",
  "Presentacion",
  'PrincipioActivo',
  "PrecioFarmacia",
  "Descuento",
]);

// Campos para la tabla basados en la selección
const selectedFields = computed(() => {
  return availableColumns.value
    .filter((col) => selectedColumns.value.includes(col.key))
    .map((col) => ({
      key: col.key,
      label: col.label,
      sortable: true,
    }));
});

// Total del carrito
const totalCarrito = computed(() => {
  if (!cart.value || !Array.isArray(cart.value)) return 0;
  return cart.value.reduce((total, item) => {
    const price = item.PrecioFarmacia || 0;
    const qty = item.quantity || 0;
    return total + price * qty;
  }, 0);
});

// Seleccionar todas las columnas
const selectAllColumns = () => {
  selectedColumns.value = availableColumns.value.map((col) => col.key);
};

// Deseleccionar todas las columnas
const deselectAllColumns = () => {
  selectedColumns.value = [];
};

// Generar PDF
const generatePDF = () => {
  if (selectedColumns.value.length === 0) {
    toast.warning("⚠️ Selecciona al menos una columna para el PDF");
    return;
  }

  if (!cart.value || cart.value.length === 0) {
    toast.error("❌ No hay productos en el carrito");
    return;
  }

  // Preparar datos para el PDF con solo las columnas seleccionadas
  const dataForPDF = cart.value.map((item) => {
    const filteredItem = {};
    selectedColumns.value.forEach((col) => {
      filteredItem[col] = item[col];
    });
    return filteredItem;
  });

  // Generar el PDF con título personalizado
  const fileName = `pedido-${new Date().toISOString().split('T')[0]}.pdf`;
  generatePDFFromData(dataForPDF, fileName, {
    title: pdfTitle.value || "Pedido de Productos - Farmacia"
  });
};

// Limpiar carrito con confirmación toast
let pdfClearCartConfirmation = false;
const handleClearCart = () => {
  if (pdfClearCartConfirmation) {
    clearCart();
    toast.success("🗑️ Carrito vaciado");
    pdfClearCartConfirmation = false;
  } else {
    pdfClearCartConfirmation = true;
    toast.warning(
      "⚠️ ¿Vaciar el carrito?\n\nHaz clic nuevamente en 'Vaciar carrito' para confirmar.",
      { timeout: 5000 }
    );
    setTimeout(() => {
      pdfClearCartConfirmation = false;
    }, 5000);
  }
};
</script>

<style scoped>
.column-checkbox {
  font-size: 0.9rem;
}

.column-checkbox:hover {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 2px 4px;
}
</style>