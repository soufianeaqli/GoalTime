import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    const el = ref.current;
    if (el) {
      el.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach((child) => {
        observer.observe(child);
      });
    }
    return () => observer.disconnect();
  }, []);
  return ref;
}

const SectionLines = () => (
  <div className="section-lines max-w-7xl mx-auto px-6 lg:px-8">
    <div className="line" />
    <div className="line" />
    <div className="line" />
  </div>
);

export default function Accueil({ user }) {
  const mainRef = useScrollReveal();

  return (
    <div ref={mainRef} className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-24">

      {/* ═══════════════════ HERO (XNRGY style) ═══════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-end pb-16 md:pb-20 px-6 lg:px-12 overflow-hidden">

        {/* Background with gradient overlay */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/[0.05] rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/[0.03] rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto w-full">
          {/* Label */}
          <div className="reveal mb-6">
            <span className="label-xs text-white/30">La plateforme de football au Maroc</span>
          </div>

          {/* Giant Display Title (XNRGY style) */}
          <div className="flex flex-col mb-12">
            <motion.h1
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="display-xl"
            >
              Réservez.
            </motion.h1>
            <motion.h1
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="display-xl"
            >
              Jouez.
            </motion.h1>
            <motion.h1
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="display-xl text-white/20"
            >
              Dominez.
            </motion.h1>
          </div>

          {/* Bottom Row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-10"
          >
            <div className="max-w-md">
              <p className="body-md mb-8">
                Trouvez le terrain parfait, réservez en un clic, et affrontez d'autres joueurs.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/terrain" className="btn-primary">
                  Réserver un terrain
                  <span className="ml-1">→</span>
                </Link>
                <Link to="/annonces" className="btn-outline">
                  Trouver des joueurs
                </Link>
              </div>
            </div>

            {/* Glass Card */}
            <Link to="/terrain" className="group flex items-center gap-4 p-3 pr-6 rounded-2xl bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-500 max-w-sm">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/[0.05] shrink-0 flex items-center justify-center">
                <img src="/logo.jpg" alt="GoalTime" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="label-xs text-white/30 block mb-2">Dernière activité</span>
                <p className="text-sm font-semibold text-white truncate">Terrain Bab Tizimi</p>
                <p className="text-xs text-white/40 mt-1">Réservez maintenant</p>
              </div>
              <span className="text-white/30 text-xl group-hover:text-white/60 transition-all duration-500 group-hover:translate-x-1">→</span>
            </Link>
          </motion.div>
        </div>
      </section>

      <SectionLines />

      {/* ═══════════════════ ABOUT (XNRGY title-content-image) ═══════════════════ */}
      <section className="py-24 md:py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 md:gap-24">
            <div className="reveal">
              <span className="label-sm mb-6 block">Introduction</span>
              <h2 className="display-lg leading-none">
                Notre<br />
                <span className="text-white/20">mission.</span>
              </h2>
            </div>
            <div>
              <p className="reveal reveal-delay-1 heading-md text-white/60 leading-relaxed mb-8">
                Nous créons des expériences de football accessibles, connectées et passionnantes. De la réservation de terrain à l'organisation de tournois, GoalTime révolutionne la façon dont vous jouez.
              </p>
              <div className="reveal reveal-delay-2">
                <Link to="/terrain" className="btn-arrow">
                  Découvrir les terrains
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionLines />

      {/* ═══════════════════ FULL-WIDTH IMAGE SECTION ═══════════════════ */}
      <section className="py-24 md:py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="reveal-scale relative overflow-hidden rounded-2xl aspect-[16/7] bg-dark-800">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/[0.08] shadow-lg shadow-black/30 mb-5">
                  <img src="/logo.jpg" alt="GoalTime" className="w-full h-full object-cover" />
                </div>
                <p className="label-sm text-white/30">Football · Passion · Communaute</p>
              </div>
            </div>
            {/* Overlay content */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 bg-gradient-to-t from-black/60 to-transparent">
              <h3 className="heading-md mb-2">Terrain Bab Tizimi</h3>
              <p className="body-sm">Le meilleur terrain de Meknes</p>
            </div>
          </div>
        </div>
      </section>

      <SectionLines />

      {/* ═══════════════════ FEATURES (XNRGY style grid) ═══════════════════ */}
      <section className="py-24 md:py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="reveal mb-16 md:mb-24">
            <span className="label-sm mb-4 block">Fonctionnalites</span>
            <h2 className="display-lg max-w-3xl">
              Tout pour votre<br />
              <span className="text-white/20">prochain match.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden">
            {[
              {
                num: '01',
                title: 'Reservation rapide',
                desc: 'Reservez un terrain en quelques secondes avec disponibilite en temps reel.',
                link: '/terrain',
                linkLabel: 'Reserver',
              },
              {
                num: '02',
                title: 'Trouvez des joueurs',
                desc: 'Publiez une annonce et trouvez des coequipiers pour votre prochain match.',
                link: '/annonces',
                linkLabel: 'Explorer',
              },
              {
                num: '03',
                title: 'Tournois',
                desc: 'Participez a des tournois passionnants et prouvez vos talents.',
                link: '/tournoi-smart',
                linkLabel: 'Voir les tournois',
              },
            ].map((f, i) => (
              <div
                key={i}
                className={`reveal reveal-delay-${i + 1} group bg-dark-900 p-8 md:p-10 flex flex-col justify-between min-h-[320px] hover:bg-dark-800 transition-colors duration-500`}
              >
                <div>
                  <span className="text-white/15 text-sm font-mono">{f.num}</span>
                  <h3 className="heading-sm mt-4 mb-3">{f.title}</h3>
                  <p className="body-sm">{f.desc}</p>
                </div>
                <Link to={f.link} className="btn-arrow mt-8 text-sm">
                  {f.linkLabel}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionLines />

      {/* ═══════════════════ STATS ═══════════════════ */}
      <section className="py-24 md:py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden">
            {[
              { value: '2,500+', label: 'Joueurs actifs' },
              { value: '15+', label: 'Terrains' },
              { value: '200+', label: 'Matchs joues' },
              { value: '4.9', label: 'Note moyenne' },
            ].map((s, i) => (
              <div
                key={i}
                className={`reveal reveal-delay-${i + 1} bg-dark-900 p-8 md:p-10 text-center`}
              >
                <p className="text-3xl md:text-4xl font-extrabold text-white mb-2">{s.value}</p>
                <p className="text-[11px] text-white/25 uppercase tracking-widest font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionLines />

      {/* ═══════════════════ CTA ═══════════════════ */}
      <section className="py-24 md:py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="reveal-scale relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.06] to-transparent border border-white/[0.06] p-12 md:p-20 text-center">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/[0.03] rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]" />
            <div className="relative z-10">
              <span className="label-sm mb-6 block">Pret a jouer ?</span>
              <h2 className="display-lg mb-6">
                Rejoignez<br />
                <span className="text-white/20">GoalTime.</span>
              </h2>
              <p className="body-md max-w-md mx-auto mb-10">
                Des milliers de joueurs vous attendent. Reservez votre prochain terrain des maintenant.
              </p>
              <Link to={user ? '/terrain' : '/login'} className="btn-primary">
                {user ? 'Reserver maintenant' : 'Creer un compte'}
                <span className="ml-1">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FINAL SECTION (XNRGY LET'S CONNECT style) ═══════════════════ */}
      <section className="py-24 md:py-32 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto text-center">
          <div className="reveal">
            <h2 className="display-xl text-white/[0.04] select-none pointer-events-none">
              JOUEZ.
            </h2>
          </div>
        </div>
      </section>

      <div className="h-8" />
    </div>
  );
}