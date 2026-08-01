import type { Dardo } from "../../lib/bersaglio";

/**
 * Esito di una tirata inserita dall'utente, qualunque sia il modo di input.
 *
 * Il tastierino conosce solo il totale; l'input a bersaglio sa anche quante
 * frecce sono state tirate, dove sono finite e se la visita e' sballata (per
 * esempio uno zero raggiunto senza doppio, che dal solo totale non si vede).
 * I giochi usano i campi opzionali quando ci sono e restano validi quando no.
 */
export interface Tirata {
  /** Totale segnato nella visita. */
  punteggio: number;
  /** Frecce effettivamente tirate (nota solo con l'input a bersaglio). */
  frecce?: number;
  /** Dettaglio delle singole frecce, quando disponibile. */
  dardi?: Dardo[];
  /** Visita sballata con certezza (rilevata freccia per freccia). */
  bust?: boolean;
}

/** Tirata inserita dal tastierino: si conosce solo il totale. */
export function tirataDaTotale(punteggio: number): Tirata {
  return { punteggio };
}
