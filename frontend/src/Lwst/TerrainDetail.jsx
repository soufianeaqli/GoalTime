import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CalendarPlus,
  MapPin,
  Clock,
  DollarSign,
  Shirt,
  ShowerHead,
  Car,
  Wifi,
  Coffee,
  Check,
  X,
  Star,
  Ruler,
  Lightbulb,
  Sun,
  CalendarDays,
  User,
  Mail,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import LoginPrompt from './LoginPrompt';
import FlyingBall from '../components/FlyingBall';
import { ToastFixed as ToastFixed } from '../components/Toast';
import * as reservationService from '../services/reservationService';
import { API_BASE_URL } from '../services/config';

function TerrainDetail({ addReservation, reservations, user, terrains }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [terrain, setTerrain] = useState(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date: '',
    timeSlot: '',
  });
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showFlyingBall, setShowFlyingBall] = useState(false);
  const [savedReservations, setSavedReservations] = useState(() => {
    const saved = localStorage.getItem('terrainDetailReservations');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchTerrainById = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/terrains/${id}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          setTerrain(data);
        } else {
          const errorData = await response.json();
          console.error('Erreur lors du chargement du terrain:', errorData.message);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du terrain:', error);
      }
    };
    const foundTerrain = terrains.find((t) => t.id === parseInt(id));
    if (foundTerrain) {
      setTerrain(foundTerrain);
    } else {
      fetchTerrainById();
    }
  }, [id, terrains]);

  useEffect(() => {
    localStorage.setItem('terrainDetailReservations', JSON.stringify(savedReservations));
  }, [savedReservations]);

  const handleReserveClick = () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setIsReservationModalOpen(true);
  };

  const handleCloseReservationModal = () => {
    setIsReservationModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.date === today) {
      const slotHour = parseInt(formData.timeSlot.split(':')[0], 10);
      if (slotHour < currentHour) {
        setConfirmationMessage('Ce créneau est déjà passé pour aujourd\'hui.');
        setTimeout(() => setConfirmationMessage(''), 5000);
        return;
      }
    }

    const conflict = reservations.some(
      (reservation) =>
        reservation.terrainId === terrain.id &&
        reservation.date === formData.date &&
        reservation.timeSlot === formData.timeSlot
    );

    if (conflict) {
      setConfirmationMessage('Une réservation existe déjà pour cette date et heure.');
      setTimeout(() => setConfirmationMessage(''), 5000);
      return;
    }

    try {
      const availabilityResponse = await reservationService.checkAvailability(
        terrain.id,
        formData.date,
        formData.timeSlot
      );

      if (!availabilityResponse.success || !availabilityResponse.data.available) {
        setConfirmationMessage(
          availabilityResponse.error ||
            (availabilityResponse.data && availabilityResponse.data.message) ||
            'Ce créneau est déjà réservé.'
        );
        setTimeout(() => setConfirmationMessage(''), 5000);
        return;
      }

      const reservationData = {
        terrain_id: terrain.id,
        user_id: user ? user.username : 'guest',
        name: formData.name,
        email: formData.email,
        date: formData.date,
        time_slot: formData.timeSlot,
        prix: terrain.prix,
      };

      const response = await reservationService.createReservation(reservationData);

      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la création de la réservation');
      }

      const newReservation = response.data;

      const reservationToAdd = {
        id: newReservation.id,
        terrainId: terrain.id,
        terrainTitle: terrain.titre,
        terrainPrice: terrain.prix,
        name: formData.name,
        email: formData.email,
        date: formData.date,
        timeSlot: formData.timeSlot,
        userId: user ? user.username : 'guest',
      };

      addReservation(reservationToAdd);
      setSavedReservations([...savedReservations, reservationToAdd]);
      setIsReservationModalOpen(false);
      setFormData({ name: '', email: '', date: '', timeSlot: '' });
      setShowFlyingBall(true);
      setConfirmationMessage('Votre réservation a été enregistrée avec succès.');
      setTimeout(() => setConfirmationMessage(''), 5000);
    } catch (error) {
      console.error('Erreur lors de la création de la réservation:', error);
      setConfirmationMessage(error.message || 'Erreur lors de la création de la réservation');
      setTimeout(() => setConfirmationMessage(''), 5000);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentHour = now.getHours();

  const timeSlots = [
    '10:00-11:00',
    '11:00-12:00',
    '12:00-13:00',
    '13:00-14:00',
    '14:00-15:00',
    '15:00-16:00',
    '16:00-17:00',
    '17:00-18:00',
    '18:00-19:00',
    '19:00-20:00',
    '20:00-21:00',
    '21:00-22:00',
    '22:00-23:00',
    '23:00-00:00',
  ];

  const reservedSlots =
    terrain && reservations
      ? reservations
          .filter((reservation) => reservation.terrainId === terrain.id && reservation.date === formData.date)
          .map((reservation) => reservation.timeSlot)
      : [];

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '/placeholder.jpg';
    if (imageUrl.startsWith('/storage')) {
      return `${API_BASE_URL.replace('/api', '')}${imageUrl}`;
    }
    return imageUrl;
  };

  const getSurfaceType = (titre) => {
    if (titre.includes('Synthétique')) return 'Gazon synthétique';
    if (titre.includes('Naturel')) return 'Gazon naturel';
    if (titre.includes('Hybride')) return 'Gazon hybride';
    return 'Gazon standard';
  };

  if (!terrain) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-2xl backdrop-blur-xl border border-black/5 dark:border-white/8 p-12 text-center max-w-md w-full"
        >
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-3">Terrain non trouvé</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Le terrain que vous recherchez n'existe pas ou a été supprimé.
          </p>
          <button
            onClick={() => navigate('/terrain')}
            className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à la liste des terrains
          </button>
        </motion.div>
      </div>
    );
  }

  const amenities = [
    { icon: Shirt, label: 'Vestiaires' },
    { icon: ShowerHead, label: 'Douches' },
    { icon: Car, label: 'Parking' },
    { icon: Wifi, label: 'Wi-Fi gratuit' },
    { icon: Coffee, label: 'Cafétéria' },
  ];

  const specs = [
    { icon: Ruler, label: 'Surface', value: getSurfaceType(terrain.titre) },
    { icon: Ruler, label: 'Dimensions', value: '40m x 20m' },
    { icon: Lightbulb, label: 'Éclairage', value: 'Système LED' },
    { icon: Sun, label: 'Disponibilité', value: '9h00 - 22h00' },
    { icon: DollarSign, label: 'Prix', value: `${terrain.prix} DH/heure` },
  ];

  return (
    <div className="min-h-screen">
      <FlyingBall show={showFlyingBall} onComplete={() => { setShowFlyingBall(false); navigate('/reservation'); }} />
      {showLoginPrompt && <LoginPrompt />}

      {/* Confirmation toast */}
      <ToastFixed
        message={confirmationMessage}
        type={confirmationMessage.includes('succès') ? 'success' : 'warning'}
        onClose={() => setConfirmationMessage('')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
  <div className="flex items-center gap-3">
    <button
      onClick={() => navigate('/terrain')}
      className="w-10 h-10 rounded-xl bg-white dark:bg-dark-800 border border-black/5 dark:border-white/8 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors"
    >
      <ArrowLeft className="w-5 h-5 text-dark-900 dark:text-white" />
    </button>
    <div className="flex items-center gap-3">
      <div className="w-1.5 h-12 bg-gradient-to-b from-primary to-primary-light rounded-full" />
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gradient">{terrain.titre}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Détail du terrain</p>
      </div>
    </div>
  </div>
          {user && user.role !== 'admin' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReserveClick}
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
            >
              <CalendarPlus className="w-4 h-4" />
              Réserver ce terrain
            </motion.button>
          )}
        </motion.div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Image + Description - takes 3 columns */}
          <div className="lg:col-span-3 space-y-8">
            {/* Hero image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative rounded-2xl overflow-hidden group"
            >
              <img
                src={getImageUrl(terrain.image)}
                alt={terrain.titre}
                className="w-full h-[300px] sm:h-[420px] object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  e.target.src = '/placeholder.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Price badge */}
              <div className="absolute top-4 right-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="glass-card rounded-xl backdrop-blur-xl border border-white/20 px-4 py-2 flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-lg font-bold text-white">{terrain.prix} DH</span>
                  <span className="text-xs text-white/70">/heure</span>
                </motion.div>
              </div>

              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                  <span className="text-xs font-medium text-emerald-300 uppercase tracking-wider">Disponible</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">{terrain.titre}</h2>
                <div className="flex items-center gap-2 text-white/70">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">Terrain de football professionnel</span>
                </div>
              </div>
            </motion.div>

            {/* Description card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-card rounded-2xl backdrop-blur-xl border border-black/5 dark:border-white/8 p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#0B6E4F]/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-[#0B6E4F] dark:text-[#10b981]" />
                </div>
                <h3 className="text-xl font-bold text-dark-900 dark:text-white">Description</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{terrain.description}</p>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
                Ce terrain est équipé de vestiaires modernes, d'un éclairage LED pour les matchs nocturnes, et d'un
                système de drainage avancé pour garantir des conditions de jeu optimales même après la pluie.
              </p>
            </motion.div>

            {/* Amenities card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="glass-card rounded-2xl backdrop-blur-xl border border-black/5 dark:border-white/8 p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <h3 className="text-xl font-bold text-dark-900 dark:text-white">Équipements</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {amenities.map((amenity, i) => (
                  <motion.div
                    key={amenity.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-dark-800 border border-black/5 dark:border-white/5"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#0B6E4F]/10 dark:bg-[#10b981]/10 flex items-center justify-center shrink-0">
                      <amenity.icon className="w-4 h-4 text-[#0B6E4F] dark:text-[#10b981]" />
                    </div>
                    <span className="text-sm font-medium text-dark-900 dark:text-white">{amenity.label}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar - takes 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Specs card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-card rounded-2xl backdrop-blur-xl border border-black/5 dark:border-white/8 p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#0B6E4F]/10 dark:bg-[#10b981]/10 flex items-center justify-center">
                  <Ruler className="w-5 h-5 text-[#0B6E4F] dark:text-[#10b981]" />
                </div>
                <h3 className="text-xl font-bold text-dark-900 dark:text-white">Spécifications</h3>
              </div>
              <div className="space-y-4">
                {specs.map((spec, i) => (
                  <motion.div
                    key={spec.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center justify-between py-3 border-b border-black/5 dark:border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <spec.icon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">{spec.label}</span>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        spec.label === 'Prix'
                          ? 'text-[#D4AF37]'
                          : 'text-dark-900 dark:text-white'
                      }`}
                    >
                      {spec.value}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Quick info card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="glass-card rounded-2xl backdrop-blur-xl border border-black/5 dark:border-white/8 p-6 sm:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <h3 className="text-xl font-bold text-dark-900 dark:text-white">Créneaux disponibles</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((slot) => {
                  const isReserved = reservedSlots.includes(slot);
                  const isPast = formData.date === today && parseInt(slot.split(':')[0], 10) < currentHour;
                  const unavailable = isReserved || isPast;
                  return (
                    <div
                      key={slot}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        unavailable
                          ? 'bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-200 dark:border-red-500/20 opacity-50'
                          : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                      }`}
                    >
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{slot}</span>
                      {isReserved && <span className="ml-auto text-[10px]">Réservé</span>}
                      {isPast && !isReserved && <span className="ml-auto text-[10px]">Passé</span>}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* CTA card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="rounded-2xl bg-gradient-to-br from-[#0B6E4F] to-[#10b981] p-6 sm:p-8 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-2">Prêt à jouer ?</h3>
                <p className="text-white/80 text-sm mb-6 leading-relaxed">
                  Réservez votre créneau maintenant et profitez d'un terrain de qualité professionnelle.
                </p>
                {user && user.role !== 'admin' ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleReserveClick}
                    className="w-full bg-white text-[#0B6E4F] font-bold py-3 px-6 rounded-xl hover:bg-white/90 transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <CalendarPlus className="w-5 h-5" />
                    Réserver maintenant
                  </motion.button>
                ) : (
                  <p className="text-white/60 text-sm text-center">Connectez-vous pour réserver</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      <AnimatePresence>
        {isReservationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={handleCloseReservationModal}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative glass-card rounded-2xl backdrop-blur-xl border border-black/5 dark:border-white/8 w-full max-w-lg shadow-2xl"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/5">
                <div>
                  <h2 className="text-xl font-bold text-dark-900 dark:text-white">Réserver</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{terrain.titre}</p>
                </div>
                <button
                  onClick={handleCloseReservationModal}
                  className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-dark-700 transition-colors"
                >
                  <X className="w-5 h-5 text-dark-900 dark:text-white" />
                </button>
              </div>

              {/* Modal body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-dark-900 dark:text-white mb-2">
                    <span className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      Nom complet
                    </span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Entrez votre nom"
                    className="input-field w-full rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-dark-800 border border-black/5 dark:border-white/8 text-dark-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] dark:focus:ring-[#10b981] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-900 dark:text-white mb-2">
                    <span className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      Email
                    </span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Entrez votre email"
                    className="input-field w-full rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-dark-800 border border-black/5 dark:border-white/8 text-dark-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] dark:focus:ring-[#10b981] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-900 dark:text-white mb-2">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-gray-400" />
                      Date de Réservation
                    </span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    min={today}
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="input-field w-full rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-dark-800 border border-black/5 dark:border-white/8 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] dark:focus:ring-[#10b981] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark-900 dark:text-white mb-2">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      Plage Horaire
                    </span>
                  </label>
                  <select
                    name="timeSlot"
                    value={formData.timeSlot}
                    onChange={handleChange}
                    required
                    className="input-field w-full rounded-xl px-4 py-3 text-sm bg-gray-50 dark:bg-dark-800 border border-black/5 dark:border-white/8 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0B6E4F] dark:focus:ring-[#10b981] transition-all appearance-none"
                  >
                    <option value="" disabled>
                      Choisir une heure
                    </option>
                    {timeSlots.map((slot) => {
                      const isReserved = reservedSlots.includes(slot);
                      const isPast = formData.date === today && parseInt(slot.split(':')[0], 10) < currentHour;
                      const unavailable = isReserved || isPast;
                      return (
                        <option key={slot} value={slot} disabled={unavailable}>
                          {isReserved ? `${slot} (Réservé)` : isPast ? `${slot} (Passé)` : slot}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Price summary */}
                {formData.timeSlot && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-dark-900 dark:text-white">Total à payer</span>
                      <span className="text-xl font-bold text-[#D4AF37]">{terrain.prix} DH</span>
                    </div>
                  </motion.div>
                )}

                {/* Modal actions */}
                <div className="flex items-center gap-3 pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
                  >
                    <Check className="w-4 h-4" />
                    Confirmer la réservation
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleCloseReservationModal}
                    className="btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TerrainDetail;
