import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_CONFIG = {
  scheduled: { label: "Programmé", color: "rgba(100,116,139,0.7)", dot: "#94a3b8" },
  live: { label: "En cours", color: "rgba(239,68,68,0.7)", dot: "#ef4444" },
  finished: { label: "Terminé", color: "rgba(16,185,129,0.7)", dot: "#10b981" },
};

const ROUNDS_META = [
  { key: "quarter", label: "Quarts de finale", number: 1 },
  { key: "semi", label: "Demi-finales", number: 2 },
  { key: "final", label: "Finale", number: 3 },
];

function MatchCard({ match, onUpdateResult, user, delay }) {
  const [editing, setEditing] = useState(false);
  const [homeScore, setHomeScore] = useState(match.home_score ?? "");
  const [awayScore, setAwayScore] = useState(match.away_score ?? "");
  const status = STATUS_CONFIG[match.status] || STATUS_CONFIG.scheduled;
  const isFinished = match.status === "finished";
  const isScheduled = match.status === "scheduled";
  const homeWins = isFinished && match.winner_team_id === match.home_team_id;
  const awayWins = isFinished && match.winner_team_id === match.away_team_id;
  const canEdit = user && isScheduled;

  const handleSave = () => {
    const hs = parseInt(homeScore, 10);
    const as = parseInt(awayScore, 10);
    if (isNaN(hs) || isNaN(as) || hs < 0 || as < 0) return;
    onUpdateResult(match.id, { home_score: hs, away_score: as });
    setEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -30, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="tb-match-card"
      style={{
        background: isFinished
          ? "rgba(16,185,129,0.06)"
          : "rgba(255,255,255,0.04)",
        boxShadow: isFinished
          ? "0 0 20px rgba(16,185,129,0.08), 0 8px 32px rgba(0,0,0,0.25)"
          : "0 8px 32px rgba(0,0,0,0.25)",
      }}
    >
      {/* Status badge */}
      <div
        className="tb-status-badge"
        style={{ background: status.color, color: "#fff" }}
      >
        <span
          className="tb-status-dot"
          style={{
            background: status.dot,
            boxShadow: match.status === "live" ? `0 0 6px ${status.dot}` : "none",
          }}
        />
        {status.label}
      </div>

      {/* Match date/time */}
      {(match.match_date || match.match_time) && (
        <div className="tb-match-datetime">
          {match.match_date}
          {match.match_date && match.match_time ? " · " : ""}
          {match.match_time}
        </div>
      )}

      {/* Home team */}
      <div className={`tb-team-row ${homeWins ? "tb-winner" : ""}`}>
        <div
          className="tb-color-bar"
          style={{
            background: homeWins
              ? "linear-gradient(180deg,#10b981,#059669)"
              : "linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))",
          }}
        />
        <span className="tb-team-name">
          {match.homeTeam?.team_name || "TBA"}
        </span>
      </div>

      {/* Score */}
      <div className="tb-score-display">
        {editing ? (
          <div className="tb-score-inputs">
            <input
              type="number"
              min="0"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              className="tb-score-input"
              autoFocus
            />
            <span className="tb-score-sep">-</span>
            <input
              type="number"
              min="0"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              className="tb-score-input"
            />
          </div>
        ) : (
          <span className="tb-score-value">
            {isFinished ? `${match.home_score ?? 0} - ${match.away_score ?? 0}` : "vs"}
          </span>
        )}
      </div>

      {/* Away team */}
      <div className={`tb-team-row ${awayWins ? "tb-winner" : ""}`}>
        <div
          className="tb-color-bar"
          style={{
            background: awayWins
              ? "linear-gradient(180deg,#10b981,#059669)"
              : "linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))",
          }}
        />
        <span className="tb-team-name">
          {match.awayTeam?.team_name || "TBA"}
        </span>
      </div>

      {/* Edit controls */}
      {canEdit && !editing && (
        <button
          className="tb-edit-btn"
          onClick={() => setEditing(true)}
        >
          Saisir le score
        </button>
      )}
      {editing && (
        <div className="tb-edit-actions">
          <button className="tb-save-btn" onClick={handleSave}>
            Enregistrer
          </button>
          <button className="tb-cancel-btn" onClick={() => setEditing(false)}>
            Annuler
          </button>
        </div>
      )}
    </motion.div>
  );
}

function ChampionCard({ championName, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, rotateY: -30 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
      className="tb-champion"
    >
      <div className="tb-champion-inner">
        <div className="tb-champion-trophy">🏆</div>
        <div className="tb-champion-label">Champion</div>
        <div className="tb-champion-name">{championName}</div>
      </div>
    </motion.div>
  );
}

function ConnectorLine({ fromY, toY, delay }) {
  const startX = 100;
  const midX = 50;
  const endX = 0;
  const h = toY - fromY;
  const path = `M${startX},${fromY} C${startX + midX},${fromY} ${endX - midX},${toY} ${endX},${toY}`;
  return (
    <motion.path
      d={path}
      stroke="rgba(16,185,129,0.25)"
      strokeWidth="2"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.6, delay }}
    />
  );
}

export default function TournamentBracket({ matches, onUpdateResult, user }) {
  const rounds = useMemo(() => {
    const grouped = {};
    ROUNDS_META.forEach((r) => {
      grouped[r.number] = {
        ...r,
        matches: [],
      };
    });
    matches.forEach((m) => {
      if (grouped[m.round_number]) {
        grouped[m.round_number].matches.push(m);
      }
    });
    return Object.values(grouped).filter((r) => r.matches.length > 0);
  }, [matches]);

  const finalMatch = useMemo(() => {
    return matches.find((m) => m.round_number === 3 && m.status === "finished");
  }, [matches]);

  const championTeam = useMemo(() => {
    if (!finalMatch) return null;
    const winnerId = finalMatch.winner_team_id;
    if (!winnerId) return null;
    if (winnerId === finalMatch.home_team_id) return finalMatch.homeTeam?.team_name;
    if (winnerId === finalMatch.away_team_id) return finalMatch.awayTeam?.team_name;
    return null;
  }, [finalMatch]);

  if (!matches || matches.length === 0) {
    return (
      <div className="tb-container">
        <div className="tb-empty">
          <div className="tb-empty-icon"><img src="/logo.jpg" alt="" className="w-full h-full object-cover rounded-full" /></div>
          <div className="tb-empty-text">Aucun match dans le tableau</div>
        </div>
      </div>
    );
  }

  let globalIdx = 0;

  return (
    <div className="tb-container">
      <motion.h2
        className="tb-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Tableau du Tournoi
      </motion.h2>

      <div className="tb-bracket-scroll">
        <div className="tb-bracket">
          {rounds.map((round, roundIdx) => {
            const matchCount = round.matches.length;
            return (
              <div className="tb-round" key={round.number}>
                <div className="tb-round-label">{round.label}</div>
                <div className="tb-round-matches">
                  {round.matches.map((match) => {
                    const delay = globalIdx * 0.1;
                    globalIdx++;
                    return (
                      <React.Fragment key={match.id}>
                        <MatchCard
                          match={match}
                          onUpdateResult={onUpdateResult}
                          user={user}
                          delay={delay}
                        />
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {championTeam && (
            <ChampionCard
              championName={championTeam}
              delay={rounds.length * 0.2}
            />
          )}
        </div>
      </div>

      <style>{`
        .tb-container {
          width: 100%;
          padding: 1rem;
        }
        .tb-title {
          text-align: center;
          font-size: 1.6rem;
          font-weight: 800;
          background: linear-gradient(135deg, #10b981, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
        }
        .tb-bracket-scroll {
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 1rem 0 2rem;
          -webkit-overflow-scrolling: touch;
        }
        .tb-bracket-scroll::-webkit-scrollbar {
          height: 6px;
        }
        .tb-bracket-scroll::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.03);
          border-radius: 3px;
        }
        .tb-bracket-scroll::-webkit-scrollbar-thumb {
          background: rgba(16,185,129,0.3);
          border-radius: 3px;
        }
        .tb-bracket {
          display: flex;
          align-items: center;
          gap: 3rem;
          min-width: max-content;
          padding: 0 1rem;
        }
        .tb-round {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          position: relative;
        }
        .tb-round-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.4);
          margin-bottom: 0.5rem;
        }
        .tb-round-matches {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .tb-match-card {
          width: 220px;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 1rem;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          position: relative;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .tb-match-card:hover {
          border-color: rgba(16,185,129,0.3);
          box-shadow: 0 0 24px rgba(16,185,129,0.08), 0 12px 40px rgba(0,0,0,0.35) !important;
        }
        .tb-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 3px 8px;
          border-radius: 6px;
          margin-bottom: 0.6rem;
        }
        .tb-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .tb-match-datetime {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.35);
          margin-bottom: 0.6rem;
        }
        .tb-team-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          transition: all 0.3s;
        }
        .tb-team-row.tb-winner .tb-team-name {
          color: #10b981;
          font-weight: 700;
        }
        .tb-color-bar {
          width: 3px;
          height: 22px;
          border-radius: 2px;
          flex-shrink: 0;
        }
        .tb-team-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: rgba(255,255,255,0.88);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tb-score-display {
          text-align: center;
          padding: 0.4rem 0;
        }
        .tb-score-value {
          font-size: 1.3rem;
          font-weight: 800;
          color: rgba(255,255,255,0.95);
          letter-spacing: 0.05em;
          font-variant-numeric: tabular-nums;
        }
        .tb-score-inputs {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .tb-score-input {
          width: 44px;
          height: 36px;
          text-align: center;
          font-size: 1.1rem;
          font-weight: 700;
          color: #fff;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(16,185,129,0.4);
          border-radius: 8px;
          outline: none;
          font-variant-numeric: tabular-nums;
          -moz-appearance: textfield;
        }
        .tb-score-input::-webkit-outer-spin-button,
        .tb-score-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .tb-score-input:focus {
          border-color: #10b981;
          box-shadow: 0 0 12px rgba(16,185,129,0.2);
        }
        .tb-score-sep {
          font-size: 1.1rem;
          color: rgba(255,255,255,0.4);
          font-weight: 700;
        }
        .tb-edit-btn {
          width: 100%;
          margin-top: 0.6rem;
          padding: 6px 0;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #10b981;
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.25);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.25s;
        }
        .tb-edit-btn:hover {
          background: rgba(16,185,129,0.18);
          border-color: rgba(16,185,129,0.5);
        }
        .tb-edit-actions {
          display: flex;
          gap: 6px;
          margin-top: 0.6rem;
        }
        .tb-save-btn {
          flex: 1;
          padding: 6px 0;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #fff;
          background: linear-gradient(135deg, #10b981, #059669);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.25s;
        }
        .tb-save-btn:hover {
          box-shadow: 0 4px 16px rgba(16,185,129,0.35);
          transform: translateY(-1px);
        }
        .tb-cancel-btn {
          flex: 1;
          padding: 6px 0;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.25s;
        }
        .tb-cancel-btn:hover {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.7);
        }
        .tb-champion {
          flex-shrink: 0;
        }
        .tb-champion-inner {
          width: 200px;
          padding: 2rem 1.5rem;
          border-radius: 18px;
          background: linear-gradient(145deg, rgba(245,158,11,0.12), rgba(16,185,129,0.12));
          border: 2px solid rgba(245,158,11,0.35);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          text-align: center;
          box-shadow: 0 0 40px rgba(245,158,11,0.1), 0 16px 48px rgba(0,0,0,0.3);
          animation: tb-champion-pulse 3s ease-in-out infinite;
        }
        @keyframes tb-champion-pulse {
          0%, 100% { box-shadow: 0 0 40px rgba(245,158,11,0.1), 0 16px 48px rgba(0,0,0,0.3); }
          50% { box-shadow: 0 0 60px rgba(245,158,11,0.2), 0 16px 48px rgba(0,0,0,0.3); }
        }
        .tb-champion-trophy {
          font-size: 3.2rem;
          margin-bottom: 0.6rem;
          filter: drop-shadow(0 4px 12px rgba(245,158,11,0.3));
        }
        .tb-champion-label {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: rgba(245,158,11,0.7);
          margin-bottom: 0.4rem;
        }
        .tb-champion-name {
          font-size: 1.1rem;
          font-weight: 800;
          background: linear-gradient(135deg, #f59e0b, #10b981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.3;
        }
        .tb-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
        }
        .tb-empty-icon {
          width: 3rem;
          height: 3rem;
          margin: 0 auto 1rem;
          opacity: 0.3;
          border-radius: 50%;
          overflow: hidden;
        }
        .tb-empty-text {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.35);
          font-weight: 600;
        }
        @media (max-width: 640px) {
          .tb-title { font-size: 1.2rem; }
          .tb-match-card { width: 180px; padding: 0.8rem; }
          .tb-score-value { font-size: 1.1rem; }
          .tb-champion-inner { width: 160px; padding: 1.5rem 1rem; }
          .tb-champion-trophy { font-size: 2.4rem; }
          .tb-champion-name { font-size: 0.95rem; }
        }
      `}</style>
    </div>
  );
}
