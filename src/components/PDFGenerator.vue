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

          <b-form-checkbox v-model="includeSummary" switch class="mt-3">
            Incluir Resumen de Totales al final (Subtotal, IVA, Total)
          </b-form-checkbox>
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
        <b-card class="mb-3 bg-light">
          <h6 class="mb-3">🔘 Seleccionar columnas para el PDF:</h6>
          <b-row>
            <b-col v-for="column in availableColumns" :key="column.key" cols="12" sm="6" md="4" lg="3" class="mb-2">
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
          <div class="table-responsive d-none d-md-block" style="max-height: 400px; overflow-y: auto">
            <b-table :items="cartWithCalculations" :fields="selectedFields" striped hover small responsive>
              <template #cell(PrecioFarmacia)="data">
                ${{ Number(data.value || 0).toFixed(2) }}
              </template>

              <template #cell(PVP)="data">
                ${{ Number(data.value || 0).toFixed(2) }}
              </template>

              <template #cell(PrecioTotal)="data">
                ${{ Number(data.value || 0).toFixed(2) }}
              </template>

              <template #cell(Subtotal)="data">
                ${{ Number(data.value || 0).toFixed(2) }}
              </template>

              <template #cell(TotalConIVA)="data">
                ${{ Number(data.value || 0).toFixed(2) }}
              </template>

              <template #cell(TotalSinIVA)="data">
                ${{ Number(data.value || 0).toFixed(2) }}
              </template>

              <template #cell(quantity)="data">
                {{ data.value }}
              </template>

              <template #cell(Cantidad a recibir)="data">
                {{ data.value }}
              </template>
            </b-table>
          </div>

          <!-- Vista Móvil (Tarjetas) -->
          <div class="d-md-none">
            <div v-for="(item, index) in cartWithCalculations" :key="index" class="mb-3">
              <b-card class="shadow-sm border-0">
                <div v-for="field in selectedFields" :key="field.key"
                  class="d-flex justify-content-between mb-2 border-bottom pb-1">
                  <span class="fw-bold text-muted small">{{ field.label }}:</span>
                  <span class="text-end small">
                    <template
                      v-if="['PrecioFarmacia', 'PVP', 'PrecioTotal', 'Subtotal', 'TotalConIVA', 'TotalSinIVA'].includes(field.key)">
                      ${{ Number(item[field.key] || 0).toFixed(2) }}
                    </template>
                    <template v-else-if="['IVA', 'Descuento'].includes(field.key)">
                      {{ item[field.key] }}%
                    </template>
                    <template v-else>
                      {{ item[field.key] }}
                    </template>
                  </span>
                </div>
              </b-card>
            </div>
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

    <!-- Modal de Datos para PDF -->
    <b-modal v-model="showPdfModal" title="📄 Datos del Documento" @ok="confirmGeneratePDF" ok-title="Generar PDF"
      cancel-title="Cancelar">
      <b-form>
        <b-form-group label="Cliente (Obligatorio):" label-for="pdf-client" class="mb-3">
          <b-form-input id="pdf-client" v-model="pdfClient" placeholder="Nombre del cliente" required></b-form-input>
        </b-form-group>

        <b-form-group label="Ciudad (Obligatorio):" label-for="pdf-city" class="mb-3">
          <b-form-input id="pdf-city" v-model="pdfCity" placeholder="Ciudad" required></b-form-input>
        </b-form-group>

        <b-form-group label="Vendedor (Obligatorio):" label-for="pdf-seller" class="mb-3">
          <b-form-select id="pdf-seller" v-model="pdfSeller" :options="sellerOptions" required></b-form-select>
        </b-form-group>

        <b-form-group label="Tipo de Documento:" label-for="pdf-type" class="mb-3">
          <b-form-select id="pdf-type" v-model="pdfType" :options="documentTypeOptions" required></b-form-select>
        </b-form-group>
      </b-form>
    </b-modal>
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
// Título personalizado para el PDF
const pdfTitle = ref("Pedido de Productos MH");
const includeSummary = ref(true);

// Datos del Modal PDF
const showPdfModal = ref(false);
const pdfClient = ref("");
const pdfCity = ref("");
const pdfSeller = ref("");
const pdfType = ref("Proforma");

const sellerOptions = [
  { value: '', text: 'Seleccione un vendedor' },
  { value: 'Diana Benalcázar', text: 'Diana Benalcázar' },
];

const documentTypeOptions = [
  { value: 'Proforma', text: 'Proforma' },
  { value: 'Pedido', text: 'Pedido' },
  { value: 'Lista de Precios', text: 'Lista de Precios' },
];

// Columnas disponibles
const availableColumns = ref([
  { key: "Marca", label: "Marca" },
  { key: "NombreProducto", label: "Nombre" },
  { key: "Presentacion", label: "Presentación" },
  { key: "PrincipioActivo", label: "Principio Activo" },
  { key: "PrecioFarmacia", label: "Precio Farmacia" },
  { key: "Descuento", label: "Descuento (%)" },
  { key: "PrecioTotal", label: "Precio Total" },
  { key: "PVP", label: "PVP" },
  { key: "IVA", label: "IVA (%)" },
  { key: "quantity", label: "Cantidad" },
  { key: "TotalConIVA", label: "Total con IVA" },
  { key: "Promocion", label: "Promocion" },
  { key: "Cantidad a recibir", label: "Cantidad a recibir" },
]);

// Columnas seleccionadas por defecto
const selectedColumns = ref([
  "Marca",
  "NombreProducto",
  "Presentacion",
  'PrincipioActivo',
  "PrecioFarmacia",
  "Descuento",
  "PrecioTotal",
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

// Carrito con cálculos para la vista previa
const cartWithCalculations = computed(() => {
  if (!cart.value) return [];
  return cart.value.map(item => {
    const precio = Number(item.PrecioFarmacia || 0);
    const cantidad = Number(item.quantity || 0);
    const iva = Number(item.IVA || 0);

    const precioTotal = precio * cantidad;

    // Calcular cantidad a recibir con promoción
    let cantidadARecibir = cantidad;
    if (item.Promocion) {
      const rules = parsePromotionRules(item.Promocion);
      if (rules.length > 0) {
        const bonus = calculateBonus(cantidad, rules);
        cantidadARecibir += bonus;
      }
    }

    return {
      ...item,
      PrecioTotal: precioTotal,
      Subtotal: precioTotal,
      TotalConIVA: precioTotal * (1 + (iva / 100)),
      TotalSinIVA: precioTotal,
      "Cantidad a recibir": cantidadARecibir
    };
  });
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

  // Abrir modal en lugar de generar directamente
  showPdfModal.value = true;
};

const confirmGeneratePDF = (bvModalEvent) => {
  if (!pdfClient.value || !pdfCity.value || !pdfSeller.value) {
    bvModalEvent.preventDefault();
    toast.warning("⚠️ Por favor complete todos los campos obligatorios");
    return;
  }

  // Preparar datos para el PDF con solo las columnas seleccionadas
  const dataForPDF = cart.value.map((item) => {
    // Calcular valores derivados
    const precio = Number(item.PrecioFarmacia || 0);
    const cantidad = Number(item.quantity || 0);
    const iva = Number(item.IVA || 0);

    const precioTotal = precio * cantidad;
    const subtotal = precioTotal;
    const totalConIVA = precioTotal * (1 + (iva / 100));
    const totalSinIVA = precioTotal;

    // Calcular cantidad a recibir con promoción
    let cantidadARecibir = cantidad;
    if (item.Promocion) {
      const rules = parsePromotionRules(item.Promocion);
      if (rules.length > 0) {
        const bonus = calculateBonus(cantidad, rules);
        cantidadARecibir += bonus;
      }
    }

    const itemWithCalculations = {
      ...item,
      PrecioTotal: precioTotal.toFixed(2),
      Subtotal: subtotal.toFixed(2),
      TotalConIVA: totalConIVA.toFixed(2),
      TotalSinIVA: totalSinIVA.toFixed(2),
      "Cantidad a recibir": cantidadARecibir
    };

    const filteredItem = {};
    selectedColumns.value.forEach((col) => {
      filteredItem[col] = itemWithCalculations[col];
    });
    return filteredItem;
  });

  // Calcular totales si se solicita
  let totals = null;
  if (includeSummary.value) {
    totals = cart.value.reduce((acc, item) => {
      const precio = Number(item.PrecioFarmacia || 0);
      const cantidad = Number(item.quantity || 0);
      const ivaRate = Number(item.IVA || 0);

      const subtotalItem = precio * cantidad;

      acc.subtotal += subtotalItem;

      if (ivaRate === 0) {
        acc.base0 += subtotalItem;
      } else {
        acc.base15 += subtotalItem;
        acc.iva += subtotalItem * (ivaRate / 100);
      }

      acc.total = acc.subtotal + acc.iva;
      return acc;
    }, { subtotal: 0, base0: 0, base15: 0, iva: 0, total: 0 });
  }

  // Generar el PDF con título personalizado y totales
  const dateStr = new Date().toISOString().split('T')[0];
  const cleanClient = pdfClient.value.replace(/\s+/g, "_");
  const fileName = `${pdfType.value}_${cleanClient}_${dateStr}.pdf`;

  generatePDFFromData(dataForPDF, fileName, {
    title: pdfType.value, // Usar el tipo de documento como título principal
    subtitle: pdfTitle.value, // El título personalizado pasa a ser subtítulo o descripción
    totals: totals,
    headerData: {
      cliente: pdfClient.value,
      ciudad: pdfCity.value,
      vendedor: pdfSeller.value,
      fecha: dateStr,
      tipo: pdfType.value
    }
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

// --- Lógica de Promociones (Duplicada de CarritoView para consistencia) ---

const parsePromotionRules = (promoString) => {
  if (!promoString) return [];
  const parts = promoString.split(' ');
  const rules = [];

  parts.forEach(part => {
    const match = part.match(/(\d+)\+(\d+)/);
    if (match) {
      rules.push({
        buy: parseInt(match[1], 10),
        get: parseInt(match[2], 10)
      });
    }
  });

  return rules.sort((a, b) => b.buy - a.buy);
};

const calculateBonus = (quantity, rules) => {
  let remaining = quantity;
  let bonus = 0;

  for (const rule of rules) {
    if (remaining >= rule.buy) {
      const times = Math.floor(remaining / rule.buy);
      bonus += times * rule.get;
      remaining %= rule.buy;
    }
  }
  return bonus;
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
