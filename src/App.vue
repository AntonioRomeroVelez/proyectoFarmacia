<template>
  <div id="app" class="bg-light min-vh-100">
    <!-- PÁGINAS -->
    <b-container fluid class="py-4">
      <router-view />
    </b-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useCart } from '@/composables/useCart'

const { cartCount } = useCart()
const navExpanded = ref(false)

const toggleNav = () => {
  navExpanded.value = !navExpanded.value
}

const closeNav = () => {
  navExpanded.value = false
}

const handleNavbarClick = (e) => {
  // Don't close if clicking on the navbar itself
}

const handleClickOutside = (e) => {
  const navbar = document.querySelector('.navbar-custom')
  if (navbar && !navbar.contains(e.target) && navExpanded.value) {
    closeNav()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style>
/* =============================== */
/*    ESTILO GENERAL DEL SITIO     */
/* =============================== */

#app {
  font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #333;
}

.card {
  border-radius: 12px;
  border: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}
</style>
