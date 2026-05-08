<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { fetchAllUsers, fetchBooksFromApi, toggleUserAdmin, toggleUserRestrictedContent } from '../services/audiobookService'

const router = useRouter()

const users = ref([])
const books = ref([])
const isLoading = ref(true)
const error = ref(null)
const loggedInUserEmail = ref(null)

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch (e) {
    return null
  }
}

const fetchInitialData = async () => {
  try {
    isLoading.value = true
    error.value = null
    const [fetchedUsers, fetchedBooks] = await Promise.all([
      fetchAllUsers(),
      fetchBooksFromApi()
    ])
    users.value = fetchedUsers
    books.value = fetchedBooks
  } catch (err) {
    console.error('Erro ao buscar dados:', err)
    error.value = 'Falha ao carregar os dados. Verifique se o backend está rodando.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    const payload = parseJwt(token)
    if (payload && payload.email) {
      loggedInUserEmail.value = payload.email
    }
  }
  fetchInitialData()
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date)) return '-'
  
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

const getFavoriteTitles = (favoriteIds) => {
  if (!favoriteIds || favoriteIds.length === 0) return 'Nenhum'
  
  const titles = favoriteIds.map(id => {
    const book = books.value.find(b => b.id === id)
    return book ? book.title : 'Livro desconhecido'
  })
  
  return titles.join(', ')
}

const truncateFavorites = (titlesStr) => {
  if (titlesStr.length > 50) {
    return titlesStr.substring(0, 50) + '...'
  }
  return titlesStr
}

const handleToggleAdmin = async (user) => {
  try {
    const updatedUser = await toggleUserAdmin(user.id)
    user.admin = updatedUser.admin
  } catch (err) {
    console.error('Erro ao alterar admin:', err)
    alert('Erro ao alterar status de admin.')
  }
}

const handleToggleRestricted = async (user) => {
  try {
    const updatedUser = await toggleUserRestrictedContent(user.id)
    user.canAccessRestrictedContent = updatedUser.canAccessRestrictedContent
  } catch (err) {
    console.error('Erro ao alterar acesso restrito:', err)
    alert('Erro ao alterar acesso restrito.')
  }
}

</script>

<template>
  <div class="user-config-container">
    <div class="header">
      <div class="header-top">
        <div class="header-title">
          <h1>👥 Configurações de Usuários</h1>
          <span class="user-count">Usuários: {{ users.length }}</span>
        </div>
        <router-link to="/admin" class="nav-link">
          ⚙️ Voltar para Admin
        </router-link>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando usuários...</p>
    </div>

    <div v-else-if="error" class="error-state">
      {{ error }}
    </div>

    <div v-else class="table-wrapper">
      <table class="user-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Nome</th>
            <th>Livros Favoritos</th>
            <th class="text-center">Último Login</th>
            <th class="text-center">Admin</th>
            <th class="text-center">Acesso Restrito</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>
              <div class="user-info-cell">
                <img v-if="user.picture" :src="user.picture" alt="Foto do usuário" class="user-avatar" referrerpolicy="no-referrer" />
                <div v-else class="user-avatar-placeholder">
                  {{ user.email.charAt(0).toUpperCase() }}
                </div>
                <span class="user-email">{{ user.email }}</span>
              </div>
            </td>
            <td>{{ user.name || '-' }}</td>
            <td class="cell-favorites" :title="getFavoriteTitles(user.favoriteBookIds)">
              {{ truncateFavorites(getFavoriteTitles(user.favoriteBookIds)) }}
            </td>
            <td class="text-center">{{ formatDate(user.lastLogin) }}</td>
            <td class="text-center">
              <span class="status-indicator" 
                    :class="[
                      user.admin ? 'status-yes' : 'status-no',
                      user.email !== loggedInUserEmail ? 'clickable' : 'not-allowed'
                    ]" 
                    @click="user.email !== loggedInUserEmail && handleToggleAdmin(user)"
                    :title="user.email === loggedInUserEmail ? 'Você não pode alterar seu próprio privilégio' : ''">
                {{ user.admin ? 'Sim' : 'Não' }}
              </span>
            </td>
            <td class="text-center">
              <span class="status-indicator clickable" :class="user.canAccessRestrictedContent ? 'status-yes' : 'status-no'" @click="handleToggleRestricted(user)">
                {{ user.canAccessRestrictedContent ? 'Sim' : 'Não' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.user-config-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #e0e0e0;
}

.header {
  margin-bottom: 2rem;
  background-color: #1a1a2e;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title h1 {
  margin: 0;
  font-size: 1.8rem;
  color: #fff;
  font-weight: 700;
}

.user-count {
  display: inline-block;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #a0a0b0;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
}

.nav-link {
  color: #4da6ff;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(77, 166, 255, 0.3);
  border-radius: 6px;
  background-color: rgba(77, 166, 255, 0.05);
}

.nav-link:hover {
  color: #80c1ff;
  background-color: rgba(77, 166, 255, 0.1);
}

.table-wrapper {
  background-color: #1a1a2e;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  overflow-x: auto;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.user-table th, .user-table td {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.user-table th {
  background-color: rgba(255, 255, 255, 0.02);
  color: #a0a0b0;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
}

.user-table tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.03);
}

.user-info-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.user-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #4da6ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.user-email {
  font-weight: 500;
  color: #fff;
}

.cell-favorites {
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: help;
}

.text-center {
  text-align: center;
}

.status-indicator {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-block;
}

.status-indicator.clickable {
  cursor: pointer;
  transition: transform 0.1s, filter 0.2s;
}

.status-indicator.clickable:hover {
  transform: scale(1.05);
  filter: brightness(1.2);
}

.status-indicator.not-allowed {
  cursor: not-allowed;
  opacity: 0.6;
}

.status-yes {
  background-color: rgba(46, 204, 113, 0.15);
  color: #2ecc71;
}

.status-no {
  background-color: rgba(231, 76, 60, 0.15);
  color: #e74c3c;
}

.loading-state, .error-state {
  text-align: center;
  padding: 3rem;
  background-color: #1a1a2e;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}

.error-state {
  color: #e74c3c;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: #4da6ff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
