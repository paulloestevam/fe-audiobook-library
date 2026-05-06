import { API_URL } from '../config'

export const fetchBooksFromApi = async () => {
  const response = await fetch(`${API_URL}/books`)
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
  return await response.json()
}

export const fetchBookById = async (id) => {
  const response = await fetch(`${API_URL}/books/${id}`)
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
  return await response.json()
}

export const updateBookDetails = async (id, bookDetails) => {
  const response = await fetch(`${API_URL}/books/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bookDetails)
  })
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

export const uploadZips = async (files) => {
  const formData = new FormData()
  for (let i = 0; i < files.length; i++) {
    formData.append('files', files[i])
  }
  const response = await fetch(`${API_URL}/books/upload-zips`, {
    method: 'POST',
    body: formData
  })
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
  return await response.text()
}
