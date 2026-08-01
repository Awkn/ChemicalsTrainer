/**
 * 61-100 Checkouts: esce un numero casuale tra 61 e 100 e si prova a chiuderlo
 * con una sola visita (3 freccette). Si inserisce il punteggio realizzato: se
 * pareggia il bersaglio e' chiuso, altrimenti fallito. Poi esce un nuovo
 * numero. Sessione a oltranza; a fine sessione si salva la percentuale.
 *
 * Il bersaglio successivo viene passato dall'esterno cosi' che le transizioni
 * restino pure (e l'annulla, via storico degli stati, ripristini il bersaglio).
 */

export const MIN = 61;
export const MAX = 100;

export type EsitoTentativo = "riuscito" | "fallito";

export interface StatoCo61100 {
  /** Bersaglio corrente da chiudere (61..100). */
  bersaglio: number;
  /** Tentativi conclusi. */
  tentativi: number;
  /** Checkout riusciti. */
  riusciti: number;
  /** Esito dell'ultimo tentativo (per il feedback a schermo). */
  esitoUltimo: EsitoTentativo | null;
}

/** Numero casuale chiudibile tra MIN e MAX (impuro: usa Math.random). */
export function bersaglioCasuale(): number {
  return MIN + Math.floor(Math.random() * (MAX - MIN + 1));
}

export function creaCo61100(primoBersaglio: number): StatoCo61100 {
  return { bersaglio: primoBersaglio, tentativi: 0, riusciti: 0, esitoUltimo: null };
}

/**
 * Registra il punteggio della visita e passa al bersaglio successivo.
 * `bustForzato` segnala uno sballo che dal totale non si vedrebbe (lo zero
 * raggiunto senza doppio): lo riconosce solo l'input a bersaglio.
 */
export function inviaPunteggio(
  stato: StatoCo61100,
  punteggio: number,
  prossimoBersaglio: number,
  bustForzato = false,
): StatoCo61100 {
  const riuscito = !bustForzato && punteggio === stato.bersaglio;
  return {
    bersaglio: prossimoBersaglio,
    tentativi: stato.tentativi + 1,
    riusciti: stato.riusciti + (riuscito ? 1 : 0),
    esitoUltimo: riuscito ? "riuscito" : "fallito",
  };
}

export function percentualeSuccesso(stato: StatoCo61100): number {
  if (stato.tentativi === 0) return 0;
  return Math.round((stato.riusciti / stato.tentativi) * 100);
}

export interface RisultatoCo61100 {
  successo: number;
  tentativi: number;
  riusciti: number;
}

export function risultatoCo61100(stato: StatoCo61100): RisultatoCo61100 {
  return {
    successo: percentualeSuccesso(stato),
    tentativi: stato.tentativi,
    riusciti: stato.riusciti,
  };
}
