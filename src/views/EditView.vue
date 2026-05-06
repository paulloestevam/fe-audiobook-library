<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchBookById, updateBookDetails } from '../services/audiobookService'

const route = useRoute()
const router = useRouter()

const bookId = route.params.id
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref(null)

const book = ref({
  title: '',
  author: '',
  genre: '',
  subGenre: '',
  rating: null,
  reviewsCount: null,
  description: '',
  urlAmazon: '',
  restricted: false,
  series: false
})

onMounted(async () => {
  try {
    const data = await fetchBookById(bookId)
    book.value = {
      title: data.title || '',
      author: data.author || '',
      genre: data.genre || '',
      subGenre: data.subGenre || '',
      rating: data.rating || null,
      reviewsCount: data.reviewsCount || null,
      description: data.description || '',
      urlAmazon: data.urlAmazon || '',
      restricted: data.restricted || false,
      series: data.series || false
    }
  } catch (err) {
    console.error('Erro ao carregar livro:', err)
    error.value = 'Falha ao carregar os dados do livro.'
  } finally {
    isLoading.value = false
  }
})

const handleSave = async () => {
  try {
    isSaving.value = true
    await updateBookDetails(bookId, book.value)
    router.push('/admin')
  } catch (err) {
    console.error('Erro ao salvar livro:', err)
    alert('Erro ao salvar as alterações.')
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  router.push('/admin')
}
</script>

<template>
  <div class="edit-container">
    <div class="header">
      <div class="header-top">
        <div class="header-title">
          <h1>✏️ Editar Livro</h1>
        </div>
        <button class="nav-link btn-back" @click="handleCancel">
          Voltar
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Carregando dados...</p>
    </div>

    <div v-else-if="error" class="error-state">
      {{ error }}
    </div>

    <div v-else class="form-wrapper">
      <form @submit.prevent="handleSave" class="edit-form">
        
        <div class="form-group full-width">
          <label for="title">Título</label>
          <input type="text" id="title" v-model="book.title" required class="form-input" />
        </div>

        <div class="form-group full-width">
          <label for="author">Autor</label>
          <input type="text" id="author" v-model="book.author" required class="form-input" />
        </div>

        <div class="form-group">
          <label for="genre">Gênero</label>
          <select id="genre" v-model="book.genre" class="form-input">
            <option value="Ficção">Ficção</option>
            <option value="Não-ficção">Não-ficção</option>
            <option value="Literatura">Literatura</option>
            <option value="">Outro / N/A</option>
          </select>
        </div>

        <div class="form-group">
          <label for="subGenre">Sub-gênero</label>
          <input type="text" id="subGenre" v-model="book.subGenre" class="form-input" />
        </div>

        <div class="form-group">
          <label for="rating">Nota (ex: 4.5)</label>
          <input type="text" id="rating" v-model="book.rating" class="form-input" />
        </div>

        <div class="form-group">
          <label for="reviewsCount">Total de Avaliações</label>
          <input type="number" id="reviewsCount" v-model="book.reviewsCount" class="form-input" />
        </div>

        <div class="form-group full-width">
          <label for="urlAmazon">URL Amazon</label>
          <input type="url" id="urlAmazon" v-model="book.urlAmazon" class="form-input" placeholder="https://..." />
        </div>

        <div class="form-group full-width">
          <label for="description">Descrição</label>
          <textarea id="description" v-model="book.description" rows="5" class="form-input"></textarea>
        </div>

        <div class="form-group checkbox-group full-width">
          <label class="checkbox-label">
            <input type="checkbox" v-model="book.restricted" />
            Restringir acesso (🔒)
          </label>
        </div>

        <div class="form-group checkbox-group full-width">
          <label class="checkbox-label">
            <input type="checkbox" v-model="book.series" />
            Série (Faz parte de uma coleção)
          </label>
        </div>

        <div class="form-actions full-width">
          <button type="button" class="btn-cancel" @click="handleCancel" :disabled="isSaving">Cancelar</button>
          <button type="submit" class="btn-save" :disabled="isSaving">
            {{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style src="../assets/styles/editView.css" scoped></style>
