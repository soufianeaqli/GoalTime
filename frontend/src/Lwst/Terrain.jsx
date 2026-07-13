import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, MapPin, DollarSign, Clock, Info,
    Trash2, Plus, Image as ImageIcon, XCircle, CheckCircle, AlertTriangle
} from 'lucide-react';
import LoginPrompt from './LoginPrompt';
import FlyingBall from '../components/FlyingBall';
import Toast from '../components/Toast';
import * as reservationService from '../services/reservationService';
import { API_BASE_URL } from '../services/config';
import * as terrainService from '../services/terrainService';

function Terrain({ addReservation, reservations, user }) {
    const [terrains, setTerrains] = useState([]);
    const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', date: '', timeSlot: '' });
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [selectedTerrain, setSelectedTerrain] = useState(null);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [showFlyingBall, setShowFlyingBall] = useState(false);
    const navigate = useNavigate();

    // Admin state
    const [showAddTerrainForm, setShowAddTerrainForm] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [terrainToDelete, setTerrainToDelete] = useState(null);
    const [newTerrain, setNewTerrain] = useState({ titre: '', description: '', prix: '', image: null });
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        const fetchTerrains = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/terrains`, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
                if (response.ok) {
                    const data = await response.json();
                    setTerrains(data);
                }
            } catch (error) {
                setConfirmationMessage('Erreur lors du chargement des terrains');
            }
        };
        fetchTerrains();
    }, []);

    const handleReserveClick = (terrainId) => {
        if (!user) {
            setShowLoginPrompt(true);
            return;
        }
        setSelectedTerrain(terrains.find(t => t.id === terrainId));
        setIsReservationModalOpen(true);
    };

    const handleCloseReservationModal = () => {
        setIsReservationModalOpen(false);
        setSelectedTerrain(null);
    };

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleNewTerrainChange = (e) => setNewTerrain(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.match(/^image\/(jpeg|png|jpg)$/)) {
            setConfirmationMessage('Type de fichier non autorisé. Utilisez JPG ou PNG.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setConfirmationMessage('L\'image est trop grande. Taille maximum: 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);

        try {
            const formData = new FormData();
            formData.append('image', file);
            const response = await fetch(`${API_BASE_URL}/upload-image`, { method: 'POST', body: formData });

            if (response.ok) {
                const responseData = await response.json();
                if (responseData && responseData.url) {
                    setNewTerrain(prev => ({ ...prev, image: responseData.url }));
                    setConfirmationMessage('Image téléchargée avec succès');
                    setTimeout(() => setConfirmationMessage(''), 3000);
                }
            }
        } catch (error) {
            setConfirmationMessage(error.message || 'Erreur upload image');
            setImagePreview(null);
        }
    };

    const handleAddTerrain = async (e) => {
        e.preventDefault();
        if (!newTerrain.titre || !newTerrain.description || !newTerrain.prix) {
            setConfirmationMessage('Veuillez remplir tous les champs');
            setTimeout(() => setConfirmationMessage(''), 3000);
            return;
        }

        try {
            const terrainData = { ...newTerrain, prix: Number(newTerrain.prix) };
            const response = await fetch(`${API_BASE_URL}/terrains`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(terrainData)
            });

            if (response.ok) {
                const responseData = await response.json();
                if (responseData.success && responseData.terrain) {
                    setTerrains(prev => [...prev, responseData.terrain]);
                    setShowAddTerrainForm(false);
                    setNewTerrain({ titre: '', description: '', prix: '', image: null });
                    setImagePreview(null);
                    setConfirmationMessage('Terrain ajouté!');
                    setTimeout(() => setConfirmationMessage(''), 3000);
                }
            }
        } catch (error) {
            setConfirmationMessage(error.message || 'Erreur ajout terrain');
        }
    };

    const handleDeleteConfirmation = (terrainId) => {
        setTerrainToDelete(terrainId);
        setShowDeleteConfirmation(true);
    };

    const handleConfirmDelete = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/terrains/${terrainToDelete}`, { method: 'DELETE' });
            if (response.ok) {
                setTerrains(prev => prev.filter(terrain => terrain.id !== terrainToDelete));
                setShowDeleteConfirmation(false);
                setTerrainToDelete(null);
                setConfirmationMessage('Terrain supprimé.');
                setTimeout(() => setConfirmationMessage(''), 3000);
            }
        } catch (error) {
            setTerrains(prev => prev.filter(terrain => terrain.id !== terrainToDelete));
            setShowDeleteConfirmation(false);
            setConfirmationMessage('Terrain supprimé.');
            setTimeout(() => setConfirmationMessage(''), 3000);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.date === today) {
            const slotHour = parseInt(formData.timeSlot.split(':')[0], 10);
            if (slotHour < currentHour) {
                setConfirmationMessage('Ce créneau est déjà passé pour aujourd\'hui.');
                setTimeout(() => setConfirmationMessage(''), 3000);
                return;
            }
        }
        try {
            const availabilityResponse = await reservationService.checkAvailability(selectedTerrain.id, formData.date, formData.timeSlot);
            if (!availabilityResponse.data.available) {
                setConfirmationMessage('Cette plage horaire n\'est plus disponible.');
                setTimeout(() => setConfirmationMessage(''), 3000);
                return;
            }

            const reservationData = {
                terrain_id: selectedTerrain.id,
                user_id: user.username,
                name: formData.name, email: formData.email, date: formData.date, time_slot: formData.timeSlot,
                prix: selectedTerrain.prix
            };

            const response = await reservationService.createReservation(reservationData);
            addReservation(response.data);
            setIsReservationModalOpen(false);
            setFormData({ name: '', email: '', date: '', timeSlot: '' });
            setShowFlyingBall(true);
            setConfirmationMessage('Votre réservation a été enregistrée avec succès.');
            setTimeout(() => setConfirmationMessage(''), 5000);
        } catch (error) {
            setConfirmationMessage(error.response?.data?.message || 'Erreur');
            setTimeout(() => setConfirmationMessage(''), 5000);
        }
    };

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const timeSlots = ["10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00", "22:00-23:00", "23:00-00:00"];

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return '/placeholder.jpg';
        if (imageUrl.startsWith('/storage')) return `${API_BASE_URL.replace('/api', '')}${imageUrl}`;
        return imageUrl;
    };

    // Animation Variants
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12 } } };
    const cardVariants = {
        hidden: { opacity: 0, y: 60, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
        hover: { y: -8, transition: { duration: 0.35, ease: "easeOut" } }
    };
    const modalOverlay = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
    const modalContent = {
        hidden: { opacity: 0, scale: 0.92, y: 30 },
        visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
        exit: { opacity: 0, scale: 0.92, y: 30, transition: { duration: 0.25 } }
    };

    return (
        <div className="w-full min-h-screen">
            <FlyingBall show={showFlyingBall} onComplete={() => { setShowFlyingBall(false); navigate('/reservation'); }} />
            {showLoginPrompt && <LoginPrompt />}

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
            >
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-12 bg-gradient-to-b from-primary to-primary-light rounded-full" />
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-gradient">Nos Terrains</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Réservez les meilleurs terrains de mini-foot en quelques clics.</p>
                    </div>
                </div>
                {user && user.role === 'admin' && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        className="btn-primary gap-2"
                        onClick={() => setShowAddTerrainForm(true)}
                    >
                        <Plus size={20} /> Ajouter un terrain
                    </motion.button>
                )}
            </motion.div>

            {/* Confirmation Toast */}
            <Toast message={confirmationMessage} onClose={() => setConfirmationMessage('')} />

            {/* Terrain Grid */}
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {terrains && terrains.map(terrain => {
                    if (!terrain) return null;
                    return (
                        <motion.div
                            key={terrain.id}
                            variants={cardVariants}
                            whileHover="hover"
                            className="glass-card-hover group flex flex-col overflow-hidden"
                        >
                            {/* Image Section */}
                            <div className="relative h-40 overflow-hidden rounded-t-2xl">
                                <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-dark-900/20 to-transparent z-10 transition-opacity duration-300" />
                                <img
                                    src={getImageUrl(terrain.image)}
                                    alt={terrain.titre}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                                />

                                {/* Price Badge */}
                                <div className="absolute top-4 right-4 z-20">
                                    <div className="bg-dark-900/70 backdrop-blur-md border border-gold/30 text-gold px-3.5 py-1.5 rounded-xl font-bold text-sm flex items-center gap-1.5 shadow-lg">
                                        <DollarSign size={14} className="text-gold" /> {terrain.prix} <span className="text-xs font-normal text-gray-400">/h</span>
                                    </div>
                                </div>

                                {/* Admin Delete */}
                                {user && user.role === 'admin' && (
                                    <motion.button
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => { e.preventDefault(); handleDeleteConfirmation(terrain.id); }}
                                        className="absolute top-4 left-4 z-20 bg-red-500/90 hover:bg-red-500 text-white p-2 rounded-xl shadow-lg backdrop-blur-sm transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </motion.button>
                                )}

                                {/* Subtle badge at bottom */}
                                <div className="absolute bottom-3 left-4 z-20">
                                    <span className="badge-primary text-[11px]">
                                        <MapPin size={11} /> Terrain Disponible
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 flex flex-col flex-grow relative">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors duration-300">
                                    {terrain.titre}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mb-4 flex-grow line-clamp-2 leading-relaxed">
                                    {terrain.description}
                                </p>

                                {/* Actions */}
                                <div className="flex gap-3 mt-auto">
                                    <motion.button
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.92 }}
                                        onClick={() => navigate(`/terrain/${terrain.id}`)}
                                        className="btn-secondary !h-10 !w-10 !p-0 justify-center shrink-0"
                                        title="Voir les détails"
                                    >
                                        <Info size={18} />
                                    </motion.button>

                                    {user && user.role !== 'admin' && (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => handleReserveClick(terrain.id)}
                                            className="btn-primary flex-1 gap-2"
                                        >
                                            <Calendar size={17} /> Réserver
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Empty State */}
            {terrains && terrains.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card text-center py-20 px-8"
                >
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                        <MapPin size={36} className="text-primary-light" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucun terrain disponible</h3>
                    <p className="text-gray-500 dark:text-gray-400">Les terrains apparaîtront ici une fois ajoutés.</p>
                </motion.div>
            )}

            {/* ==================== MODALS ==================== */}
            <AnimatePresence>
                {(isReservationModalOpen || showAddTerrainForm || showDeleteConfirmation) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Overlay */}
                        <motion.div
                            variants={modalOverlay}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="absolute inset-0 bg-dark-900/70 backdrop-blur-md"
                            onClick={() => {
                                if (isReservationModalOpen) handleCloseReservationModal();
                                if (showAddTerrainForm) setShowAddTerrainForm(false);
                                if (showDeleteConfirmation) setShowDeleteConfirmation(false);
                            }}
                        />

                        {/* ========== Reservation Modal ========== */}
                        {isReservationModalOpen && selectedTerrain && (
                            <motion.div
                                variants={modalContent}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="relative glass-card w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden"
                            >
                                {/* Header */}
                                <div className="px-6 py-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-primary/5">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                                            <MapPin size={18} className="text-primary-light" />
                                        </div>
                                        <span>Réserver <span className="text-primary">{selectedTerrain.titre}</span></span>
                                    </h2>
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleCloseReservationModal}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                                    >
                                        <XCircle size={24} />
                                    </motion.button>
                                </div>

                                {/* Body */}
                                <div className="p-6 overflow-y-auto">
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Nom complet</label>
                                                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input-field" placeholder="Votre nom" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Email</label>
                                                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-field" placeholder="votre@email.com" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Date</label>
                                                <input type="date" name="date" min={today} value={formData.date} onChange={handleChange} required className="input-field [color-scheme:dark]" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Horaire</label>
                                                <select name="timeSlot" value={formData.timeSlot} onChange={handleChange} required className="input-field">
                                                    <option value="">Choisir un horaire</option>
                                                    {timeSlots.map(slot => {
                                                        const isReserved = reservations.some(r => r.terrain_id === selectedTerrain.id && r.date === formData.date && r.time_slot === slot);
                                                        const isPast = formData.date === today && parseInt(slot.split(':')[0], 10) < currentHour;
                                                        const disabled = isReserved || isPast;
                                                        return (
                                                            <option key={slot} value={slot} disabled={disabled} className={isReserved ? 'text-red-400' : isPast ? 'text-gray-400' : ''}>
                                                                {slot} {isReserved ? '(Complet)' : isPast ? '(Passé)' : ''}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Pricing Summary */}
                                        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Tarif horaire</span>
                                                <span className="text-lg font-bold text-primary">{selectedTerrain.prix} DH</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-3 flex gap-3">
                                            <button type="button" onClick={handleCloseReservationModal} className="btn-secondary flex-1">
                                                Annuler
                                            </button>
                                            <button type="submit" className="btn-primary flex-1">
                                                Confirmer la réservation
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        )}

                        {/* ========== Add Terrain Modal ========== */}
                        {showAddTerrainForm && (
                            <motion.div
                                variants={modalContent}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="relative glass-card w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden"
                            >
                                {/* Header */}
                                <div className="px-6 py-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-primary/5">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                                            <MapPin size={18} className="text-primary-light" />
                                        </div>
                                        Nouveau Terrain
                                    </h2>
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setShowAddTerrainForm(false)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                                    >
                                        <XCircle size={24} />
                                    </motion.button>
                                </div>

                                {/* Body */}
                                <div className="p-6 overflow-y-auto">
                                    <form onSubmit={handleAddTerrain} className="space-y-4">
                                        {/* Image Upload */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Image du terrain</label>
                                            <div className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-4 text-center hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 relative cursor-pointer group overflow-hidden">
                                                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                {imagePreview ? (
                                                    <img src={imagePreview} alt="Aperçu" className="h-36 mx-auto object-cover rounded-xl" />
                                                ) : (
                                                    <div className="py-8">
                                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                                                            <ImageIcon size={24} className="text-primary-light" />
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Cliquez ou glissez une image</p>
                                                        <p className="text-xs text-gray-400 mt-1">JPG, PNG — Max 5MB</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Titre</label>
                                            <input type="text" name="titre" value={newTerrain.titre} onChange={handleNewTerrainChange} required className="input-field" placeholder="Nom du terrain" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Prix (DH/heure)</label>
                                            <input type="number" name="prix" value={newTerrain.prix} onChange={handleNewTerrainChange} required className="input-field" placeholder="Ex: 150" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Description</label>
                                            <textarea name="description" value={newTerrain.description} onChange={handleNewTerrainChange} required rows="3" className="input-field resize-none" placeholder="Décrivez le terrain..." />
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-3 flex gap-3">
                                            <button type="button" onClick={() => setShowAddTerrainForm(false)} className="btn-secondary flex-1">
                                                Annuler
                                            </button>
                                            <button type="submit" className="btn-primary flex-1">
                                                Ajouter le terrain
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        )}

                        {/* ========== Delete Confirmation Modal ========== */}
                        {showDeleteConfirmation && (
                            <motion.div
                                variants={modalContent}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="relative glass-card w-full max-w-sm p-8 text-center"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-5">
                                    <AlertTriangle size={30} className="text-red-500" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirmer la suppression</h2>
                                <p className="text-gray-500 dark:text-gray-400 mb-7 text-sm leading-relaxed">
                                    Êtes-vous sûr de vouloir supprimer définitivement ce terrain ? Cette action est irréversible.
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowDeleteConfirmation(false)} className="btn-secondary flex-1">
                                        Annuler
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={handleConfirmDelete}
                                        className="flex-1 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors shadow-lg shadow-red-500/20"
                                    >
                                        Supprimer
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Terrain;
