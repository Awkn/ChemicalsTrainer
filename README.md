# 🎯 Darts Trainer

Tool per pianificare gli allenamenti settimanali di freccette. Imposti cosa
allenare in ogni giorno della settimana, la pagina **Oggi** ti dice cosa fare,
e puoi esportare/importare i programmi per condividerli con i compagni di
squadra.

È una **PWA**: si apre nel browser, ma si può "installare" come app su PC e
telefono e funziona anche offline. I dati sono salvati localmente sul
dispositivo.

## Funzioni

- **Oggi** — mostra gli esercizi programmati per il giorno corrente.
- **Programma** — editor settimanale (Lun→Dom): assegna esercizi ai giorni con
  note/obiettivi. Puoi avere più programmi.
- **Esercizi** — libreria riutilizzabile di esercizi, per categoria (Scoring,
  Doppi, Checkout, …).
- **Dati** — esporta tutto in un file `.json` e importalo su un altro
  dispositivo o passalo a un compagno.

## Come si sviluppa

Serve [Node.js](https://nodejs.org) 20+.

```bash
npm install          # installa le dipendenze
npm run gen-icons    # genera le icone PWA (una volta sola)
npm run dev          # avvia in sviluppo (http://localhost:5173)
```

## Come si crea la versione da distribuire

```bash
npm run build        # crea la cartella dist/ pronta da pubblicare
npm run preview      # provala in locale
```

Il contenuto di `dist/` è un sito statico: puoi caricarlo su un qualsiasi
hosting gratuito (es. GitHub Pages, Netlify, Vercel) e mandare il link ai
compagni. Aprendolo, ognuno potrà installarlo come app e importare i tuoi
programmi dal file esportato.

## Struttura del progetto

```
src/
  types/        modello dati condiviso (Esercizio, Programma, Assegnazione…)
  lib/          persistenza (Dexie/IndexedDB), repository, import/export, seed
  components/   layout e navigazione
  features/
    oggi/       cosa allenare oggi
    programma/  editor settimanale
    esercizi/   libreria esercizi
    impostazioni/ import ed export dati
```

## Stack

React + TypeScript + Vite · Dexie (IndexedDB) · vite-plugin-pwa
