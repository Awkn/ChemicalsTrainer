/**
 * Motore di Bob's 27 (allenamento sui doppi).
 *
 * Regole adottate:
 * - Si parte da 27 punti.
 * - Si affrontano in ordine D1, D2, ... D20 e infine il Bull (doppio 25).
 * - Per ogni bersaglio si tirano 3 frecce. Ogni freccia a segno vale il doppio
 *   del numero (D1 = 2, D20 = 40, Bull = 50).
 * - Se in un bersaglio non si centra nessuna delle 3 frecce, si SOTTRAE il
 *   valore del doppio.
 * - Non c'e' "bust": si gioca sempre fino al Bull e il punteggio puo' anche
 *   scendere sotto zero.
 *
 * Le funzioni sono pure (stato -> nuovo stato): l'annulla si ottiene tenendo
 * lo storico degli stati nel componente.
 */

export interface Bersaglio {
  /** Numero del doppio (1..20, oppure 25 per il Bull). */
  valore: number;
  /** Etichetta mostrata: "D1".."D20" oppure "Bull". */
  etichetta: string;
}

export const BERSAGLI: Bersaglio[] = [
  ...Array.from({ length: 20 }, (_, i) => ({
    valore: i + 1,
    etichetta: `D${i + 1}`,
  })),
  { valore: 25, etichetta: "Bull" },
];

export const PUNTEGGIO_INIZIALE = 27;
export const FRECCE_PER_BERSAGLIO = 3;

export interface StatoBob27 {
  /** Indice del bersaglio corrente in BERSAGLI (0..20). A fine partita = 21. */
  indice: number;
  /** Punteggio corrente (parte da 27, puo' diventare negativo). */
  punteggio: number;
  /** Esiti delle frecce gia' tirate sul bersaglio corrente (max 3). */
  frecceTurno: boolean[];
  /** Totale frecce tirate nella partita (per la percentuale). */
  frecceTirate: number;
  /** Totale doppi centrati nella partita. */
  doppiCentrati: number;
  /** True quando tutti i bersagli sono stati affrontati. */
  finito: boolean;
}

/** Punti che vale una freccia a segno sul bersaglio dato. */
export function puntiDoppio(b: Bersaglio): number {
  return b.valore * 2;
}

export function creaBob27(): StatoBob27 {
  return {
    indice: 0,
    punteggio: PUNTEGGIO_INIZIALE,
    frecceTurno: [],
    frecceTirate: 0,
    doppiCentrati: 0,
    finito: false,
  };
}

/** Bersaglio corrente, oppure null a partita finita. */
export function bersaglioCorrente(stato: StatoBob27): Bersaglio | null {
  return stato.finito ? null : BERSAGLI[stato.indice];
}

/**
 * Registra l'esito di una freccia (a segno o mancata). Quando il turno arriva
 * a 3 frecce, applica l'eventuale penalita' e passa al bersaglio successivo.
 */
export function tiraFreccia(stato: StatoBob27, colpito: boolean): StatoBob27 {
  if (stato.finito) return stato;

  const bersaglio = BERSAGLI[stato.indice];
  const valore = puntiDoppio(bersaglio);

  const frecceTurno = [...stato.frecceTurno, colpito];
  let punteggio = stato.punteggio + (colpito ? valore : 0);
  const frecceTirate = stato.frecceTirate + 1;
  const doppiCentrati = stato.doppiCentrati + (colpito ? 1 : 0);

  // Turno non ancora concluso: aspetta le altre frecce.
  if (frecceTurno.length < FRECCE_PER_BERSAGLIO) {
    return { ...stato, frecceTurno, punteggio, frecceTirate, doppiCentrati };
  }

  // Fine turno: se nessuna freccia a segno, sottrai il valore del doppio.
  const centri = frecceTurno.filter(Boolean).length;
  if (centri === 0) punteggio -= valore;

  const indice = stato.indice + 1;
  const finito = indice >= BERSAGLI.length;

  return {
    ...stato,
    indice,
    punteggio,
    frecceTurno: [],
    frecceTirate,
    doppiCentrati,
    finito,
  };
}

/** Percentuale di doppi centrati sul totale delle frecce tirate (0..100). */
export function percentualeDoppi(stato: StatoBob27): number {
  if (stato.frecceTirate === 0) return 0;
  return Math.round((stato.doppiCentrati / stato.frecceTirate) * 100);
}

export interface RisultatoBob27 {
  punteggio: number;
  percentuale: number;
  doppiCentrati: number;
  frecceTirate: number;
}

export function risultatoBob27(stato: StatoBob27): RisultatoBob27 {
  return {
    punteggio: stato.punteggio,
    percentuale: percentualeDoppi(stato),
    doppiCentrati: stato.doppiCentrati,
    frecceTirate: stato.frecceTirate,
  };
}
