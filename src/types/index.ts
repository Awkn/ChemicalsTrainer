/**
 * Modello dati dell'app. Tutto il dominio "freccette" vive qui, cosi' che i
 * moduli (programma, esercizi, oggi...) parlino lo stesso linguaggio.
 */

/** Giorno della settimana. 0 = Lunedi ... 6 = Domenica (convenzione europea). */
export type Giorno = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const GIORNI: { valore: Giorno; nome: string; breve: string }[] = [
  { valore: 0, nome: "Lunedi", breve: "Lun" },
  { valore: 1, nome: "Martedi", breve: "Mar" },
  { valore: 2, nome: "Mercoledi", breve: "Mer" },
  { valore: 3, nome: "Giovedi", breve: "Gio" },
  { valore: 4, nome: "Venerdi", breve: "Ven" },
  { valore: 5, nome: "Sabato", breve: "Sab" },
  { valore: 6, nome: "Domenica", breve: "Dom" },
];

/** Categorie tipiche dell'allenamento a freccette. */
export type Categoria =
  | "Scoring"
  | "Doppi"
  | "Checkout"
  | "Tripli"
  | "Around the Clock"
  | "Partita"
  | "Riscaldamento"
  | "Altro";

export const CATEGORIE: Categoria[] = [
  "Scoring",
  "Doppi",
  "Checkout",
  "Tripli",
  "Around the Clock",
  "Partita",
  "Riscaldamento",
  "Altro",
];

/** Unita' di misura di una metrica, usata per formattare i valori nei grafici. */
export type UnitaMetrica = "numero" | "punti" | "percentuale";

/**
 * Giochi interattivi collegabili a un esercizio: al posto di "Registra
 * risultato" l'esercizio mostra "Inizia" e il gioco salva il risultato da se'.
 * Elenco aperto: i prossimi giochi si aggiungono qui.
 */
export type GiocoId = "bob27" | "co121";

/**
 * Definizione di una metrica misurabile per un esercizio (es. "Punteggio",
 * "Checkout %"). I risultati registrati riempiono un valore per ogni metrica.
 * Si assume che "piu' alto = meglio" (i grafici confrontano con l'obiettivo).
 */
export interface MetricaDef {
  /** Id stabile della metrica dentro l'esercizio, es. "punteggio". */
  id: string;
  nome: string;
  unita: UnitaMetrica;
  /** Valore obiettivo, mostrato come linea di riferimento nei grafici. */
  obiettivo?: number;
  /**
   * Direzione del miglioramento. Default "alto" (piu' alto = meglio).
   * "basso" per metriche come le frecce usate, dove meno e' meglio.
   */
  verso?: "alto" | "basso";
}

/** True se la variazione indicata rappresenta un miglioramento per la metrica. */
export function eMiglioramento(m: MetricaDef, delta: number): boolean {
  return m.verso === "basso" ? delta < 0 : delta > 0;
}

/** Un esercizio nella libreria (riutilizzabile in piu' giorni/programmi). */
export interface Esercizio {
  id: string;
  nome: string;
  categoria: Categoria;
  descrizione: string;
  /** Obiettivo suggerito, es. "40 lanci" oppure "chiudi 10 doppi". Testo libero. */
  obiettivo?: string;
  /** Durata indicativa dell'esercizio in minuti (opzionale). */
  durataMin?: number;
  /** Metriche tracciabili di questo esercizio (per la pagina Progressi). */
  metriche?: MetricaDef[];
  /** Se presente, l'esercizio si svolge come gioco interattivo (vedi GiocoId). */
  gioco?: GiocoId;
  createdAt: number;
}

/**
 * Un esercizio senza metriche non ha un punteggio da misurare (es. un
 * riscaldamento): si registra solo con un "fatto".
 */
export function soloCompletamento(e: Esercizio): boolean {
  return !e.metriche || e.metriche.length === 0;
}

/** Un risultato registrato in una data per un esercizio. */
export interface Risultato {
  id: string;
  esercizioId: string;
  /** Data della sessione in formato "YYYY-MM-DD". */
  data: string;
  /**
   * Valori per ogni metrica: chiave = MetricaDef.id.
   * Se vuoto, il record indica soltanto "esercizio fatto" in quella data.
   */
  valori: Record<string, number>;
  note?: string;
  createdAt: number;
}

/** True se il risultato registra solo il completamento, senza misure. */
export function eCompletamento(r: Risultato): boolean {
  return Object.keys(r.valori).length === 0;
}

/** Un programma di allenamento: un nome + un insieme di assegnazioni settimanali. */
export interface Programma {
  id: string;
  nome: string;
  descrizione?: string;
  createdAt: number;
}

/** Assegnazione di un esercizio a un giorno dentro un programma. */
export interface Assegnazione {
  id: string;
  programmaId: string;
  giorno: Giorno;
  esercizioId: string;
  /** Note specifiche per questo giorno (sovrascrivono l'obiettivo di default). */
  note?: string;
  /** Ordine di visualizzazione nella giornata. */
  ordine: number;
}

/** Struttura del file di import/export (per condividere programmi coi compagni). */
export interface ExportBundle {
  formato: "darts-trainer";
  versione: 1 | 2;
  esportatoIl: number;
  programmi: Programma[];
  esercizi: Esercizio[];
  assegnazioni: Assegnazione[];
  /** Presente dalla versione 2. Assente nei file piu' vecchi. */
  risultati?: Risultato[];
}
