import { db } from "./db";
import { inOrdine } from "./cronologia";
import { nuovoId } from "./id";
import type {
  Assegnazione,
  Esercizio,
  Giorno,
  Programma,
  Risultato,
} from "../types";

/**
 * Repository: unico punto di accesso ai dati. I componenti non toccano Dexie
 * direttamente, chiamano queste funzioni. Cosi' la logica di persistenza sta
 * in un posto solo ed e' facile da cambiare/testare.
 */

// ---------- Esercizi ----------

export function nuovoEsercizio(
  dati: Omit<Esercizio, "id" | "createdAt">,
): Promise<string> {
  const esercizio: Esercizio = {
    ...dati,
    id: nuovoId(),
    createdAt: Date.now(),
  };
  return db.esercizi.add(esercizio);
}

export function aggiornaEsercizio(
  id: string,
  modifiche: Partial<Omit<Esercizio, "id" | "createdAt">>,
): Promise<number> {
  return db.esercizi.update(id, modifiche);
}

/**
 * Cambia la soglia di una metrica. `null` la toglie: la metrica resta
 * tracciata nei grafici ma esce dal cruscotto, dove senza traguardo non
 * ci sarebbe niente da giudicare.
 *
 * Riscrive l'intero array delle metriche perche' Dexie non sa aggiornare un
 * elemento dentro un campo annidato; il resto della definizione resta com'e'.
 */
export async function impostaObiettivo(
  esercizioId: string,
  metricaId: string,
  obiettivo: number | null,
): Promise<void> {
  const esercizio = await db.esercizi.get(esercizioId);
  if (!esercizio?.metriche) return;

  const metriche = esercizio.metriche.map((m) => {
    if (m.id !== metricaId) return m;
    if (obiettivo == null) {
      // Va tolta la chiave, non messa a undefined: finirebbe nel backup e
      // nei confronti come un valore presente ma vuoto.
      const { obiettivo: _, ...senzaSoglia } = m;
      return senzaSoglia;
    }
    return { ...m, obiettivo };
  });

  await db.esercizi.update(esercizioId, { metriche });
}

/** Elimina un esercizio, le assegnazioni che lo usano e i suoi risultati. */
export async function eliminaEsercizio(id: string): Promise<void> {
  await db.transaction(
    "rw",
    db.esercizi,
    db.assegnazioni,
    db.risultati,
    async () => {
      await db.assegnazioni.where("esercizioId").equals(id).delete();
      await db.risultati.where("esercizioId").equals(id).delete();
      await db.esercizi.delete(id);
    },
  );
}

// ---------- Programmi ----------

export function nuovoProgramma(
  dati: Omit<Programma, "id" | "createdAt">,
): Promise<string> {
  const programma: Programma = {
    ...dati,
    id: nuovoId(),
    createdAt: Date.now(),
  };
  return db.programmi.add(programma);
}

export function aggiornaProgramma(
  id: string,
  modifiche: Partial<Omit<Programma, "id" | "createdAt">>,
): Promise<number> {
  return db.programmi.update(id, modifiche);
}

/** Elimina un programma e tutte le sue assegnazioni. */
export async function eliminaProgramma(id: string): Promise<void> {
  await db.transaction("rw", db.programmi, db.assegnazioni, async () => {
    await db.assegnazioni.where("programmaId").equals(id).delete();
    await db.programmi.delete(id);
  });
}

// ---------- Assegnazioni ----------

/** Assegna un esercizio a un giorno, accodandolo in fondo alla giornata. */
export async function assegnaEsercizio(
  programmaId: string,
  giorno: Giorno,
  esercizioId: string,
): Promise<string> {
  const esistenti = await db.assegnazioni
    .where("[programmaId+giorno]")
    .equals([programmaId, giorno])
    .toArray();
  const ordine =
    esistenti.reduce((max, a) => Math.max(max, a.ordine), -1) + 1;

  const assegnazione: Assegnazione = {
    id: nuovoId(),
    programmaId,
    giorno,
    esercizioId,
    ordine,
  };
  return db.assegnazioni.add(assegnazione);
}

export function aggiornaAssegnazione(
  id: string,
  modifiche: Partial<Pick<Assegnazione, "note" | "ordine" | "giorno">>,
): Promise<number> {
  return db.assegnazioni.update(id, modifiche);
}

export function rimuoviAssegnazione(id: string): Promise<void> {
  return db.assegnazioni.delete(id);
}

// ---------- Risultati ----------

export function registraRisultato(
  dati: Omit<Risultato, "id" | "createdAt">,
): Promise<string> {
  const risultato: Risultato = {
    ...dati,
    id: nuovoId(),
    createdAt: Date.now(),
  };
  return db.risultati.add(risultato);
}

export function eliminaRisultato(id: string): Promise<void> {
  return db.risultati.delete(id);
}

/** Segna come fatto un esercizio senza metriche (registra solo la data). */
export function segnaFatto(esercizioId: string, data: string): Promise<string> {
  return registraRisultato({ esercizioId, data, valori: {} });
}

/** Annulla il "fatto" di una data, senza toccare i risultati con misure. */
export async function annullaFatto(
  esercizioId: string,
  data: string,
): Promise<void> {
  const dellaData = await db.risultati
    .where("[esercizioId+data]")
    .equals([esercizioId, data])
    .toArray();
  const daRimuovere = dellaData
    .filter((r) => Object.keys(r.valori).length === 0)
    .map((r) => r.id);
  await db.risultati.bulkDelete(daRimuovere);
}

/** Risultati di un esercizio, dal piu' vecchio al piu' recente (per i grafici). */
export async function risultatiPerEsercizio(
  esercizioId: string,
): Promise<Risultato[]> {
  const r = await db.risultati
    .where("esercizioId")
    .equals(esercizioId)
    .toArray();
  r.sort(inOrdine);
  return r;
}
