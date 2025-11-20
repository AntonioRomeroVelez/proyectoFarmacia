<template>
  <b-card :class="['producto-card', { 'producto-agregado': esAgregado }]" :header="producto.NombreProducto"
    style="border: 1px solid #dee2e6;">
    <!-- Información del producto -->
    <b-card-body>
      <div class="producto-info">
        <div class="d-flex justify-content-between align-items-center ">
          <!-- Código y Marca -->
          <div class="d-flex justify-content-between align-items-start">
            <b-badge variant="info">
              {{ producto.Marca }}
            </b-badge>
          </div>

          <!-- Presentación -->
          <div class="producto-presentacion ">
            <small> <i class="bi bi-box"></i> {{ producto.Presentacion }} </small>
          </div>
        </div>

        <!-- Principio Activo -->
        <p class="producto-principio text-muted small">
          {{ producto.PrincipioActivo }}
        </p>



        <!-- Precios -->
        <div class="precio-linea mt-2 mb-2">
          <span class="precio-label-inline">Precio Farmacia:</span>
          <strong class="precio-valor-inline">
            ${{ getParteEntera(producto.PrecioFarmacia) }}<span class="precio-decimales">.{{
              getParteDecimal(producto.PrecioFarmacia) }}</span>
          </strong>
        </div>


        <div class="d-flex align-items-center gap-2 flex-wrap">
          <!-- Descuento -->
          <b-badge v-if="producto.Descuento" variant="warning">
            Desc: {{ producto.Descuento }}%
          </b-badge>
          <!--IVA -->
          <b-badge v-if="producto.IVA" variant="primary">
            IVA: {{ producto.IVA }}%
          </b-badge>

          <!-- Promoción -->
          <b-badge v-if="producto.Promocion" variant="info">
            Promoción: {{ producto.Promocion }}
          </b-badge>
        </div>
      </div>
    </b-card-body>

    <!-- Acciones -->
    <template #footer>
      <div class="d-flex flex-column gap-2">
        <div v-if="!estaEnCarrito" class="d-flex align-items-center gap-2">
          <b-form-input v-model.number="cantidad" type="number" min="1" size="sm" class="w-50"
            placeholder="Cant."></b-form-input>
          <b-button variant="success" size="sm" class="w-50" @click="agregarAlCarrito">
            <i class="bi bi-cart-plus"></i> Agregar
          </b-button>
        </div>

        <b-button v-else variant="outline-danger" size="sm" class="w-100" @click="quitarDelCarrito">
          <i class="bi bi-cart-dash me-1"></i> Quitar del carrito
        </b-button>

        <b-button variant="outline-primary" size="sm" class="w-100" @click="verDetalle">
          <i class="bi bi-eye me-1"></i> Detalle
        </b-button>
      </div>
    </template>
  </b-card>
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
</script>

<style scoped>
.producto-card {
  height: 100%;
  transition: all 0.3s ease;
}

.producto-card:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.producto-agregado {
  border: 2px solid #28a745;
  background-color: #f8fff9;
}

.producto-principio {
  height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.precios-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0;
}

.precio-farmacia,
.pvp {
  text-align: center;
}

.precio-farmacia strong {
  font-size: 1.3rem;
}

.pvp del {
  font-size: 0.9rem;
}

.promocion {
  text-align: center;
}

.badge {
  margin: 2px;
}

/* Asegurar que los iconos se vean bien */
.bi {
  font-size: 0.9em;
}

/* Badge de promoción con mejor visibilidad */
.promo-badge {
  background-color: #ffc107 !important;
  color: #000 !important;
  font-weight: 600;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
}

.promo-badge strong {
  color: #000 !important;
}

/* Estilos para precio en línea simple */
.precio-linea {
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.precio-label-inline {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

.precio-valor-inline {
  font-size: 1.25rem;
  color: #28a745;
  font-weight: 700;
  display: flex;
  align-items: baseline;
}

.precio-decimales {
  font-size: 0.75em;
  /* 75% del tamaño de la fuente padre */
  opacity: 0.85;
}
</style>
