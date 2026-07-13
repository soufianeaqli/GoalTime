import { Route, Routes, Navigate, Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import Header from "./Header/Header";
import Footer from "./components/Footer";
import Accueil from "./Lwst/Accueil";
import Terrain from "./Lwst/Terrain";
import TerrainDetail from "./Lwst/TerrainDetail";
import Reservation from "./Lwst/Reservation";
import Contact from "./Lwst/Contact";
import Login from './Lwst/Login';
import Parametres from './Lwst/Parametres';
import MatchAnnonce from './Lwst/MatchAnnonce';
import AnnonceDetail from './Lwst/AnnonceDetail';
import CreateAnnonce from './Lwst/CreateAnnonce';
import CaptainDashboard from './Lwst/CaptainDashboard';

import TournamentWizard from './Lwst/TournamentWizard';
import TournamentPublicPage from './Lwst/TournamentPublicPage';
import TournamentDashboard from './Lwst/TournamentDashboard';
import PublicProfile from './Lwst/PublicProfile';
import GoogleCallback from './Lwst/GoogleCallback';
import { API_BASE_URL } from './services/config';

function App() {
  const [reservations, setReservations] = useState(() => {
    const saved = localStorage.getItem('allReservations');
    return saved ? JSON.parse(saved) : [];
  });
  const [user, setUser] = useState(null);
  const [terrains, setTerrains] = useState([]);
  const [loading, setLoading] = useState(true);

  const isDarkMode = true;

  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id && parsedUser.username) {
          setUser({
            id: parsedUser.id,
            username: parsedUser.username,
            name: parsedUser.name || '',
            email: parsedUser.email || '',
            phone: parsedUser.phone || '',
            role: parsedUser.role || 'user'
          });
        }
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  useEffect(() => { localStorage.setItem('allReservations', JSON.stringify(reservations)); }, [reservations]);

  useEffect(() => {
    const fetchTerrains = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/terrains`, { headers: { 'Accept': 'application/json' } });
        if (response.ok) setTerrains(await response.json());
      } catch (error) { console.error(error); }
    };
    fetchTerrains();
  }, []);

  const addReservation = (newReservation) => {
    const reservationWithUser = {
      ...newReservation,
      userId: user ? user.username : 'guest',
      accepted: user?.role === 'admin',
      id: Date.now().toString()
    };
    setReservations(prev => [...prev, reservationWithUser]);
    return reservationWithUser;
  };

  const modifyReservation = (updatedReservation) => {
    setReservations(prev => prev.map(r => r.id === updatedReservation.id ? updatedReservation : r));
  };

  const deleteReservation = (id) => {
    setReservations(prev => prev.filter(r => r.id !== id));
  };

  const acceptReservation = (id) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, accepted: true } : r));
  };

  const handleLogin = (userData) => {
    const completeUserData = { id: userData.id, username: userData.username, name: userData.name, email: userData.email, phone: userData.phone, role: userData.role };
    setUser(completeUserData);
    localStorage.setItem('user', JSON.stringify(completeUserData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <div className="relative min-h-screen text-white font-sans selection:bg-white/20">
      {/* Page Loader */}
      <div className={`page-loader ${!loading ? 'is-hidden' : ''}`}>
        <div className="page-loader__columns">
          <div className="page-loader__col page-loader__col--1" />
          <div className="page-loader__col page-loader__col--2" />
          <div className="page-loader__col page-loader__col--3" />
          <div className="page-loader__col page-loader__col--4" />
        </div>
        <div className="page-loader__inner">
          <span className="page-loader__logo">GOALTIME</span>
        </div>
      </div>

      {/* Background */}
      <div className="fixed inset-0 z-[-3] bg-cover bg-center bg-no-repeat bg-fixed" style={{ backgroundImage: "url('/imagebg.jpg')" }} />
      <div className="fixed inset-0 z-[-2] bg-black/70" />

      <Header user={user} logout={handleLogout} isDarkMode={isDarkMode} />

      <main className="relative z-10 min-h-screen pt-24">
        <Routes>
          <Route path="/" element={<Navigate to="/accueil" />} />
          <Route path="accueil" element={<Accueil user={user} />} />
          <Route path="terrain" element={<Terrain user={user} addReservation={addReservation} reservations={reservations} />} />
          <Route path="terrain/:id" element={<TerrainDetail user={user} addReservation={addReservation} reservations={reservations} terrains={terrains} />} />
          <Route path="reservation" element={<Reservation user={user} reservations={reservations} deleteReservation={deleteReservation} modifyReservation={modifyReservation} acceptReservation={acceptReservation} />} />
          <Route path="contact" element={<Contact user={user} />} />
          <Route path="login" element={<Login setUser={handleLogin} />} />
          <Route path="auth/google/callback" element={<GoogleCallback setUser={handleLogin} />} />
          <Route path="parametres" element={user ? <Parametres user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="annonces" element={<MatchAnnonce user={user} />} />
          <Route path="annonces/creer" element={<CreateAnnonce user={user} />} />
          <Route path="annonces/mes" element={<CaptainDashboard user={user} />} />
          <Route path="annonces/:id" element={<AnnonceDetail user={user} />} />
          <Route path="profil/:userId" element={<PublicProfile />} />
          <Route path="tournoi-smart" element={<TournamentPublicPage user={user} />} />
          <Route path="tournoi-smart/:id" element={<TournamentPublicPage user={user} />} />
          <Route path="tournoi-smart/:id/admin" element={user ? <TournamentDashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="tournoi-smart/creer" element={user ? <TournamentWizard user={user} onClose={() => window.history.back()} onCreated={(t) => window.location.href = `/tournoi-smart/${t.id}/admin`} /> : <Navigate to="/login" />} />
        </Routes>
      </main>

      {/* Sticky CTA */}
      <Link to={user ? '/terrain' : '/login'} className="sticky-cta">
        <img src="/logo.jpg" alt="" className="w-4 h-4 rounded-sm object-cover" /> <span>{user ? 'Réserver' : 'Se connecter'}</span>
      </Link>

      <Footer />
    </div>
  );
}

export default App;
