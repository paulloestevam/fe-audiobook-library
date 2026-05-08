import { API_URL } from '../config'

const getAuthHeaders = (headers = {}) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    return { ...headers, 'Authorization': `Bearer ${token}` }
  }
  return headers
}

export const fetchBooksFromApi = async () => {
  const response = await fetch(`${API_URL}/books`, {
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
  return await response.json()
}

export const fetchRestrictedBooksFromApi = async () => {
  const response = await fetch(`${API_URL}/books-restricted`, {
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
  return await response.json()
}

export const fetchBooksAllFromApi = async () => {
  const response = await fetch(`${API_URL}/books-all`, {
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
  return await response.json()
}

export const fetchBookById = async (id) => {
  const response = await fetch(`${API_URL}/books/${id}`, {
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
  return await response.json()
}

export const updateBookDetails = async (id, bookDetails) => {
  const response = await fetch(`${API_URL}/books/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(bookDetails)
  })
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
  return await response.json()
}

export const toggleBookRestriction = async (id) => {
  const response = await fetch(`${API_URL}/books/${id}/toggle-restriction`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
  return await response.json()
}

export const updateBookGenre = async (id, genre) => {
  const response = await fetch(`${API_URL}/books/${id}/genre`, {
    method: 'PATCH',
    headers: getAuthHeaders({
      'Content-Type': 'text/plain'
    }),
    body: genre
  })
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
  return await response.json()
}

export const deleteBook = async (id) => {
  const response = await fetch(`${API_URL}/books/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
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
    headers: getAuthHeaders(),
    body: formData
  })
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
  return await response.text()
}

export const toggleFavoriteBook = async (id) => {
  const response = await fetch(`${API_URL}/users/favorites/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
  return await response.json()
}

export const fetchUserFavorites = async () => {
  const response = await fetch(`${API_URL}/users/favorites`, {
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    return []
  }
  return await response.json()
}

export const fetchAllUsers = async () => {
  const response = await fetch(`${API_URL}/users`, {
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
  return await response.json()
}

export const toggleUserAdmin = async (id) => {
  const response = await fetch(`${API_URL}/users/${id}/toggle-admin`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
  return await response.json()
}

export const toggleUserRestrictedContent = async (id) => {
  const response = await fetch(`${API_URL}/users/${id}/toggle-restricted`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
  return await response.json()
}
