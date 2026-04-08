import React, { useState, useEffect } from 'react';
import LoginPrompt from './LoginPrompt';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trophy, Calendar, Users, Edit, Trash2, Plus, 
    CheckCircle, XCircle, Info, Image as ImageIcon, 
    DollarSign, Shield, Layout, UserPlus, UserMinus 
} from 'lucide-react';
import * as tournamentService from '../services/tournamentService';
import { BASE_URL } from '../services/config';

function Tournoi({ user }) {
    const [tournaments, setTournaments] = useState([]);
    const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
    const [isAddTournoiModalOpen, setIsAddTournoiModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedTournoi, setSelectedTournoi] = useState(null);
    const [formData, setFormData] = useState({
        teamName: '',
        captainName: '',
        phoneNumber: '',
        email: ''
    });
    const [tournoiFormData, setTournoiFormData] = useState({
        format: '',
        entryFee: '',
        image: null
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTournaments();
    }, []);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                email: user.email || '',
                captainName: user.username || ''
            }));
        }
    }, [user]);

    const fetchTournaments = async () => {
        try {
            const data = await tournamentService.getAllTournaments();
            setTournaments(data);
        } catch (error) {
            setError('Erreur lors du chargement des tournois');
            console.error('Error:', error);
        }
    };

    const handleRegisterClick = (tournoi) => {
        if (!user) {
            setShowLoginPrompt(true);
            return;
        }
        setSelectedTournoi(tournoi);
        setIsRegistrationModalOpen(true);
        setFormData(prev => ({
            ...prev, 
            email: user.email || '',
            captainName: user.username || ''
        }));
    };

    const handleCloseModal = () => {
        setIsRegistrationModalOpen(false);
        setSelectedTournoi(null);
        setFormData({
            teamName: '',
            captainName: '',
            phoneNumber: '',
            email: ''
        });
    };

    const handleCloseTournoiModal = () => {
        setIsAddTournoiModalOpen(false);
        setIsEditMode(false);
        setSelectedTournoi(null);
        setTournoiFormData({
            name: '',
            date: '',
            maxTeams: '',
            registeredTeams: 0,
            prizePool: '',
            description: '',
            format: '',
            entryFee: '',
            image: null
        });
        setImagePreview(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleTournoiChange = (e) => {
        const { name, value } = e.target;
        setTournoiFormData({
            ...tournoiFormData,
            [name]: value
        });
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
            setError('Type de fichier non autorisé. Utilisez JPG ou PNG.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('L\'image est trop grande. Taille maximum: 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);

        try {
            const uploadFormData = new FormData();
            uploadFormData.append('image', file);

            const response = await fetch(`${BASE_URL}/direct-upload.php`, {
                method: 'POST',
                body: uploadFormData
            });

            if (response.ok) {
                const responseData = await response.json();
                if (responseData && responseData.url) {
                    setTournoiFormData(prev => ({
                        ...prev,
                        image: responseData.url
                    }));
                    setConfirmationMessage('Image téléchargée avec succès');
                    setTimeout(() => setConfirmationMessage(''), 3000);
                }
            } else {
                throw new Error('Erreur lors de l\'upload de l\'image');
            }
        } catch (error) {
            setError(error.message);
            setImagePreview(null);
        }
    };

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return '/placeholder-tournament.jpg';
        if (imageUrl.startsWith('/storage')) {
            return `${BASE_URL}${imageUrl}`;
        }
        return imageUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const teamData = {
                team_name: formData.teamName,
                captain_name: formData.captainName,
                phone_number: formData.phoneNumber,
                email: formData.email
            };

            const updatedTournament = await tournamentService.registerTeam(selectedTournoi.id, teamData);
            setTournaments(tournaments.map(t => 
                t && t.id === updatedTournament.id ? updatedTournament : t
            ));
            
            setConfirmationMessage('Inscription réussie!');
            setTimeout(() => setConfirmationMessage(''), 3000);
            
            handleCloseModal();
            fetchTournaments();
        } catch (error) {
            setError('Erreur lors de l\'inscription: ' + (error.message || 'Veuillez réessayer'));
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleEditClick = (tournoi) => {
        let formattedDate = tournoi.date;
        if (formattedDate && formattedDate.includes('T')) {
            formattedDate = formattedDate.split('T')[0];
        }
        
        setTournoiFormData({
            name: tournoi.name,
            date: formattedDate,
            maxTeams: tournoi.max_teams,
            prizePool: tournoi.prize_pool,
            description: tournoi.description,
            format: tournoi.format,
            entryFee: tournoi.entry_fee,
            image: tournoi.image
        });
        setImagePreview(tournoi.image ? getImageUrl(tournoi.image) : null);
        setSelectedTournoi(tournoi);
        setIsEditMode(true);
        setIsAddTournoiModalOpen(true);
    };

    const handleEditTournoi = async (e) => {
        e.preventDefault();
        try {
            const responseData = await tournamentService.updateTournament(selectedTournoi.id, {
                name: tournoiFormData.name,
                date: tournoiFormData.date,
                max_teams: tournoiFormData.maxTeams,
                prize_pool: tournoiFormData.prizePool,
                description: tournoiFormData.description,
                format: tournoiFormData.format,
                entry_fee: tournoiFormData.entryFee,
                image: tournoiFormData.image
            });

            if (responseData && responseData.success) {
                setTournaments(tournaments.map(t => 
                    t && t.id === selectedTournoi.id ? (responseData.tournament || responseData) : t
                ));
                handleCloseTournoiModal();
                setConfirmationMessage('Le tournoi a été mis à jour avec succès.');
                setTimeout(() => setConfirmationMessage(''), 5000);
            } else {
                throw new Error((responseData && responseData.message) || 'Échec de la mise à jour du tournoi');
            }
        } catch (error) {
            setError('Erreur lors de la modification du tournoi: ' + (error.message || ''));
        }
    };

    const handleAddTournoi = async (e) => {
        e.preventDefault();
        try {
            const newTournament = await tournamentService.createTournament({
                name: tournoiFormData.name,
                date: tournoiFormData.date,
                max_teams: tournoiFormData.maxTeams,
                prize_pool: tournoiFormData.prizePool,
                description: tournoiFormData.description,
                format: tournoiFormData.format,
                entry_fee: tournoiFormData.entryFee,
                image: tournoiFormData.image,
                registered_teams: 0,
                teams: []
            });

            setTournaments([...tournaments, newTournament]);
            
            setConfirmationMessage('Tournoi ajouté avec succès!');
            setTimeout(() => setConfirmationMessage(''), 3000);
            handleCloseTournoiModal();
        } catch (error) {
            setError('Erreur lors de la création du tournoi');
            console.error('Error:', error);
        }
    };

    const handleDeleteTournoi = async (id) => {
        try {
            await tournamentService.deleteTournament(id);
            setTournaments(tournaments.filter(t => t.id !== id));
            
            setConfirmationMessage('Tournoi supprimé avec succès!');
            setTimeout(() => setConfirmationMessage(''), 3000);
        } catch (error) {
            setError('Erreur lors de la suppression du tournoi');
        }
    };

    const isUserRegisteredForTournament = (tournoi) => {
        if (!user || !tournoi || !tournoi.teams) return false;
        for (const team of tournoi.teams) {
            if (team.email === user.email || team.captain === user.username || team.user_id === user.id) {
                tournoi._foundTeamId = team.id;
                return true;
            }
        }
        return false;
    };

    const handleUnregister = async (tournamentId) => {
        try {
            const tournament = tournaments.find(t => t.id === tournamentId);
            const foundTeamId = tournament ? tournament._foundTeamId : null;
            
            const updatedTournament = await tournamentService.unregisterTeam(tournamentId, foundTeamId);
            setTournaments(prev => prev.map(t => t.id === tournamentId ? updatedTournament : t));
            
            setConfirmationMessage('Votre équipe a été désinscrite avec succès.');
            setTimeout(() => setConfirmationMessage(''), 5000);
        } catch (error) {
            setError(error.message || 'Une erreur est survenue lors de la désinscription.');
            setTimeout(() => setError(null), 5000);
        }
    };

    // Framer Motion Configurations
    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
        hover: { y: -10, scale: 1.02, transition: { duration: 0.3 } }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    return (
        <div className="w-full">
            {showLoginPrompt && <LoginPrompt />}
            
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-2">
                        Tournois E-Sport & Foot
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">Rejoignez la compétition et gagnez des récompenses incroyables.</p>
                </div>
                {user && user.role === 'admin' && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 dark:text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                        onClick={() => setIsAddTournoiModalOpen(true)}
                    >
                        <Plus size={20} /> Nouveau Tournoi
                    </motion.button>
                )}
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
                        <XCircle size={20} className="text-red-400" />
                        {error}
                    </motion.div>
                )}
                {confirmationMessage && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
                        <CheckCircle size={20} className="text-emerald-400" />
                        {confirmationMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {tournaments && tournaments.map(tournoi => {
                    if (!tournoi) return null;
                    const isRegistered = isUserRegisteredForTournament(tournoi);
                    const isFull = tournoi.registered_teams >= tournoi.max_teams;

                    return (
                        <motion.div 
                            key={tournoi.id} 
                            variants={cardVariants}
                            whileHover="hover"
                            className="bg-white dark:bg-[#121212] border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden shadow-2xl relative group"
                        >
                            {/* Admin Overlays */}
                            {user && user.role === 'admin' && (
                                <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditClick(tournoi)} className="bg-blue-500 text-slate-900 dark:text-white p-2 rounded-lg hover:bg-blue-400 shadow-lg">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteTournoi(tournoi.id)} className="bg-red-500 text-slate-900 dark:text-white p-2 rounded-lg hover:bg-red-400 shadow-lg">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}

                            {/* Card Image */}
                            <div className="relative h-48 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent z-10 block"></div>
                                <img 
                                    src={getImageUrl(tournoi.image)} 
                                    alt={tournoi.name} 
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
                                />
                                {isFull && !isRegistered && (
                                    <div className="absolute top-4 left-4 z-20 bg-red-500 text-slate-900 dark:text-white text-xs font-bold px-3 py-1 rounded-full">
                                        COMPLET
                                    </div>
                                )}
                            </div>

                            {/* Card Content */}
                            <div className="p-6 relative z-20 -mt-6">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 line-clamp-1">{tournoi.name}</h2>
                                
                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center text-slate-700 dark:text-slate-300 text-sm">
                                        <Calendar size={16} className="text-emerald-400 mr-3" />
                                        <span>{tournoi.date ? tournoi.date.split('T')[0] : tournoi.date}</span>
                                    </div>
                                    <div className="flex items-center text-slate-700 dark:text-slate-300 text-sm">
                                        <Users size={16} className="text-emerald-400 mr-3" />
                                        <span className="w-full flex justify-between">
                                            Equipes <span>{tournoi.registered_teams} / {tournoi.max_teams}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center text-slate-700 dark:text-slate-300 text-sm">
                                        <Trophy size={16} className="text-yellow-400 mr-3" />
                                        <span className="w-full flex justify-between">
                                            Prize Pool <span className="font-bold text-yellow-400">{tournoi.prize_pool}</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-auto">
                                    {user ? (
                                        user.role !== 'admin' && (
                                            isRegistered ? (
                                                <button onClick={() => handleUnregister(tournoi.id)} className="flex-1 flex justify-center items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl font-medium transition-colors text-sm">
                                                    <UserMinus size={16} /> Quitter
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => handleRegisterClick(tournoi)} 
                                                    disabled={isFull}
                                                    className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl font-medium transition-colors text-sm ${
                                                        isFull ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 dark:text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                                    }`}
                                                >
                                                    <UserPlus size={16} /> S'inscrire
                                                </button>
                                            )
                                        )
                                    ) : (
                                        <button disabled className="flex-1 flex justify-center items-center gap-2 bg-slate-800 text-slate-500 py-2.5 rounded-xl font-medium cursor-not-allowed text-sm">
                                            <Shield size={16} /> Connexion requise
                                        </button>
                                    )}
                                    <Link to={`/tournoi/${tournoi.id}`} className="flex-shrink-0 flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 w-11 rounded-xl transition-colors">
                                        <Info size={20} className="text-slate-700 dark:text-slate-300" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Modals */}
            <AnimatePresence>
                {(isRegistrationModalOpen || isAddTournoiModalOpen) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white dark:bg-black/60 backdrop-blur-sm"
                            onClick={isRegistrationModalOpen ? handleCloseModal : handleCloseTournoiModal}
                        ></motion.div>
                        
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/5 dark:bg-white/5">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {isRegistrationModalOpen ? `Inscription: ${selectedTournoi?.name}` : (isEditMode ? 'Modifier Tournoi' : 'Nouveau Tournoi')}
                                </h2>
                                <button onClick={isRegistrationModalOpen ? handleCloseModal : handleCloseTournoiModal} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                {isRegistrationModalOpen ? (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom de l'équipe</label>
                                            <input type="text" name="teamName" value={formData.teamName} onChange={handleChange} required className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Ex: Les Invincibles" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capitaine</label>
                                            <input type="text" name="captainName" value={formData.captainName} onChange={handleChange} required className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Téléphone</label>
                                            <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="0600000000" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                                        </div>
                                        <div className="pt-4 flex gap-3">
                                            <button type="button" onClick={handleCloseModal} className="flex-1 px-4 py-3 border border-black/10 dark:border-white/10 rounded-xl text-slate-900 dark:text-white hover:bg-black/5 dark:bg-white/5 transition-colors">Annuler</button>
                                            <button type="submit" className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 dark:text-white rounded-xl font-medium shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors">Confirmer</button>
                                        </div>
                                    </form>
                                ) : (
                                    <form onSubmit={isEditMode ? handleEditTournoi : handleAddTournoi} className="space-y-4">
                                        {/* Image Upload */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Affiche du tournoi</label>
                                            <div className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl p-4 text-center hover:bg-black/5 dark:bg-white/5 transition-colors relative cursor-pointer group">
                                                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                {imagePreview ? (
                                                    <img src={imagePreview} alt="Preview" className="h-32 mx-auto object-contain rounded-lg" />
                                                ) : (
                                                    <div className="text-slate-600 dark:text-slate-400 py-6">
                                                        <ImageIcon size={32} className="mx-auto mb-2 opacity-50 group-hover:opacity-100 transition-opacity text-emerald-400" />
                                                        <p className="text-sm">Cliquez ou glissez une image</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom du tournoi</label>
                                                <input type="text" name="name" value={tournoiFormData.name} onChange={handleTournoiChange} required className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                                <input type="date" name="date" value={tournoiFormData.date} onChange={handleTournoiChange} required className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Équipes Max</label>
                                                <select name="maxTeams" value={tournoiFormData.maxTeams} onChange={handleTournoiChange} required className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                                                    <option value="" disabled>Choisir</option>
                                                    <option value="8">8</option>
                                                    <option value="12">12</option>
                                                    <option value="16">16</option>
                                                    <option value="20">20</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prize Pool</label>
                                                <select name="prizePool" value={tournoiFormData.prizePool} onChange={handleTournoiChange} required className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                                                    <option value="" disabled>Choisir prix</option>
                                                    <option value="1000 DH">1000 DH</option>
                                                    <option value="2000 DH">2000 DH</option>
                                                    <option value="5000 DH">5000 DH</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Frais d'entré</label>
                                                <select name="entryFee" value={tournoiFormData.entryFee} onChange={handleTournoiChange} required className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                                                    <option value="" disabled>Choisir frais</option>
                                                    <option value="300 DH">300 DH</option>
                                                    <option value="500 DH">500 DH</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Format</label>
                                                <select name="format" value={tournoiFormData.format} onChange={handleTournoiChange} required className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                                                    <option value="" disabled>Choisir un format</option>
                                                    <option value="Élimination directe">Élimination directe</option>
                                                    <option value="Phase de groupes + Élimination directe">Phase de groupes + Élimination directe</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                                <textarea name="description" value={tournoiFormData.description} onChange={handleTournoiChange} required rows="3" className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"></textarea>
                                            </div>
                                        </div>
                                        <div className="pt-4 flex gap-3">
                                            <button type="button" onClick={handleCloseTournoiModal} className="flex-1 px-4 py-3 border border-black/10 dark:border-white/10 rounded-xl text-slate-900 dark:text-white hover:bg-black/5 dark:bg-white/5 transition-colors">Annuler</button>
                                            <button type="submit" className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 dark:text-white rounded-xl font-medium shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors">
                                                {isEditMode ? 'Enregistrer' : 'Créer Tournoi'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Tournoi;