import { API_BASE_URL } from './config';

export const sendContactMessage = async (contactData) => {
  const response = await fetch(`${API_BASE_URL}/contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(contactData)
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Erreur lors de l\'envoi du message');
  return data;
};

export const getContactMessages = async () => {
  const response = await fetch(`${API_BASE_URL}/contacts`, {
    headers: { 'Accept': 'application/json' }
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Erreur lors de la récupération');
  return data.data;
};

export const markContactMessageAsRead = async (id) => {
  const response = await fetch(`${API_BASE_URL}/contacts/${id}/read`, {
    method: 'PUT',
    headers: { 'Accept': 'application/json' }
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Erreur lors du marquage');
  return data;
};

export const deleteContactMessage = async (id) => {
  const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json' }
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Erreur lors de la suppression');
  return data;
};
