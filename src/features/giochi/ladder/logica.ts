/**
 * Doubles Ladder: da D1 a D20, fino a 3 frecce per doppio. Se lo chiudi conta
 * come chiuso e avanzi; dopo 3 errori passi comunque al successivo. Si tiene
 * traccia di doppi chiusi, frecce usate e percentuale sui 20 doppi.
 *
 * Funzioni pure: l'annulla si ottiene tenendo lo storico degli stati.
 */

export const NUMERO_DOPPI = 20;
export const FRECCE_PER_DOPPIO = 3;

export interface StatoLadder {
  /** Doppio corrente: 0 = D1 ... 19 = D20. A giro finito = 20. */
  indice: number;
  /** Errori sul doppio corrente (0..2; al terzo si avanza). */
  mancatiSuTarget: number;
  /** Frecce tirate finora. */
  frecce: number;
  /** Doppi chiusi. */
  chiusi: number;
  finito: boolean;
}

export function creaLadder(): StatoLadder {
  return { indice: 0, mancatiSuTarget: 0, frecce: 0, chiusi: 0, finito: false };
}

export function doppioCorrente(stato: StatoLadder): string | null {
  return stato.finito ? null : `D${stato.indice + 1}`;
}

function avanza(indice: number): Pick<StatoLadder, "indice" | "mancatiSuTarget" | "finito"> {
  const nuovo = indice + 1;
  return { indice: nuovo, mancatiSuTarget: 0, finito: nuovo >= NUMERO_DOPPI };
}

export function tiraFreccia(stato: StatoLadder, colpito: boolean): StatoLadder {
  if (stato.finito) return stato;
  const frecce = stato.frecce + 1;

  if (colpito) {
    return { ...stato, ...avanza(stato.indice), frecce, chiusi: stato.chiusi + 1 };
  }

  const mancati = stato.mancatiSuTarget + 1;
  if (mancati >= FRECCE_PER_DOPPIO) {
    return { ...stato, ...avanza(stato.indice), frecce };
  }
  return { ...stato, mancatiSuTarget: mancati, frecce };
}

export function percentualeChiusi(stato: StatoLadder): number {
  return Math.round((stato.chiusi / NUMERO_DOPPI) * 100);
}

export interface RisultatoLadder {
  chiusi: number;
  frecce: number;
  perc: number;
}

export function risultatoLadder(stato: StatoLadder): RisultatoLadder {
  return {
    chiusi: stato.chiusi,
    frecce: stato.frecce,
    perc: percentualeChiusi(stato),
  };
}
