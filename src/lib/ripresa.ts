/**
 * Partita lasciata a meta', per poterla riprendere.
 *
 * Le partite vivono solo nella memoria del componente: basta che iOS scarichi
 * la PWA mentre si guarda un messaggio e mezz'ora di gioco sparisce, senza
 * nemmeno un avviso. Qui se ne tiene una copia, riscritta a ogni visita, e
 * riaprendo il gioco si offre di ripartire da li'.
 *
 * localStorage e non IndexedDB di proposito: la scrittura e' sincrona, e
 * quando il sistema decide di chiudere la pagina non c'e' tempo per una
 * scrittura asincrona.
 */

export interface Ripresa<T> {
  /** Ultima mossa: serve a non riproporre la partita di ieri sera. */
  aggiornata: number;
  /** Riga mostrata nell'invito, es. "Tu 4 — 2 Bot · leg 7". */
  descrizione: string;
  dati: T;
}

const PREFISSO = "darts-trainer:ripresa:";

/** Oltre questo non e' piu' una partita "in corso": e' roba di ieri. */
const SCADENZA_MS = 12 * 60 * 60 * 1000;

export function salvaRipresa<T>(
  gioco: string,
  descrizione: string,
  dati: T,
): void {
  const r: Ripresa<T> = { aggiornata: Date.now(), descrizione, dati };
  try {
    localStorage.setItem(PREFISSO + gioco, JSON.stringify(r));
  } catch {
    // Spazio finito o navigazione privata. La ripresa e' una rete di
    // sicurezza, non un requisito: non deve mai far saltare la partita.
  }
}

export function leggiRipresa<T>(gioco: string): Ripresa<T> | null {
  try {
    const grezzo = localStorage.getItem(PREFISSO + gioco);
    if (!grezzo) return null;
    const r = JSON.parse(grezzo) as Ripresa<T>;
    if (r?.dati == null || Date.now() - r.aggiornata > SCADENZA_MS) {
      scartaRipresa(gioco);
      return null;
    }
    return r;
  } catch {
    // Copia illeggibile (formato vecchio, salvataggio troncato): si butta.
    scartaRipresa(gioco);
    return null;
  }
}

export function scartaRipresa(gioco: string): void {
  localStorage.removeItem(PREFISSO + gioco);
}

/** "alle 21:14" per oggi, "ieri alle 23:40" per il giorno prima. */
export function quandoRipresa(ms: number): string {
  const quando = new Date(ms);
  const ora = quando.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const oggi = new Date().toDateString() === quando.toDateString();
  return oggi ? `alle ${ora}` : `ieri alle ${ora}`;
}
