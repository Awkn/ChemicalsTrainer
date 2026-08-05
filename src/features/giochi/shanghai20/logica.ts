/**
 * Shanghai 20: in una visita bisogna prendere singolo, triplo e doppio del 20,
 * in qualunque ordine. Si ripete 20 volte; conta quante visite sono "shanghai"
 * complete.
 *
 * Non serve sapere dove sia finita ogni freccia: bastano i tre interruttori di
 * cosa hai preso, che si toccano mentre le frecce sono ancora nel bersaglio.
 * Singoli, tripli e doppi presi si contano comunque, perche' 12 visite con due
 * pezzi su tre raccontano una storia diversa da 12 visite a vuoto.
 *
 * Funzioni pure: l'annulla si ottiene tenendo lo storico degli stati.
 */

export const VISITE = 20;

export interface Presi {
  singolo: boolean;
  triplo: boolean;
  doppio: boolean;
}

export const NIENTE: Presi = { singolo: false, triplo: false, doppio: false };

export interface StatoShanghai {
  /** Visite gia' giocate. A fine esercizio vale VISITE. */
  visita: number;
  /** Visite in cui sono stati presi tutti e tre. */
  completati: number;
  singoli: number;
  tripli: number;
  doppi: number;
  ultimo: Presi | null;
}

export function creaShanghai(): StatoShanghai {
  return {
    visita: 0,
    completati: 0,
    singoli: 0,
    tripli: 0,
    doppi: 0,
    ultimo: null,
  };
}

export function finito(stato: StatoShanghai): boolean {
  return stato.visita >= VISITE;
}

export function eShanghai(p: Presi): boolean {
  return p.singolo && p.triplo && p.doppio;
}

export function registraVisita(stato: StatoShanghai, p: Presi): StatoShanghai {
  if (finito(stato)) return stato;
  return {
    visita: stato.visita + 1,
    completati: stato.completati + (eShanghai(p) ? 1 : 0),
    singoli: stato.singoli + (p.singolo ? 1 : 0),
    tripli: stato.tripli + (p.triplo ? 1 : 0),
    doppi: stato.doppi + (p.doppio ? 1 : 0),
    ultimo: p,
  };
}

/** Punti che le frecce prese valgono davvero, per curiosita' di fine partita. */
export function punti(stato: StatoShanghai): number {
  return stato.singoli * 20 + stato.tripli * 60 + stato.doppi * 40;
}
