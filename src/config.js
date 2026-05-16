export const HOST = import.meta.env.VITE_BACKEND_HOST !== undefined ? import.meta.env.VITE_BACKEND_HOST : 'http://localhost:8086';

export const API_URL = `${HOST}/audiobook-library`;

// Em produção, usa as rotas estáticas criadas no Nginx
export const IMAGES_URL = import.meta.env.PROD ? '/images' : `${API_URL}/images`;
export const DOWNLOADS_URL = import.meta.env.PROD ? '/downloads' : `${API_URL}/downloads`;
