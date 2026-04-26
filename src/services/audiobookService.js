import { API_URL } from '../config'

export const fetchBooksFromApi = async () => {
  const response = await fetch(`${API_URL}/books`)
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`)
  }
  return await response.json()
}
