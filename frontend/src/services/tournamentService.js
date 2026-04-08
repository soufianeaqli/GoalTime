import { BASE_URL, API_BASE_URL, API_URL } from './config';

const getCSRFToken = async () => {
    try {
        await fetch(`${API_URL}/sanctum/csrf-cookie`, {
            credentials: 'include'
        });
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
    }
};

const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Une erreur est survenue');
    }
    return data;
};

export const getAllTournaments = async () => {
    try {
        const response = await fetch(`${BASE_URL}/direct-get-tournaments.php`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erreur lors du chargement des tournois');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching tournaments:', error);
        throw error;
    }
};

export const getTournamentById = async (id) => {
    try {
        const response = await fetch(`${BASE_URL}/direct-get-tournament.php?id=${id}`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erreur lors du chargement du tournoi');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching tournament:', error);
        throw error;
    }
};

export const createTournament = async (tournamentData) => {
    try {
        // Utiliser le script direct avec méthode POST
        const response = await fetch(`${BASE_URL}/direct-add-tournament.php`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tournamentData)
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Erreur lors de la création du tournoi');
        }
        return data.tournament || data;
    } catch (error) {
        console.error('Error creating tournament:', error);
        throw error;
    }
};

export const updateTournament = async (id, tournamentData) => {
    try {
        // S'assurer que l'ID est inclus dans les données
        const dataWithId = { ...tournamentData, id };
        
        // Utiliser le script de mise à jour direct
        const response = await fetch(`${BASE_URL}/direct-update-tournoi.php`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataWithId)
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Erreur lors de la modification du tournoi');
        }
        return data; // Contient success: true et le tournoi mis à jour
    } catch (error) {
        console.error('Error updating tournament:', error);
        throw error;
    }
};

export const deleteTournament = async (id) => {
    try {
        const response = await fetch(`${BASE_URL}/direct-delete-tournament.php?id=${id}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Erreur lors de la suppression du tournoi');
        }
        return true;
    } catch (error) {
        console.error('Error deleting tournament:', error);
        throw error;
    }
};

export const registerTeam = async (tournamentId, teamData) => {
    try {
        // S'assurer que l'utilisateur connecté est associé à cette équipe
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.id) {
                    teamData.user_id = user.id;
                }
                console.log('User info added to team data:', user, teamData);
            } catch (e) {
                console.error('Error parsing user data from localStorage', e);
            }
        }
        
        console.log('Sending registration data:', teamData, 'for tournament:', tournamentId);
        
        // Utiliser le script PHP direct
        const response = await fetch(`${BASE_URL}/direct-register-team.php`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tournoi_id: tournamentId, ...teamData })
        });
        
        if (!response.ok) {
            const errText = await response.text();
            console.error('Error response:', errText);
            throw new Error('Erreur lors de l\'inscription de l\'équipe: ' + response.status);
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Erreur lors de l\'inscription de l\'équipe');
        }
        
        console.log('Registration successful:', data);
        return data;
    } catch (error) {
        console.error('Error registering team:', error);
        throw error;
    }
};

export const unregisterTeam = async (tournamentId, teamId = null) => {
    try {
        // Récupérer l'ID utilisateur depuis localStorage
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            throw new Error('Aucune information d\'utilisateur disponible pour la désinscription');
        }
        
        let userId = null;
        try {
            const user = JSON.parse(userStr);
            userId = user?.id || null;
        } catch (e) {
            throw new Error('Erreur lors de la récupération des informations utilisateur');
        }
        
        if (!userId) {
            throw new Error('Impossible de déterminer l\'utilisateur à désinscrire');
        }
        
        console.log('Sending unregistration request for tournament:', tournamentId, 'user:', userId);
        
        // Utiliser le script PHP direct
        const response = await fetch(`${BASE_URL}/direct-unregister-team.php`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tournoi_id: tournamentId, user_id: userId })
        });
        
        if (!response.ok) {
            const errText = await response.text();
            console.error('Error response from unregister:', errText);
            throw new Error('Erreur lors de la désinscription: ' + response.status);
        }
        
        const data = await response.json();
        console.log('Réponse brute de l\'API:', data);
        
        if (!data.success) {
            throw new Error(data.message || 'Erreur lors de la désinscription de l\'équipe');
        }
        
        console.log('Unregistration successful:', data);
        return data;
    } catch (error) {
        console.error('Error unregistering team:', error);
        throw error;
    }
}; 