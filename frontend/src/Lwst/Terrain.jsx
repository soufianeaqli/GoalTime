import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, MapPin, DollarSign, Clock, Info, 
    Trash2, Plus, Image as ImageIcon, XCircle, CheckCircle, AlertTriangle 
} from 'lucide-react';
import LoginPrompt from './LoginPrompt';
import * as reservationService from '../services/reservationService';
import { BASE_URL } from '../services/config';

function Terrain({ addReservation, reservations, user }) {
    const [terrains, setTerrains] = useState([]);
    const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', date: '', timeSlot: '' });
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [selectedTerrain, setSelectedTerrain] = useState(null);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
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
                const response = await fetch(`${BASE_URL}/direct-get-terrains.php`, {
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
            const response = await fetch(`${BASE_URL}/direct-upload.php`, { method: 'POST', body: formData });
            
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
            const response = await fetch(`${BASE_URL}/direct-add.php`, {
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
            const response = await fetch(`${BASE_URL}/direct-delete.php?id=${terrainToDelete}`, { method: 'GET' });
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
            setConfirmationMessage('Votre réservation a été enregistrée avec succès.');
            setTimeout(() => setConfirmationMessage(''), 5000);
        } catch (error) {
            setConfirmationMessage(error.response?.data?.message || 'Erreur');
            setTimeout(() => setConfirmationMessage(''), 5000);
        }
    };

    const today = new Date().toISOString().split('T')[0];
    const timeSlots = ["09:00-10:00", "10:00-11:00", "11:00-12:00", "15:00-16:00", "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00"];

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return '/placeholder.jpg';
        if (imageUrl.startsWith('/storage')) return `${BASE_URL}${imageUrl}`;
        return imageUrl;
    };

    // Animation Variants
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const cardVariants = { 
        hidden: { opacity: 0, y: 50 }, 
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }, 
        hover: { y: -10, transition: { duration: 0.3 } } 
    };

    return (
        <div className="w-full">
            {showLoginPrompt && <LoginPrompt />}

            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-2">
                        Nos Terrains
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">Réservez les meilleurs terrains de mini-foot de la ville.</p>
                </div>
                {user && user.role === 'admin' && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 dark:text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                        onClick={() => setShowAddTerrainForm(true)}
                    >
                        <Plus size={20} /> Ajouter un terrain
                    </motion.button>
                )}
            </div>

            <AnimatePresence>
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
                initial="hidden" animate="visible"
            >
                {terrains && terrains.map(terrain => {
                    if (!terrain) return null;
                    return (
                        <motion.div 
                            key={terrain.id} 
                            variants={cardVariants}
                            whileHover="hover"
                            className="bg-white dark:bg-[#121212] border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden shadow-2xl group flex flex-col"
                        >
                            <div className="relative h-56 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent z-10"></div>
                                <img src={getImageUrl(terrain.image)} alt={terrain.titre} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                                
                                <div className="absolute top-4 right-4 z-20 bg-emerald-500 text-slate-900 dark:text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg flex items-center gap-1">
                                    <DollarSign size={14} /> {terrain.prix} /h
                                </div>
                                {user && user.role === 'admin' && (
                                    <button onClick={(e) => { e.preventDefault(); handleDeleteConfirmation(terrain.id); }} className="absolute top-4 left-4 z-20 bg-red-500 hover:bg-red-600 text-slate-900 dark:text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="p-6 relative z-20 -mt-6 flex flex-col flex-grow">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{terrain.titre}</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 flex-grow line-clamp-3">{terrain.description}</p>
                                
                                <div className="flex gap-3 mt-auto">
                                    <button onClick={() => navigate(`/terrain/${terrain.id}`)} className="flex items-center justify-center bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:bg-white/10 border border-black/10 dark:border-white/10 w-12 h-12 rounded-xl transition-colors">
                                        <Info size={20} className="text-slate-700 dark:text-slate-300" />
                                    </button>
                                    
                                    {user && user.role !== 'admin' && (
                                        <button onClick={() => handleReserveClick(terrain.id)} className="flex-1 flex justify-center items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 dark:text-white h-12 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                                            <Calendar size={18} /> Réserver
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Modals */}
            <AnimatePresence>
                {(isReservationModalOpen || showAddTerrainForm || showDeleteConfirmation) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white dark:bg-black/60 backdrop-blur-sm" onClick={() => {
                            if (isReservationModalOpen) handleCloseReservationModal();
                            if (showAddTerrainForm) setShowAddTerrainForm(false);
                            if (showDeleteConfirmation) setShowDeleteConfirmation(false);
                        }} />
                        
                        {/* Reservation Modal */}
                        {isReservationModalOpen && selectedTerrain && (
                            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                                <div className="px-6 py-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/5 dark:bg-white/5">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><MapPin className="text-emerald-400"/> Réserver: {selectedTerrain.titre}</h2>
                                    <button onClick={handleCloseReservationModal} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors"><XCircle size={24} /></button>
                                </div>
                                <div className="p-6 overflow-y-auto custom-scrollbar">
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom complet</label>
                                                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                                <input type="date" name="date" min={today} value={formData.date} onChange={handleChange} required className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 [color-scheme:dark]" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Horaire</label>
                                                <select name="timeSlot" value={formData.timeSlot} onChange={handleChange} required className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                                                    <option value="">Choisir</option>
                                                    {timeSlots.map(slot => {
                                                        const isReserved = reservations.some(r => r.terrain_id === selectedTerrain.id && r.date === formData.date && r.time_slot === slot);
                                                        return <option key={slot} value={slot} disabled={isReserved} className={isReserved ? 'text-red-400' : ''}>{slot} {isReserved ? '(Complet)' : ''}</option>;
                                                    })}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="pt-4 flex gap-3">
                                            <button type="button" onClick={handleCloseReservationModal} className="flex-1 px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 text-slate-900 dark:text-white hover:bg-black/5 dark:bg-white/5 transition-colors">Annuler</button>
                                            <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 dark:text-white font-medium shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors">Confirmer</button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        )}

                        {/* Add Terrain Modal */}
                        {showAddTerrainForm && (
                            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                                <div className="px-6 py-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/5 dark:bg-white/5">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><MapPin className="text-emerald-400"/> Nouveau Terrain</h2>
                                    <button onClick={() => setShowAddTerrainForm(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors"><XCircle size={24} /></button>
                                </div>
                                <div className="p-6 overflow-y-auto custom-scrollbar">
                                    <form onSubmit={handleAddTerrain} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Image du terrain</label>
                                            <div className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl p-4 text-center hover:bg-black/5 dark:bg-white/5 transition-colors relative cursor-pointer group">
                                                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                {imagePreview ? <img src={imagePreview} alt="Aperçu" className="h-32 mx-auto object-cover rounded-lg" /> : <div className="text-slate-600 dark:text-slate-400 py-6"><ImageIcon size={32} className="mx-auto mb-2 opacity-50 group-hover:opacity-100 text-emerald-400" /><p className="text-sm">Cliquez ou glissez une image</p></div>}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Titre</label>
                                            <input type="text" name="titre" value={newTerrain.titre} onChange={handleNewTerrainChange} required className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prix (DH/heure)</label>
                                            <input type="number" name="prix" value={newTerrain.prix} onChange={handleNewTerrainChange} required className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                            <textarea name="description" value={newTerrain.description} onChange={handleNewTerrainChange} required rows="3" className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"></textarea>
                                        </div>
                                        <div className="pt-4 flex gap-3">
                                            <button type="button" onClick={() => setShowAddTerrainForm(false)} className="flex-1 px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 text-slate-900 dark:text-white hover:bg-black/5 dark:bg-white/5 transition-colors">Annuler</button>
                                            <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 dark:text-white font-medium shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors">Ajouter</button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        )}

                        {/* Delete Confirmation Modal */}
                        {showDeleteConfirmation && (
                            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
                                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle size={32} className="text-red-500" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Confirmer la suppression</h2>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">Êtes-vous sûr de vouloir supprimer définitivement ce terrain ?</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowDeleteConfirmation(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-slate-900 dark:text-white hover:bg-black/5 dark:bg-white/5 transition-colors">Annuler</button>
                                    <button onClick={handleConfirmDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-slate-900 dark:text-white font-medium shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-colors">Supprimer</button>
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