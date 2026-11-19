# MarveList — Enciclopedia Interattiva & Tracker del Multiverso Marvel

Web app completa costruita con **React + Vite + Tailwind CSS**, configurata con `base: './'` per funzionare immediatamente su **GitHub Pages** senza errori di routing o asset mancanti.

## Funzionalità principali
- **119 titoli Marvel** con schede complete (titolo italiano e originale, formato, Universo, Fase/Saga, data di uscita, timeline cronologica, durata/episodi, livello di essenzialità, sinossi, cast principale, connessioni multiversali e conteggio + guida senza spoiler alle scene post-credit):
  - **MCU (Fasi 1-6)** da *Iron Man (2008)* fino a *Thunderbolts\**, *I Fantastici Quattro: Gli Inizi*, *Daredevil: Born Again*, *Spider-Man: Brand New Day*, *Avengers: Doomsday* e *Avengers: Secret Wars*, inclusi Special Presentation e serie animate (*What If...?*, *Eyes of Wakanda*, *Marvel Zombies*).
  - **Defenders & Serie TV**: *Daredevil* (S1-3), *Jessica Jones*, *Luke Cage*, *Iron Fist*, *The Defenders*, *The Punisher*, *Agent Carter*, *Agents of S.H.I.E.L.D.*, *Inhumans*, *Runaways*, *Cloak & Dagger*, *Helstrom*.
  - **X-Men & Mutanti**: trilogia originale, trilogia Wolverine, nuova linea temporale, *Deadpool 1 & 2*, *Legion*, *The Gifted*, *X-Men '97*.
  - **Spider-Man Legacy, SSU & Spider-Verse**: trilogia Sam Raimi, *The Amazing Spider-Man 1 & 2*, *Venom 1-3*, *Morbius*, *Madame Web*, *Kraven*, trilogia animata *Spider-Verse*.
  - **Fantastici Quattro (Storici)** (2005, 2007, 2015) e **Marvel Legacy & Cult** (*Blade 1-3*, *Daredevil 2003*, *Elektra*, *Hulk 2003*, *The Punisher 2004/2008*, *Ghost Rider 1 & 2*, *Howard e il destino del mondo*).
- **Filtri, ordinamento e viste**: per Universo, Fase/Saga, Formato, Stato (*Visti, Da Vedere, In Corso, Manca al Partner*) e *Solo Essenziali*; ordinamento per *Ordine di Uscita*, *Cronologico*, *Voto (1-5)* o *A-Z*; toggle *Elenco Unico / Vista Raggruppata*.
- **Pagine `#/register` e `#/login` integrate**: opzionali (accesso libero come Ospite), con scheda *Prossimo titolo consigliato* e barre di avanzamento (% e ore guardate).
- **Sincronizzazione di coppia (2 dispositivi)**: selettore rapido `Lui / Lei` personalizzabile, Codice Stanza condiviso (es. `MARVEL-COPPIA`), fallback automatico su `localStorage` e pannello **Impostazioni Firebase** per incollare la propria `firebaseConfig` gratuita.

## Avvio locale e Build
```bash
npm install
npm run dev
npm run build
```

La cartella `dist/` generata da `npm run build` è pronta per essere pubblicata direttamente su GitHub Pages (o tramite la GitHub Action inclusa in `.github/workflows/deploy.yml`).
