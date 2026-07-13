import { API_BASE_URL } from './config';

const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Erreur serveur');
  }

  return data;
};

export const reputationService = {
  async getReputation(userId) {
    return fetchApi(`/reputation/${userId}`);
  },

  async getReviews(userId, page = 1) {
    return fetchApi(`/reputation/${userId}/reviews?page=${page}`);
  },

  async getPendingReviews(userId) {
    return fetchApi(`/reputation/pending-reviews?user_id=${userId}`);
  },

  async submitReview(reviewData) {
    return fetchApi('/reputation/review', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  async getLeaderboard() {
    return fetchApi('/reputation/leaderboard');
  },

  async completeMatch(data) {
    return fetchApi('/reputation/complete-match', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
