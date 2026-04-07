// Configuration de l'API centralisée
const DEFAULT_REMOTE_URL = 'https://sincere-youth-production-1500.up.railway.app';
const DEFAULT_LOCAL_URL = 'http://127.0.0.1:8000';

// Priorité à la variable d'environnement, sinon valeur par défaut selon le mode
export const BASE_URL = import.meta.env.VITE_API_URL || 
                        (import.meta.env.PROD ? DEFAULT_REMOTE_URL : DEFAULT_LOCAL_URL);

export const API_BASE_URL = `${BASE_URL}/api`;

console.log(`[API Config] Mode: ${import.meta.env.MODE} | Target URL: ${BASE_URL}`);
