import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Cloud,
  HardDrive,
  RotateCcw,
  Trash2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { parseFirebaseConfigInput } from '../services/syncService';

const FIRESTORE_RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /marvelist_shared/{docId} {
      allow read, write: if true;
    }
  }
}`;

export default function SyncSettingsModal({
  isOpen,
  onClose,
  syncStatus,
  syncError,
  firebaseConfig,
  onSaveFirebaseConfig,
  onResetProgress,
  onShowToast
}) {
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
      setConfigText(firebaseConfig ? JSON.stringify(firebaseConfig, null, 2) : '');
      setConfigError('');
    }
  }, [isOpen, firebaseConfig]);

  if (!isOpen) return null;

  const handleCopyRules = () => {
    navigator.clipboard?.writeText(FIRESTORE_RULES_SNIPPET);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  const handleApplyFirebase = (e) => {
    e.preventDefault();
    setConfigError('');
    try {
      const parsed = parseFirebaseConfigInput(configText);
      onSaveFirebaseConfig(parsed);
      onShowToast(`Cloud Firebase collegato (${parsed.projectId})!`);
    } catch (err) {
      setConfigError(err.message);
    }
  };

  const handleDisconnectFirebase = () => {
    setConfigText('');
    setConfigError('');
    onSaveFirebaseConfig(null);
    onShowToast('Firebase scollegato: attivo salvataggio su localStorage.');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Impostazioni Sincronizzazione Cloud e Watchlist"
    >
      <div
        className="modal-reveal bg-[#111118] border border-white/15 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modale */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/35">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#e5a93b]/15 border border-[#e5a93b]/30 text-[#f3c66c]">
              {syncStatus === 'synced' ? (
                <Cloud className="w-5 h-5 text-emerald-400" />
              ) : (
                <HardDrive className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-tight text-white">
                Sincronizzazione Cloud & Watchlist
              </h2>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                {syncStatus === 'synced' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-emerald-300">Firestore attivo in tempo reale</span>
                  </>
                ) : syncStatus === 'connecting' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#e5a93b]" />
                    <span className="text-[#f3c66c]">Connessione a Firestore...</span>
                  </>
                ) : syncStatus === 'error' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-red-300">Errore Cloud • Salvataggio locale attivo</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    <span className="text-sky-300">Modalità Locale (localStorage)</span>
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

        {/* Contenuto */}
        <div className="p-6 max-h-[78vh] overflow-y-auto space-y-5">
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
                <strong className="text-white block mb-0.5">Salvataggio locale attivo</strong>
                Le spunte si salvano automaticamente su questo dispositivo. Collegando Firebase qui sotto, la stessa watchlist condivisa si aggiorna dal vivo su tutti i dispositivi senza nessun login.
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">
                  Progetto collegato: {firebaseConfig.projectId}
                </strong>
                Tutte le spunte, i voti e le note si sincronizzano in tempo reale tra i vostri dispositivi.
              </div>
            </div>
          )}

          <form onSubmit={handleApplyFirebase} className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Configurazione Firebase (JSON o snippet JS da Firebase Console)
              </label>
              <textarea
                rows={5}
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
                  Usa solo locale
                </button>
              )}
            </div>
          </form>

          {/* Guida Rapida Firebase */}
          <div className="p-4 rounded-xl bg-black/45 border border-white/10 space-y-2.5 text-xs text-zinc-300">
            <div className="font-bold text-white">Setup gratuito in 2 minuti (senza account nell'app):</div>
            <ol className="list-decimal list-inside space-y-1 text-zinc-400">
              <li>
                Su <span className="text-[#f3c66c] font-medium">console.firebase.google.com</span> crea un progetto e aggiungi un'app <strong className="text-zinc-200">Web (&lt;/&gt;)</strong>.
              </li>
              <li>
                Apri <strong className="text-zinc-200">Firestore Database → Crea database</strong> (modalità test).
              </li>
              <li>
                Incolla queste <strong className="text-zinc-200">Regole (Rules)</strong> su Firestore:
              </li>
            </ol>

            <div className="relative">
              <pre className="p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                {FIRESTORE_RULES_SNIPPET}
              </pre>
              <button
                type="button"
                onClick={handleCopyRules}
                className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-white font-semibold flex items-center gap-1"
              >
                {copiedRules ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedRules ? 'Copiate' : 'Copia'}</span>
              </button>
            </div>
          </div>

          {/* Azioni Rapide Watchlist */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onResetProgress('empty')}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/15 border border-white/10 hover:border-red-500/40 text-zinc-300 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Azzera tutte le spunte (Inizia da 0)</span>
            </button>
            <button
              type="button"
              onClick={() => onResetProgress('demo')}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ripristina demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
