import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

const STORAGE_KEYS = {
  FIREBASE_CONFIG: 'marvelist_firebase_config_v1',
  PREFS: 'marvelist_prefs_v1',
  ROOM_PREFIX: 'marvelist_room_v1_'
};

const FIREBASE_APP_NAME = 'marvelist-couple-sync';

export const DEFAULT_ROOM_CODE = 'MARVEL-COPPIA';

export function normalizeRoomCode(code) {
  if (!code || typeof code !== 'string') return DEFAULT_ROOM_CODE;
  const cleaned = code.trim().toUpperCase().replace(/[^A-Z0-9-_]/g, '');
  return cleaned || DEFAULT_ROOM_CODE;
}

/**
 * Accetta sia JSON puro che snippet JS copiato direttamente dalla Console Firebase
 * (es. `const firebaseConfig = { apiKey: "...", projectId: "..." };`).
 */
export function parseFirebaseConfigInput(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Incolla una configurazione Firebase valida.');
  }

  let text = rawText.trim();
  // Rimuove eventuali commenti // o /* */
  text = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  // Estrae la porzione tra la prima { e l'ultima }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Oggetto { ... } non trovato nella configurazione incollata.');
  }
  let objectBody = text.slice(firstBrace, lastBrace + 1);

  // Tenta prima JSON.parse diretto
  let parsed = null;
  try {
    parsed = JSON.parse(objectBody);
  } catch {
    // Converte chiavi JS non quotate e apici singoli in JSON valido
    const normalized = objectBody
      .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
      .replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"')
      .replace(/,\s*([}\]])/g, '$1');
    try {
      parsed = JSON.parse(normalized);
    } catch {
      throw new Error('Formato non valido. Controlla le parentesi graffe e i campi della firebaseConfig.');
    }
  }

  if (!parsed || typeof parsed !== 'object' || !parsed.apiKey || !parsed.projectId) {
    throw new Error('La configurazione deve contenere almeno "apiKey" e "projectId".');
  }

  return {
    apiKey: String(parsed.apiKey).trim(),
    authDomain: parsed.authDomain ? String(parsed.authDomain).trim() : `${String(parsed.projectId).trim()}.firebaseapp.com`,
    projectId: String(parsed.projectId).trim(),
    storageBucket: parsed.storageBucket ? String(parsed.storageBucket).trim() : '',
    messagingSenderId: parsed.messagingSenderId ? String(parsed.messagingSenderId).trim() : '',
    appId: parsed.appId ? String(parsed.appId).trim() : ''
  };
}

export function resolveInitialFirebaseConfig() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.apiKey && parsed.projectId) return parsed;
    }
  } catch {
    // Ignora errori localStorage
  }

  try {
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
      const parsed = typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
      if (parsed && parsed.apiKey && parsed.projectId) return parsed;
    }
  } catch {
    // Ignora
  }

  try {
    const envCfg = import.meta?.env?.VITE_FIREBASE_CONFIG;
    if (envCfg) {
      const parsed = JSON.parse(envCfg);
      if (parsed && parsed.apiKey && parsed.projectId) return parsed;
    }
  } catch {
    // Ignora
  }

  return null;
}

export function saveStoredFirebaseConfig(config) {
  try {
    if (!config) {
      localStorage.removeItem(STORAGE_KEYS.FIREBASE_CONFIG);
    } else {
      localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(config));
    }
  } catch {
    // Ignora
  }
}

export function loadLocalPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFS);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLocalPrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(prefs));
  } catch {
    // Ignora
  }
}

export function loadLocalRoomState(roomCode) {
  const cleanRoom = normalizeRoomCode(roomCode);
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.ROOM_PREFIX}${cleanRoom}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLocalRoomState(roomCode, state) {
  const cleanRoom = normalizeRoomCode(roomCode);
  try {
    localStorage.setItem(
      `${STORAGE_KEYS.ROOM_PREFIX}${cleanRoom}`,
      JSON.stringify({
        progress: state.progress || {},
        profile: state.profile || {},
        updatedAt: state.updatedAt || Date.now()
      })
    );
  } catch {
    // Ignora
  }
}

let cachedSignature = '';
let cachedClients = null;

export async function getFirebaseClients(config) {
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  const signature = JSON.stringify(config);
  if (cachedClients && cachedSignature === signature) {
    return cachedClients;
  }

  const existing = getApps().find((a) => a.name === FIREBASE_APP_NAME);
  if (existing) {
    try {
      await deleteApp(existing);
    } catch {
      // Ignora cleanup error
    }
  }

  const app = initializeApp(config, FIREBASE_APP_NAME);
  const db = getFirestore(app);
  const auth = getAuth(app);

  // Tenta auth anonima senza bloccare Firestore se l'utente usa regole test-mode senza Auth
  try {
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
      await signInWithCustomToken(auth, __initial_auth_token);
    } else if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (err) {
    // Se Anonymous Auth non e abilitato in console, Firestore in test mode puo comunque funzionare
    console.warn('Auth anonima opzionale non attiva:', err?.code || err?.message);
  }

  cachedSignature = signature;
  cachedClients = { app, db, auth };
  return cachedClients;
}

function getRoomDocRef(db, cleanRoom) {
  if (typeof __app_id !== 'undefined' && __app_id) {
    return doc(db, 'artifacts', __app_id, 'public', 'data', 'marvelist_rooms', cleanRoom);
  }
  return doc(db, 'marvelist_rooms', cleanRoom);
}

export function subscribeToRoom({ roomCode, firebaseConfig, seedState, onData, onStatus }) {
  const cleanRoom = normalizeRoomCode(roomCode);
  let unsubSnapshot = null;
  let cancelled = false;

  // Listener cross-tab per fallback localStorage
  const handleStorageEvent = (event) => {
    if (event.key === `${STORAGE_KEYS.ROOM_PREFIX}${cleanRoom}` && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        onData(parsed, { source: 'local' });
      } catch {
        // Ignora
      }
    }
  };
  window.addEventListener('storage', handleStorageEvent);

  if (!firebaseConfig) {
    onStatus('local', null);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', handleStorageEvent);
    };
  }

  onStatus('connecting', null);

  getFirebaseClients(firebaseConfig)
    .then((clients) => {
      if (cancelled || !clients) return;
      const roomRef = getRoomDocRef(clients.db, cleanRoom);

      unsubSnapshot = onSnapshot(
        roomRef,
        (docSnap) => {
          if (cancelled) return;
          if (docSnap.exists()) {
            const data = docSnap.data();
            saveLocalRoomState(cleanRoom, data);
            onData(data, { source: 'cloud' });
            onStatus('synced', null);
          } else {
            const localExisting = loadLocalRoomState(cleanRoom);
            const initialPayload = {
              progress: localExisting?.progress || seedState.progress,
              profile: {
                name: localExisting?.profile?.name || seedState.profile.name,
                partnerName: localExisting?.profile?.partnerName || seedState.profile.partnerName
              },
              updatedAt: Date.now()
            };
            saveLocalRoomState(cleanRoom, initialPayload);
            setDoc(roomRef, initialPayload, { merge: true }).catch((err) => {
              if (!cancelled) {
                onStatus('error', formatFirestoreError(err));
              }
            });
            onStatus('synced', null);
          }
        },
        (error) => {
          if (cancelled) return;
          console.error('Errore snapshot Firestore:', error);
          onStatus('error', formatFirestoreError(error));
        }
      );
    })
    .catch((err) => {
      if (cancelled) return;
      console.error('Errore init Firebase:', err);
      onStatus('error', formatFirestoreError(err));
    });

  return () => {
    cancelled = true;
    window.removeEventListener('storage', handleStorageEvent);
    if (unsubSnapshot) unsubSnapshot();
  };
}

export async function pushRoomState({ roomCode, firebaseConfig, state }) {
  const cleanRoom = normalizeRoomCode(roomCode);
  const payload = {
    progress: state.progress,
    profile: {
      name: state.profile.name,
      partnerName: state.profile.partnerName
    },
    updatedAt: Date.now()
  };

  saveLocalRoomState(cleanRoom, payload);

  if (!firebaseConfig) {
    return { ok: true, mode: 'local' };
  }

  try {
    const clients = await getFirebaseClients(firebaseConfig);
    if (!clients) return { ok: true, mode: 'local' };
    const roomRef = getRoomDocRef(clients.db, cleanRoom);
    await setDoc(roomRef, payload, { merge: true });
    return { ok: true, mode: 'cloud' };
  } catch (err) {
    console.error('Errore salvataggio Firestore:', err);
    return { ok: false, mode: 'error', error: formatFirestoreError(err) };
  }
}

function formatFirestoreError(err) {
  const code = err?.code || '';
  if (code.includes('permission-denied')) {
    return 'Permessi Firestore negati: imposta le regole di Firestore su marvelist_rooms (vedi Impostazioni Firebase). I dati restano salvati in locale.';
  }
  if (code.includes('unavailable') || code.includes('network')) {
    return 'Connessione cloud momentaneamente non raggiungibile. Modifiche salvate in localStorage.';
  }
  return err?.message || 'Errore di connessione Firebase. Modalità locale attiva.';
}
