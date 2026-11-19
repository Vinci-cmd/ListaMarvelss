import React, { useState, useEffect } from 'react';
import {
  Users,
  X,
  Copy,
  Check,
  Cloud,
  HardDrive,
  Settings,
  Link2,
  RotateCcw,
  Trash2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { normalizeRoomCode, parseFirebaseConfigInput } from '../services/syncService';

const FIRESTORE_RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /marvelist_rooms/{roomId} {
      allow read, write: if true;
    }
  }
}`;

export default function SyncSettingsModal({
  isOpen,
  initialTab = 'room',
  onClose,
  roomCode,
  userProfile,
  activeMember,
  syncStatus,
  syncError,
  firebaseConfig,
  onSaveRoomSettings,
  onSaveFirebaseConfig,
  onResetRoomProgress,
  onShowToast
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [roomInput, setRoomInput] = useState(roomCode);
  const [myName, setMyName] = useState(userProfile.name);
  const [partnerName, setPartnerName] = useState(userProfile.partnerName);
  const [member, setMember] = useState(activeMember);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);

  const [configText, setConfigText] = useState(
    firebaseConfig ? JSON.stringify(firebaseConfig, null, 2) : ''
  );
  const [configError, setConfigError] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setRoomInput(roomCode);
      setMyName(userProfile.name);
      setPartnerName(userProfile.partnerName);
      setMember(activeMember);
      setConfigText(firebaseConfig ? JSON.stringify(firebaseConfig, null, 2) : '');
      setConfigError('');
    }
  }, [isOpen, initialTab, roomCode, userProfile.name, userProfile.partnerName, activeMember, firebaseConfig]);

  if (!isOpen) return null;

  const cleanRoomPreview = normalizeRoomCode(roomInput);
  const inviteLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#/?room=${encodeURIComponent(cleanRoomPreview)}`
      : '';

  const handleCopy = (text, setter) => {
    navigator.clipboard?.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleSaveRoom = (e) => {
    e.preventDefault();
    onSaveRoomSettings({
      roomCode: cleanRoomPreview,
      name: myName.trim() || 'Lui',
      partnerName: partnerName.trim() || 'Lei',
      activeMember: member
    });
    onClose();
  };

  const handleApplyFirebase = (e) => {
    e.preventDefault();
    setConfigError('');
    try {
      const parsed = parseFirebaseConfigInput(configText);
      onSaveFirebaseConfig(parsed);
      onShowToast(`Firebase configurato (${parsed.projectId})!`);
    } catch (err) {
      setConfigError(err.message);
    }
  };

  const handleDisconnectFirebase = () => {
    setConfigText('');
    setConfigError('');
    onSaveFirebaseConfig(null);
    onShowToast('Firebase scollegato: attivo salvataggio automatico su localStorage.');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Stanza Condivisa e Impostazioni Firebase"
    >
      <div
        className="modal-reveal bg-[#111118] border border-white/15 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modale */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/35">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#e62429]/15 border border-[#e62429]/30 text-[#e62429]">
              {activeTab === 'room' ? <Users className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-tight text-white">
                Stanza Condivisa & Impostazioni Sync
              </h2>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                {syncStatus === 'synced' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-emerald-300">Cloud Firestore attivo in tempo reale</span>
                  </>
                ) : syncStatus === 'connecting' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#e5a93b]" />
                    <span className="text-[#f3c66c]">Connessione a Firestore...</span>
                  </>
                ) : syncStatus === 'error' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-red-300">Errore Cloud • Fallback localStorage attivo</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span className="text-sky-300">Modalità Locale (localStorage automatico)</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi impostazioni"
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Switch Tabs */}
        <div className="px-6 pt-4">
          <div className="flex p-1 bg-black/55 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('room')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'room'
                  ? 'bg-[#e62429] text-white'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Stanza di Coppia</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('firebase')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'firebase'
                  ? 'bg-[#e5a93b] text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Impostazioni Firebase</span>
            </button>
          </div>
        </div>

        {/* Contenuto Tab */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {activeTab === 'room' ? (
            <form onSubmit={handleSaveRoom} className="space-y-5">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Usate lo stesso <strong className="text-[#f3c66c]">Codice Stanza</strong> su due dispositivi (con Firebase collegato nelle Impostazioni): ogni film visto, voto a stelle, nota o cuoricino di coppia si sincronizza all'istante.
              </p>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Codice Stanza Condiviso
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                    placeholder="ES. MARVEL-COPPIA"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-[#e5a93b]/40 text-[#f3c66c] font-mono font-bold text-sm focus:outline-none focus:border-[#e5a93b]"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(cleanRoomPreview, setCopiedCode)}
                    className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10"
                    title="Copia codice stanza"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(inviteLink, setCopiedLink)}
                    className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5"
                    title="Copia link diretto alla stanza"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
                    <span className="hidden sm:inline">{copiedLink ? 'Copiato' : 'Link'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                    Nome Profilo 1 (Lui)
                  </label>
                  <input
                    type="text"
                    value={myName}
                    onChange={(e) => setMyName(e.target.value)}
                    placeholder="Es. Marco"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/12 text-white text-xs focus:outline-none focus:border-[#e62429]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                    Nome Profilo 2 (Lei)
                  </label>
                  <input
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="Es. Giulia"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/12 text-white text-xs focus:outline-none focus:border-[#e62429]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1.5">
                  Chi sta usando questo dispositivo adesso?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMember('me')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      member === 'me'
                        ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300'
                        : 'bg-black/45 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Sono {myName.trim() || 'Lui'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMember('partner')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors ${
                      member === 'partner'
                        ? 'bg-rose-600/25 border-rose-500 text-rose-300'
                        : 'bg-black/45 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Sono {partnerName.trim() || 'Lei'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#e62429] hover:bg-red-500 text-white font-bold text-xs transition-colors"
              >
                Salva e Sincronizza Stanza
              </button>

              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onResetRoomProgress('empty')}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/40 text-zinc-300 hover:text-red-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Azzera tutti i progressi (Inizia da 0)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onResetRoomProgress('demo')}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ripristina dati demo</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {syncError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{syncError}</span>
                </div>
              )}

              {!firebaseConfig ? (
                <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-200 flex items-start gap-2.5">
                  <HardDrive className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block mb-0.5">Fallback localStorage attivo</strong>
                    I tuoi progressi vengono già salvati automaticamente su questo browser. Per sincronizzare in tempo reale tra 2 dispositivi diversi, incolla qui sotto la tua configurazione Firebase gratuita.
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block mb-0.5">
                      Progetto collegato: {firebaseConfig.projectId}
                    </strong>
                    La sincronizzazione Firestore in tempo reale è attiva per la stanza{' '}
                    <span className="font-mono font-bold text-[#f3c66c]">{roomCode}</span>.
                  </div>
                </div>
              )}

              <form onSubmit={handleApplyFirebase} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Incolla la tua firebaseConfig (JSON o snippet JS da Firebase Console)
                  </label>
                  <textarea
                    rows={6}
                    value={configText}
                    onChange={(e) => setConfigText(e.target.value)}
                    placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "tuo-progetto.firebaseapp.com",\n  "projectId": "tuo-progetto",\n  "appId": "1:123456:web:abcdef"\n}`}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 font-mono text-xs text-[#f3c66c] placeholder-zinc-600 focus:outline-none focus:border-[#e5a93b]"
                  />
                </div>

                {configError && <p className="text-xs text-red-400 font-medium">{configError}</p>}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#e5a93b] hover:bg-[#f3c66c] text-black font-bold text-xs transition-colors"
                  >
                    Salva e Connetti Firebase
                  </button>
                  {firebaseConfig && (
                    <button
                      type="button"
                      onClick={handleDisconnectFirebase}
                      className="py-2.5 px-3.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 text-zinc-300 hover:text-red-300 text-xs font-bold transition-colors"
                    >
                      Usa solo localStorage
                    </button>
                  )}
                </div>
              </form>

              <div className="p-4 rounded-xl bg-black/45 border border-white/10 space-y-2.5 text-xs text-zinc-300">
                <div className="font-bold text-white">Come ottenere una firebaseConfig gratuita (2 minuti):</div>
                <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                  <li>
                    Vai su <span className="text-[#f3c66c] font-medium">console.firebase.google.com</span> e crea un progetto gratuito.
                  </li>
                  <li>
                    Aggiungi un'app <strong className="text-zinc-200">Web (&lt;/&gt;)</strong> e copia l'oggetto <code className="text-[#f3c66c]">firebaseConfig</code> qui sopra.
                  </li>
                  <li>
                    Nel menu a sinistra apri <strong className="text-zinc-200">Firestore Database → Crea database</strong> (modalità test).
                  </li>
                  <li>
                    Nella scheda <strong className="text-zinc-200">Regole (Rules)</strong> assicurati che la collection <code className="text-[#f3c66c]">marvelist_rooms</code> sia accessibile:
                  </li>
                </ol>

                <div className="relative">
                  <pre className="p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                    {FIRESTORE_RULES_SNIPPET}
                  </pre>
                  <button
                    type="button"
                    onClick={() => handleCopy(FIRESTORE_RULES_SNIPPET, setCopiedRules)}
                    className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-white font-semibold flex items-center gap-1"
                  >
                    {copiedRules ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedRules ? 'Copiate' : 'Copia'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
