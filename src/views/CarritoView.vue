<template>
  <div class="container-fluid py-2">
    <div class="d-flex justify-content-center align-items-center mb-2 flex-wrap">
      <h2 class="fw-bold text-primary mb-0 m-2">
        Productos pedidos
      </h2>
      <router-link to="/productos">
        <b-button variant="outline-primary" size="sm" class="m-2">
          ← Seguir comprando
        </b-button>
      </router-link>
    </div>

    <!-- Estado vacío -->
    <b-card v-if="cart.length === 0" class="text-center py-5 shadow-sm">
      <div style="font-size: 4rem; color: #6c757d;">🛒</div>
      <h5 class="text-muted mt-3">Tu carrito está vacío</h5>
      <p class="text-muted mb-3">Agrega productos desde la página de productos</p>
      <router-link to="/productos">
        <b-button variant="primary">
          Ver Productos
        </b-button>
      </router-link>
    </b-card>

    <!-- Contenido del carrito -->
    <div v-else>
      <!-- Resumen de totales -->
      <b-row>
        <b-col md="12">
          <b-card class="shadow-sm bg-light mb-4">
            <h5 class="mb-3">Resumen de la Venta</h5>
            <div class="d-flex justify-content-between mb-2">
              <span>Subtotal (sin IVA):</span>
              <strong>${{ cartSubtotal.toFixed(3) }}</strong>
            </div>
            <div class="d-flex justify-content-between mb-2">
              <span>Total IVA:</span>
              <strong class="text-info">${{ cartTotalIVA.toFixed(3) }}</strong>
            </div>
            <hr />
            <div class="d-flex justify-content-between mb-3">
              <strong class="fs-5">Total Global:</strong>
              <strong class="fs-5 text-success">${{ cartTotal.toFixed(3) }}</strong>
            </div>
            <div class="d-flex justify-content-center mb-3 gap-2 flex-wrap">
              <b-button variant="btn-minimal-success" class="btn-minimal btn-minimal-success"
                @click="prepararExportacion('proforma')">
                Proforma Excel
              </b-button>

              <b-button variant="btn-minimal-primary" class="btn-minimal btn-minimal-primary"
                @click="prepararExportacion('pedido')">
                Pedido Excel
              </b-button>

              <b-button variant="btn-minimal-warning" class="btn-minimal btn-minimal-warning"
                @click="prepararExportacion('pdf')">
                Lista Precio PDF
              </b-button>
            </div>
          </b-card>
        </b-col>
      </b-row>

      <!-- Productos en tarjetas -->
      <b-card class="shadow-sm mb-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="mb-0">🛍️ Productos en el Carrito ({{ cartCount }} items)</h5>
          <b-button variant="outline-danger" size="sm" @click="handleClearCart">
            Vaciar Producto de carrito
          </b-button>
        </div>

        <div class="row g-3">
          <div v-for="item in cartItemsWithPromotions" :key="item.ID" class="col-12 col-md-6 col-lg-4">
            <b-card class="cart-item-card h-100">
              <!-- Header -->
              <template #header>
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 class="mb-1 fw-bold text-primary">{{ item.NombreProducto }}</h6>
                    <small class="text-muted">{{ item.Marca }} - {{ item.Presentacion }}</small>
                  </div>
                  <b-button variant="outline-danger" size="sm" @click="removeFromCart(item.ID)"
                    title="Eliminar producto">
                    ✕
                  </b-button>
                </div>
              </template>

              <!-- Body -->
              <div class="cart-item-details">
                <!-- Código y IVA -->
                <div class="d-flex justify-content-between mb-2">
                  <b-badge variant="info">IVA: {{ item.IVA }}%</b-badge>
                </div>

                <!-- Precio unitario -->
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <span class="text-muted">Precio Unitario:</span>
                  <strong class="text-success fs-5">${{ Number(item.PrecioFarmacia).toFixed(3) }}</strong>
                </div>

                <!-- Control de cantidad -->
                <div class="quantity-control mb-3">
                  <label class="form-label small text-muted">Cantidad:</label>
                  <div class="d-flex justify-content-center align-items-center gap-2">
                    <b-button variant="outline-secondary" size="sm" @click="updateQuantity(item.ID, item.quantity - 1)">
                      −
                    </b-button>
                    <span class="quantity-display">{{ item.quantity }}</span>
                    <b-button variant="outline-secondary" size="sm" @click="updateQuantity(item.ID, item.quantity + 1)">
                      +
                    </b-button>
                  </div>
                  <!-- Promoción Display -->
                  <div v-if="item.promotionDetails" class="mt-2 text-center">
                    <b-badge variant="success" class="w-100 py-2" style="white-space: normal;">
                      🎉 Recibes: {{ item.promotionDetails.totalReceived }}
                      <br>
                      <small>({{ item.quantity }} pagados + {{ item.promotionDetails.bonus }} gratis)</small>
                    </b-badge>
                    <small class="text-muted d-block mt-1" style="font-size: 0.75rem;">
                      Promo: {{ item.Promocion || 'N/A' }}
                    </small>
                  </div>
                </div>

                <!-- Desglose de precios -->
                <div class="price-breakdown">
                  <div class="d-flex justify-content-between mb-1">
                    <small class="text-muted">Subtotal:</small>
                    <small>${{ item.subtotalItem.toFixed(3) }}</small>
                  </div>
                  <div class="d-flex justify-content-between mb-1">
                    <small class="text-muted">IVA ({{ item.IVA }}%):</small>
                    <small class="text-info">${{ item.ivaAmount.toFixed(3) }}</small>
                  </div>
                  <hr class="my-2">
                  <div class="d-flex justify-content-between">
                    <strong>Total:</strong>
                    <strong class="text-primary">${{ item.totalItem.toFixed(3) }}</strong>
                  </div>
                </div>
              </div>
            </b-card>
          </div>
        </div>
      </b-card>
    </div>

    <!-- Modal de Datos del Cliente -->
    <b-modal v-model="showClientModal" title="Datos del Cliente" @ok="confirmarExportacion" ok-title="Generar"
      cancel-title="Cancelar">
      <b-form>
        <b-form-group label="Nombre del Cliente:" label-for="cliente-modal" class="mb-3">
          <b-form-input id="cliente-modal" v-model="clienteNombre" placeholder="Ingrese nombre del cliente" required />
        </b-form-group>

        <b-form-group label="Ciudad:" label-for="ciudad-modal" class="mb-3">
          <b-form-input id="ciudad-modal" v-model="ciudad" placeholder="Ingrese ciudad" />
        </b-form-group>

        <b-form-group label="Vendedor:" label-for="vendedor-modal" class="mb-3">
          <b-form-select id="vendedor-modal" v-model="vendedorNombre" :options="vendedorOptions"></b-form-select>
        </b-form-group>

        <b-form-group label="Fecha:" label-for="fecha-modal" class="mb-3">
          <b-form-input id="fecha-modal" v-model="fecha" type="date" />
        </b-form-group>
      </b-form>
    </b-modal>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useCart } from '@/composables/useCart'
import { useExcelHandler } from '@/utils/excelHandler'
import { usePDFGenerator } from '@/utils/pdfGenerator'
import { useToast } from 'vue-toastification'
import alertify from 'alertifyjs'

const toast = useToast()

const {
  cart,
  cartCount,
  cartSubtotal,
  cartTotalIVA,
  cartTotal,
  cartItemsWithDetails,
  updateQuantity,
  removeFromCart,
  clearCart,
} = useCart();

const { exportCartToExcel, exportToExcel, exportCustomExcel } = useExcelHandler();

// Estado del formulario de cliente
const clienteNombre = ref("");
const ciudad = ref("");
const vendedorNombre = ref("");
const fecha = ref("");
const showClientModal = ref(false);
const pendingAction = ref(null); // 'proforma', 'pedido', 'pdf'

// Opciones para el select de vendedor
const vendedorOptions = [
  { value: '', text: 'Seleccione un vendedor' },
  { value: 'Diana Benalcázar', text: 'Diana Benalcázar' },
  // { value: 'Diego Ulloa', text: 'Diego Ulloa' },
  // { value: 'Mario Caceres', text: 'Mario Caceres' },
  // { value: 'Jimena Ortiz', text: 'Jimena Ortiz' }
];

onMounted(() => {
  // Set default date to today
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  fecha.value = `${year}-${month}-${day}`;
});

const handleClearCart = () => {
  alertify.confirm(
    "Vaciar Carrito",
    "⚠️ ¿Estás seguro de que deseas vaciar todo el carrito?",
    () => {
      clearCart();
      toast.success("🗑️ Carrito vaciado");
    },
    () => {
      // Cancel action
    }
  ).set('labels', { ok: 'Sí, Vaciar', cancel: 'Cancelar' });
};

// Preparar exportación (abrir modal)
const prepararExportacion = (tipo) => {
  if (cartItemsWithPromotions.value.length === 0) {
    toast.warning('⚠️ El carrito está vacío');
    return;
  }
  pendingAction.value = tipo;
  showClientModal.value = true;
};

// Confirmar exportación desde el modal
const confirmarExportacion = (bvModalEvent) => {
  if (!clienteNombre.value.trim()) {
    bvModalEvent.preventDefault(); // Evitar cierre del modal
    toast.warning('⚠️ Por favor ingrese el nombre del cliente');
    return;
  }

  // Ejecutar la acción pendiente
  if (pendingAction.value === 'proforma') {
    generarProformaExcel();
  } else if (pendingAction.value === 'pedido') {
    generarPedidoExcel();
  } else if (pendingAction.value === 'pdf') {
    exportarListaPrecioPDF();
  }

  // El modal se cerrará automáticamente si no prevenimos el evento
  pendingAction.value = null;
};

// Generar Proforma en Excel
const generarProformaExcel = () => {
  // Formato de proforma: Cantidad, Promoción, Nombre Producto, Marca, Precio Farmacia, Total
  const exportData = cartItemsWithPromotions.value.map(item => ({
    'Cantidad': item.quantity,
    'Descuento %': item.Descuento ? item.Descuento + '%' : '',
    'Bonificación': item.promotionDetails?.bonus > 0 ? item.promotionDetails.bonus : '',
    'Nombre Producto': item.NombreProducto,
    'Marca': item.Marca,
    'Precio Farmacia': Number(item.PrecioFarmacia).toFixed(2),
    'Total': Number(item.subtotalItem).toFixed(2)
  }))

  console.log('exportData:', exportData);
  const filename = `${clienteNombre.value.replace(/\s+/g, "_") || 'Cliente'}_Proforma_${fecha.value}.xlsx`

  const metadata = {
    'Cliente': clienteNombre.value,
    'Ciudad': ciudad.value,
    'Vendedor': vendedorNombre.value,
    'Fecha': fecha.value
  };

  exportCustomExcel(metadata, exportData, filename)

  toast.success(`✅ Proforma generada: ${filename}`, {
    timeout: 1000
  })
}

// Generar Pedido completo en Excel
const generarPedidoExcel = () => {
  // Formato de pedido: Cantidad, Promoción, Nombre Producto, Lote, Fecha de Vencimiento
  const exportData = cartItemsWithPromotions.value.map(item => ({
    'Cantidad': item.quantity,
    'Descuento': item.Descuento ? item.Descuento + '%' : '',
    'Bonificación': item.promotionDetails?.bonus > 0 ? item.promotionDetails.bonus : '',
    'Nombre Producto': item.NombreProducto,
    'Lote': '', // Campo vacío para que el usuario lo complete
    'Fecha de Vencimiento': '' // Campo vacío para que el usuario lo complete
  }))

  const filename = `${clienteNombre.value.replace(/\s+/g, "_")}_Pedido_${fecha.value}.xlsx`

  const metadata = {
    'Cliente': clienteNombre.value,
    'Ciudad': ciudad.value,
    'Vendedor': vendedorNombre.value,
    'Fecha': fecha.value
  };

  exportCustomExcel(metadata, exportData, filename)

  toast.success(`✅ Pedido generado: ${filename}`, {
    timeout: 1000
  })
}

// Exportar Lista de Precios en PDF
const exportarListaPrecioPDF = () => {
  // Preparar datos para PDF con la estructura específica
  const pdfData = cartItemsWithPromotions.value.map(item => ({
    'Producto': item.NombreProducto,
    'Marca': item.Marca,
    'Presentacion': item.Presentacion,
    'Precio': Number(item.PrecioFarmacia).toFixed(2),
    'Promocion': item.Descuento ? `${item.Descuento}+1` : '-',
    'Descuento %': item.Descuento ? `${item.Descuento} %` : '-'
  }))

  // Generar PDF con información del cliente
  const { generatePDFFromData } = usePDFGenerator()
  const filename = `${clienteNombre.value.replace(/\s+/g, "_")}_Lista_Precios_${fecha.value}.pdf`

  generatePDFFromData(pdfData, filename, {
    title: 'Lista productos MH',
    subtitle: `Cliente: ${clienteNombre.value}`,
    date: `Fecha: ${fecha.value}`
  })

  toast.success(`✅ Lista de productos generada: ${filename}`)
}

// --- Lógica de Promociones ---

/**
 * Parsea un string de promoción (ej. "5+1 10+2 20+4") y devuelve un array de reglas ordenadas.
 */
const parsePromotionRules = (promoString) => {
  if (!promoString) return [];
  // Normalizar y separar por espacios
  const parts = promoString.split(' ');
  const rules = [];

  parts.forEach(part => {
    // Buscar patrón "X+Y"
    const match = part.match(/(\d+)\+(\d+)/);
    if (match) {
      rules.push({
        buy: parseInt(match[1], 10),
        get: parseInt(match[2], 10)
      });
    }
  });

  // Ordenar de mayor a menor cantidad de compra requerida para aplicar la mejor oferta primero
  return rules.sort((a, b) => b.buy - a.buy);
};

/**
 * Calcula la bonificación basada en la cantidad y las reglas de promoción.
 * Aplica la regla más alta posible repetidamente.
 */
const calculateBonus = (quantity, rules) => {
  let remaining = quantity;
  let bonus = 0;

  // Iterar sobre las reglas (ya ordenadas de mayor a menor)
  for (const rule of rules) {
    if (remaining >= rule.buy) {
      // Cuántas veces cabe esta regla en lo que queda
      const times = Math.floor(remaining / rule.buy);
      bonus += times * rule.get;

      // Restamos lo que ya "usamos" para calcular bonificación
      // NOTA: En promociones acumulativas simples (ej. 5+1, 10+2), 10+2 es solo 2 veces 5+1.
      // Pero si fuera "5+1" y "20+5" (donde 20 da 5 en vez de 4), queremos aplicar la de 20 primero.
      // El requerimiento dice "calcular la mejor promoción".
      // Asumimos que las reglas se aplican a la cantidad comprada.

      remaining %= rule.buy;
    }
  }
  return bonus;
};

// Enriquecer items con cálculo de promociones
// Sobrescribimos cartItemsWithDetails para incluir la lógica de promoción
import { computed as vueComputed } from 'vue'; // Importar computed localmente si es necesario o usar el del setup

// Nota: cartItemsWithDetails viene de useCart, pero necesitamos extenderlo.
// Crearemos una computed local que envuelva la original.

const cartItemsWithPromotions = vueComputed(() => {
  return cartItemsWithDetails.value.map(item => {
    // Simulación: Si no tiene campo Promocion, le ponemos uno de prueba para demostrar
    // En producción, esto vendría de la base de datos.
    // const mockPromo = "5+1 10+2 20+4"; 
    const promoString = item.Promocion || ""; // Usar el real, o vacío

    let promotionDetails = null;

    if (promoString) {
      const rules = parsePromotionRules(promoString);
      if (rules.length > 0) {
        const bonus = calculateBonus(item.quantity, rules);
        if (bonus > 0) {
          promotionDetails = {
            bonus,
            totalReceived: item.quantity + bonus
          };
        }
      }
    }

    return {
      ...item,
      promotionDetails
    };
  });
});
</script>

<style scoped>
.cart-item-card {
  transition: all 0.3s ease;
  border: 2px solid transparent;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
}

.cart-item-card:hover {
  border-color: #0d6efd;
  box-shadow: 0 4px 12px rgba(13, 110, 253, 0.15);
  transform: translateY(-2px);
}

.cart-item-details {
  font-size: 0.9rem;
}

.quantity-control {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 8px;
}

.quantity-display {
  font-size: 1.25rem;
  font-weight: 600;
  min-width: 40px;
  text-align: center;
  color: #0d6efd;
}

.price-breakdown {
  background: #fff;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.card-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 2px solid #dee2e6;
}

/* Estilos minimalistas para botones */
.btn-minimal {
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  border: none;
  font-weight: 500;
  font-size: 0.9rem;
  letter-spacing: 0.3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.btn-minimal:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-minimal:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Variantes de color minimalista */
.btn-minimal-success {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.btn-minimal-success:hover {
  background: linear-gradient(135deg, #20c997 0%, #28a745 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(40, 167, 69, 0.3);
}

.btn-minimal-primary {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
}

.btn-minimal-primary:hover {
  background: linear-gradient(135deg, #0056b3 0%, #007bff 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(0, 123, 255, 0.3);
}

.btn-minimal-warning {
  background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
  color: #333;
}

.btn-minimal-warning:hover {
  background: linear-gradient(135deg, #ff9800 0%, #ffc107 100%);
  color: #333;
  box-shadow: 0 4px 16px rgba(255, 193, 7, 0.3);
}

/* Efecto de onda al hacer clic */
.btn-minimal::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn-minimal:active::before {
  width: 300px;
  height: 300px;
}
</style>
