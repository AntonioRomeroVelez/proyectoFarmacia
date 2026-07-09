<template>
  <div :class="['producto-card', { 'producto-agregado': esAgregado }]">

    <!-- ── Header: nombre + marca ── -->
    <div class="card-header-custom">
      <h6 class="product-name">{{ producto.NombreProducto }}</h6>
      <span class="brand-chip">{{ producto.Marca }}</span>
    </div>

    <!-- ── Cuerpo ── -->
    <div class="card-body-custom">

      <!-- Principio activo -->
      <p class="principio-activo">
        <i class="bi bi-capsule"></i>
        {{ producto.PrincipioActivo.replaceAll('+', ' + ') }}
      </p>

      <!-- ── Precio destacado ── -->
      <div class="price-block">
        <div class="price-main">Precio Farmacia
          <span class="price-currency">$</span>
          <span class="price-integer">{{ getParteEntera(producto.PrecioFarmacia) }}</span>
          <span class="price-decimals">.{{ getParteDecimal(producto.PrecioFarmacia) }}</span>
        </div>
        <span v-if="producto.PVP" class="pvp-tag">PVP ${{ producto.PVP }}</span>
      </div>

      <!-- ── Chips de atributos ── -->
      <div class="chips-row">
        <span class="chip chip-presentacion">{{ producto.Presentacion }}</span>

        <span v-if="producto.Tipo" :class="['chip', getTipoBadgeClass(producto.Tipo)]">
          {{ producto.Tipo }}
        </span>

        <span v-if="producto.IVA" class="chip chip-iva">IVA {{ producto.IVA }}%</span>

        <span v-if="producto.Descuento" class="chip chip-descuento">-{{ producto.Descuento }}%</span>

        <span v-if="producto.Promocion" class="chip chip-promo">🎁 {{ producto.Promocion }}</span>
      </div>

      <!-- Observación -->
      <div v-if="producto.Observacion" class="observacion-box">
        <span class="obs-label">Obs.</span>
        {{ producto.Observacion }}
      </div>

    </div>

    <!-- ── Footer: acciones ── -->
    <div class="card-footer-custom">
      <div v-if="!estaEnCarrito" class="action-row">
        <b-form-input v-model.number="cantidad" type="number" min="1" size="sm" class="qty-input" placeholder="Cant." />
        <b-button variant="success" size="sm" class="btn-add" @click="agregarAlCarrito">
          <i class="bi bi-cart-plus"></i> Agregar
        </b-button>
      </div>

      <b-button v-else variant="outline-danger" size="sm" class="w-100 btn-remove" @click="quitarDelCarrito">
        <i class="bi bi-cart-dash me-1"></i> Quitar del carrito
      </b-button>

      <b-button variant="outline-secondary" size="sm" class="w-100 btn-detail" @click="verDetalle">
        <i class="bi bi-eye me-1"></i> Ver detalle
      </b-button>
    </div>

  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useCart } from "@/composables/useCart";

// Props que recibe el componente
const props = defineProps({
  producto: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.ID && value.NombreProducto;
    },
  },
  esAgregado: {
    type: Boolean,
    default: false,
  },
});

// Emits para comunicarse con el padre
const emit = defineEmits([
  "ver-detalle",
]);

const { addToCart, removeFromCart, cart } = useCart();
const cantidad = ref(1);

// Computed properties
const ahorro = computed(() => {
  return (props.producto.PVP || 0) - (props.producto.PrecioFarmacia || 0);
});

const estaEnCarrito = computed(() => {
  return cart.value.some(item => item.ID === props.producto.ID);
});

// Métodos para formateo de precios
const getParteEntera = (valor) => {
  const num = Number(valor || 0).toFixed(3);
  return num.split('.')[0];
};

const getParteDecimal = (valor) => {
  const num = Number(valor || 0).toFixed(3);
  return num.split('.')[1];
};

// Métodos
const agregarAlCarrito = () => {
  addToCart(props.producto, cantidad.value);
  cantidad.value = 1; // Reset quantity
};

const quitarDelCarrito = () => {
  removeFromCart(props.producto.ID);
};

const verDetalle = () => {
  emit("ver-detalle", props.producto);
};

const getTipoBadgeClass = (tipo) => {
  if (!tipo) return 'chip-tipo';
  const t = tipo.toLowerCase().trim();
  if (t === 'medicamento') return 'chip-medicamento';
  if (t === 'insumo') return 'chip-insumo';
  return 'chip-tipo';
};
</script>

<style scoped>
/* ═══════════════════════════════════════
   CARD BASE
═══════════════════════════════════════ */
.producto-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
    background: #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
    transition: box-shadow 0.2s ease, transform 0.2s ease;
    overflow: hidden;
}

.producto-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.producto-agregado {
  border: 2px solid #22c55e;
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
}

/* ═══════════════════════════════════════
   HEADER
═══════════════════════════════════════ */
.card-header-custom {
  padding: 10px 12px 8px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-name {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
  word-break: break-word;
}

.brand-chip {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 600;
  color: #0277bd;
  background: #e1f5fe;
  border: 1px solid #b3e5fc;
  border-radius: 20px;
  padding: 1px 8px;
  width: fit-content;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* ═══════════════════════════════════════
   BODY
═══════════════════════════════════════ */
.card-body-custom {
  flex: 1;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.principio-activo {
  margin: 0;
  font-size: 0.72rem;
  color: #64748b;
  line-height: 1.4;
  word-break: break-word;
}

.principio-activo i {
  color: #0284c7;
  /* Azul/Celeste científico */
  margin-right: 4px;
  font-size: 0.8rem;
}
/* ── Precio ── */
.price-block {
  display: flex;
  align-items: baseline;
  gap: 8px;
    flex-wrap: wrap;
}

.price-main {
  display: flex;
  align-items: baseline;
  gap: 1px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 8px;
  padding: 3px 20px;
  color: #15803d;
}

.price-currency {
  font-size: 0.75rem;
  font-weight: 600;
  color: #15803d;
  margin-left: 10px;
}

.price-integer {
  font-size: 1rem;
  font-weight: 800;
  color: #15803d;
  line-height: 1;
}

.price-decimals {
  font-size: 0.90rem;
  font-weight: 600;
  color: #15803d;
  opacity: 0.8;
}

.pvp-tag {
  font-size: 0.7rem;
  color: #dc2626;
  background: #fff1f2;
  border: 1px solid #fecaca;
  border-radius: 5px;
  padding: 3px 15px;
  font-weight: 500;
}

/* ── Chips row ── */
.chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.chip {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 600;
  border-radius: 5px;
  padding: 3px 15px;
  white-space: nowrap;
}

.chip-presentacion {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.chip-iva {
  background: #fce7f3;
  color: #9d174d;
  border: 1px solid #fbcfe8;
}

.chip-descuento {
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
}

.chip-promo {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.chip-tipo {
  background: #faf5ff;
  color: #6b21a8;
  border: 1px solid #e9d5ff;
}

.chip-medicamento {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.chip-insumo {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

/* ── Observación ── */
.observacion-box {
  font-size: 0.7rem;
  color: #78350f;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-left: 3px solid #f59e0b;
  border-radius: 6px;
  padding: 5px 8px;
  line-height: 1.4;
  word-break: break-word;
}

.obs-label {
  font-weight: 700;
  margin-right: 3px;
  color: #92400e;
  }
  
  /* ═══════════════════════════════════════
                         FOOTER / ACCIONES
                      ═══════════════════════════════════════ */
.card-footer-custom {
  padding: 8px 12px 10px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 6px;
    background: #fafafa;
}

.action-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.qty-input {
  width: 70px !important;
  min-width: 0;
  font-size: 0.82rem;
  text-align: center;
  border-radius: 8px !important;
}

.btn-add {
  flex: 1;
  font-size: 0.8rem;
  border-radius: 8px;
  font-weight: 600;
}

.btn-remove,
.btn-detail {
  font-size: 0.78rem;
  border-radius: 8px;
  font-weight: 500;
}

.bi {
  font-size: 0.85em;
}
</style>
