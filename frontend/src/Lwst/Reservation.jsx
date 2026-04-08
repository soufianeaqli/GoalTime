import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CalendarCheck, Edit, Trash2, CreditCard, CheckCircle, 
    XCircle, Clock, CalendarDays, User, MapPin, AlertTriangle, ListFilter
} from 'lucide-react';
import LoginPrompt from './LoginPrompt';
import * as reservationService from '../services/reservationService';
import { BASE_URL } from '../services/config';

function Reservation({ user }) {
    const [reservations, setReservations] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [formData, setFormData] = useState({ id: null, name: '', date: '', timeSlot: '', accepted: false, rejected: false, userId: '' });
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [reservationToDelete, setReservationToDelete] = useState(null);
    const [deletionMessage, setDeletionMessage] = useState('');
    const [paymentForm, setPaymentForm] = useState({ cardNumber: '', cardName: '', expiryDate: '', cvv: '', amount: '', reservationId: '' });
    const [paymentFilter, setPaymentFilter] = useState('all');
    
    // Status initialization
    const initPaymentStatus = () => {
        const status = {};
        reservations.forEach(reservation => {
            if (reservation.isPaid) status[reservation.id] = 'success';
        });
        return status;
    };
    const [paymentStatus, setPaymentStatus] = useState(initPaymentStatus);
    
    useEffect(() => { setPaymentStatus(initPaymentStatus); }, [reservations]);

    // Fetch reservations
    useEffect(() => {
        const fetchReservations = async () => {
            try {
                let response;
                if (user.role === 'admin') {
                    response = await reservationService.getAllReservations();
                } else {
                    response = await reservationService.getUserReservations(user.username);
                }
                setReservations(response.data);
            } catch (error) {
                setConfirmationMessage('Erreur lors du chargement des réservations');
            }
        };
        if (user) fetchReservations();
    }, [user]);

    // Enrich reservations with terrain names
    useEffect(() => {
        const enrichReservationsWithTerrainNames = async () => {
            const needsTerrainNames = reservations.some(res => (!res.terrainName && !res.terrain_name && res.terrain_id) || (!res.terrainName && !res.terrain_name && res.terrainId));
            if (!needsTerrainNames) return;
            try {
                const response = await fetch(`${BASE_URL}/direct-get-terrains.php`, { headers: { 'Accept': 'application/json' }});
                if (!response.ok) return;
                const terrains = await response.json();
                const terrainsMap = {};
                terrains.forEach(terrain => { terrainsMap[terrain.id] = terrain.titre; });
                
                const updatedReservations = reservations.map(res => {
                    const terrainId = res.terrain_id || res.terrainId;
                    if (terrainId && terrainsMap[terrainId]) {
                        return { ...res, terrainName: terrainsMap[terrainId], terrain_name: terrainsMap[terrainId] };
                    }
                    return res;
                });
                setReservations(updatedReservations);
            } catch (error) {}
        };
        if (reservations.length > 0) enrichReservationsWithTerrainNames();
    }, [reservations.length]);

    if (!user) return <LoginPrompt />;

    // Filtering
    let displayedReservations = user.role === 'admin' ? reservations : reservations.filter(res => res.userId === user.username);
    if (user.role === 'admin' && paymentFilter !== 'all') {
        displayedReservations = displayedReservations.filter(res => {
            const isPaid = paymentStatus[res.id] === 'success' || res.isPaid;
            return paymentFilter === 'paid' ? isPaid : !isPaid;
        });
    }

    // Days calculation
    const calculateDaysRemaining = (reservationDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const matchDate = new Date(reservationDate);
        matchDate.setHours(0, 0, 0, 0);
        const diffTime = matchDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // Actions
    const handleModifyClick = (reservation) => { setFormData({ ...reservation }); setIsEditModalOpen(true); };
    const handleDeleteClick = (reservationId) => { setReservationToDelete(reservationId); setIsDeleteModalOpen(true); };
    
    const confirmDelete = async () => {
        try {
            await reservationService.deleteReservation(reservationToDelete, user.username, user.role === 'admin');
            setReservations(prev => prev.filter(res => res.id !== reservationToDelete));
            setDeletionMessage('Réservation supprimée.');
            setIsDeleteModalOpen(false);
            setReservationToDelete(null);
            setTimeout(() => setDeletionMessage(''), 5000);
        } catch (error) {
            setDeletionMessage(error.message || 'Erreur lors de la suppression');
            setTimeout(() => setDeletionMessage(''), 5000);
        }
    };

    const handleCloseEditModal = () => { setIsEditModalOpen(false); setFormData({ id: null, name: '', date: '', timeSlot: '', accepted: false, rejected: false, userId: '' }); };
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleFilterChange = (e) => setPaymentFilter(e.target.value);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await reservationService.updateReservation(formData.id, formData);
            setReservations(prev => prev.map(res => res.id === response.data.id ? response.data : res));
            setConfirmationMessage('Réservation modifiée avec succès.');
            setIsEditModalOpen(false);
            setTimeout(() => setConfirmationMessage(''), 5000);
        } catch (error) {
            setConfirmationMessage(error.message || 'Erreur lors de la modification');
            setTimeout(() => setConfirmationMessage(''), 5000);
        }
    };

    const handlePaymentClick = (reservation) => {
        setPaymentForm({ ...paymentForm, reservationId: reservation.id, amount: reservation.terrainPrice || reservation.prix || 0 });
        setIsPaymentModalOpen(true);
    };
    const handlePaymentChange = (e) => setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        try {
            await reservationService.markAsPaid(paymentForm.reservationId, user.username);
            setReservations(prev => prev.map(res => res.id === paymentForm.reservationId ? { ...res, isPaid: true, is_paid: true } : res));
            setConfirmationMessage('Paiement effectué avec succès.');
            setIsPaymentModalOpen(false);
            setPaymentForm({ cardNumber: '', cardName: '', expiryDate: '', cvv: '', amount: '', reservationId: '' });
            setTimeout(() => setConfirmationMessage(''), 5000);
        } catch (error) {
            setConfirmationMessage(error.message || 'Erreur lors du paiement');
            setTimeout(() => setConfirmationMessage(''), 5000);
        }
    };

    const today = new Date().toISOString().split('T')[0];
    const timeSlots = ["09:00-10:00", "10:00-11:00", "11:00-12:00", "15:00-16:00", "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00"];

    // Variants for animation
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    return (
        <div className="w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 mb-2">
                        {user.role === 'admin' ? 'Toutes les Réservations' : 'Historique des Réservations'}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">Gérez vos créneaux et vos paiements.</p>
                </div>

                {user.role === 'admin' && (
                    <div className="flex items-center gap-2 bg-white/80 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl p-2 px-4 shadow-lg backdrop-blur-sm">
                        <ListFilter size={18} className="text-slate-600 dark:text-slate-400" />
                        <select 
                            value={paymentFilter} 
                            onChange={handleFilterChange}
                            className="bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none cursor-pointer"
                        >
                            <option value="all" className="bg-black">Toutes les réservations</option>
                            <option value="paid" className="bg-black">Réservations payées</option>
                            <option value="unpaid" className="bg-black">Réservations non payées</option>
                        </select>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {(confirmationMessage || deletionMessage) && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
                        <CheckCircle size={20} className="text-emerald-400" />
                        {confirmationMessage || deletionMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div 
                className="bg-white dark:bg-[#121212] border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden shadow-2xl"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10">
                                <th className="p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Nom</th>
                                <th className="p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Terrain</th>
                                <th className="p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Date & Horaire</th>
                                {user.role === 'admin' && <th className="p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Utilisateur</th>}
                                {user.role === 'admin' && <th className="p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Statut de Paiement</th>}
                                {user.role === 'admin' && <th className="p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Échéance</th>}
                                <th className="p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                                {user.role !== 'admin' && <th className="p-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Paiement</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {displayedReservations.length === 0 ? (
                                <tr>
                                    <td colSpan={user.role === 'admin' ? 7 : 5} className="p-8 text-center text-slate-600 dark:text-slate-400">
                                        <CalendarCheck size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>Aucune réservation trouvée.</p>
                                    </td>
                                </tr>
                            ) : (
                                displayedReservations.map(reservation => {
                                    const daysRemaining = calculateDaysRemaining(reservation.date);
                                    const isPaid = paymentStatus[reservation.id] === 'success' || reservation.isPaid;

                                    return (
                                        <motion.tr 
                                            key={reservation.id} 
                                            variants={itemVariants}
                                            className={`hover:bg-black/5 dark:bg-white/5 transition-colors ${isPaid ? '' : 'bg-red-500/5'}`}
                                        >
                                            <td className="p-4 font-medium text-slate-900 dark:text-white">{reservation.name}</td>
                                            <td className="p-4 text-emerald-400 font-medium">
                                                {reservation.terrainName || reservation.terrain_name || `Terrain #${reservation.terrain_id || reservation.terrainId}`}
                                            </td>
                                            <td className="p-4 text-slate-700 dark:text-slate-300">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <CalendarDays size={14} className="text-slate-500" />
                                                    {reservation.date}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-emerald-400">
                                                    <Clock size={14} />
                                                    {reservation.timeSlot}
                                                </div>
                                            </td>
                                            {user.role === 'admin' && <td className="p-4 text-slate-700 dark:text-slate-300">{reservation.userId || 'Guest'}</td>}
                                            
                                            {user.role === 'admin' && (
                                                <td className="p-4">
                                                    {isPaid ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                                                            <CheckCircle size={14} /> Payée
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20">
                                                            <XCircle size={14} /> Non payée
                                                        </span>
                                                    )}
                                                </td>
                                            )}
                                            
                                            {user.role === 'admin' && (
                                                <td className="p-4">
                                                    {daysRemaining < 0 ? (
                                                        <span className="text-slate-500 text-sm">Passé</span>
                                                    ) : daysRemaining === 0 ? (
                                                        <span className="text-emerald-400 font-medium text-sm">Aujourd'hui</span>
                                                    ) : daysRemaining <= 3 ? (
                                                        <span className="text-amber-400 font-medium text-sm">Dans {daysRemaining} jours</span>
                                                    ) : (
                                                        <span className="text-slate-700 dark:text-slate-300 text-sm">Dans {daysRemaining} jours</span>
                                                    )}
                                                </td>
                                            )}

                                            <td className="p-4 text-slate-700 dark:text-slate-300">
                                                <div className="flex gap-2">
                                                    {user.role !== 'admin' && (
                                                        <button onClick={() => handleModifyClick(reservation)} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors tooltip" title="Modifier">
                                                            <Edit size={16} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDeleteClick(reservation.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors tooltip" title="Supprimer">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>

                                            {user.role !== 'admin' && (
                                                <td className="p-4">
                                                    {isPaid ? (
                                                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                                                            <CheckCircle size={18} /> Confirmé
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handlePaymentClick(reservation)}
                                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-900 dark:text-white font-medium hover:from-emerald-400 hover:to-teal-400 transition-colors shadow-lg"
                                                        >
                                                            <CreditCard size={16} /> Payer
                                                        </button>
                                                    )}
                                                </td>
                                            )}
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white dark:bg-black/60 backdrop-blur-sm" onClick={handleCloseEditModal} />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                            <div className="px-6 py-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/5 dark:bg-white/5">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Modifier Réservation</h2>
                                <button onClick={handleCloseEditModal} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors"><XCircle size={24} /></button>
                            </div>
                            <div className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom</label>
                                        <div className="relative">
                                            <User size={18} className="absolute left-3 top-3 text-slate-600 dark:text-slate-400" />
                                            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Terrain</label>
                                        <div className="relative">
                                            <MapPin size={18} className="absolute left-3 top-3 text-slate-600 dark:text-slate-400" />
                                            <input type="text" value={formData.terrainName || formData.terrain_name || `Terrain #${formData.terrainId || formData.terrain_id}`} readOnly className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-slate-600 dark:text-slate-400 cursor-not-allowed" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                            <input type="date" name="date" min={today} value={formData.date} onChange={handleChange} required className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 [color-scheme:dark]" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Horaire</label>
                                            <select name="timeSlot" value={formData.timeSlot || ''} onChange={handleChange} required className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                                                <option value="" disabled>Choisir</option>
                                                {timeSlots.map(slot => {
                                                    const isReserved = reservations.some(reservation => reservation.date === formData.date && reservation.timeSlot === slot && reservation.id !== formData.id);
                                                    return <option key={slot} value={slot} disabled={isReserved} className={isReserved ? 'text-red-400' : ''}>{slot} {isReserved ? '(Pris)' : ''}</option>;
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="pt-4 flex gap-3">
                                        <button type="button" onClick={handleCloseEditModal} className="flex-1 px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 text-slate-900 dark:text-white hover:bg-black/5 dark:bg-white/5 transition-colors">Annuler</button>
                                        <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 dark:text-white font-medium shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors">Enregistrer</button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Modal */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} className="text-red-500" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Annuler la réservation</h2>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">Êtes-vous sûr de vouloir supprimer définitivement cette réservation ?</p>
                            <div className="flex gap-3">
                                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-slate-900 dark:text-white hover:bg-black/5 dark:bg-white/5 transition-colors">Annuler</button>
                                <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-slate-900 dark:text-white font-medium shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-colors">Supprimer</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Payment Modal */}
            <AnimatePresence>
                {isPaymentModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                            <div className="px-6 py-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/5 dark:bg-white/5">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><CreditCard className="text-emerald-400" /> Paiement Sécurisé</h2>
                                <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors"><XCircle size={24} /></button>
                            </div>
                            <div className="p-6">
                                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Montant à payer</label>
                                        <input type="text" value={`${paymentForm.amount} DH`} readOnly className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-emerald-400 font-bold text-center text-xl cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Numéro de carte</label>
                                        <input type="text" name="cardNumber" value={paymentForm.cardNumber} onChange={handlePaymentChange} required maxLength="19" placeholder="1234 5678 9012 3456" className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono tracking-widest" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nom sur la carte</label>
                                        <input type="text" name="cardName" value={paymentForm.cardName} onChange={handlePaymentChange} required placeholder="JEAN DUPONT" className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 uppercase" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expiration</label>
                                            <input type="text" name="expiryDate" value={paymentForm.expiryDate} onChange={handlePaymentChange} required maxLength="5" placeholder="MM/AA" className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CVV</label>
                                            <input type="password" name="cvv" value={paymentForm.cvv} onChange={handlePaymentChange} required maxLength="3" placeholder="123" className="w-full bg-white/90 dark:bg-black/50 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono tracking-widest" />
                                        </div>
                                    </div>
                                    <div className="pt-4 flex gap-3">
                                        <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border border-black/10 dark:border-white/10 text-slate-900 dark:text-white hover:bg-black/5 dark:bg-white/5 transition-colors">Annuler</button>
                                        <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 dark:text-white font-medium shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-colors">Confirmer le paiement</button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Reservation;