<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-circle">
          <span class="logo-icon">💊</span>
        </div>
        <h2 class="login-title">Sistema Farmacia</h2>
        <p class="login-subtitle">Inicia sesión para continuar</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username" class="form-label">
            <i class="icon">👤</i> Usuario
          </label>
          <input id="username" v-model="username" type="text" class="form-input" placeholder="Ingresa tu usuario"
            required autofocus />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">
            <i class="icon">🔒</i> Contraseña
          </label>
          <div class="password-input-wrapper">
            <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'"
              class="form-input password-input" placeholder="Ingresa tu contraseña" required />
            <button type="button" class="toggle-password-btn" @click="showPassword = !showPassword" tabindex="-1">
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <button type="submit" class="login-button" :disabled="loading">
          <span v-if="!loading">Iniciar Sesión</span>
          <span v-else>Ingresando...</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { login, isAuthenticated } = useAuth();

const username = ref('');
const password = ref('');
const loading = ref(false);
const showPassword = ref(false);

// Si ya está autenticado, redirigir
if (isAuthenticated.value) {
  router.push('/productos');
}

const handleLogin = async () => {
  loading.value = true;

  // Pequeño delay para mejor UX
  await new Promise(resolve => setTimeout(resolve, 500));

  const success = await login(username.value, password.value);

  if (success) {
    router.push('/productos');
  }

  loading.value = false;
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  min-height: 100dvh;
  /* Mejor para móvil con teclado */
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  overflow-y: auto;
  /* Importante para móvil */
}

.login-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 440px;
  padding: 40px;
  animation: slideUp 0.5s ease-out;
  margin: auto;
  /* Asegura centrado vertical incluso con teclado */
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-circle {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
}

.logo-icon {
  font-size: 40px;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 8px 0;
}

.login-subtitle {
  color: #718096;
  margin: 0;
  font-size: 14px;
}

.login-form {
  margin-bottom: 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: #4a5568;
  font-weight: 500;
  font-size: 14px;
}

.icon {
  margin-right: 5px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Wrapper para el campo de contraseña con botón */
.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input {
  padding-right: 50px;
  /* Espacio para el botón */
}

.toggle-password-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 20px;
  padding: 5px 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  user-select: none;
}

.toggle-password-btn:hover {
  transform: translateY(-50%) scale(1.1);
}

.toggle-password-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.login-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  margin-top: 10px;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Optimizaciones para móvil */
@media (max-width: 480px) {
  .login-container {
    padding: 10px;
    align-items: flex-start;
    /* Cambia de center a flex-start en móvil */
    padding-top: 20px;
  }

  .login-card {
    padding: 30px 25px;
    margin: 0;
    /* Elimina margin auto en móvil */
  }

  .login-title {
    font-size: 24px;
  }

  .login-header {
    margin-bottom: 20px;
    /* Reduce margen en móvil */
  }

  .logo-circle {
    width: 60px;
    height: 60px;
    margin-bottom: 15px;
  }

  .logo-icon {
    font-size: 30px;
  }

  .form-group {
    margin-bottom: 15px;
    /* Reduce espacio entre campos */
  }
}

/* Ajuste para cuando el teclado virtual está activo */
@media (max-height: 600px) {
  .login-container {
    align-items: flex-start;
    padding-top: 10px;
  }

  .login-header {
    margin-bottom: 15px;
  }

  .logo-circle {
    width: 50px;
    height: 50px;
    margin-bottom: 10px;
  }

  .logo-icon {
    font-size: 25px;
  }

  .login-title {
    font-size: 20px;
    margin-bottom: 5px;
  }

  .login-subtitle {
    font-size: 12px;
  }
}
</style>
