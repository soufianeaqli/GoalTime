import axios from 'axios';
import { BASE_URL, API_BASE_URL } from './config';

// Instance API principale
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

// Fonction pour obtenir le CSRF token
const getCsrfToken = async () => {
    try {
        await axios.get(`${BASE_URL}/sanctum/csrf-cookie`, {
            withCredentials: true
        });
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1];
        
        if (token) {
            api.defaults.headers.common['X-XSRF-TOKEN'] = decodeURIComponent(token);
        }
    } catch (error) {
        console.error('Erreur lors de la récupération du token CSRF:', error);
    }
};

// Intercepteur de requête
api.interceptors.request.use(
    async (config) => {
        // Si c'est une requête avec FormData
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        // Pour les méthodes qui nécessitent un CSRF token
        if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
            const token = await getCsrfToken();
            if (token) {
                config.headers['X-XSRF-TOKEN'] = token;
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Intercepteur de réponse
api.interceptors.response.use(
    response => response,
    async (error) => {
        if (error.response?.status === 419) {
            // Réessayer la requête une seule fois
            try {
                const token = await getCsrfToken();
                if (token && error.config && !error.config._retry) {
                    error.config._retry = true;
                    error.config.headers['X-XSRF-TOKEN'] = token;
                    return api(error.config);
                }
            } catch (retryError) {
                console.error('Erreur lors de la nouvelle tentative:', retryError);
            }
        }
        return Promise.reject(error);
    }
);

// Fonction pour télécharger une image
export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const token = await getCsrfToken();
        const response = await api.post('/upload-image', formData, {
            headers: {
                'X-XSRF-TOKEN': token
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};

export default api; 