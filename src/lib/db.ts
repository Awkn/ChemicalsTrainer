import Dexie, { type Table } from "dexie";
import type { Assegnazione, Esercizio, Programma, Risultato } from "../types";

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
  }
}

export const db = new DartsDB();
