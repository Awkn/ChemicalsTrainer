/**
 * Motore di "121 Checkout" (allenamento alle chiusure).
 *
 * Si prova a chiudere sempre 121 con al massimo 9 dardi (3 round). A ogni round
 * si inserisce il punteggio realizzato con le 3 freccette e il rimanente scende.
 * - Rimanente a 0: chiusura riuscita (si assume l'ultima freccia su un doppio).
 * - Rimanente sotto 0 oppure uguale a 1: sballato -> tentativo fallito.
 * - Rimanente ancora sopra 1 dopo 9 dardi: tentativo fallito.
 * La sessione e' a oltranza: dopo ogni tentativo se ne inizia un altro; a fine
 * sessione si salva la percentuale di chiusure riuscite.
 *
 * Funzioni pure (stato -> nuovo stato): l'annulla si ottiene tenendo lo storico
 * degli stati nel componente.
 */

export const PARTENZA = 121;
export const VISITE_MAX = 3; // 3 round da 3 dardi = 9 dardi

export type EsitoTentativo = "chiuso" | "fallito";

export interface Stato121 {
  /** Punti che restano da chiudere nel tentativo corrente. */
  rimanente: number;
  /** Punteggi delle visite gia' inserite nel tentativo corrente. */
  visiteCorrente: number[];
  /** Tentativi conclusi (chiusi + falliti). */
  tentativi: number;
  /** Tentativi chiusi con successo. */
  chiusi: number;
  /** Striscia di chiusure consecutive in corso. */
  serie: number;
  /** Miglior striscia della sessione. */
  miglioreSerie: number;
  /** Esito dell'ultimo tentativo appena concluso (per il feedback a schermo). */
  esitoUltimo: EsitoTentativo | null;
}

export function crea121(): Stato121 {
  return {
    rimanente: PARTENZA,
    visiteCorrente: [],
    tentativi: 0,
    chiusi: 0,
    serie: 0,
    miglioreSerie: 0,
    esitoUltimo: null,
  };
}

/** Dardi ancora disponibili nel tentativo corrente. */
export function dardiRimasti(stato: Stato121): number {
  return (VISITE_MAX - stato.visiteCorrente.length) * 3;
}

/** Conclude il tentativo corrente e prepara quello successivo. */
function concludi(stato: Stato121, esito: EsitoTentativo): Stato121 {
  const chiuso = esito === "chiuso";
  const serie = chiuso ? stato.serie + 1 : 0;
  return {
    rimanente: PARTENZA,
    visiteCorrente: [],
    tentativi: stato.tentativi + 1,
    chiusi: stato.chiusi + (chiuso ? 1 : 0),
    serie,
    miglioreSerie: Math.max(stato.miglioreSerie, serie),
    esitoUltimo: esito,
  };
}

/**
 * Registra il punteggio di una visita (3 freccette) nel tentativo corrente.
 * `bustForzato` segnala uno sballo che dal totale non si vedrebbe (lo zero
 * raggiunto senza doppio): lo riconosce solo l'input a bersaglio.
 */
export function inviaPunteggio(
  stato: Stato121,
  punteggio: number,
  bustForzato = false,
): Stato121 {
  if (bustForzato) return concludi(stato, "fallito");

  const nuovo = stato.rimanente - punteggio;

  if (nuovo === 0) return concludi(stato, "chiuso");
  // Sballato: sotto zero o a 1 (da 1 non si chiude su un doppio).
  if (nuovo < 0 || nuovo === 1) return concludi(stato, "fallito");

  const visiteCorrente = [...stato.visiteCorrente, punteggio];
  // Esaurite le 9 freccette senza chiudere.
  if (visiteCorrente.length >= VISITE_MAX) return concludi(stato, "fallito");

  return { ...stato, rimanente: nuovo, visiteCorrente, esitoUltimo: null };
}

/** Percentuale di chiusure riuscite sui tentativi conclusi (0..100). */
export function percentualeSuccesso(stato: Stato121): number {
  if (stato.tentativi === 0) return 0;
  return Math.round((stato.chiusi / stato.tentativi) * 100);
}

export interface Risultato121 {
  successo: number;
  tentativi: number;
  chiusi: number;
}

export function risultato121(stato: Stato121): Risultato121 {
  return {
    successo: percentualeSuccesso(stato),
    tentativi: stato.tentativi,
    chiusi: stato.chiusi,
  };
}
