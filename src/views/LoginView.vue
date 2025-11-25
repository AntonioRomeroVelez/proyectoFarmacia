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
          <input id="password" v-model="password" type="password" class="form-input" placeholder="Ingresa tu contraseña"
            required />
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

// Si ya está autenticado, redirigir
if (isAuthenticated.value) {
  router.push('/productos');
}

const handleLogin = async () => {
  loading.value = true;

  // Pequeño delay para mejor UX
  await new Promise(resolve => setTimeout(resolve, 500));

  const success = login(username.value, password.value);

  if (success) {
    router.push('/productos');
  }

  loading.value = false;
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 440px;
  padding: 40px;
  animation: slideUp 0.5s ease-out;
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
  margin-bottom: 25px;
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

.login-footer {
  border-top: 1px solid #e2e8f0;
  padding-top: 20px;
}

.demo-credentials {
  background: #f7fafc;
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.demo-title {
  margin: 0 0 10px 0;
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
}

.demo-users {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.demo-user {
  font-size: 12px;
  color: #718096;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.demo-user strong {
  color: #2d3748;
}

@media (max-width: 480px) {
  .login-card {
    padding: 30px 25px;
  }

  .login-title {
    font-size: 24px;
  }
}
</style>
