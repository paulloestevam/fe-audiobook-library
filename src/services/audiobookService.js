import { API_URL } from '../config'

export const fetchBooksFromApi = async () => {
  const response = await fetch(`${API_URL}/books`)
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
  return await response.json()
}

export const toggleBookRestriction = async (id) => {
  const response = await fetch(`${API_URL}/books/${id}/toggle-restriction`, {
    method: 'PATCH'
  })
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
  return await response.json()
}

export const updateBookGenre = async (id, genre) => {
  const response = await fetch(`${API_URL}/books/${id}/genre`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'text/plain'
    },
    body: genre
  })
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
  return await response.json()
}

export const deleteBook = async (id) => {
  const response = await fetch(`${API_URL}/books/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
}
