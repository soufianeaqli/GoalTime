import { API_BASE_URL } from './config';

export const updateProfile = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/user/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(userData)
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Erreur lors de la mise à jour du profil');

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  localStorage.setItem('user', JSON.stringify({ ...storedUser, ...data.user }));
  return data.user;
};

export const updatePassword = async (passwordData) => {
  const response = await fetch(`${API_BASE_URL}/user/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(passwordData)
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Erreur lors de la mise à jour du mot de passe');
  return data;
};
