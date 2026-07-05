export const HOST = import.meta.env.PROD
  ? ''
  : (import.meta.env.VITE_BACKEND_HOST !== undefined ? import.meta.env.VITE_BACKEND_HOST : 'http://localhost:8086');

export const API_URL = `${HOST}/audiobook-library`;

// Google OAuth does not support .local domains. We must initiate OAuth via the registered nip.io domain in production.
export const GOOGLE_LOGIN_URL = import.meta.env.PROD
  ? 'https://192.168.1.150.nip.io/audiobook-library/oauth2/authorization/google'
  : `${API_URL}/oauth2/authorization/google`;

// Em produção, usa as rotas estáticas criadas no Nginx
export const IMAGES_URL = import.meta.env.PROD ? '/images' : `${API_URL}/images`;
export const DOWNLOADS_URL = import.meta.env.PROD ? '/downloads' : `${API_URL}/downloads`;
