/**
 * Doubles Pressure Game: dieci doppi, tre frecce ciascuno. Chiuderlo alla
 * prima vale 3 punti, alla seconda 2, alla terza 1; non chiuderlo toglie un
 * punto. Il massimo e' 30, il minimo -10.
 *
 * I dieci doppi si estraggono all'inizio e restano nello stato: la sessione ha
 * una lunghezza certa e l'annulla, che ripesca uno stato precedente, ritrova la
 * stessa lista.
 *
 * Funzioni pure a parte l'estrazione, che usa Math.random.
 */

export const QUANTI = 10;

/** Punti per freccia usata: indice 0 = prima freccia. */
export const PUNTI = [3, 2, 1];
export const PENALITA = -1;

export interface StatoDp {
  /** I doppi della sessione (1..20), in ordine di gioco. */
  doppi: number[];
  /** Indice del doppio in corso. Alla fine vale doppi.length. */
  indice: number;
  punti: number;
  /** Chiusure riuscite, per il riepilogo. */
  chiusi: number;
  /** Punti dell'ultimo doppio giocato, per il feedback a schermo. */
  ultimo: number | null;
}

/** Dieci doppi diversi fra D1 e D20 (impuro: usa Math.random). */
export function estraiDoppi(quanti = QUANTI): number[] {
  const tutti = Array.from({ length: 20 }, (_, i) => i + 1);
  for (let i = tutti.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tutti[i], tutti[j]] = [tutti[j], tutti[i]];
  }
  return tutti.slice(0, quanti);
}

export function creaDp(doppi: number[]): StatoDp {
  return { doppi, indice: 0, punti: 0, chiusi: 0, ultimo: null };
}

export function finito(stato: StatoDp): boolean {
  return stato.indice >= stato.doppi.length;
}

/** Doppio da chiudere adesso ("D16"), o null se la sessione e' finita. */
export function doppioCorrente(stato: StatoDp): string | null {
  return finito(stato) ? null : `D${stato.doppi[stato.indice]}`;
}

/**
 * Registra l'esito del doppio corrente. `freccia` e' con quale freccia e'
 * stato chiuso (1, 2 o 3); `null` significa non chiuso.
 */
export function registraEsito(stato: StatoDp, freccia: number | null): StatoDp {
  if (finito(stato)) return stato;
  const valore = freccia == null ? PENALITA : PUNTI[freccia - 1];
  return {
    ...stato,
    indice: stato.indice + 1,
    punti: stato.punti + valore,
    chiusi: stato.chiusi + (freccia == null ? 0 : 1),
    ultimo: valore,
  };
}
