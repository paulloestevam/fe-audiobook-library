<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { fetchBooksFromApi, toggleFavoriteBook, fetchUserFavorites, fetchRestrictedBooksFromApi } from '../services/audiobookService'
import { IMAGES_URL, DOWNLOADS_URL, API_URL } from '../config'


const books = ref([])
const viewMode = ref('mode-compact')
const searchQuery = ref('')
const sortOption = ref('recent')
const selectedGenre = ref('')
const selectedSubGenre = ref('')
const isSubgenresExpanded = ref(false)
const userFavorites = ref([])
const canAccessRestrictedContent = ref(false)
const showRestrictedOnly = ref(false)
const awaitingSecondClick = ref(false)
let clickTimer = null
const isAdmin = ref(false)

const subGenres = computed(() => {
  let relevantBooks = books.value
  if (selectedGenre.value) {
    if (selectedGenre.value === 'Séries') {
      relevantBooks = relevantBooks.filter(b => b.series)
    } else if (selectedGenre.value === 'Favoritos') {
      relevantBooks = relevantBooks.filter(b => userFavorites.value.includes(b.id))
    } else {
      relevantBooks = relevantBooks.filter(b => b.genre === selectedGenre.value)
    }
  }
  
  const subSet = new Set()
  relevantBooks.forEach(b => {
    if (b.subGenre && b.subGenre.trim()) {
      subSet.add(b.subGenre.trim())
    }
  })
  return Array.from(subSet).sort()
})

watch(selectedGenre, () => {
  selectedSubGenre.value = ''
})
const activeBookId = ref(null)
const isLoading = ref(true)
const error = ref(null)
const isLoggedIn = ref(false)
const userPicture = ref(null)
const showUserMenu = ref(false)

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch (e) {
    return null
  }
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

const toggleCard = (bookId) => {
  if (viewMode.value === 'mode-list') return
  
  if (activeBookId.value === bookId) {
    activeBookId.value = null
  } else {
    activeBookId.value = bookId
  }
}

const fetchBooks = async () => {
  try {
    isLoading.value = true
    books.value = await fetchBooksFromApi()
  } catch (err) {
    console.error('Erro ao buscar livros:', err)
    error.value = 'Falha ao carregar os livros. Verifique se o backend está rodando na porta 8080 e se o CORS está liberado.'
  } finally {
    isLoading.value = false
  }
}

const toggleRestrictedFilter = async () => {
  if (showRestrictedOnly.value) {
    // Para fechar: apenas 1 clique
    showRestrictedOnly.value = false
    isLoading.value = true
    try {
      books.value = await fetchBooksFromApi()
    } catch (err) {
      console.error('Erro ao buscar livros:', err)
    } finally {
      isLoading.value = false
    }
  } else {
    // Para abrir: precisa de 2 cliques
    if (awaitingSecondClick.value) {
      // Recebeu o segundo clique
      awaitingSecondClick.value = false
      clearTimeout(clickTimer)
      showRestrictedOnly.value = true
      isLoading.value = true
      try {
        books.value = await fetchRestrictedBooksFromApi()
      } catch (err) {
        console.error('Erro ao buscar livros:', err)
      } finally {
        isLoading.value = false
      }
    } else {
      // Primeiro clique
      awaitingSecondClick.value = true
      clickTimer = setTimeout(() => {
        awaitingSecondClick.value = false
      }, 150) // 1.5 segundos para dar o segundo clique
    }
  }
}

onMounted(async () => {
  const token = localStorage.getItem('auth_token')
  isLoggedIn.value = !!token
  if (token) {
    const payload = parseJwt(token)
    if (payload) {
      if (payload.picture) {
        userPicture.value = payload.picture
      }
      if (payload.canAccessRestrictedContent === true) {
        canAccessRestrictedContent.value = true
      }
      if (payload.admin === true) {
        isAdmin.value = true
      }
    }
    try {
      userFavorites.value = await fetchUserFavorites()
    } catch (e) {
      console.error('Erro ao buscar favoritos', e)
    }
  }
  fetchBooks()
})

const handleToggleFavorite = async (bookId) => {
  if (!isLoggedIn.value) return
  try {
    userFavorites.value = await toggleFavoriteBook(bookId)
  } catch (err) {
    console.error('Erro ao favoritar:', err)
  }
}

const handleLogout = () => {
  localStorage.removeItem('auth_token')
  isLoggedIn.value = false
  userPicture.value = null
  showUserMenu.value = false
  window.location.reload()
}

const filteredBooks = computed(() => {
  let result = books.value

  if (selectedGenre.value) {
    if (selectedGenre.value === 'Séries') {
      result = result.filter(b => b.series)
    } else if (selectedGenre.value === 'Favoritos') {
      result = result.filter(b => userFavorites.value.includes(b.id))
    } else {
      result = result.filter(b => b.genre === selectedGenre.value)
    }
  }

  if (selectedSubGenre.value) {
    result = result.filter(b => b.subGenre === selectedSubGenre.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(b => 
      b.title?.toLowerCase().includes(q) || 
      b.author?.toLowerCase().includes(q)
    )
  }

  result = [...result].sort((a, b) => {
    if (sortOption.value === 'name') {
      return (a.title || '').localeCompare(b.title || '')
    } else if (sortOption.value === 'recent') {
      return new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime()
    } else if (sortOption.value === 'author') {
      return (a.author || '').localeCompare(b.author || '')
    } else if (sortOption.value === 'duration') {
      return (b.duration || '').localeCompare(a.duration || '')
    } else if (sortOption.value === 'popularity') {
      return (b.reviewsCount || 0) - (a.reviewsCount || 0)
    }
    return 0
  })

  return result
})

const getImageUrl = (filename) => {
  if (!filename) return '/vite.svg'
  
  if (filename.includes('http')) return filename
  
  return `${IMAGES_URL}/${filename}`
}

const getDownloadUrl = (filename) => {
  if (!filename) return '#'
  if (filename.includes('http')) return filename
  return `${DOWNLOADS_URL}/${filename}`
}
</script>

<template>
  <div>
    <div class="controls">
      <div class="header-top">
        <div class="header-title">
          <h1>📚 Biblioteca</h1>
          <span class="book-count">Livros: {{ filteredBooks.length }}</span>
        </div>
        <div class="header-links">

          
          <a :href="`${DOWNLOADS_URL}/Smart%20AudioBook%20Player%20v10.7.0%20Premium%20Mod%20Apk%20%7BCracksHash%7D.apk`" class="apk-link">
            📱 Baixar App Player
          </a>

          <a v-if="!isLoggedIn" :href="`${API_URL}/oauth2/authorization/google`" class="google-login-btn" title="Entrar com o Google">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
          </a>

          <router-link v-if="isAdmin" to="/admin" class="admin-link">
            ⚙️
          </router-link>

          <button v-if="canAccessRestrictedContent" 
                  :class="['restricted-link', { active: showRestrictedOnly, 'pending': awaitingSecondClick }]" 
                  @click="toggleRestrictedFilter" 
                  :title="showRestrictedOnly ? 'Ocultar Restritos' : 'Mostrar Restritos'">
            {{ showRestrictedOnly ? '🔓' : '🔒' }}
          </button>

          <div v-if="isLoggedIn" class="user-menu-container">
            <img v-if="userPicture" :src="userPicture" alt="Usuário" class="user-avatar" @click="toggleUserMenu" referrerpolicy="no-referrer" />
            <div v-else class="user-avatar-placeholder" @click="toggleUserMenu">👤</div>
            
            <div v-if="showUserMenu" class="user-dropdown">
              <button @click="handleLogout" class="dropdown-item text-danger">Sair</button>
            </div>
          </div>
        </div>
      </div>
      <div class="header-bottom">
        <div class="search-group">
          <input 
            type="text" 
            class="search-input" 
            placeholder="Pesquisar..." 
            v-model="searchQuery"
          />
          <select class="sort-select" v-model="sortOption">
            <option value="recent">Mais recentes</option>
            <option value="name">Nome</option>
            <option value="author">Autor</option>
            <option value="duration">Duração</option>
            <option value="popularity">Popularidade</option>
          </select>
        </div>

        <div class="genre-filters btn-group">
          <button :class="{ active: selectedGenre === '' }" @click="selectedGenre = ''">Todos</button>
          <button v-if="isLoggedIn" :class="{ active: selectedGenre === 'Favoritos' }" @click="selectedGenre = 'Favoritos'">Favoritos</button>
          <button :class="{ active: selectedGenre === 'Ficção' }" @click="selectedGenre = 'Ficção'">Ficção</button>
          <button :class="{ active: selectedGenre === 'Não-ficção' }" @click="selectedGenre = 'Não-ficção'">Não-ficção</button>
          <button :class="{ active: selectedGenre === 'Literatura' }" @click="selectedGenre = 'Literatura'">Literatura</button>
          <button :class="{ active: selectedGenre === 'Séries' }" @click="selectedGenre = 'Séries'">Séries</button>
        </div>
        <div class="btn-group">
          <button 
            :class="['btn-icon', { active: viewMode === 'mode-grid' }]" 
            @click="viewMode = 'mode-grid'"
            title="Blocos">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm0 9h7v7h-7v-7zM4 13h7v7H4v-7z"/></svg>
          </button>
          <button 
            :class="['btn-icon', { active: viewMode === 'mode-compact' }]" 
            @click="viewMode = 'mode-compact'"
            title="Compacto">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg>
          </button>
          <button 
            :class="['btn-icon', { active: viewMode === 'mode-list' }]" 
            @click="viewMode = 'mode-list'"
            title="Lista">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2zm4-10h12v2H8V6zm0 5h12v2H8v-2zm0 5h12v2H8v-2z"/></svg>
          </button>
        </div>
      </div>
      
      <div class="subgenre-container" v-if="subGenres && subGenres.length > 0">
        <button class="subgenre-toggle" @click="isSubgenresExpanded = !isSubgenresExpanded">
          <span class="toggle-text">Sub-gêneros {{ selectedSubGenre ? `(${selectedSubGenre})` : '' }}</span>
          <span class="toggle-icon">{{ isSubgenresExpanded ? '▲' : '▼' }}</span>
        </button>
        <div class="subgenre-filters" v-show="isSubgenresExpanded">
          <button 
            class="subgenre-btn"
            :class="{ active: selectedSubGenre === '' }" 
            @click="selectedSubGenre = ''">
            Todos
          </button>
          <button 
            v-for="sub in subGenres" 
            :key="sub"
            class="subgenre-btn"
            :class="{ active: selectedSubGenre === sub }" 
            @click="selectedSubGenre = sub">
            {{ sub }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" style="text-align: center; padding: 2rem;">
      Carregando livros...
    </div>

    <div v-else-if="error" style="color: red; text-align: center; padding: 2rem;">
      {{ error }}
    </div>

    <div v-else id="book-container" :class="viewMode">
      <div 
        v-for="book in filteredBooks" 
        :key="book.id" 
        class="book-card"
        :class="{ active: activeBookId === book.id }"
        @click="toggleCard(book.id)"
      >
        
        <div class="cover-wrapper">
          <img :src="getImageUrl(book.imageFilename)" class="cover-bg-blur" alt="" />
          <img :src="getImageUrl(book.imageFilename)" class="cover-img" :alt="book.title" />
          
          <button v-if="isLoggedIn" @click.stop="handleToggleFavorite(book.id)" class="btn-favorite" :class="{ 'is-favorite': userFavorites.includes(book.id) }" title="Favoritar">
            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          </button>
        </div>

        <div class="section-title">
          <span class="title" :title="book.title">{{ book.title }}</span>
          <template v-if="viewMode === 'mode-list'">
            <span v-if="book.subGenre" class="meta-tag">{{ book.subGenre }}</span>
            <span v-if="book.genre" class="meta-tag">{{ book.genre }}</span>
          </template>
          <template v-else>
            <span v-if="book.genre || book.subGenre" class="meta-tag">
              {{ book.genre && book.subGenre ? book.genre + ' - ' + book.subGenre : (book.genre || book.subGenre) }}
            </span>
          </template>
        </div>

        <div class="section-meta">
          <div class="author"><span class="author-label">De:</span> <span class="author-name">{{ book.author }}</span></div>
          <div class="meta-bottom">
            <div class="meta-stats">
              <span v-if="book.duration">{{ book.duration }}</span>
              <span v-if="book.duration && book.rating"> / </span>
              <a v-if="book.rating && book.urlAmazon" :href="book.urlAmazon" target="_blank" rel="noopener noreferrer" class="rating-inline" @click.stop>
                <span class="stars">★</span> {{ book.rating }}<template v-if="book.reviewsCount"> / {{ book.reviewsCount }} avaliações</template>
              </a>
              <span v-else-if="book.rating" class="rating-inline">
                <span class="stars">★</span> {{ book.rating }}<template v-if="book.reviewsCount"> / {{ book.reviewsCount }} avaliações</template>
              </span>
            </div>
            <div class="meta-actions">
              <button v-if="isLoggedIn" @click.stop="handleToggleFavorite(book.id)" class="btn-favorite-inline" :class="{ 'is-favorite': userFavorites.includes(book.id) }" title="Favoritar">
                <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              </button>
              <a v-if="book.zipFilename" :href="getDownloadUrl(book.zipFilename)" @click.stop class="btn-download-inline" title="Baixar Audiobook" download>
                <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div class="section-desc">
          <p class="description">{{ book.description || 'Nenhuma descrição disponível para este audiobook.' }}</p>
        </div>
        
      </div>
    </div>
  </div>
</template>

<style src="../assets/styles/mainView.css" scoped></style>
