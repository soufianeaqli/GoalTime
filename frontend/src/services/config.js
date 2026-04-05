/**
 * Configuration centrale de l'API avec détection automatique de l'environnement
 */

// Vérifier si nous sommes en local (localhost ou 127.0.0.1)
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// URL du backend sur Railway (Production)
const RAILWAY_URL = 'https://sincere-youth-production-1500.up.railway.app';

// URL du backend en local
const LOCAL_URL = 'http://127.0.0.1:8000';

// La BASE_URL utilise d'abord les variables d'environnement, puis la détection automatique
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                        import.meta.env.VITE_API_URL || 
                        (isLocal ? LOCAL_URL : RAILWAY_URL);

// L'URL de l'API Laravel (avec le préfixe /api)
export const API_BASE_URL = `${BASE_URL}/api`;

console.log(`[API Config] Running on ${isLocal ? 'Local' : 'Production'} - API Base: ${BASE_URL}`);
