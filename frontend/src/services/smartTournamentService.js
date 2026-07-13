import { API_BASE_URL } from './config';

const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...options.headers },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || data.message || 'Erreur serveur');
  return data;
};

export const smartTournamentService = {
  async list() { return fetchApi('/smart-tournaments'); },
  async get(id) { return fetchApi(`/smart-tournaments/${id}`); },
  async create(data) { return fetchApi('/smart-tournaments', { method: 'POST', body: JSON.stringify(data) }); },
  async update(id, data) { return fetchApi(`/smart-tournaments/${id}`, { method: 'PUT', body: JSON.stringify(data) }); },
  async delete(id) { return fetchApi(`/smart-tournaments/${id}`, { method: 'DELETE' }); },
  async registerTeam(id, data) { return fetchApi(`/smart-tournaments/${id}/register-team`, { method: 'POST', body: JSON.stringify(data) }); },
  async generateGroups(id) { return fetchApi(`/smart-tournaments/${id}/generate-groups`, { method: 'POST' }); },
  async generateFixtures(id) { return fetchApi(`/smart-tournaments/${id}/generate-fixtures`, { method: 'POST' }); },
  async generateKnockout(id) { return fetchApi(`/smart-tournaments/${id}/generate-knockout`, { method: 'POST' }); },
  async updateStatus(id, status) { return fetchApi(`/smart-tournaments/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }); },
  async closeRegistration(id) { return fetchApi(`/smart-tournaments/${id}/close-registration`, { method: 'POST' }); },
  async updateMatchResult(tournamentId, matchId, data) {
    return fetchApi(`/smart-tournaments/${tournamentId}/matches/${matchId}/result`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async getStandings(id) { return fetchApi(`/smart-tournaments/${id}/standings`); },
  async getMatches(id) { return fetchApi(`/smart-tournaments/${id}/matches`); },
  async createGroup(id, data) { return fetchApi(`/smart-tournaments/${id}/groups`, { method: 'POST', body: JSON.stringify(data) }); },
  async deleteGroup(id, groupId) { return fetchApi(`/smart-tournaments/${id}/groups/${groupId}`, { method: 'DELETE' }); },
  async createMatch(id, data) { return fetchApi(`/smart-tournaments/${id}/matches`, { method: 'POST', body: JSON.stringify(data) }); },
  async deleteMatch(id, matchId) { return fetchApi(`/smart-tournaments/${id}/matches/${matchId}`, { method: 'DELETE' }); },
  async createStanding(id, data) { return fetchApi(`/smart-tournaments/${id}/standings`, { method: 'POST', body: JSON.stringify(data) }); },
  async generateRound(id) { return fetchApi(`/smart-tournaments/${id}/generate-round`, { method: 'POST' }); },
};
