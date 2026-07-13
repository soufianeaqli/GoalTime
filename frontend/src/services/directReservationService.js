import { API_BASE_URL } from './config';

export const getAllReservations = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`Erreur ${response.status}`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('getAllReservations:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const getUserReservations = async (username) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations/user/${encodeURIComponent(username)}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`Erreur ${response.status}`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('getUserReservations:', error);
    return { success: false, error: error.message, data: [] };
  }
};

export const createReservation = async (reservationData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(reservationData)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Erreur ${response.status}`);
    }
    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('createReservation:', error);
    return { success: false, error: error.message };
  }
};

export const updateReservation = async (id, reservationData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(reservationData)
    });
    if (!response.ok) throw new Error('Erreur lors de la mise à jour');
    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('updateReservation:', error);
    return { success: false, error: error.message };
  }
};

export const deleteReservation = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error('Erreur lors de la suppression');
    return { success: true };
  } catch (error) {
    console.error('deleteReservation:', error);
    return { success: false, error: error.message };
  }
};

export const checkAvailability = async (terrainId, date, timeSlot) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations/check-availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ terrain_id: terrainId, date, time_slot: timeSlot })
    });
    if (!response.ok) throw new Error('Erreur lors de la vérification');
    const result = await response.json();
    return { success: true, data: { available: result.available } };
  } catch (error) {
    console.error('checkAvailability:', error);
    return { success: false, error: error.message, data: { available: false } };
  }
};

export const markAsPaid = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reservations/${id}/pay`, {
      method: 'PUT',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error('Erreur lors du marquage comme payée');
    const result = await response.json();
    return { success: true, data: result.data };
  } catch (error) {
    console.error('markAsPaid:', error);
    return { success: false, error: error.message };
  }
};
