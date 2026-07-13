import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarCheck, Edit, Trash2, CreditCard, CheckCircle,
    XCircle, Clock, CalendarDays, User, MapPin, AlertTriangle, ListFilter
} from 'lucide-react';
import LoginPrompt from './LoginPrompt';
import * as reservationService from '../services/reservationService';
import Toast from '../components/Toast';
import { API_BASE_URL } from '../services/config';

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

    const initPaymentStatus = () => {
        const status = {};
        reservations.forEach(reservation => {
            if (reservation.is_paid || reservation.isPaid) status[reservation.id] = 'success';
        });
        return status;
    };
    const [paymentStatus, setPaymentStatus] = useState(initPaymentStatus);

    useEffect(() => { setPaymentStatus(initPaymentStatus); }, [reservations]);

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

    useEffect(() => {
        const enrichReservationsWithTerrainNames = async () => {
            const needsTerrainNames = reservations.some(res => (!res.terrainName && !res.terrain_name && res.terrain_id) || (!res.terrainName && !res.terrain_name && res.terrainId));
            if (!needsTerrainNames) return;
            try {
                const response = await fetch(`${API_BASE_URL}/terrains`, { headers: { 'Accept': 'application/json' } });
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

    let displayedReservations = user.role === 'admin' ? reservations : reservations.filter(res => res.user_id === user.username);
    if (user.role === 'admin' && paymentFilter !== 'all') {
        displayedReservations = displayedReservations.filter(res => {
            const isPaid = paymentStatus[res.id] === 'success' || res.is_paid || res.isPaid;
            return paymentFilter === 'paid' ? isPaid : !isPaid;
        });
    }

    const calculateDaysRemaining = (reservationDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const matchDate = new Date(reservationDate);
        matchDate.setHours(0, 0, 0, 0);
        const diffTime = matchDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const handleModifyClick = (reservation) => { setFormData({ ...reservation, timeSlot: reservation.time_slot || reservation.timeSlot }); setIsEditModalOpen(true); };
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
        if (formData.date === today) {
            const slotHour = parseInt((formData.timeSlot || '').split(':')[0], 10);
            if (slotHour < currentHour) {
                setConfirmationMessage('Ce créneau est déjà passé pour aujourd\'hui.');
                setTimeout(() => setConfirmationMessage(''), 5000);
                return;
            }
        }
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
    const now = new Date();
    const currentHour = now.getHours();
    const timeSlots = ["10:00-11:00", "11:00-12:00", "12:00-13:00", "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00", "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00", "22:00-23:00", "23:00-00:00"];

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

    return (
        <div className="w-full min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-12 bg-gradient-to-b from-primary to-primary-light rounded-full" />
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-gradient">
                                {user.role === 'admin' ? 'Toutes les ' : 'Historique des '}Réservations
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Gérez vos créneaux et vos paiements</p>
                        </div>
                    </div>
                    {user.role === 'admin' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                            <div className="glass-card flex items-center gap-2 px-4 py-2.5">
                                <ListFilter size={16} className="text-slate-500 dark:text-slate-400" />
                                <select
                                    value={paymentFilter}
                                    onChange={handleFilterChange}
                                    className="bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none cursor-pointer"
                                >
                                    <option value="all">Toutes les réservations</option>
                                    <option value="paid">Réservations payées</option>
                                    <option value="unpaid">Réservations non payées</option>
                                </select>
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Messages */}
                <Toast message={confirmationMessage || deletionMessage} onClose={() => { setConfirmationMessage(''); setDeletionMessage(''); }} />

                {/* Table Card */}
                <motion.div
                    className="glass-card rounded-2xl overflow-hidden"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-black/5 dark:border-white/5">
                                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nom</th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Terrain</th>
                                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date & Horaire</th>
                                    {user.role === 'admin' && <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Utilisateur</th>}
                                    {user.role === 'admin' && <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Statut</th>}
                                    {user.role === 'admin' && <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Échéance</th>}
                                    <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                                    {user.role !== 'admin' && <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Paiement</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                {displayedReservations.length === 0 ? (
                                    <tr>
                                        <td colSpan={user.role === 'admin' ? 7 : 5} className="p-12 text-center">
                                            <CalendarCheck size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                                            <p className="text-slate-500 dark:text-slate-400 text-sm">Aucune réservation trouvée</p>
                                        </td>
                                    </tr>
                                ) : (
                                    displayedReservations.map(reservation => {
                                        const daysRemaining = calculateDaysRemaining(reservation.date);
                                        const isPaid = paymentStatus[reservation.id] === 'success' || reservation.is_paid || reservation.isPaid;

                                        return (
                                            <motion.tr
                                                key={reservation.id}
                                                variants={itemVariants}
                                                className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                                            >
                                                <td className="p-4 font-semibold text-slate-900 dark:text-white text-sm">{reservation.name}</td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                                        <MapPin size={12} />
                                                        {reservation.terrainName || reservation.terrain_name || `Terrain #${reservation.terrain_id || reservation.terrainId}`}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-sm">
                                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 mb-0.5">
                                                        <CalendarDays size={13} className="text-slate-400" />
                                                        {reservation.date}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                                                        <Clock size={12} />
                                                        {reservation.time_slot || reservation.timeSlot}
                                                    </div>
                                                </td>
                                                {user.role === 'admin' && <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{reservation.userId || 'Guest'}</td>}

                                                {user.role === 'admin' && (
                                                    <td className="p-4">
                                                        {isPaid ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                                                                <CheckCircle size={13} /> Payée
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-500 dark:text-red-400 text-xs font-semibold">
                                                                <XCircle size={13} /> Non payée
                                                            </span>
                                                        )}
                                                    </td>
                                                )}

                                                {user.role === 'admin' && (
                                                    <td className="p-4 text-sm">
                                                        {daysRemaining < 0 ? (
                                                            <span className="text-slate-400">Passé</span>
                                                        ) : daysRemaining === 0 ? (
                                                            <span className="text-emerald-500 font-semibold">Aujourd'hui</span>
                                                        ) : daysRemaining <= 3 ? (
                                                            <span className="text-[#D4AF37] font-semibold">Dans {daysRemaining}j</span>
                                                        ) : (
                                                            <span className="text-slate-600 dark:text-slate-300">Dans {daysRemaining}j</span>
                                                        )}
                                                    </td>
                                                )}

                                                <td className="p-4">
                                                    <div className="flex gap-1.5">
                                                        {user.role !== 'admin' && (
                                                            <button onClick={() => handleModifyClick(reservation)} className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors" title="Modifier">
                                                                <Edit size={15} />
                                                            </button>
                                                        )}
                                                        <button onClick={() => handleDeleteClick(reservation.id)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors" title="Supprimer">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>

                                                {user.role !== 'admin' && (
                                                    <td className="p-4">
                                                        {isPaid ? (
                                                            <span className="inline-flex items-center gap-1.5 text-emerald-500 font-medium text-sm">
                                                                <CheckCircle size={16} /> Confirmé
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handlePaymentClick(reservation)}
                                                                className="btn-primary text-xs px-3 py-1.5"
                                                            >
                                                                <CreditCard size={14} /> Payer
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
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseEditModal} />
                            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="relative glass-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                                <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Modifier Réservation</h2>
                                    <button onClick={handleCloseEditModal} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                        <XCircle size={20} className="text-slate-400" />
                                    </button>
                                </div>
                                <div className="p-6">
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Nom</label>
                                            <div className="relative">
                                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input-field pl-10 w-full" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Terrain</label>
                                            <div className="relative">
                                                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input type="text" value={formData.terrainName || formData.terrain_name || `Terrain #${formData.terrainId || formData.terrain_id}`} readOnly className="input-field pl-10 w-full opacity-60 cursor-not-allowed" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Date</label>
                                                <input type="date" name="date" min={today} value={formData.date} onChange={handleChange} required className="input-field w-full [color-scheme:dark]" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Horaire</label>
                                                <select name="timeSlot" value={formData.timeSlot || ''} onChange={handleChange} required className="input-field w-full">
                                                    <option value="" disabled>Choisir</option>
                                                    {timeSlots.map(slot => {
                                                        const isReserved = reservations.some(reservation => reservation.date === formData.date && (reservation.time_slot || reservation.timeSlot) === slot && reservation.id !== formData.id);
                                                        const isPast = formData.date === today && parseInt(slot.split(':')[0], 10) < currentHour;
                                                        const disabled = isReserved || isPast;
                                                        return <option key={slot} value={slot} disabled={disabled}>{slot}{isReserved ? ' (Pris)' : isPast ? ' (Passé)' : ''}</option>;
                                                    })}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="pt-4 flex gap-3">
                                            <button type="button" onClick={handleCloseEditModal} className="btn-secondary flex-1">Annuler</button>
                                            <button type="submit" className="btn-primary flex-1">Enregistrer</button>
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
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
                            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="relative glass-card rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
                                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle size={28} className="text-red-500" />
                                </div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Annuler la réservation</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Êtes-vous sûr de vouloir supprimer définitivement cette réservation ?</p>
                                <div className="flex gap-3">
                                    <button onClick={() => setIsDeleteModalOpen(false)} className="btn-secondary flex-1">Annuler</button>
                                    <button onClick={confirmDelete} className="btn-danger flex-1">Supprimer</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Payment Modal */}
                <AnimatePresence>
                    {isPaymentModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)} />
                            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="relative glass-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                                <div className="px-6 py-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <CreditCard size={18} className="text-[#D4AF37]" /> Paiement Sécurisé
                                    </h2>
                                    <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                        <XCircle size={20} className="text-slate-400" />
                                    </button>
                                </div>
                                <div className="p-6">
                                    <form onSubmit={handlePaymentSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Montant à payer</label>
                                            <div className="input-field w-full text-center font-bold text-lg text-emerald-600 dark:text-emerald-400 cursor-not-allowed">
                                                {paymentForm.amount} DH
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Numéro de carte</label>
                                            <input type="text" name="cardNumber" value={paymentForm.cardNumber} onChange={handlePaymentChange} required maxLength="19" placeholder="1234 5678 9012 3456" className="input-field w-full font-mono tracking-widest" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Nom sur la carte</label>
                                            <input type="text" name="cardName" value={paymentForm.cardName} onChange={handlePaymentChange} required placeholder="JEAN DUPONT" className="input-field w-full uppercase" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Expiration</label>
                                                <input type="text" name="expiryDate" value={paymentForm.expiryDate} onChange={handlePaymentChange} required maxLength="5" placeholder="MM/AA" className="input-field w-full font-mono" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">CVV</label>
                                                <input type="password" name="cvv" value={paymentForm.cvv} onChange={handlePaymentChange} required maxLength="3" placeholder="123" className="input-field w-full font-mono tracking-widest" />
                                            </div>
                                        </div>
                                        <div className="pt-4 flex gap-3">
                                            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="btn-secondary flex-1">Annuler</button>
                                            <button type="submit" className="btn-primary flex-1">Confirmer le paiement</button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default Reservation;
