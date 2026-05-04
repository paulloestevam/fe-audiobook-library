<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { fetchBooksFromApi } from '../services/audiobookService'
import { IMAGES_URL, DOWNLOADS_URL } from '../config'


const books = ref([])
const viewMode = ref('mode-compact')
const searchQuery = ref('')
const sortOption = ref('recent')
const selectedGenre = ref('')
const selectedSubGenre = ref('')

const subGenres = computed(() => {
  let relevantBooks = books.value
  if (selectedGenre.value) {
    relevantBooks = relevantBooks.filter(b => b.genre === selectedGenre.value)
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

onMounted(() => {
  fetchBooks()
})

const filteredBooks = computed(() => {
  let result = books.value

  if (selectedGenre.value) {
    result = result.filter(b => b.genre === selectedGenre.value)
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
          <span class="book-count">Total de livros: {{ filteredBooks.length }}</span>
        </div>
        <div class="header-links">
          <router-link to="/admin" class="admin-link">
            ⚙️ Painel Admin
          </router-link>
          <a href="https://192.168.1.150/downloads/Smart%20AudioBook%20Player%20v10.7.0%20Premium%20Mod%20Apk%20%7BCracksHash%7D.apk" class="apk-link">
            📱 Baixar App Player
          </a>
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
          <button :class="{ active: selectedGenre === 'Ficção' }" @click="selectedGenre = 'Ficção'">Ficção</button>
          <button :class="{ active: selectedGenre === 'Não-ficção' }" @click="selectedGenre = 'Não-ficção'">Não-ficção</button>
          <button :class="{ active: selectedGenre === 'Literatura' }" @click="selectedGenre = 'Literatura'">Literatura</button>
        </div>
        <div class="btn-group">
          <button 
            :class="{ active: viewMode === 'mode-grid' }" 
            @click="viewMode = 'mode-grid'">
            Blocos
          </button>
          <button 
            :class="{ active: viewMode === 'mode-compact' }" 
            @click="viewMode = 'mode-compact'">
            Compacto
          </button>
          <button 
            :class="{ active: viewMode === 'mode-list' }" 
            @click="viewMode = 'mode-list'">
            Lista
          </button>
        </div>
      </div>
      
      <div class="subgenre-filters" v-if="subGenres && subGenres.length > 0">
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
          
          <a v-if="book.zipFilename" :href="getDownloadUrl(book.zipFilename)" @click.stop class="btn-download" title="Baixar Audiobook" download>
            <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          </a>
        </div>

        <div class="section-title">
          <span class="title" :title="book.title">{{ book.title }}</span>
          <template v-if="viewMode === 'mode-list'">
            <span v-if="book.subGenre" class="meta-tag">{{ book.subGenre }}</span>
            <span v-if="book.genre" class="meta-tag">{{ book.genre }}</span>
          </template>
          <template v-else>
            <span v-if="book.genre" class="meta-tag">{{ book.genre }}</span>
            <span v-if="book.subGenre" class="meta-tag">{{ book.subGenre }}</span>
          </template>
        </div>

        <div class="section-meta">
          <div class="author"><span class="author-label">De:</span> <span class="author-name">{{ book.author }}</span></div>
          <div class="duration-info" v-if="book.duration">Duração: {{ book.duration }}</div>
          <!-- <div class="subgenre-info" v-if="book.subGenre">Sub-gênero: {{ book.subGenre }}</div> -->
          <a v-if="book.rating && book.urlAmazon" :href="book.urlAmazon" target="_blank" rel="noopener noreferrer" class="rating-container" @click.stop>
            <span class="rating-stars"><span class="stars">★</span>{{ book.rating }} </span>
            <span class="rating-count" v-if="book.reviewsCount">{{ book.reviewsCount }} avaliações</span>
          </a>
          <div v-else-if="book.rating" class="rating-container">
            <span class="rating-stars"><span class="stars">★</span>{{ book.rating }} </span>
            <span class="rating-count" v-if="book.reviewsCount">{{ book.reviewsCount }} avaliações</span>
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
