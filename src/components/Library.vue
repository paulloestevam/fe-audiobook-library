<script setup>
import { ref, onMounted, computed } from 'vue'

const books = ref([])
const viewMode = ref('mode-compact')
const searchQuery = ref('')
const sortOption = ref('recent')
const selectedGenre = ref('')
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
    const response = await fetch('http://localhost:8080/audiobook-library/books')
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`)
    }
    const data = await response.json()
    books.value = data
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

const images = import.meta.glob('../assets/images/*', { eager: true, as: 'url' })

const getImageUrl = (filename) => {
  if (!filename) return '/vite.svg'
  
  if (filename.includes('http')) return filename
  
  const path = `../assets/images/${filename}`
  return images[path] || '/vite.svg'
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
        <a href="https://192.168.1.150/downloads/Smart%20AudioBook%20Player%20v10.7.0%20Premium%20Mod%20Apk%20%7BCracksHash%7D.apk" class="apk-link">
          📱 Baixar App Player
        </a>
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
          
          <a v-if="book.zipFilename" href="#" class="btn-download" title="Baixar Audiobook">
            <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          </a>
        </div>

        <div class="section-title">
          <span v-if="book.genre" class="meta-tag">{{ book.genre }}</span>
          <span class="title" :title="book.title">{{ book.title }}</span>
        </div>

        <div class="section-meta">
          <div v-if="book.rating" class="rating-container">
            <span class="rating-stars">★ {{ book.rating }}</span>
            <span class="rating-count" v-if="book.reviewsCount">({{ book.reviewsCount }})</span>
          </div>
          <div class="author">Autor: {{ book.author }}</div>
          <div class="grid-time" v-if="book.duration">Duração: {{ book.duration }}</div>
        </div>

        <div class="section-desc">
          <div class="list-time" v-if="book.duration">Duração: {{ book.duration }}</div>
          <p class="description">{{ book.description || 'Nenhuma descrição disponível para este audiobook.' }}</p>
        </div>
        
      </div>
    </div>
  </div>
</template>

<style>
:root { --bg-color: #f3f3f3; --card-bg: #ffffff; --text-main: #111; --text-sec: #555; --accent: #e09f00; --star-color: #ffa41c; }
</style>

<style scoped>

.controls { margin-bottom: 20px; background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
.header-bottom { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
.header-title { display: flex; align-items: baseline; gap: 15px; }
h1 { margin: 0; font-size: 1.5rem; color: #333; }
.book-count { font-size: 0.9rem; color: #777; font-weight: normal; background: #eee; padding: 2px 8px; border-radius: 10px; }

.apk-link { font-size: 0.70rem; color: #999; text-decoration: none; display: flex; align-items: center; gap: 5px; transition: 0.2s; font-weight: normal; }
.apk-link:hover { color: var(--accent); text-decoration: underline; }

.search-group { display: flex; gap: 10px; align-items: center; }
.sort-select { padding: 8px; border-radius: 4px; border: 1px solid #ddd; background: #f9f9f9; color: #333; cursor: pointer; outline: none; min-width: 120px; }
.search-input { padding: 8px; border-radius: 4px; border: 1px solid #ddd; background: #f9f9f9; color: #333; outline: none; width: 140px; }
.search-input:focus { border-color: var(--accent); background: #fff; }

.btn-group button { padding: 8px 16px; border: none; cursor: pointer; background: #ddd; font-weight: bold; border-radius: 4px; margin-left: 5px; transition: 0.2s; color: #333; }
.btn-group button.active { background-color: var(--accent); color: white; }

#book-container { display: grid; }

.mode-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 50px;
}

.mode-grid .book-card {
    background: var(--card-bg);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    display: flex; flex-direction: column;
    position: relative; cursor: pointer;
}

.mode-grid .cover-wrapper { order: 1; position: relative; width: 100%; aspect-ratio: 1/1; overflow: hidden; background: #eee; }
.mode-grid .section-title { order: 2; padding: 15px 15px 5px 15px; background: #fff; }
.mode-grid .section-meta  { order: 3; padding: 0 15px 15px 15px; background: #fff; }

.section-desc {
    display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(255, 255, 255, 0.98); color: #222;
    padding: 20px; box-sizing: border-box;
    opacity: 0; visibility: hidden; pointer-events: none;
    transition: opacity 0.2s ease; overflow-y: auto; z-index: 50;
}
.book-card.active .section-desc { opacity: 1; visibility: visible; pointer-events: auto; }

.cover-bg-blur { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; filter: blur(10px) brightness(0.9); transform: scale(1.1); z-index: 1; }
.cover-img { position: relative; width: 100%; height: 100%; object-fit: contain; z-index: 2; image-rendering: high-quality; transform: translateZ(0); box-shadow: 0 0 10px rgba(0,0,0,0.2); }
.title { font-weight: bold; font-size: 1.1rem; height: 3.2rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; color: var(--text-main); }
.author { font-size: 0.95rem; color: var(--text-sec); margin-top: 5px; }
.list-time { display: none; }
.grid-time { font-weight: normal; font-size: 0.8rem; opacity: 0.8; color: var(--text-sec); }
.meta-tag { display: block; font-size: 0.8rem; text-transform: uppercase; color: var(--accent); margin-bottom: 8px; font-weight: bold; }

.mode-compact {
    grid-template-columns: repeat(8, 1fr);
    gap: 15px;
}
.mode-compact .book-card {
    background: var(--card-bg);
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    display: flex; flex-direction: column;
    position: relative;
    cursor: pointer;
}

.mode-compact .cover-wrapper { order: 1; position: relative; width: 100%; aspect-ratio: 1/1; overflow: hidden; background: #eee; }
.mode-compact .section-title { order: 2; padding: 8px 8px 2px 8px; background: #fff; }
.mode-compact .section-meta { order: 3; padding: 0 8px 8px 8px; background: #fff; }
.mode-compact .title { font-size: 0.85rem; height: 2.4rem; line-height: 1.2; margin-bottom: 2px; }
.mode-compact .author { font-size: 0.75rem; margin-top: 2px; }
.mode-compact .grid-time { font-size: 0.7rem; }
.mode-compact .list-time { display: none; }
.mode-compact .rating-stars { font-size: 0.7rem; }
.mode-compact .rating-container { font-size: 0.7rem; margin-bottom: 2px; }
.mode-compact .meta-tag { display: block; font-size: 0.65rem; margin-bottom: 4px; }
.mode-compact .btn-download { width: 28px; height: 28px; top: 5px; right: 5px; }

.mode-list {
    grid-template-columns: 1fr;
    gap: 20px;
}

.mode-list .book-card {
    display: grid;
    grid-template-columns: 180px 220px 1fr;
    grid-template-rows: min-content 1fr;
    grid-template-areas:
        "img meta title"
        "img meta content";
    background: var(--card-bg);
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    column-gap: 25px;
    row-gap: 5px;
    align-items: start;
}

.mode-list .cover-wrapper { grid-area: img; width: 100%; height: 180px; position: relative; border-radius: 4px; overflow: hidden; }
.mode-list .section-meta  { grid-area: meta; display: flex; flex-direction: column; justify-content: flex-start; gap: 10px; padding-top: 5px; border-right: 1px solid #eee; padding-right: 15px;}

.mode-list .section-title { grid-area: title; margin: 0; padding: 0; }
.mode-list .title { font-size: 1.5rem; font-weight: bold; color: var(--text-main); margin-bottom: 5px; display: block; height: auto; -webkit-line-clamp: unset; }

.mode-list .section-desc {
    grid-area: content;
    position: static; opacity: 1; visibility: visible; pointer-events: auto;
    background: none; padding: 0; color: inherit; display: block;
}

.mode-list .cover-bg-blur { display: none; }
.mode-list .cover-img { width: 100%; height: 100%; object-fit: cover; }

.mode-list .author { font-size: 1rem; font-weight: 600; color: var(--text-main); }
.mode-list .grid-time { display: none; }
.mode-list .list-time { display: block; font-size: 0.9rem; color: #555; font-weight: 500;}

.mode-list .meta-tag { display: inline-block; background: #eee; padding: 3px 8px; font-size: 0.8rem; border-radius: 12px; margin-bottom: 10px; width: fit-content; color: #555; }
.mode-list .description {
    font-size: 0.85rem;
    line-height: 1.5; color: #444;
    border-top: none; padding-top: 0; margin-top: 0;
}

.btn-download { position: absolute; top: 10px; right: 10px; width: 36px; height: 36px; background: rgba(255, 255, 255, 0.95); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.3); color: #333; opacity: 1; transition: opacity 0.2s; z-index: 60; text-decoration: none; }
.mode-list .btn-download { opacity: 1; top: 5px; right: 5px; width: 28px; height: 28px; background: rgba(255,255,255,0.8); }
.btn-download svg { width: 18px; height: 18px; fill: currentColor; }
.btn-download:hover { transform: scale(1.1); }

.rating-container { display: inline-flex; align-items: center; font-size: 0.85rem; color: #007185; margin-bottom: 5px; text-decoration: none; transition: opacity 0.2s; }
.rating-stars { color: var(--star-color); margin-right: 5px; font-size: 0.9rem; letter-spacing: 1px; }
.rating-count { color: #565959; font-size: 0.8rem; }

@media (max-width: 1600px) { .mode-compact { grid-template-columns: repeat(6, 1fr); } }
@media (max-width: 1400px) { .mode-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 1200px) { .mode-compact { grid-template-columns: repeat(4, 1fr); } }
@media (max-width: 900px) {
    .mode-grid { grid-template-columns: repeat(2, 1fr); }
    .mode-list .book-card { grid-template-columns: 1fr; grid-template-areas: "img" "title" "meta" "content"; gap: 10px; grid-template-rows: auto; }
    .mode-list .section-meta { border-right: none; padding-right: 0; flex-direction: row; flex-wrap: wrap; align-items: center;}
}
@media (max-width: 500px) {
    .mode-grid { grid-template-columns: 1fr; }
    .mode-compact { grid-template-columns: repeat(2, 1fr); }
}
</style>
