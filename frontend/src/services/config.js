/**
 * Configuration centrale de l'API avec détection automatique de l'environnement
 */

// URL du backend sur Railway (Production)
const RAILWAY_URL = 'https://sincere-youth-production-1500.up.railway.app';

// URL du backend en local
const LOCAL_URL = 'http://127.0.0.1:8000';

// Vérifier si nous sommes en local (localhost ou 127.0.0.1)
const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' || 
                window.location.hostname.startsWith('192.168.');

// Vérifier si nous sommes sur Vercel
const isVercel = window.location.hostname.includes('vercel.app') || 
                 window.location.hostname.includes('goal-time-b6ob');

// La BASE_URL utilise d'abord les variables d'environnement, puis la détection automatique
// En production (Vite build) ou sur Vercel, on utilise RAILWAY_URL par défaut
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                        import.meta.env.VITE_API_URL || 
                        ((isLocal && !isVercel) ? LOCAL_URL : RAILWAY_URL);

// L'URL de l'API Laravel (avec le préfixe /api)
export const API_BASE_URL = `${BASE_URL}/api`;

console.log(`[API Config] Mode: ${import.meta.env.MODE} - Host: ${window.location.hostname}`);
console.log(`[API Config] Using BASE_URL: ${BASE_URL}`);
