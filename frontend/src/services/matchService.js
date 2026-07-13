import { API_BASE_URL } from './config';

// ===== ANNOUNCEMENTS =====
export const getAnnouncements = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      params.append(key, value);
    }
  });
  const url = `${API_BASE_URL}/announcements?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Erreur lors du chargement des annonces');
  return response.json();
};

export const getAnnouncement = async (id, userId) => {
  const url = userId ? `${API_BASE_URL}/announcements/${id}?user_id=${userId}` : `${API_BASE_URL}/announcements/${id}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Annonce non trouvée');
  return response.json();
};

export const createAnnouncement = async (data) => {
  const response = await fetch(`${API_BASE_URL}/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Erreur lors de la création');
  }
  return response.json();
};

export const updateAnnouncement = async (id, data) => {
  const response = await fetch(`${API_BASE_URL}/announcements/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Erreur lors de la mise à jour');
  return response.json();
};

export const deleteAnnouncement = async (id) => {
  const response = await fetch(`${API_BASE_URL}/announcements/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Erreur lors de la suppression');
  return response.json();
};

export const joinAnnouncement = async (id, data) => {
  const response = await fetch(`${API_BASE_URL}/announcements/${id}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Erreur');
  }
  return response.json();
};

export const leaveAnnouncement = async (id, data) => {
  const response = await fetch(`${API_BASE_URL}/announcements/${id}/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Erreur');
  return response.json();
};

export const kickPlayer = async (id, data) => {
  const response = await fetch(`${API_BASE_URL}/announcements/${id}/kick`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Erreur');
  return response.json();
};

export const getMyAnnouncements = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/announcements/my?user_id=${userId}`);
  if (!response.ok) throw new Error('Erreur');
  return response.json();
};

// ===== MESSAGES =====
export const getMessages = async (announcementId) => {
  const response = await fetch(`${API_BASE_URL}/announcements/${announcementId}/messages`);
  if (!response.ok) throw new Error('Erreur');
  return response.json();
};

export const sendMessage = async (announcementId, data) => {
  const response = await fetch(`${API_BASE_URL}/announcements/${announcementId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Erreur');
  return response.json();
};

export const markMessagesRead = async (announcementId, userId) => {
  const response = await fetch(`${API_BASE_URL}/announcements/${announcementId}/messages/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!response.ok) throw new Error('Erreur');
  return response.json();
};

// ===== NOTIFICATIONS =====
export const getNotifications = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/notifications?user_id=${userId}`);
  if (!response.ok) throw new Error('Erreur');
  return response.json();
};

export const getUnreadCount = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/notifications/unread-count?user_id=${userId}`);
  if (!response.ok) throw new Error('Erreur');
  return response.json();
};

export const markNotificationRead = async (id) => {
  const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: 'PUT',
  });
  if (!response.ok) throw new Error('Erreur');
  return response.json();
};

export const markAllNotificationsRead = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/notifications/read-all?user_id=${userId}`, {
    method: 'PUT',
  });
  if (!response.ok) throw new Error('Erreur');
  return response.json();
};

// ===== PLAYER PROFILES =====
export const getPlayerProfile = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/players/${userId}/profile`);
  if (!response.ok) throw new Error('Erreur');
  return response.json();
};

export const updatePlayerProfile = async (userId, data) => {
  const response = await fetch(`${API_BASE_URL}/players/${userId}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Erreur');
  return response.json();
};

export const getLeaderboard = async () => {
  const response = await fetch(`${API_BASE_URL}/players/leaderboard`);
  if (!response.ok) throw new Error('Erreur');
  return response.json();
};
