<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { fetchBooksFromApi, toggleBookRestriction, updateBookGenre, deleteBook } from '../services/audiobookService'

const books = ref([])
const sortColumn = ref('dateAdded')
const sortDirection = ref('desc')
const isLoading = ref(true)
const error = ref(null)

const activeMenuId = ref(null)
const activeSubMenuId = ref(null)

const fetchBooks = async () => {
  try {
    isLoading.value = true
    books.value = await fetchBooksFromApi()
  } catch (err) {
    console.error('Erro ao buscar livros:', err)
    error.value = 'Falha ao carregar os livros. Verifique se o backend está rodando e se o CORS está liberado.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchBooks()
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})

const sortedBooks = computed(() => {
  let result = [...books.value]

  result.sort((a, b) => {
    let valA = a[sortColumn.value]
    let valB = b[sortColumn.value]

    if (valA === undefined || valA === null) valA = ''
    if (valB === undefined || valB === null) valB = ''

    let comparison = 0
    if (typeof valA === 'string' && typeof valB === 'string') {
      comparison = valA.localeCompare(valB)
    } else if (typeof valA === 'number' && typeof valB === 'number') {
      comparison = valA - valB
    } else if (typeof valA === 'boolean' && typeof valB === 'boolean') {
      comparison = (valA === valB) ? 0 : valA ? -1 : 1
    }

    // Special case for dateAdded as it might be a string timestamp or date string
    if (sortColumn.value === 'dateAdded') {
      const dateA = new Date(valA || 0).getTime()
      const dateB = new Date(valB || 0).getTime()
      comparison = dateA - dateB
    }
    
    // special case for duration string if it's like "10:30"
    if (sortColumn.value === 'duration') {
       comparison = valA.toString().localeCompare(valB.toString())
    }

    return sortDirection.value === 'asc' ? comparison : -comparison
  })

  return result
})

const sortBy = (column) => {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc' // Default to asc on new column
  }
}

const getGenreClass = (genre) => {
  if (!genre) return 'badge-empty'
  const g = genre.toLowerCase()
  if (g.includes('ficção') && !g.includes('não')) return 'badge-ficcao'
  if (g.includes('não-ficção') || g.includes('nao-ficcao')) return 'badge-nao-ficcao'
  if (g.includes('literatura')) return 'badge-literatura'
  return 'badge-genre' // default
}

const toggleMenu = (bookId, event) => {
  event.stopPropagation()
  if (activeMenuId.value === bookId) {
    activeMenuId.value = null
    activeSubMenuId.value = null
  } else {
    activeMenuId.value = bookId
    activeSubMenuId.value = null
  }
}

const showSubMenu = (bookId, event) => {
  event.stopPropagation()
  activeSubMenuId.value = bookId
}

const closeMenu = () => {
  activeMenuId.value = null
  activeSubMenuId.value = null
}

const handleToggleRestriction = async (bookId) => {
  try {
    const updatedBook = await toggleBookRestriction(bookId)
    const index = books.value.findIndex(b => b.id === bookId)
    if (index !== -1) {
      books.value[index] = updatedBook
    }
  } catch (err) {
    console.error('Erro ao alternar restrição:', err)
    alert('Erro ao alternar restrição.')
  }
  closeMenu()
}

const handleUpdateGenre = async (bookId, genre) => {
  try {
    const updatedBook = await updateBookGenre(bookId, genre)
    const index = books.value.findIndex(b => b.id === bookId)
    if (index !== -1) {
      books.value[index] = updatedBook
    }
  } catch (err) {
    console.error('Erro ao atualizar gênero:', err)
    alert('Erro ao atualizar gênero.')
  }
  closeMenu()
}

const handleDeleteBook = async (bookId) => {
  if (confirm('Tem certeza que deseja excluir este livro?')) {
    try {
      await deleteBook(bookId)
      books.value = books.value.filter(b => b.id !== bookId)
    } catch (err) {
      console.error('Erro ao excluir livro:', err)
      alert('Erro ao excluir livro.')
    }
  }
  closeMenu()
}

</script>

<template>
  <div class="admin-container">
    <div class="header">
      <div class="header-top">
        <div class="header-title">
          <h1>⚙️ Painel de Administração</h1>
          <span class="book-count">Total de livros: {{ books.length }}</span>
        </div>
        <router-link to="/" class="nav-link">
          📚 Voltar para Biblioteca
        </router-link>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando dados...</p>
    </div>

    <div v-else-if="error" class="error-state">
      {{ error }}
    </div>

    <div v-else class="table-wrapper">
      <table class="admin-table">
        <thead>
          <tr>
            <th @click="sortBy('title')" class="sortable">Título <span v-if="sortColumn === 'title'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('author')" class="sortable">Autor <span v-if="sortColumn === 'author'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('genre')" class="sortable">Gênero <span v-if="sortColumn === 'genre'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('subGenre')" class="sortable">Sub-gênero <span v-if="sortColumn === 'subGenre'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('duration')" class="sortable">Duração <span v-if="sortColumn === 'duration'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('restricted')" class="sortable">Restrição <span v-if="sortColumn === 'restricted'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span></th>
            <th class="actions-col"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="book in sortedBooks" :key="book.id">
            <td class="cell-title" :title="book.title">{{ book.title }}</td>
            <td class="cell-author">{{ book.author }}</td>
            <td><span class="badge" :class="getGenreClass(book.genre)">{{ book.genre || 'N/A' }}</span></td>
            <td>{{ book.subGenre || '-' }}</td>
            <td class="cell-duration">{{ book.duration || '-' }}</td>
            <td>
              <span class="status-indicator" :class="book.restricted ? 'restricted' : 'free'">
                {{ book.restricted ? 'Sim' : 'Não' }}
              </span>
            </td>
            <td class="actions-col">
              <div class="menu-container">
                <button class="btn-options" @click="toggleMenu(book.id, $event)">
                  ...
                </button>
                
                <div v-if="activeMenuId === book.id" class="dropdown-menu">
                  <button class="dropdown-item" @click="handleToggleRestriction(book.id)">
                    Alternar Restrição
                  </button>
                  
                  <div class="dropdown-submenu-container" @mouseenter="showSubMenu(book.id, $event)" @mouseleave="activeSubMenuId = null">
                    <button class="dropdown-item has-submenu">
                      Alterar Gênero ▸
                    </button>
                    <div v-if="activeSubMenuId === book.id" class="dropdown-submenu">
                      <button class="dropdown-item" @click.stop="handleUpdateGenre(book.id, 'Ficção')">Ficção</button>
                      <button class="dropdown-item" @click.stop="handleUpdateGenre(book.id, 'Não-ficção')">Não-ficção</button>
                      <button class="dropdown-item" @click.stop="handleUpdateGenre(book.id, 'Literatura')">Literatura</button>
                    </div>
                  </div>
                  
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item text-danger" @click="handleDeleteBook(book.id)">
                    Excluir
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style src="../assets/styles/adminView.css" scoped></style>
