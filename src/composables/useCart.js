import { ref, computed, watch } from "vue";
import { useToast } from "vue-toastification";

const cart = ref([]);
const toast = useToast();

// Load from localStorage on init
const storedCart = localStorage.getItem("shoppingCart");
if (storedCart) {
  try {
    cart.value = JSON.parse(storedCart);
  } catch (e) {
    console.error("Error loading cart from localStorage", e);
  }
}

// Watch for changes to save to localStorage
watch(
  cart,
  (newCart) => {
    localStorage.setItem("shoppingCart", JSON.stringify(newCart));
  },
  { deep: true }
);

export const useCart = () => {
  const addToCart = (product, quantity) => {
    const existingItem = cart.value.find((item) => item.ID === product.ID);

    if (existingItem) {
      existingItem.quantity += quantity;
      toast.info(`Cantidad actualizada: ${product.NombreProducto}`);
    } else {
      cart.value.push({
        ...product,
        quantity,
      });
      toast.success(`Agregado al carrito: ${product.NombreProducto}`);
    }
  };

  const removeFromCart = (productId) => {
    const index = cart.value.findIndex((item) => item.ID === productId);
    if (index !== -1) {
      cart.value.splice(index, 1);
      toast.warning("Producto eliminado del carrito");
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    const item = cart.value.find((item) => item.ID === productId);
    if (item) {
      if (newQuantity <= 0) {
        removeFromCart(productId);
      } else {
        item.quantity = newQuantity;
      }
    }
  };

  const clearCart = () => {
    cart.value = [];
    toast.info("Carrito vaciado");
  };

  const cartCount = computed(() => {
    return cart.value.reduce((acc, item) => acc + item.quantity, 0);
  });

  // Subtotal sin IVA
  const cartSubtotal = computed(() => {
    return cart.value.reduce((acc, item) => {
      const price = item.PrecioFarmacia || 0;
      return acc + price * item.quantity;
    }, 0);
  });

  // Total de IVA (calculado por producto)
  const cartTotalIVA = computed(() => {
    return cart.value.reduce((acc, item) => {
      const price = item.PrecioFarmacia || 0;
      const subtotalItem = price * item.quantity;
      const ivaRate = (item.IVA || 0) / 100;
      const ivaAmount = subtotalItem * ivaRate;
      return acc + ivaAmount;
    }, 0);
  });

  // Total global (subtotal + IVA)
  const cartTotal = computed(() => {
    return cartSubtotal.value + cartTotalIVA.value;
  });

  // Información detallada de items para facturación
  const cartItemsWithDetails = computed(() => {
    return cart.value.map((item) => {
      const price = item.PrecioFarmacia || 0;
      const subtotalItem = price * item.quantity;
      const ivaRate = (item.IVA || 0) / 100;
      const ivaAmount = subtotalItem * ivaRate;
      const totalItem = subtotalItem + ivaAmount;

      return {
        ...item,
        subtotalItem,
        ivaAmount,
        totalItem,
      };
    });
  });

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartSubtotal,
    cartTotalIVA,
    cartTotal,
    cartItemsWithDetails,
  };
};

