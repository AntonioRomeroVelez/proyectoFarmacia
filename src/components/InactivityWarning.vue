<template>
  <div v-if="show" class="inactivity-overlay">
    <div class="inactivity-modal">
      <div class="warning-icon">⚠️</div>
      <h2 class="warning-title">La sesión se va a cerrar por inactividad</h2>
      <div class="countdown-container">
        <div class="countdown-number">{{ remainingSeconds }}</div>
        <div class="countdown-label">segundos restantes</div>
      </div>
      <p class="warning-message">
        ¿Deseas continuar con tu sesión?
      </p>
      <button class="continue-btn" @click="handleContinue">
        ✓ Continuar Sesión
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  remainingSeconds: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['dismiss']);

const handleContinue = () => {
  emit('dismiss');
};
</script>

<style scoped>
.inactivity-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99999;
  backdrop-filter: blur(8px);
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.inactivity-modal {
  background: white;
  border-radius: 20px;
  padding: 3rem 2.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  text-align: center;
  max-width: 450px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.warning-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.warning-title {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 1.5rem;
  font-weight: 700;
}

.countdown-container {
  margin: 2rem 0;
}

.countdown-number {
  font-size: 5rem;
  font-weight: 800;
  color: #ff6b6b;
  line-height: 1;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.countdown-label {
  font-size: 1rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.warning-message {
  font-size: 1.1rem;
  color: #555;
  margin-bottom: 2rem;
}

.continue-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 3rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.continue-btn:active {
  transform: translateY(0);
}
</style>
