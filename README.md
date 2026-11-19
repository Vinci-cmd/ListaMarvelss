# MarveList — Enciclopedia Interattiva & Tracker del Multiverso Marvel

Web app costruita con **React + Vite + Tailwind CSS**, configurata con `base: './'` per funzionare su **GitHub Pages** senza errori di routing o asset mancanti. Accesso diretto immediato, **senza account, login o password**.

## Funzionalità principali
- **119 titoli Marvel** con schede complete (titolo italiano e originale, formato, Universo, Fase/Saga, data di uscita, timeline cronologica, durata/episodi, livello di essenzialità, sinossi, cast principale, connessioni multiversali e guida senza spoiler alle scene post-credit):
  - **MCU (Fasi 1-6)** da *Iron Man (2008)* fino a *Thunderbolts\**, *I Fantastici Quattro: Gli Inizi*, *Daredevil: Born Again*, *Spider-Man: Brand New Day*, *Avengers: Doomsday* e *Avengers: Secret Wars*, inclusi Special Presentation e serie animate.
  - **Defenders & Serie TV**: *Daredevil* (S1-3), *Jessica Jones*, *Luke Cage*, *Iron Fist*, *The Defenders*, *The Punisher*, *Agent Carter*, *Agents of S.H.I.E.L.D.*, *Inhumans*, *Runaways*, *Cloak & Dagger*, *Helstrom*.
  - **X-Men & Mutanti**, **Spider-Man Legacy / SSU / Spider-Verse**, **Fantastici Quattro (Storici)** e **Marvel Legacy & Cult**.
- **Filtri, ordinamento e viste**: per Universo, Fase/Saga, Formato, Stato (*Visti, Da Vedere, In Corso*) e *Solo Essenziali*; ordinamento per *Ordine di Uscita*, *Cronologico*, *Voto (1-5)* o *A-Z*; toggle *Elenco Unico / Vista Raggruppata*.
- **Watchlist condivisa senza account**: un'unica lista condivisa in tempo reale tramite **Firebase Firestore** (con fallback automatico su `localStorage` e pannello **Sync Cloud** per collegare la propria `firebaseConfig` gratuita).

## Avvio locale e Build
```bash
npm install
npm run dev
npm run build
```

La cartella `dist/` generata da `npm run build` viene pubblicata automaticamente su GitHub Pages tramite [.github/workflows/deploy.yml](.github/workflows/deploy.yml).
