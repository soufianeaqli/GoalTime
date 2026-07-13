import { API_BASE_URL } from './config';

export const login = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(credentials)
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Erreur lors de la connexion');
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
};

export const register = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(userData)
  });
  const data = await response.json();
  if (!data.success) {
    if (data.errors) {
      if (data.errors.username) throw new Error('Ce nom d\'utilisateur est déjà utilisé.');
      if (data.errors.email) throw new Error('Cet email est déjà utilisé.');
      if (data.errors.phone) throw new Error('Ce numéro de téléphone est déjà utilisé.');
    }
    throw new Error(data.message || 'Erreur lors de l\'inscription');
  }
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
};

export const checkUsernameAvailable = async (username) => {
  const response = await fetch(`${API_BASE_URL}/check-username?username=${encodeURIComponent(username)}`, {
    headers: { 'Accept': 'application/json' }
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Erreur lors de la vérification');
  return data.available;
};

export const logout = () => {
  localStorage.removeItem('user');
};
