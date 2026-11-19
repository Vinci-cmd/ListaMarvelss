import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Clock,
  Search,
  Calendar,
  Compass,
  Heart,
  Star,
  Flame,
  X,
  UserPlus,
  CheckSquare,
  Award,
  Zap,
  Layers,
  ArrowUpDown,
  Cloud,
  HardDrive,
  Settings,
  Globe,
  RotateCcw
} from 'lucide-react';
import {
  MCU_DATABASE,
  INITIAL_USER_PROGRESS,
  UNIVERSES_META
} from './data/marvelDatabase';
import {
  DEFAULT_ROOM_CODE,
  normalizeRoomCode,
  resolveInitialFirebaseConfig,
  saveStoredFirebaseConfig,
  loadLocalPrefs,
  saveLocalPrefs,
  loadLocalRoomState,
  subscribeToRoom,
  pushRoomState
} from './services/syncService';
import PosterEmblem from './components/PosterEmblem';
import TitleCard from './components/TitleCard';
import TitleDetailModal from './components/TitleDetailModal';
import SyncSettingsModal from './components/SyncSettingsModal';
import AuthView from './components/AuthView';

function parseHashState() {
  if (typeof window === 'undefined') {
    return { route: 'dashboard', authMode: 'register', roomFromUrl: null };
  }
  const rawHash = window.location.hash || '';
  const cleanPath = rawHash.replace(/^#/, '').split('?')[0].toLowerCase();
  const hashQuery = rawHash.includes('?') ? rawHash.split('?')[1] : '';
  const searchParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(hashQuery);
  const roomFromUrl = hashParams.get('room') || searchParams.get('room');

  if (cleanPath === '/register') {
    return { route: 'register', authMode: 'register', roomFromUrl };
  }
  if (cleanPath === '/login') {
    return { route: 'register', authMode: 'login', roomFromUrl };
  }
  return { route: 'dashboard', authMode: 'register', roomFromUrl };
}

export default function App() {
  const initialHash = useMemo(() => parseHashState(), []);
  const savedPrefs = useMemo(() => loadLocalPrefs(), []);

  const initialRoom = normalizeRoomCode(
    initialHash.roomFromUrl || savedPrefs?.roomCode || DEFAULT_ROOM_CODE
  );

  const [currentRoute, setCurrentRoute] = useState(initialHash.route);
  const [authMode, setAuthMode] = useState(initialHash.authMode);

  const [firebaseConfig, setFirebaseConfig] = useState(() => resolveInitialFirebaseConfig());
  const [roomCode, setRoomCode] = useState(initialRoom);
  const [activeMember, setActiveMember] = useState(savedPrefs?.activeMember || 'me');
  const [syncModalState, setSyncModalState] = useState({ open: false, tab: 'room' });
  const [syncStatus, setSyncStatus] = useState(firebaseConfig ? 'connecting' : 'local');
  const [syncError, setSyncError] = useState(null);

  const [userProfile, setUserProfile] = useState(() => {
    const localRoom = loadLocalRoomState(initialRoom);
    return {
      name: localRoom?.profile?.name || savedPrefs?.profile?.name || 'Lui',
      email: savedPrefs?.profile?.email || 'agente@shield.marvel',
      favoriteHero: savedPrefs?.profile?.favoriteHero || 'Iron Man',
      coupleMode: true,
      partnerName: localRoom?.profile?.partnerName || savedPrefs?.profile?.partnerName || 'Lei',
      isRegistered: savedPrefs?.profile?.isRegistered ?? true
    };
  });

  const [progress, setProgress] = useState(() => {
    const localRoom = loadLocalRoomState(initialRoom);
    return localRoom?.progress || INITIAL_USER_PROGRESS;
  });

  // Controlli di Filtro e Ordinamento
  const [sortMode, setSortMode] = useState('release');
  const [groupByUniverse, setGroupByUniverse] = useState(false);
  const [selectedUniverse, setSelectedUniverse] = useState('Tutti');
  const [selectedPhase, setSelectedPhase] = useState('Tutte');
  const [selectedType, setSelectedType] = useState('Tutti');
  const [selectedStatus, setSelectedStatus] = useState('Tutti');
  const [includeLegacy, setIncludeLegacy] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyEssential, setOnlyEssential] = useState(false);

  const [activeItem, setActiveItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimerRef = useRef(null);
  const notesSyncTimerRef = useRef(null);
  const searchInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMessage(null), 3200);
  };

  const navigateTo = (route, mode = 'register') => {
    setCurrentRoute(route);
    if (route === 'register') {
      setAuthMode(mode);
      window.location.hash = mode === 'login' ? '#/login' : '#/register';
    } else {
      window.location.hash = '#/';
    }
  };

  // Scorciatoia "/" per cercare rapidamente
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA' &&
        !activeItem &&
        !syncModalState.open
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItem, syncModalState.open]);

  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseHashState();
      setCurrentRoute(parsed.route);
      setAuthMode(parsed.authMode);
      if (parsed.roomFromUrl) {
        setRoomCode(normalizeRoomCode(parsed.roomFromUrl));
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    saveLocalPrefs({
      roomCode,
      activeMember,
      profile: userProfile
    });
  }, [roomCode, activeMember, userProfile]);

  useEffect(() => {
    const localExisting = loadLocalRoomState(roomCode);
    if (localExisting?.progress) {
      setProgress(localExisting.progress);
    }
    if (localExisting?.profile) {
      setUserProfile((prev) => ({
        ...prev,
        name: localExisting.profile.name || prev.name,
        partnerName: localExisting.profile.partnerName || prev.partnerName
      }));
    }

    const unsubscribe = subscribeToRoom({
      roomCode,
      firebaseConfig,
      seedState: {
        progress: localExisting?.progress || INITIAL_USER_PROGRESS,
        profile: {
          name: userProfile.name,
          partnerName: userProfile.partnerName
        }
      },
      onData: (data) => {
        if (data?.progress) {
          setProgress(data.progress);
        }
        if (data?.profile) {
          setUserProfile((prev) => ({
            ...prev,
            name: data.profile.name || prev.name,
            partnerName: data.profile.partnerName || prev.partnerName,
            coupleMode: true
          }));
        }
      },
      onStatus: (status, errMsg) => {
        setSyncStatus(status);
        setSyncError(errMsg);
      }
    });

    return () => unsubscribe();
  }, [roomCode, firebaseConfig]);

  const persistSharedState = (nextProgress, nextProfile = userProfile) => {
    setProgress(nextProgress);
    pushRoomState({
      roomCode,
      firebaseConfig,
      state: {
        progress: nextProgress,
        profile: nextProfile
      }
    }).then((res) => {
      if (!res.ok && res.error) {
        setSyncStatus('error');
        setSyncError(res.error);
      }
    });
  };

  const getItemUniverse = (item) => item.universe || 'MCU (Fasi 1-6)';

  const toggleWatched = (id, e) => {
    if (e) e.stopPropagation();
    const current = progress[id] || { status: 'unwatched', rating: 0, partnerWatched: false, notes: '' };
    const updatedItem =
      activeMember === 'partner'
        ? { ...current, partnerWatched: !current.partnerWatched }
        : { ...current, status: current.status === 'watched' ? 'unwatched' : 'watched' };

    persistSharedState({ ...progress, [id]: updatedItem });
  };

  const toggleSecondaryWatched = (id, e) => {
    if (e) e.stopPropagation();
    const current = progress[id] || { status: 'unwatched', rating: 0, partnerWatched: false, notes: '' };
    const updatedItem =
      activeMember === 'partner'
        ? { ...current, status: current.status === 'watched' ? 'unwatched' : 'watched' }
        : { ...current, partnerWatched: !current.partnerWatched };

    persistSharedState({ ...progress, [id]: updatedItem });
  };

  const togglePartnerDirect = (id, e) => {
    if (e) e.stopPropagation();
    const current = progress[id] || { status: 'unwatched', rating: 0, partnerWatched: false, notes: '' };
    persistSharedState({
      ...progress,
      [id]: { ...current, partnerWatched: !current.partnerWatched }
    });
  };

  const setItemStatus = (id, status) => {
    const current = progress[id] || { status: 'unwatched', rating: 0, partnerWatched: false, notes: '' };
    persistSharedState({
      ...progress,
      [id]: { ...current, status }
    });
  };

  const setItemRating = (id, rating, e) => {
    if (e) e.stopPropagation();
    const current = progress[id] || { status: 'unwatched', rating: 0, partnerWatched: false, notes: '' };
    persistSharedState({
      ...progress,
      [id]: { ...current, rating }
    });
  };

  const updateItemNotes = (id, notes) => {
    const current = progress[id] || { status: 'unwatched', rating: 0, partnerWatched: false, notes: '' };
    const nextProgress = {
      ...progress,
      [id]: { ...current, notes }
    };
    setProgress(nextProgress);

    if (notesSyncTimerRef.current) clearTimeout(notesSyncTimerRef.current);
    notesSyncTimerRef.current = setTimeout(() => {
      pushRoomState({
        roomCode,
        firebaseConfig,
        state: {
          progress: nextProgress,
          profile: userProfile
        }
      });
    }, 350);
  };

  const markPhaseAsWatched = (phaseName) => {
    const itemsInPhase = MCU_DATABASE.filter((item) => item.phase === phaseName);
    const updated = { ...progress };
    itemsInPhase.forEach((item) => {
      const cur = updated[item.id] || { status: 'unwatched', rating: 0, partnerWatched: false, notes: '' };
      if (activeMember === 'partner') {
        updated[item.id] = { ...cur, partnerWatched: true };
      } else {
        updated[item.id] = { ...cur, status: 'watched' };
      }
    });
    persistSharedState(updated);
    showToast(`Tutti i titoli di "${phaseName}" segnati come visti!`);
  };

  const stats = useMemo(() => {
    const activeDataset = includeLegacy
      ? MCU_DATABASE
      : MCU_DATABASE.filter((i) => getItemUniverse(i) === 'MCU (Fasi 1-6)');

    const totalCount = activeDataset.length;
    let meWatchedCount = 0;
    let partnerWatchedCount = 0;
    let activeWatchedCount = 0;
    let inProgressCount = 0;
    let coupleWatchedCount = 0;
    let totalMinutesWatched = 0;
    let totalMinutesAll = 0;

    activeDataset.forEach((item) => {
      totalMinutesAll += item.runtimeMinutes;
      const p = progress[item.id];
      const meDone = p?.status === 'watched';
      const partnerDone = Boolean(p?.partnerWatched);

      if (meDone) meWatchedCount++;
      if (partnerDone) partnerWatchedCount++;
      if (meDone && partnerDone) coupleWatchedCount++;

      const activeDone = activeMember === 'partner' ? partnerDone : meDone;
      if (activeDone) {
        activeWatchedCount++;
        totalMinutesWatched += item.runtimeMinutes;
      } else if (activeMember === 'me' && p?.status === 'in_progress') {
        inProgressCount++;
        totalMinutesWatched += Math.round(item.runtimeMinutes * 0.5);
      }
    });

    const percentage = totalCount > 0 ? Math.round((activeWatchedCount / totalCount) * 100) : 0;
    const inProgressPercent =
      totalCount > 0 ? Math.min(100 - percentage, Math.round((inProgressCount / totalCount) * 100)) : 0;

    const universeCards = UNIVERSES_META.filter((u) => u.id !== 'Tutti');
    const phaseBreakdown = universeCards.map((u) => {
      const items = MCU_DATABASE.filter((i) =>
        u.id === 'Fantastici Quattro'
          ? getItemUniverse(i) === 'Fantastici Quattro' || i.id === 'fantastic-four-first-steps'
          : getItemUniverse(i) === u.id
      );
      const done = items.filter((i) =>
        activeMember === 'partner'
          ? Boolean(progress[i.id]?.partnerWatched)
          : progress[i.id]?.status === 'watched'
      ).length;
      return {
        phase: u.id,
        shortLabel: u.shortLabel,
        total: items.length,
        watched: done,
        percent: items.length > 0 ? Math.round((done / items.length) * 100) : 0
      };
    });

    const filteredNextPool = activeDataset.filter(
      (i) => selectedUniverse === 'Tutti' || getItemUniverse(i) === selectedUniverse
    );
    const sortedForNext = [...filteredNextPool].sort((a, b) =>
      sortMode === 'timeline' ? a.timelineOrder - b.timelineOrder : a.releaseOrder - b.releaseOrder
    );
    const nextUp = sortedForNext.find((i) =>
      activeMember === 'partner'
        ? !progress[i.id]?.partnerWatched
        : progress[i.id]?.status !== 'watched'
    );

    return {
      activeLabel: activeMember === 'partner' ? userProfile.partnerName : userProfile.name,
      totalCount,
      watchedCount: activeWatchedCount,
      meWatchedCount,
      partnerWatchedCount,
      inProgressCount,
      coupleWatchedCount,
      percentage,
      inProgressPercent,
      hoursWatched: Math.round(totalMinutesWatched / 60),
      hoursTotal: Math.round(totalMinutesAll / 60),
      phaseBreakdown,
      nextUp
    };
  }, [progress, includeLegacy, sortMode, selectedUniverse, activeMember, userProfile.name, userProfile.partnerName]);

  const filteredItems = useMemo(() => {
    return MCU_DATABASE.filter((item) => {
      const itemUniv = getItemUniverse(item);
      if (!includeLegacy && itemUniv !== 'MCU (Fasi 1-6)') return false;

      if (selectedUniverse !== 'Tutti') {
        if (selectedUniverse === 'Fantastici Quattro') {
          if (itemUniv !== 'Fantastici Quattro' && item.id !== 'fantastic-four-first-steps') return false;
        } else if (selectedUniverse === 'X-Men & Mutanti') {
          if (itemUniv !== 'X-Men & Mutanti' && item.id !== 'deadpool-wolverine') return false;
        } else if (itemUniv !== selectedUniverse) {
          return false;
        }
      }

      if (selectedPhase !== 'Tutte' && item.phase !== selectedPhase) return false;
      if (selectedType !== 'Tutti') {
        if (selectedType === 'Speciali') {
          if (item.type !== 'Special Presentation' && item.type !== 'Cortometraggio') return false;
        } else if (item.type !== selectedType) {
          return false;
        }
      }
      if (onlyEssential && item.essentiality !== 'Essenziale') return false;

      const meStatus = progress[item.id]?.status || 'unwatched';
      const partnerDone = Boolean(progress[item.id]?.partnerWatched);

      if (selectedStatus === 'watched') {
        if (activeMember === 'partner' ? !partnerDone : meStatus !== 'watched') return false;
      } else if (selectedStatus === 'unwatched') {
        if (activeMember === 'partner' ? partnerDone : meStatus !== 'unwatched') return false;
      } else if (selectedStatus === 'in_progress') {
        if (meStatus !== 'in_progress') return false;
      } else if (selectedStatus === 'couple_pending') {
        if (activeMember === 'partner') {
          if (!partnerDone || meStatus === 'watched') return false;
        } else {
          if (meStatus !== 'watched' || partnerDone) return false;
        }
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchTitle =
          item.title.toLowerCase().includes(q) || item.originalTitle.toLowerCase().includes(q);
        const matchChar = item.characters.some((c) => c.toLowerCase().includes(q));
        const matchYear =
          String(item.releaseYear).includes(q) || item.timelineYear.toLowerCase().includes(q);
        const matchSaga =
          (item.saga || '').toLowerCase().includes(q) || item.phase.toLowerCase().includes(q);
        if (!matchTitle && !matchChar && !matchYear && !matchSaga) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortMode === 'timeline') return a.timelineOrder - b.timelineOrder;
      if (sortMode === 'rating') return (progress[b.id]?.rating || 0) - (progress[a.id]?.rating || 0);
      if (sortMode === 'title') return a.title.localeCompare(b.title);
      return a.releaseYear - b.releaseYear || a.releaseOrder - b.releaseOrder;
    });
  }, [
    includeLegacy,
    selectedUniverse,
    selectedPhase,
    selectedType,
    selectedStatus,
    onlyEssential,
    searchQuery,
    sortMode,
    progress,
    activeMember
  ]);

  const availablePhases = useMemo(() => {
    const pool = MCU_DATABASE.filter((i) => {
      if (!includeLegacy && getItemUniverse(i) !== 'MCU (Fasi 1-6)') return false;
      if (selectedUniverse === 'Tutti') return true;
      if (selectedUniverse === 'Fantastici Quattro') {
        return getItemUniverse(i) === 'Fantastici Quattro' || i.id === 'fantastic-four-first-steps';
      }
      if (selectedUniverse === 'X-Men & Mutanti') {
        return getItemUniverse(i) === 'X-Men & Mutanti' || i.id === 'deadpool-wolverine';
      }
      return getItemUniverse(i) === selectedUniverse;
    });
    return ['Tutte', ...Array.from(new Set(pool.map((i) => i.phase)))];
  }, [selectedUniverse, includeLegacy]);

  const groupedSections = useMemo(() => {
    const groups = {};
    filteredItems.forEach((item) => {
      const key = `${getItemUniverse(item)} • ${item.phase}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.entries(groups);
  }, [filteredItems]);

  const hasActiveFilters =
    selectedUniverse !== 'Tutti' ||
    selectedPhase !== 'Tutte' ||
    selectedType !== 'Tutti' ||
    selectedStatus !== 'Tutti' ||
    onlyEssential ||
    searchQuery.trim() !== '';

  const resetAllFilters = () => {
    setSelectedUniverse('Tutti');
    setSelectedPhase('Tutte');
    setSelectedType('Tutti');
    setSelectedStatus('Tutti');
    setSearchQuery('');
    setOnlyEssential(false);
  };

  const handleAuthSubmit = ({ name, email, favoriteHero, partnerName, roomCode: nextRoom }) => {
    const cleanRoom = normalizeRoomCode(nextRoom);
    const nextProfile = {
      name,
      email,
      favoriteHero,
      coupleMode: true,
      partnerName,
      isRegistered: true
    };
    setUserProfile(nextProfile);
    setRoomCode(cleanRoom);
    pushRoomState({
      roomCode: cleanRoom,
      firebaseConfig,
      state: {
        progress,
        profile: nextProfile
      }
    });
    navigateTo('dashboard');
    showToast(`Connesso alla stanza "${cleanRoom}" come ${name}!`);
  };

  const handleSaveRoomSettings = ({ roomCode: nextRoom, name, partnerName, activeMember: nextMember }) => {
    const clean = normalizeRoomCode(nextRoom);
    const nextProfile = { ...userProfile, name, partnerName, coupleMode: true };
    setUserProfile(nextProfile);
    setActiveMember(nextMember);
    setRoomCode(clean);
    pushRoomState({
      roomCode: clean,
      firebaseConfig,
      state: {
        progress,
        profile: nextProfile
      }
    });
    showToast(`Stanza "${clean}" aggiornata!`);
  };

  const handleSaveFirebaseConfig = (nextConfig) => {
    saveStoredFirebaseConfig(nextConfig);
    setFirebaseConfig(nextConfig);
    setSyncError(null);
    setSyncStatus(nextConfig ? 'connecting' : 'local');
  };

  const handleResetRoomProgress = (mode) => {
    const next = mode === 'demo' ? INITIAL_USER_PROGRESS : {};
    persistSharedState(next);
    showToast(
      mode === 'demo'
        ? 'Progressi demo ripristinati nella stanza.'
        : 'Watchlist azzerata: pronti per iniziare da zero!'
    );
  };

  if (currentRoute === 'register') {
    return (
      <AuthView
        authMode={authMode}
        setAuthMode={(mode) => navigateTo('register', mode)}
        totalTitles={MCU_DATABASE.length}
        stats={stats}
        userProfile={userProfile}
        roomCode={roomCode}
        onContinueAsGuest={() => navigateTo('dashboard')}
        onSubmitAuth={handleAuthSubmit}
        onSelectItem={(item) => setActiveItem(item)}
        onToggleWatched={(id) => toggleWatched(id)}
      />
    );
  }

  const otherPartnerName = activeMember === 'partner' ? userProfile.name : userProfile.partnerName;

  return (
    <div className="min-h-screen bg-[#08080c] text-zinc-100 pb-20 relative">
      {/* Sottile spotlight superiore da sala cinematografica */}
      <div
        className="absolute inset-x-0 top-0 h-[420px] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 75% 60% at 50% -10%, rgba(230,36,41,0.14), transparent 70%)'
        }}
      />

      {/* Notifica Toast */}
      {toastMessage && (
        <div className="modal-reveal fixed bottom-6 right-6 z-50 bg-[#16161f] border border-emerald-500/45 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Navbar Superiore */}
      <header className="sticky top-0 z-30 bg-[#08080c]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-0 sm:h-16 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="bg-[#e62429] text-white font-display font-extrabold tracking-tight text-2xl px-2.5 py-0.5 rounded-lg">
              MARVEL<span className="font-semibold opacity-90">IST</span>
            </div>
            <span className="hidden lg:inline-block text-[11px] font-mono font-semibold text-zinc-300 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/10 tabular-nums">
              {MCU_DATABASE.length} TITOLI
            </span>
          </div>

          {/* Barra di Ricerca Rapida */}
          <div className="order-3 sm:order-2 w-full sm:w-auto sm:flex-1 sm:max-w-md relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchQuery('');
                  e.currentTarget.blur();
                }
              }}
              placeholder="Cerca film, serie, eroe (es. X-Men, Venom, Loki)..."
              className="w-full pl-10 pr-14 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#e62429] transition-colors"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Svuota ricerca"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-black/50 border border-white/10 rounded absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                /
              </kbd>
            )}
          </div>

          {/* Selettore rapido Sono Lui / Sono Lei + Stanza + Impostazioni + Account */}
          <div className="order-2 sm:order-3 flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center bg-black/65 p-0.5 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setActiveMember('me')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-colors max-w-[78px] truncate ${
                  activeMember === 'me'
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title={`Modalità ${userProfile.name}`}
              >
                {userProfile.name}
              </button>
              <button
                type="button"
                onClick={() => setActiveMember('partner')}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-colors flex items-center gap-1 max-w-[84px] ${
                  activeMember === 'partner'
                    ? 'bg-rose-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title={`Modalità ${userProfile.partnerName}`}
              >
                <Heart className="w-3 h-3 fill-current shrink-0" />
                <span className="truncate">{userProfile.partnerName}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSyncModalState({ open: true, tab: 'room' })}
              title={
                syncStatus === 'synced'
                  ? 'Firestore Cloud attivo'
                  : syncStatus === 'local'
                  ? 'Salvataggio locale (localStorage) • Clicca per collegare Firebase'
                  : 'Stato sincronizzazione'
              }
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#e5a93b]/15 hover:bg-[#e5a93b]/25 border border-[#e5a93b]/40 text-[#f3c66c] text-xs font-bold transition-colors"
            >
              {syncStatus === 'synced' ? (
                <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : syncStatus === 'connecting' ? (
                <Cloud className="w-3.5 h-3.5 text-[#e5a93b] shrink-0" />
              ) : (
                <HardDrive className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              )}
              <span className="font-mono max-w-[100px] truncate">{roomCode}</span>
            </button>

            <button
              type="button"
              onClick={() => setSyncModalState({ open: true, tab: 'firebase' })}
              title="Impostazioni Firebase & Sync"
              aria-label="Impostazioni Firebase"
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-zinc-300 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => navigateTo('register', 'register')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-zinc-200 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#e62429]" />
              <span className="hidden md:inline">Account</span>
            </button>
          </div>
        </div>
      </header>

      {/* Modale Stanza Condivisa & Impostazioni Firebase */}
      <SyncSettingsModal
        isOpen={syncModalState.open}
        initialTab={syncModalState.tab}
        onClose={() => setSyncModalState((prev) => ({ ...prev, open: false }))}
        roomCode={roomCode}
        userProfile={userProfile}
        activeMember={activeMember}
        syncStatus={syncStatus}
        syncError={syncError}
        firebaseConfig={firebaseConfig}
        onSaveRoomSettings={handleSaveRoomSettings}
        onSaveFirebaseConfig={handleSaveFirebaseConfig}
        onResetRoomProgress={handleResetRoomProgress}
        onShowToast={showToast}
      />

      {/* Hero Screening Console */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Card Progresso Generale */}
          <div className="lg:col-span-8 bg-[#111118] border border-white/12 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#e5a93b] uppercase tracking-wider mb-1">
                  <Award className="w-4 h-4" />
                  <span>Dossier Visione • {stats.activeLabel}</span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white leading-none">
                  Avanzamento Multiverso:{' '}
                  <span className="text-[#e62429] tabular-nums">{stats.percentage}%</span>
                </h1>
              </div>

              <div className="flex items-center gap-4 bg-black/45 px-4 py-2.5 rounded-xl border border-white/10 tabular-nums">
                <div className="text-center pr-4 border-r border-white/10">
                  <div className="font-display text-2xl font-extrabold text-white leading-none">
                    {stats.watchedCount}/{stats.totalCount}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">Completati</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-2xl font-extrabold text-[#e5a93b] leading-none">
                    {stats.hoursWatched}h
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1">su {stats.hoursTotal}h</div>
                </div>
              </div>
            </div>

            {/* Barra di avanzamento segmentata (Completati + In Corso) */}
            <div className="space-y-3 mb-5">
              <div className="w-full h-3.5 bg-black/70 rounded-full overflow-hidden p-0.5 border border-white/10 flex">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#e62429] to-[#e5a93b] transition-all duration-500"
                  style={{ width: `${stats.percentage}%` }}
                />
                {stats.inProgressPercent > 0 && (
                  <div
                    className="h-full rounded-full bg-amber-400/35 ml-0.5 transition-all duration-500"
                    style={{ width: `${stats.inProgressPercent}%` }}
                    title={`${stats.inProgressCount} in corso`}
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-zinc-300 gap-2 tabular-nums">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-semibold">
                    {userProfile.name}: {stats.meWatchedCount}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/25 text-rose-300 font-semibold">
                    {userProfile.partnerName}: {stats.partnerWatchedCount}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#e5a93b]/10 border border-[#e5a93b]/25 text-[#f3c66c] font-semibold">
                    Insieme: {stats.coupleWatchedCount}
                  </span>
                  <span className="text-zinc-400">• In corso: {stats.inProgressCount}</span>
                </div>

                <label className="inline-flex items-center gap-2 cursor-pointer text-zinc-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={includeLegacy}
                    onChange={(e) => setIncludeLegacy(e.target.checked)}
                    className="rounded border-zinc-600 text-[#e62429] focus:ring-[#e62429] bg-zinc-800"
                  />
                  <span>Includi X-Men, Spider-Man, F4, Defenders & Legacy</span>
                </label>
              </div>
            </div>

            {/* Mini-Barre per ogni Universo Marvel */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-1 tabular-nums">
              {stats.phaseBreakdown.map((pb) => (
                <button
                  key={pb.phase}
                  type="button"
                  onClick={() => {
                    setSelectedUniverse(selectedUniverse === pb.phase ? 'Tutti' : pb.phase);
                    setSelectedPhase('Tutte');
                  }}
                  className={`text-left p-2.5 rounded-xl border transition-colors ${
                    selectedUniverse === pb.phase
                      ? 'bg-[#e62429]/15 border-[#e62429] text-white'
                      : 'bg-black/45 border-white/[0.07] hover:border-white/25 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 text-[11px] font-bold mb-1.5">
                    <span className="truncate">{pb.shortLabel}</span>
                    <span className="text-[#f3c66c] font-mono shrink-0">{pb.percent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#e62429] rounded-full transition-all duration-300"
                      style={{ width: `${pb.percent}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1.5 font-mono">
                    {pb.watched}/{pb.total} visti
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Card Prossimo Titolo Consigliato ("Up Next") */}
          <div className="lg:col-span-4 bg-[#111118] border border-white/12 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            {stats.nextUp ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e5a93b]/15 border border-[#e5a93b]/35 text-[#f3c66c] text-xs font-bold">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Prossimo titolo consigliato</span>
                    </span>
                    <span className="text-xs text-zinc-400 font-mono tabular-nums">
                      {sortMode === 'timeline'
                        ? stats.nextUp.timelineYear
                        : stats.nextUp.releaseYear}
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveItem(stats.nextUp)}
                    className={`p-4 rounded-xl bg-gradient-to-br ${stats.nextUp.gradient} border border-white/15 relative overflow-hidden mb-3 cursor-pointer group`}
                  >
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          'linear-gradient(180deg, rgba(8,8,12,0.18) 0%, rgba(8,8,12,0.82) 100%)'
                      }}
                    />
                    <PosterEmblem
                      type={stats.nextUp.iconType}
                      className="w-24 h-24 opacity-25 absolute -right-3 -bottom-3 text-white transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="relative z-10">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-200 mb-1">
                        {stats.nextUp.phase} • {stats.nextUp.type}
                      </div>
                      <h2 className="font-display text-2xl font-extrabold uppercase text-white leading-tight pr-8 group-hover:text-[#f3c66c] transition-colors">
                        {stats.nextUp.title}
                      </h2>
                      <div className="text-xs text-zinc-200 mt-2 flex items-center gap-3 font-mono tabular-nums">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {stats.nextUp.durationLabel}
                        </span>
                        <span>• {stats.nextUp.postCreditsCount} Post-Credit</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                    {stats.nextUp.synopsis}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-4 mt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => toggleWatched(stats.nextUp.id)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Segna Visto ({stats.activeLabel})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveItem(stats.nextUp)}
                    className="py-2.5 px-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-semibold transition-colors"
                  >
                    Dettagli
                  </button>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-6">
                <Award className="w-12 h-12 text-[#e5a93b] mb-3" />
                <h3 className="font-display text-2xl font-bold uppercase text-white">
                  Hai completato tutto il Multiverso!
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {stats.activeLabel} è pronto per Avengers: Doomsday e Secret Wars.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Barra Controlli: Universi, Ordine, Filtri Fase, Tipo e Stato */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-[#111118] border border-white/10 rounded-2xl p-4 space-y-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          {/* Riga 0: Selettore Principale Universo Marvel */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 border-b border-white/[0.07]">
            {UNIVERSES_META.map((univ) => (
              <button
                key={univ.id}
                type="button"
                onClick={() => {
                  setSelectedUniverse(univ.id);
                  setSelectedPhase('Tutte');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-colors flex items-center gap-1.5 ${
                  selectedUniverse === univ.id
                    ? 'bg-[#e62429] text-white border-red-400'
                    : 'bg-black/45 text-zinc-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {univ.id === 'Tutti' && <Globe className="w-3.5 h-3.5" />}
                <span>{univ.label}</span>
              </button>
            ))}
          </div>

          {/* Riga 1: Ordinamento + Formato + Essenziali + Vista */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 bg-black/55 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setSortMode('release')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  sortMode === 'release'
                    ? 'bg-[#e62429] text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Ordine di Uscita</span>
              </button>

              <button
                type="button"
                onClick={() => setSortMode('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  sortMode === 'timeline'
                    ? 'bg-[#e5a93b] text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Cronologico</span>
              </button>

              <button
                type="button"
                onClick={() => setSortMode('rating')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  sortMode === 'rating'
                    ? 'bg-zinc-100 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Voto</span>
              </button>

              <button
                type="button"
                onClick={() => setSortMode('title')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  sortMode === 'title'
                    ? 'bg-zinc-100 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>A-Z</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {['Tutti', 'Film', 'Serie TV', 'Speciali'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    selectedType === type
                      ? 'bg-white text-black border-white'
                      : 'bg-black/45 text-zinc-300 border-white/10 hover:text-white hover:border-white/25'
                  }`}
                >
                  {type}
                </button>
              ))}

              <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

              <button
                type="button"
                onClick={() => setOnlyEssential(!onlyEssential)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                  onlyEssential
                    ? 'bg-[#e5a93b]/20 text-[#f3c66c] border-[#e5a93b]/50'
                    : 'bg-black/45 text-zinc-300 border-white/10 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Solo Essenziali</span>
              </button>

              <button
                type="button"
                onClick={() => setGroupByUniverse(!groupByUniverse)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                  groupByUniverse
                    ? 'bg-sky-500/20 text-sky-200 border-sky-400/50'
                    : 'bg-black/45 text-zinc-300 border-white/10 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{groupByUniverse ? 'Vista Raggruppata' : 'Elenco Unico'}</span>
              </button>
            </div>
          </div>

          {/* Riga 2: Fase / Sotto-Saga & Stato di Visione */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-white/[0.07]">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 lg:pb-0 min-w-0 flex-1 pr-2">
              {availablePhases.map((phase) => (
                <button
                  key={phase}
                  type="button"
                  onClick={() => setSelectedPhase(phase)}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedPhase === phase
                      ? 'bg-[#e62429] text-white'
                      : 'bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1] hover:text-white'
                  }`}
                >
                  {phase}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {[
                { id: 'Tutti', label: 'Tutti' },
                { id: 'watched', label: 'Visti' },
                { id: 'unwatched', label: 'Da Vedere' },
                { id: 'in_progress', label: 'In Corso' },
                ...(userProfile.coupleMode
                  ? [{ id: 'couple_pending', label: `Manca a ${otherPartnerName}` }]
                  : [])
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStatus(st.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedStatus === st.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/45'
                      : 'bg-black/45 text-zinc-300 hover:text-white border border-white/[0.07]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info Contatore Risultati */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 mt-4 mb-2 px-1 tabular-nums">
          <div className="flex flex-wrap items-center gap-2.5">
            <span>
              Visualizzati <strong className="text-white">{filteredItems.length}</strong> titoli Marvel (
              {selectedUniverse}) • Ordinati per{' '}
              <strong className="text-[#f3c66c]">
                {sortMode === 'timeline'
                  ? 'Timeline Cronologica'
                  : sortMode === 'rating'
                  ? 'Valutazione (1-5)'
                  : sortMode === 'title'
                  ? 'Ordine Alfabetico (A-Z)'
                  : 'Ordine di Uscita'}
              </strong>
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 border border-white/10 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Azzera filtri</span>
              </button>
            )}
          </div>

          {selectedPhase !== 'Tutte' && (
            <button
              type="button"
              onClick={() => markPhaseAsWatched(selectedPhase)}
              className="text-[#f3c66c] hover:text-white font-semibold flex items-center gap-1.5 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Segna tutta la sezione "{selectedPhase}" come vista</span>
            </button>
          )}
        </div>
      </section>

      {/* Griglia Principale delle Card MCU & Multiverso */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {filteredItems.length === 0 ? (
          <div className="bg-[#111118] border border-white/10 rounded-2xl p-12 text-center">
            <Compass className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="font-display text-2xl font-bold uppercase text-white">
              Nessun titolo trovato con questi filtri
            </h3>
            <p className="text-xs text-zinc-400 mt-1 mb-4">
              Prova a reimpostare la ricerca o a selezionare "Tutto il Multiverso Marvel".
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-4 py-2 bg-[#e62429] text-white rounded-xl text-xs font-bold hover:bg-red-500 transition-colors"
            >
              Ripristina tutti i filtri
            </button>
          </div>
        ) : groupByUniverse ? (
          <div className="space-y-10">
            {groupedSections.map(([sectionTitle, sectionItems]) => (
              <section key={sectionTitle} className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h2 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e62429]" />
                    <span>{sectionTitle}</span>
                    <span className="text-xs font-mono font-normal text-zinc-400 tabular-nums">
                      ({sectionItems.length})
                    </span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {sectionItems.map((item, idx) => (
                    <TitleCard
                      key={item.id}
                      item={item}
                      index={idx}
                      userItem={
                        progress[item.id] || {
                          status: 'unwatched',
                          rating: 0,
                          partnerWatched: false,
                          notes: ''
                        }
                      }
                      sortMode={sortMode}
                      activeMember={activeMember}
                      userProfile={userProfile}
                      onSelect={setActiveItem}
                      onTogglePrimaryWatched={toggleWatched}
                      onToggleSecondaryWatched={toggleSecondaryWatched}
                      onSetRating={setItemRating}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map((item, index) => (
              <TitleCard
                key={item.id}
                item={item}
                index={index}
                userItem={
                  progress[item.id] || {
                    status: 'unwatched',
                    rating: 0,
                    partnerWatched: false,
                    notes: ''
                  }
                }
                sortMode={sortMode}
                activeMember={activeMember}
                userProfile={userProfile}
                onSelect={setActiveItem}
                onTogglePrimaryWatched={toggleWatched}
                onToggleSecondaryWatched={toggleSecondaryWatched}
                onSetRating={setItemRating}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modale Dettagli Completi Scheda Marvel */}
      <TitleDetailModal
        item={activeItem}
        userItem={activeItem ? progress[activeItem.id] : null}
        userProfile={userProfile}
        onClose={() => setActiveItem(null)}
        onSetStatus={setItemStatus}
        onSetRating={setItemRating}
        onTogglePartnerWatched={togglePartnerDirect}
        onUpdateNotes={updateItemNotes}
      />
    </div>
  );
}
