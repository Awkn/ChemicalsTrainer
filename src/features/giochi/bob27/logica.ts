/**
 * Motore di Bob's 27 (allenamento sui doppi).
 *
 * Regole adottate:
 * - Si parte da 27 punti.
 * - Si affrontano in ordine D1, D2, ... D20 e infine il Bull (doppio 25).
 * - Si hanno fino a 3 freccette per centrare ogni doppio. Appena lo si centra
 *   si SOMMA il suo valore (D1 = 2, D20 = 40, Bull = 50) e si passa subito al
 *   doppio successivo: ogni doppio vale al massimo una volta.
 * - Se si mancano tutte e 3 le freccette su un doppio, si SOTTRAE il suo valore
 *   e si passa comunque al successivo.
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
  /** Frecce gia' mancate sul bersaglio corrente (0..2; al 3° manca si avanza). */
  mancatiSuTarget: number;
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
    mancatiSuTarget: 0,
    frecceTirate: 0,
    doppiCentrati: 0,
    finito: false,
  };
}

/** Bersaglio corrente, oppure null a partita finita. */
export function bersaglioCorrente(stato: StatoBob27): Bersaglio | null {
  return stato.finito ? null : BERSAGLI[stato.indice];
}

/** Passa al bersaglio successivo azzerando i tentativi. */
function avanza(stato: StatoBob27): Pick<StatoBob27, "indice" | "mancatiSuTarget" | "finito"> {
  const indice = stato.indice + 1;
  return { indice, mancatiSuTarget: 0, finito: indice >= BERSAGLI.length };
}

/**
 * Registra l'esito di una freccia. Se centra il doppio, ne somma il valore e
 * avanza subito; se e' il terzo errore sul doppio, ne sottrae il valore e
 * avanza. Altrimenti resta sul doppio per la freccia successiva.
 */
export function tiraFreccia(stato: StatoBob27, colpito: boolean): StatoBob27 {
  if (stato.finito) return stato;

  const valore = puntiDoppio(BERSAGLI[stato.indice]);
  const frecceTirate = stato.frecceTirate + 1;

  if (colpito) {
    return {
      ...stato,
      ...avanza(stato),
      punteggio: stato.punteggio + valore,
      doppiCentrati: stato.doppiCentrati + 1,
      frecceTirate,
    };
  }

  const mancati = stato.mancatiSuTarget + 1;
  // Terzo errore: penalita' e avanti.
  if (mancati >= FRECCE_PER_BERSAGLIO) {
    return {
      ...stato,
      ...avanza(stato),
      punteggio: stato.punteggio - valore,
      frecceTirate,
    };
  }

  // Ancora frecce disponibili su questo doppio.
  return { ...stato, mancatiSuTarget: mancati, frecceTirate };
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
