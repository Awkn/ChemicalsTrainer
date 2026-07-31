/**
 * "121 a scaletta": sfida a numero chiuso, pensata per la sezione Esercizi e
 * per popolare i confronti di squadra con un risultato comparabile.
 *
 * Si parte da 121. A ogni tentativo (una visita da 3 frecce):
 *  - checkout riuscito  → il bersaglio SALE di un numero (piu' difficile);
 *  - checkout mancato   → il bersaglio SCENDE di un numero (piu' facile).
 * I bersagli non chiudibili (bogey) vengono saltati. Dopo 10 tentativi la
 * sfida finisce e il punteggio e' il numero piu' alto raggiunto.
 */

export const PARTENZA_121 = 121;
export const TENTATIVI_121 = 10;

/** Checkout impossibili con l'uscita a doppio. */
const NON_CHIUDIBILI = new Set([159, 162, 163, 165, 166, 168, 169]);

function chiudibile(n: number): boolean {
  return n >= 2 && n <= 170 && !NON_CHIUDIBILI.has(n);
}

/** Primo bersaglio chiudibile sopra n (resta n se si e' gia' al massimo). */
function sopra(n: number): number {
  let x = n + 1;
  while (x <= 170 && !chiudibile(x)) x += 1;
  return x <= 170 ? x : n;
}

/** Primo bersaglio chiudibile sotto n (resta n se si e' gia' al minimo). */
function sotto(n: number): number {
  let x = n - 1;
  while (x >= 2 && !chiudibile(x)) x -= 1;
  return x >= 2 ? x : n;
}

export interface StatoSfida121 {
  /** Bersaglio corrente da chiudere. */
  bersaglio: number;
  /** Tentativi gia' giocati (0..10). */
  tentativo: number;
  /** Numero piu' alto raggiunto: e' il punteggio della sfida. */
  record: number;
  /** Checkout riusciti in totale (informativo). */
  chiusi: number;
  esitoUltimo: "riuscito" | "fallito" | null;
  finito: boolean;
}

export function creaSfida121(): StatoSfida121 {
  return {
    bersaglio: PARTENZA_121,
    tentativo: 0,
    record: PARTENZA_121,
    chiusi: 0,
    esitoUltimo: null,
    finito: false,
  };
}

/** Registra l'esito di un tentativo e sposta il bersaglio. */
export function tenta(stato: StatoSfida121, riuscito: boolean): StatoSfida121 {
  if (stato.finito) return stato;
  const bersaglio = riuscito ? sopra(stato.bersaglio) : sotto(stato.bersaglio);
  const tentativo = stato.tentativo + 1;
  return {
    bersaglio,
    tentativo,
    record: Math.max(stato.record, bersaglio),
    chiusi: stato.chiusi + (riuscito ? 1 : 0),
    esitoUltimo: riuscito ? "riuscito" : "fallito",
    finito: tentativo >= TENTATIVI_121,
  };
}
