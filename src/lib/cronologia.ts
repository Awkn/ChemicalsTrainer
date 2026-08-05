/**
 * Ordine cronologico dei dati registrati.
 *
 * La `data` di un risultato e' solo il giorno ("YYYY-MM-DD"): due sessioni
 * della stessa sera pareggiano, e finiscono nell'ordine in cui le restituisce
 * IndexedDB, cioe' per id — un UUID casuale. Nei grafici questo poteva far
 * leggere un miglioramento come un peggioramento. Il `createdAt` rimette in
 * fila quello che il giorno da solo non distingue.
 */

/** Qualsiasi cosa registrata in un giorno e in un istante preciso. */
export interface Datato {
  /** Giorno, "YYYY-MM-DD". */
  data: string;
  /** Istante della registrazione (ms). */
  createdAt: number;
}

/** Comparatore dal piu' vecchio al piu' recente. */
export function inOrdine(a: Datato, b: Datato): number {
  return a.data.localeCompare(b.data) || (a.createdAt ?? 0) - (b.createdAt ?? 0);
}

/** Comparatore dal piu' recente al piu' vecchio. */
export function inOrdineInverso(a: Datato, b: Datato): number {
  return inOrdine(b, a);
}
