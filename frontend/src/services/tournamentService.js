import { API_BASE_URL } from './config';

const getStoredUser = () => {
  try {
    const str = localStorage.getItem('user');
    return str ? JSON.parse(str) : null;
  } catch { return null; }
};

export const getAllTournaments = async () => {
  const response = await fetch(`${API_BASE_URL}/tournaments`, {
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) throw new Error('Erreur lors du chargement des tournois');
  return await response.json();
};

export const getTournamentById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/tournaments/${id}`, {
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) throw new Error('Erreur lors du chargement du tournoi');
  return await response.json();
};

export const createTournament = async (tournamentData) => {
  const user = getStoredUser();
  const response = await fetch(`${API_BASE_URL}/tournaments`, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...tournamentData, role: user?.role })
  });
  if (!response.ok) throw new Error('Erreur lors de la création du tournoi');
  const data = await response.json();
  return data.tournament || data;
};

export const updateTournament = async (id, tournamentData) => {
  const user = getStoredUser();
  const response = await fetch(`${API_BASE_URL}/tournaments/${id}`, {
    method: 'PUT',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...tournamentData, role: user?.role })
  });
  if (!response.ok) throw new Error('Erreur lors de la modification du tournoi');
  const data = await response.json();
  return data;
};

export const deleteTournament = async (id) => {
  const response = await fetch(`${API_BASE_URL}/tournaments/${id}`, {
    method: 'DELETE',
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) throw new Error('Erreur lors de la suppression du tournoi');
  return true;
};

export const registerTeam = async (tournamentId, teamData) => {
  const user = getStoredUser();
  if (user?.id) teamData.user_id = user.id;

  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/register`, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(teamData)
  });
  if (!response.ok) throw new Error('Erreur lors de l\'inscription de l\'équipe');
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Erreur lors de l\'inscription');
  return data;
};

export const unregisterTeam = async (tournamentId) => {
  const user = getStoredUser();
  if (!user?.id) throw new Error('Aucune information d\'utilisateur disponible');

  const response = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/unregister`, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id })
  });
  if (!response.ok) throw new Error('Erreur lors de la désinscription');
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Erreur lors de la désinscription');
  return data;
};
