/**
 * Drill su un singolo doppio: si tira sempre allo stesso bersaglio e si segna
 * solo centro o errore. Qui non serve il tabellone: il bersaglio e' gia'
 * deciso, quindi due pulsanti sono piu' rapidi di venti tocchi su una fetta
 * piccola, e il dato che ne esce e' lo stesso (tentativi e centri su quel
 * doppio) che alimenta lo storico.
 */

/** Frecce di una sessione: 7 visite da 3, come un giro di allenamento. */
export const FRECCE_DRILL = 21;

/** Bersagli allenabili: i venti doppi piu' il bull (che vale come doppio). */
export const BERSAGLI: string[] = [
  ...Array.from({ length: 20 }, (_, i) => `D${i + 1}`),
  "Bull",
];

export function bersaglioValido(b: string): boolean {
  return BERSAGLI.includes(b);
}

export interface StatoDrill {
  bersaglio: string;
  /** Esito di ogni freccia, in ordine: serve per l'annulla e per la striscia. */
  esiti: boolean[];
  finito: boolean;
}

export function creaDrill(bersaglio: string): StatoDrill {
  return { bersaglio, esiti: [], finito: false };
}

function conEsiti(stato: StatoDrill, esiti: boolean[]): StatoDrill {
  return { ...stato, esiti, finito: esiti.length >= FRECCE_DRILL };
}

/** Registra una freccia. */
export function tira(stato: StatoDrill, colpito: boolean): StatoDrill {
  if (stato.finito) return stato;
  return conEsiti(stato, [...stato.esiti, colpito]);
}

/** Torna indietro di una freccia. */
export function annullaTiro(stato: StatoDrill): StatoDrill {
  if (stato.esiti.length === 0) return stato;
  return conEsiti(stato, stato.esiti.slice(0, -1));
}

export function frecceTirate(stato: StatoDrill): number {
  return stato.esiti.length;
}

export function colpiti(stato: StatoDrill): number {
  return stato.esiti.filter(Boolean).length;
}

export function rimaste(stato: StatoDrill): number {
  return Math.max(FRECCE_DRILL - stato.esiti.length, 0);
}

/** Percentuale di centri, a un decimale (0 se non si e' ancora tirato). */
export function percentualeDrill(stato: StatoDrill): number {
  const n = frecceTirate(stato);
  return n === 0 ? 0 : Math.round((colpiti(stato) / n) * 1000) / 10;
}

/** Centri di fila piu' lunghi della sessione. */
export function serieMigliore(stato: StatoDrill): number {
  let max = 0;
  let corrente = 0;
  for (const e of stato.esiti) {
    corrente = e ? corrente + 1 : 0;
    if (corrente > max) max = corrente;
  }
  return max;
}
