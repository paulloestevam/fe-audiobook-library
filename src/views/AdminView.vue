<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchBooksFromApi, toggleBookRestriction, updateBookGenre, deleteBook, uploadZips } from '../services/audiobookService'

const router = useRouter()

const books = ref([])
const sortColumn = ref('dateAdded')
const sortDirection = ref('desc')
const isLoading = ref(true)
const error = ref(null)

const activeMenuId = ref(null)
const activeSubMenuId = ref(null)

const isDragging = ref(false)
const isUploading = ref(false)
const uploadMessage = ref('')
const fileInput = ref(null)

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

const handleEditBook = (bookId) => {
  router.push(`/admin/edit/${bookId}`)
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

const formatDescription = (desc) => {
  if (!desc) return '-'
  return desc.length > 15 ? desc.substring(0, 15) + '...' : desc
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date)) return '-'
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

const formatSubGenre = (subGenre) => {
  if (!subGenre) return '-'
  return subGenre.length > 30 ? subGenre.substring(0, 30) + '...' : subGenre
}

const onDragOver = (e) => {
  e.preventDefault()
  isDragging.value = true
}

const onDragLeave = (e) => {
  e.preventDefault()
  isDragging.value = false
}

const onDrop = async (e) => {
  e.preventDefault()
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files.length > 0) {
    await handleUpload(files)
  }
}

const onFileSelected = async (e) => {
  const files = e.target.files
  if (files.length > 0) {
    await handleUpload(files)
  }
}

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleUpload = async (files) => {
  const validFiles = Array.from(files).filter(f => f.name.endsWith('.zip'))
  if (validFiles.length === 0) {
    uploadMessage.value = 'Por favor, selecione apenas arquivos .zip'
    return
  }

  isUploading.value = true
  uploadMessage.value = 'Fazendo upload...'

  try {
    const responseMsg = await uploadZips(validFiles)
    uploadMessage.value = responseMsg || 'Upload concluído com sucesso!'
    await fetchBooks() // Refresh table
  } catch (err) {
    console.error('Erro no upload:', err)
    uploadMessage.value = 'Erro ao fazer upload dos arquivos.'
  } finally {
    isUploading.value = false
    setTimeout(() => {
      uploadMessage.value = ''
    }, 5000)
    if (fileInput.value) {
       fileInput.value.value = ''
    }
  }
}

</script>

<template>
  <div class="admin-container">
    <div class="header">
      <div class="header-top">
        <div class="header-title">
          <h1>⚙️ Painel de Administração</h1>
          <span class="book-count">Livros: {{ books.length }}</span>
        </div>
        <router-link to="/" class="nav-link">
          📚 Voltar para Biblioteca
        </router-link>
      </div>
    </div>

    <div class="upload-panel"
         @dragover="onDragOver"
         @dragleave="onDragLeave"
         @drop="onDrop"
         @click="triggerFileInput"
         :class="{ 'is-dragging': isDragging }">
      <input type="file" ref="fileInput" multiple accept=".zip" @change="onFileSelected" style="display: none;" />
      
      <div class="upload-content">
        <div class="upload-icon">📁</div>
        <h3>Upload de novos Audiobooks</h3>
        <p>Arraste e solte arquivos .zip aqui ou clique para selecionar</p>
      </div>

      <div v-if="isUploading || uploadMessage" class="upload-status" :class="{ 'is-error': uploadMessage.includes('Erro') || uploadMessage.includes('apenas arquivos') }">
        <div v-if="isUploading" class="spinner-small"></div>
        <span>{{ uploadMessage }}</span>
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
            <th @click="sortBy('dateAdded')" class="sortable">Data <span v-if="sortColumn === 'dateAdded'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('genre')" class="sortable">Gênero <span v-if="sortColumn === 'genre'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('subGenre')" class="sortable">Sub-gênero <span v-if="sortColumn === 'subGenre'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('series')" class="sortable text-center" title="Série">📚 <span v-if="sortColumn === 'series'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('duration')" class="sortable">Duração <span v-if="sortColumn === 'duration'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('rating')" class="sortable text-center">Nota <span v-if="sortColumn === 'rating'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('reviewsCount')" class="sortable text-center">Av. <span v-if="sortColumn === 'reviewsCount'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('description')" class="sortable">Desc. <span v-if="sortColumn === 'description'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('urlAmazon')" class="sortable text-center">Link <span v-if="sortColumn === 'urlAmazon'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span></th>
            <th @click="sortBy('restricted')" class="sortable text-center">🔒 <span v-if="sortColumn === 'restricted'">{{ sortDirection === 'asc' ? '▲' : '▼' }}</span></th>
            <th class="actions-col"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="book in sortedBooks" :key="book.id">
            <td class="cell-title" :title="book.title">{{ book.title }}</td>
            <td class="cell-author">{{ book.author }}</td>
            <td>{{ formatDate(book.dateAdded) }}</td>
            <td><span class="badge" :class="getGenreClass(book.genre)">{{ book.genre || 'N/A' }}</span></td>
            <td :title="book.subGenre">{{ formatSubGenre(book.subGenre) }}</td>
            <td class="text-center">
              <span v-if="book.series" title="Série">✔️</span>
              <span v-else>-</span>
            </td>
            <td class="cell-duration">{{ book.duration || '-' }}</td>
            <td class="text-center">{{ book.rating || '-' }}</td>
            <td class="text-center">{{ book.reviewsCount || '-' }}</td>
            <td class="cell-desc" :title="book.description">{{ formatDescription(book.description) }}</td>
            <td class="text-center">
              <a v-if="book.urlAmazon" :href="book.urlAmazon" target="_blank" rel="noopener noreferrer" title="Ver na Amazon" style="text-decoration: none;">🛒</a>
              <span v-else>-</span>
            </td>
            <td class="text-center">
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
                  <button class="dropdown-item" @click="handleEditBook(book.id)">
                    Editar
                  </button>
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
