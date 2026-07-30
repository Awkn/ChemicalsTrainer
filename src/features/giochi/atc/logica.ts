/**
 * Around the Clock Doubles: da D1 a D20, una freccia alla volta. Se centri il
 * doppio avanzi, se sbagli ritenti finche' non lo prendi. Si conta il totale
 * delle frecce usate per completare il giro (meno e' meglio).
 *
 * Funzioni pure: l'annulla si ottiene tenendo lo storico degli stati.
 */

export const NUMERO_DOPPI = 20;

export interface StatoAtc {
  /** Doppio corrente: 0 = D1 ... 19 = D20. A giro finito = 20. */
  indice: number;
  /** Frecce tirate finora (centrate + mancate). */
  frecce: number;
  finito: boolean;
}

export function creaAtc(): StatoAtc {
  return { indice: 0, frecce: 0, finito: false };
}

/** Etichetta del doppio corrente ("D1".."D20"), o null a giro finito. */
export function doppioCorrente(stato: StatoAtc): string | null {
  return stato.finito ? null : `D${stato.indice + 1}`;
}

export function tiraFreccia(stato: StatoAtc, colpito: boolean): StatoAtc {
  if (stato.finito) return stato;
  const frecce = stato.frecce + 1;
  if (!colpito) return { ...stato, frecce };
  const indice = stato.indice + 1;
  return { indice, frecce, finito: indice >= NUMERO_DOPPI };
}

export interface RisultatoAtc {
  frecce: number;
}

export function risultatoAtc(stato: StatoAtc): RisultatoAtc {
  return { frecce: stato.frecce };
}
