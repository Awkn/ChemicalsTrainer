import { CHIUSURE } from "../../../lib/checkout";

/**
 * Serie di checkout: una lista di punteggi da chiudere, una visita (3 frecce)
 * per ciascuno. Si inserisce il totale realizzato: se pareggia il bersaglio e'
 * chiuso, altrimenti si passa comunque al successivo. Finita la lista, la
 * sessione e' finita.
 *
 * La lista viene decisa una volta sola all'inizio e vive dentro lo stato: cosi'
 * l'esercizio ha una lunghezza certa (si sa sempre quanto manca) e l'annulla,
 * che ripesca uno stato precedente, ritrova gli stessi bersagli.
 *
 * Ci girano sopra due esercizi diversi — 30 checkout casuali fra 60 e 170, e i
 * nove numeri fissi di Game Shot — perche' cambia solo la lista.
 */

export type EsitoTentativo = "riuscito" | "fallito";

export interface StatoSerie {
  /** I bersagli della sessione, in ordine. */
  bersagli: number[];
  /** Indice del bersaglio in corso. Alla fine vale bersagli.length. */
  indice: number;
  riusciti: number;
  esitoUltimo: EsitoTentativo | null;
}

/** Punteggi chiudibili in tre frecce dentro un intervallo, dalla tabella. */
export function chiudibili(min: number, max: number): number[] {
  return Object.keys(CHIUSURE)
    .map(Number)
    .filter((n) => n >= min && n <= max)
    .sort((a, b) => a - b);
}

/**
 * `quanti` bersagli casuali fra quelli chiudibili nell'intervallo (impuro:
 * usa Math.random). Le ripetizioni sono ammesse: sono 111 numeri possibili e
 * pretendere che non si ripetano toglierebbe casualita' senza dare niente.
 */
export function bersagliCasuali(
  quanti: number,
  min: number,
  max: number,
): number[] {
  const possibili = chiudibili(min, max);
  return Array.from(
    { length: quanti },
    () => possibili[Math.floor(Math.random() * possibili.length)],
  );
}

export function creaSerie(bersagli: number[]): StatoSerie {
  return { bersagli, indice: 0, riusciti: 0, esitoUltimo: null };
}

/** Bersaglio da chiudere adesso, o null se la serie e' finita. */
export function bersaglioCorrente(stato: StatoSerie): number | null {
  return stato.indice < stato.bersagli.length ? stato.bersagli[stato.indice] : null;
}

export function finita(stato: StatoSerie): boolean {
  return stato.indice >= stato.bersagli.length;
}

/**
 * Registra la visita e passa al bersaglio successivo. `bustForzato` segnala
 * uno sballo che dal solo totale non si vedrebbe (lo zero raggiunto senza
 * doppio): lo riconosce solo l'input a bersaglio.
 */
export function inviaPunteggio(
  stato: StatoSerie,
  punteggio: number,
  bustForzato = false,
): StatoSerie {
  if (finita(stato)) return stato;
  const riuscito = !bustForzato && punteggio === stato.bersagli[stato.indice];
  return {
    ...stato,
    indice: stato.indice + 1,
    riusciti: stato.riusciti + (riuscito ? 1 : 0),
    esitoUltimo: riuscito ? "riuscito" : "fallito",
  };
}

export function percentuale(stato: StatoSerie): number {
  return stato.indice === 0
    ? 0
    : Math.round((stato.riusciti / stato.indice) * 100);
}
