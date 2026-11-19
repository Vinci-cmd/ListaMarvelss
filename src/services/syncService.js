import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

const STORAGE_KEYS = {
  FIREBASE_CONFIG: 'marvelist_firebase_config_v1',
  WATCHLIST: 'marvelist_shared_watchlist_v1'
};

const FIREBASE_APP_NAME = 'marvelist-shared-sync';

/**
 * Accetta sia JSON puro che snippet JS copiato direttamente dalla Console Firebase
 * (es. `const firebaseConfig = { apiKey: "...", projectId: "..." };`).
 */
export function parseFirebaseConfigInput(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Incolla una configurazione Firebase valida.');
  }

  let text = rawText.trim();
  text = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('Oggetto { ... } non trovato nella configurazione incollata.');
  }
  const objectBody = text.slice(firstBrace, lastBrace + 1);

  let parsed = null;
  try {
    parsed = JSON.parse(objectBody);
  } catch {
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
    authDomain: parsed.authDomain
      ? String(parsed.authDomain).trim()
      : `${String(parsed.projectId).trim()}.firebaseapp.com`,
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
      const parsed =
        typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
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

export function loadLocalWatchlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.progress || null;
  } catch {
    return null;
  }
}

export function saveLocalWatchlist(progress) {
  try {
    localStorage.setItem(
      STORAGE_KEYS.WATCHLIST,
      JSON.stringify({
        progress: progress || {},
        updatedAt: Date.now()
      })
    );
  } catch {
    // Ignora
  }
}

let cachedSignature = '';
let cachedClients = null;

async function getFirebaseClients(config) {
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

  try {
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
      await signInWithCustomToken(auth, __initial_auth_token);
    } else if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
  } catch (err) {
    console.warn('Auth anonima opzionale non attiva:', err?.code || err?.message);
  }

  cachedSignature = signature;
  cachedClients = { app, db, auth };
  return cachedClients;
}

function getSharedDocRef(db) {
  if (typeof __app_id !== 'undefined' && __app_id) {
    return doc(db, 'artifacts', __app_id, 'public', 'data', 'marvelist_shared', 'watchlist');
  }
  return doc(db, 'marvelist_shared', 'watchlist');
}

export function subscribeToWatchlist({ firebaseConfig, seedProgress, onData, onStatus }) {
  let unsubSnapshot = null;
  let cancelled = false;

  const handleStorageEvent = (event) => {
    if (event.key === STORAGE_KEYS.WATCHLIST && event.newValue) {
      try {
        const parsed = JSON.parse(event.newValue);
        if (parsed?.progress) {
          onData(parsed.progress);
        }
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
      const docRef = getSharedDocRef(clients.db);

      unsubSnapshot = onSnapshot(
        docRef,
        (docSnap) => {
          if (cancelled) return;
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data?.progress) {
              saveLocalWatchlist(data.progress);
              onData(data.progress);
            }
            onStatus('synced', null);
          } else {
            const localExisting = loadLocalWatchlist();
            const initialProgress = localExisting || seedProgress;
            saveLocalWatchlist(initialProgress);
            setDoc(
              docRef,
              {
                progress: initialProgress,
                updatedAt: Date.now()
              },
              { merge: true }
            ).catch((err) => {
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

export async function pushWatchlistState({ firebaseConfig, progress }) {
  saveLocalWatchlist(progress);

  if (!firebaseConfig) {
    return { ok: true, mode: 'local' };
  }

  try {
    const clients = await getFirebaseClients(firebaseConfig);
    if (!clients) return { ok: true, mode: 'local' };
    const docRef = getSharedDocRef(clients.db);
    await setDoc(
      docRef,
      {
        progress,
        updatedAt: Date.now()
      },
      { merge: true }
    );
    return { ok: true, mode: 'cloud' };
  } catch (err) {
    console.error('Errore salvataggio Firestore:', err);
    return { ok: false, mode: 'error', error: formatFirestoreError(err) };
  }
}

function formatFirestoreError(err) {
  const code = err?.code || '';
  if (code.includes('permission-denied')) {
    return 'Permessi Firestore negati: imposta le regole di Firestore su marvelist_shared (vedi Impostazioni Cloud). I dati restano salvati in locale.';
  }
  if (code.includes('unavailable') || code.includes('network')) {
    return 'Connessione cloud momentaneamente non raggiungibile. Modifiche salvate in localStorage.';
  }
  return err?.message || 'Errore di connessione Firebase. Modalità locale attiva.';
}
