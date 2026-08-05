import { inOrdine } from "./cronologia";
import type { Esercizio, MetricaDef, Risultato } from "../types";

/**
 * Personal best: il valore migliore mai registrato per ogni metrica.
 *
 * I Progressi raccontano l'andamento, questo racconta il picco — la serata da
 * ricordare. Si guarda tutto lo storico, non una finestra: un record e' un
 * record anche se e' di sei mesi fa.
 *
 * Modulo puro: nessun React, nessun database. Prende liste, restituisce righe.
 */

export interface RecordMetrica {
  metrica: MetricaDef;
  valore: number;
  /** Giorno in cui il record e' stato stabilito la prima volta. */
  data: string;
  /** Quante volte quel valore e' stato ottenuto (1 = fatto una volta sola). */
  volte: number;
}

export interface RecordEsercizio {
  esercizioId: string;
  esercizio: string;
  /** Presente se l'esercizio si gioca dentro l'app. */
  gioco?: string;
  /** Sessioni misurate su cui e' calcolato. */
  sessioni: number;
  record: RecordMetrica[];
}

/** True se `valore` batte `migliore` per il verso della metrica. */
function batte(m: MetricaDef, valore: number, migliore: number): boolean {
  return m.verso === "basso" ? valore < migliore : valore > migliore;
}

/**
 * I record di un esercizio, uno per metrica misurata almeno una volta.
 * L'ordine e' quello delle metriche nell'esercizio, cosi' la scheda si legge
 * come il recap.
 */
function recordDiEsercizio(
  esercizio: Esercizio,
  suoi: Risultato[],
): RecordEsercizio | null {
  // In ordine di gioco: a parita' di valore vince la prima volta che l'hai
  // fatto, che e' quando il record e' stato stabilito davvero.
  const ordinati = [...suoi].sort(inOrdine);
  const record: RecordMetrica[] = [];

  for (const m of esercizio.metriche ?? []) {
    let migliore: RecordMetrica | null = null;
    for (const r of ordinati) {
      if (!(m.id in r.valori)) continue;
      const v = r.valori[m.id];
      if (migliore == null || batte(m, v, migliore.valore)) {
        migliore = { metrica: m, valore: v, data: r.data, volte: 1 };
      } else if (v === migliore.valore) {
        migliore.volte++;
      }
    }
    if (migliore) record.push(migliore);
  }

  if (record.length === 0) return null;

  return {
    esercizioId: esercizio.id,
    esercizio: esercizio.nome,
    gioco: esercizio.gioco,
    sessioni: ordinati.length,
    record,
  };
}

/**
 * I record di tutti gli esercizi, in ordine alfabetico. Chi non ha nemmeno un
 * risultato misurato resta fuori: senza partite non c'e' niente da mostrare.
 */
export function calcolaRecord(
  esercizi: Esercizio[],
  risultati: Risultato[],
): RecordEsercizio[] {
  const perEsercizio = new Map<string, Risultato[]>();
  for (const r of risultati) {
    const lista = perEsercizio.get(r.esercizioId);
    if (lista) lista.push(r);
    else perEsercizio.set(r.esercizioId, [r]);
  }

  return esercizi
    .map((e) => recordDiEsercizio(e, perEsercizio.get(e.id) ?? []))
    .filter((r): r is RecordEsercizio => r != null)
    .sort((a, b) => a.esercizio.localeCompare(b.esercizio));
}
