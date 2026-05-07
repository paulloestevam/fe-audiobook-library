<template>
  <div class="login-success-container">
    <div class="spinner"></div>
    <h2>Autenticando...</h2>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const token = route.query.token
  if (token) {
    localStorage.setItem('auth_token', token)
  }
  // Remove possible trailing slashes or parameters and go back to root safely
  router.replace('/')
})
</script>

<style scoped>
.login-success-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 20px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #17659b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
h2 {
  color: #333;
}
</style>
