<template>
  <b-card :class="['producto-card fw-bold', { 'producto-agregado': esAgregado }]" :header="producto.NombreProducto">
    <!-- Información del producto -->
    <b-card-body>
      <div class="producto-info">

        <!-- Principio Activo -->
        <p class="producto-principio text-muted small">
          {{ producto.PrincipioActivo }}
        </p>



        <!-- Precios -->
        <div class="precio-linea mb-2">
          <span class="precio-label-inline">Precio Farmacia:</span>
          <strong class="precio-valor-inline">
            ${{ getParteEntera(producto.PrecioFarmacia) }}<span class="precio-decimales">.{{
              getParteDecimal(producto.PrecioFarmacia) }}</span>
          </strong>
        </div>


        <div class="d-flex align-items-center gap-2 flex-wrap">
          <!-- Marca -->
          <span class="badge badge-subtle-brand">
            {{ producto.Marca }}
          </span>

          <!-- Presentacion -->
          <span class="badge badge-subtle-presentation">
            {{ producto.Presentacion }}
          </span>

          <!-- Descuento -->
          <span v-if="producto.Descuento" class="badge badge-subtle-discount">
            Desc: {{ producto.Descuento }}%
          </span>
          <!--IVA -->
          <span v-if="producto.IVA" class="badge badge-subtle-tax">
            IVA: {{ producto.IVA }}%
          </span>

          <!-- Promoción -->
          <span v-if="producto.Promocion" class="badge badge-subtle-promo">
            Promoción: {{ producto.Promocion }}
          </span>
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
  /* border: solid 1px rgb(153, 204, 224) !important; */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4) !important;
}

.producto-card:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.producto-agregado {
  border: 2px solid #28a745;
  background-color: #f8fff9;
}

.producto-principio {
  word-break: break-word;
    overflow-wrap: break-word;
    line-height: 1.4;
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
  font-weight: 500;
  font-size: 0.8rem;
  padding: 0.4em 0.8em;
}

/* Badges Sutiles - Tema Farmacéutico */
.badge-subtle-brand {
  background-color: #e1f5fe;
  /* Azul Médico Claro */
  color: #0277bd;
  /* Azul Médico Oscuro */
  border: 1px solid #b3e5fc;
}

.badge-subtle-presentation {
  background-color: #f5f5f5;
  /* Gris Clínico Claro */
  color: #424242;
  /* Gris Oscuro */
  border: 1px solid #e0e0e0;
}

.badge-subtle-discount {
  background-color: #fff3e0;
  /* Naranja Suave */
  color: #ef6c00;
  /* Naranja Fuerte */
  border: 1px solid #ffe0b2;
}

.badge-subtle-tax {
  background-color: rgb(252, 204, 192);
  /* Azul Grisáceo */
  color: #455a64;
  /* Azul Grisáceo Oscuro */
  border: 1px solid #dcd2cf;
}

.badge-subtle-promo {
  background-color: #e0f2f1;
  /* Teal/Verde Agua */
  color: #00695c;
  /* Teal Oscuro */
  border: 1px solid #b2dfdb;
}

/* Asegurar que los iconos se vean bien */
.bi {
  font-size: 0.9em;
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
