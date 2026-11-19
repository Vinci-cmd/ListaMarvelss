import React, { useState } from 'react';
import {
  Play,
  Compass,
  Heart,
  UserPlus,
  LogIn,
  ChevronRight,
  Award,
  Clock,
  Zap,
  CheckCircle2,
  Film
} from 'lucide-react';
import PosterEmblem from './PosterEmblem';

export default function AuthView({
  authMode,
  setAuthMode,
  totalTitles,
  stats,
  userProfile,
  roomCode,
  onContinueAsGuest,
  onSubmitAuth,
  onSelectItem,
  onToggleWatched
}) {
  const [formName, setFormName] = useState(userProfile.name === 'Lui' ? '' : userProfile.name);
  const [formEmail, setFormEmail] = useState(userProfile.email || '');
  const [formPassword, setFormPassword] = useState('');
  const [formHero, setFormHero] = useState(userProfile.favoriteHero || 'Iron Man');
  const [formPartner, setFormPartner] = useState(
    userProfile.partnerName === 'Lei' ? '' : userProfile.partnerName
  );
  const [formRoomCode, setFormRoomCode] = useState(roomCode || 'MARVEL-COPPIA');
  const [authFeedback, setAuthFeedback] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formEmail.trim() || !formEmail.includes('@')) {
      setAuthFeedback('Inserisci un indirizzo email valido.');
      return;
    }
    setAuthFeedback('');
    onSubmitAuth({
      mode: authMode,
      name: formName.trim() || formEmail.split('@')[0] || userProfile.name,
      email: formEmail.trim(),
      favoriteHero: formHero,
      partnerName: formPartner.trim() || userProfile.partnerName || 'Lei',
      roomCode: formRoomCode
    });
  };

  return (
    <div className="min-h-screen bg-[#08080c] text-zinc-100 flex flex-col justify-between relative overflow-hidden">
      {/* Spotlight ambientale cinematografico */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 45% at 15% 10%, rgba(230,36,41,0.16), transparent 65%), radial-gradient(ellipse 50% 40% at 85% 20%, rgba(229,169,59,0.09), transparent 65%)'
        }}
      />

      {/* Top Bar */}
      <header className="relative z-10 border-b border-white/10 bg-[#08080c]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="bg-[#e62429] text-white font-display font-extrabold tracking-tight text-2xl px-3 py-0.5 rounded-lg"
            >
              MARVEL<span className="font-semibold opacity-90">IST</span>
            </button>
            <span className="hidden sm:inline-block text-xs text-zinc-400 border-l border-white/15 pl-3">
              Archivio & Tracker del Multiverso Marvel
            </span>
          </div>

          <button
            type="button"
            onClick={onContinueAsGuest}
            className="flex items-center gap-2 text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white border border-white/12 transition-colors"
          >
            <Play className="w-4 h-4 text-[#e62429]" />
            <span>Esplora Catalogo ({totalTitles} titoli)</span>
          </button>
        </div>
      </header>

      {/* Contenuto Centrale /register e /login */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Colonna Sinistra: Presentazione + Avanzamento Live + Prossimo Titolo Consigliato */}
          <div className="lg:col-span-6 space-y-6">
            <h1 className="font-display text-4xl sm:text-6xl font-extrabold uppercase tracking-tight text-white leading-[0.95]">
              Tieni traccia dell'intero{' '}
              <span className="text-[#e5a93b]">Multiverso Marvel</span>.
            </h1>

            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Organizza la maratona per <strong className="text-white">Ordine di Uscita</strong> o{' '}
              <strong className="text-white">Timeline Cronologica</strong>, scopri le scene post-credit senza spoiler e sincronizza cosa avete visto insieme.
            </p>

            {/* Card Riepilogo Avanzamento & Prossimo Titolo Consigliato */}
            <div className="bg-[#111118] border border-white/12 rounded-2xl p-5 space-y-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#e5a93b] uppercase tracking-wider">
                  <Award className="w-4 h-4" />
                  <span>Avanzamento ({stats.activeLabel})</span>
                </div>
                <span className="text-xs font-mono font-bold text-white tabular-nums">
                  {stats.watchedCount}/{stats.totalCount} ({stats.percentage}%) • {stats.hoursWatched}h / {stats.hoursTotal}h
                </span>
              </div>

              <div className="w-full h-2.5 bg-black/70 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#e62429] to-[#e5a93b] transition-all duration-500"
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>

              {stats.nextUp && (
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-[#e5a93b] flex items-center gap-1.5 mb-0.5 uppercase tracking-wider">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Prossimo titolo consigliato</span>
                    </div>
                    <div className="font-display text-xl font-bold uppercase text-white truncate">
                      {stats.nextUp.title}
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5 tabular-nums">
                      <span>{stats.nextUp.phase}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {stats.nextUp.durationLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleWatched(stats.nextUp.id)}
                      className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      title="Segna come visto"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Visto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onContinueAsGuest();
                        onSelectItem(stats.nextUp);
                      }}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
                    >
                      Apri
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Punti chiave compatti */}
            <div className="flex flex-wrap gap-4 text-xs text-zinc-300 pt-1">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-[#e62429]" />
                <span>MCU Fasi 1-6, X-Men, Spider-Verse, F4, Defenders & Legacy</span>
              </div>
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#e5a93b]" />
                <span>Uscita o Cronologia</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Stanza Condivisa di Coppia</span>
              </div>
            </div>
          </div>

          {/* Colonna Destra: Card Registrazione / Login */}
          <div className="lg:col-span-6">
            <div className="bg-[#111118] border border-white/15 rounded-2xl p-6 sm:p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] relative overflow-hidden">
              <PosterEmblem
                type="avengers"
                className="w-40 h-40 opacity-[0.04] absolute -right-6 -top-6 pointer-events-none"
              />

              {/* Switch Tab Registrazione / Accesso */}
              <div className="flex p-1 bg-black/55 rounded-xl border border-white/10 mb-6 relative z-10">
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    authMode === 'register'
                      ? 'bg-[#e62429] text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Crea Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    authMode === 'login'
                      ? 'bg-[#e62429] text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Accedi</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Il tuo Nome / Nickname
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Es. Marco"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/12 text-white placeholder-zinc-500 focus:outline-none focus:border-[#e62429] transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Nome del Partner
                    </label>
                    <input
                      type="text"
                      value={formPartner}
                      onChange={(e) => setFormPartner(e.target.value)}
                      placeholder="Es. Giulia"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/12 text-white placeholder-zinc-500 focus:outline-none focus:border-[#e62429] transition-colors text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Indirizzo Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="agente@shield.marvel"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/12 text-white placeholder-zinc-500 focus:outline-none focus:border-[#e62429] transition-colors text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/12 text-white placeholder-zinc-500 focus:outline-none focus:border-[#e62429] transition-colors text-sm"
                    />
                  </div>

                  {authMode === 'register' && (
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                        Eroe Preferito
                      </label>
                      <select
                        value={formHero}
                        onChange={(e) => setFormHero(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/12 text-white focus:outline-none focus:border-[#e62429] transition-colors text-sm"
                      >
                        <option value="Iron Man">Iron Man</option>
                        <option value="Spider-Man">Spider-Man</option>
                        <option value="Captain America">Captain America</option>
                        <option value="Thor">Thor</option>
                        <option value="Scarlet Witch">Scarlet Witch</option>
                        <option value="Doctor Strange">Doctor Strange</option>
                        <option value="Wolverine">Wolverine</option>
                        <option value="Deadpool">Deadpool</option>
                        <option value="Daredevil">Daredevil</option>
                        <option value="Black Panther">Black Panther</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#e5a93b] mb-1.5">
                    Codice Stanza di Coppia (Condiviso tra voi due)
                  </label>
                  <input
                    type="text"
                    value={formRoomCode}
                    onChange={(e) => setFormRoomCode(e.target.value.toUpperCase())}
                    placeholder="Es. MARVEL-COPPIA"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-[#e5a93b]/40 text-[#f3c66c] font-mono font-bold placeholder-zinc-500 focus:outline-none focus:border-[#e5a93b] transition-colors text-sm"
                  />
                </div>

                {authFeedback && <p className="text-xs text-red-400 font-medium">{authFeedback}</p>}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#e62429] hover:bg-red-500 text-white font-bold text-sm transition-colors"
                >
                  {authMode === 'register'
                    ? 'Registrati e Entra nella Stanza'
                    : 'Accedi alla tua Watchlist'}
                </button>
              </form>

              <div className="mt-5 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 relative z-10">
                <span>Accesso libero anche senza registrazione</span>
                <button
                  type="button"
                  onClick={onContinueAsGuest}
                  className="text-[#e5a93b] hover:text-[#f3c66c] font-bold flex items-center gap-1"
                >
                  <span>Continua come Ospite</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 py-4 text-center text-xs text-zinc-500">
        MarveList • Enciclopedia Interattiva del Marvel Multiverse ({totalTitles} titoli)
      </footer>
    </div>
  );
}
