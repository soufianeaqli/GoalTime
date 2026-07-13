import { API_BASE_URL } from './config';

export const getAllTerrains = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/terrains`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`Erreur ${response.status}`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('getAllTerrains:', error);
    return { success: false, error: error.message };
  }
};

export const getTerrain = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/terrains/${id}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`Erreur ${response.status}`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('getTerrain:', error);
    return { success: false, error: error.message };
  }
};

export const addTerrain = async (terrainData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/terrains`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(terrainData)
    });
    if (!response.ok) throw new Error(`Erreur ${response.status}`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('addTerrain:', error);
    return { success: false, error: error.message };
  }
};

export const deleteTerrain = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/terrains/${id}`, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error(`Erreur ${response.status}`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('deleteTerrain:', error);
    return { success: false, error: error.message };
  }
};

export const uploadImage = async (file) => {
  try {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      throw new Error('Type de fichier non supporté. Utilisez JPG ou PNG.');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Fichier trop volumineux. Taille maximum: 5MB.');
    }
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`${API_BASE_URL}/upload-image`, {
      method: 'POST',
      body: formData
    });
    if (!response.ok) throw new Error(`Erreur ${response.status}`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('uploadImage:', error);
    return { success: false, error: error.message };
  }
};
