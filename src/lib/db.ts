import Dexie, { type Table } from "dexie";
import type {
  Assegnazione,
  Esercizio,
  PartitaSalvata,
  Programma,
  Risultato,
  SessioneDoppi,
} from "../types";

/**
 * Database locale (IndexedDB) gestito con Dexie.
 * IndexedDB regge dati strutturati e query, a differenza di localStorage:
 * scelta pensata per far crescere l'app (statistiche, storici...) senza rifare la base.
 */
class DartsDB extends Dexie {
  esercizi!: Table<Esercizio, string>;
  programmi!: Table<Programma, string>;
  assegnazioni!: Table<Assegnazione, string>;
  risultati!: Table<Risultato, string>;
  doppi!: Table<SessioneDoppi, string>;
  partite!: Table<PartitaSalvata, string>;

  constructor() {
    super("darts-trainer");
    this.version(1).stores({
      // solo le colonne indicizzate; gli altri campi restano nell'oggetto
      esercizi: "id, categoria, nome, createdAt",
      programmi: "id, nome, createdAt",
      assegnazioni: "id, programmaId, esercizioId, [programmaId+giorno]",
    });
    // v2: aggiunge lo storico dei risultati per il tracking dei progressi.
    this.version(2).stores({
      risultati: "id, esercizioId, data, [esercizioId+data]",
    });
    // v3: tentativi al doppio, contati freccia per freccia dall'input a
    // bersaglio. Tabella a parte perche' non appartengono a un esercizio:
    // arrivano da piu' giochi e servono a misurare la resa su ogni bersaglio.
    this.version(3).stores({
      doppi: "id, data, gioco",
    });
    // v4: archivio delle partite concluse, per riaprirne il recap. Ne restano
    // solo le ultime (vedi lib/partite.ts): serve a rivedere com'e' andata, non
    // a tenere la storia di tutto.
    this.version(4).stores({
      partite: "id, finita, gioco",
    });
  }
}

export const db = new DartsDB();
