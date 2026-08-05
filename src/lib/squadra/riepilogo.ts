import { db } from "../db";
import { inOrdine } from "../cronologia";
import { dataIso } from "../date";
import type { UnitaMetrica } from "../../types";

/**
 * Riepilogo pubblicato sulla bacheca di squadra. Contiene solo dati
 * aggregati (ultimo e miglior valore per metrica, costanza), mai lo storico
 * completo delle sessioni.
 */

export interface StatisticaPubblicata {
  esercizio: string;
  metrica: string;
  unita: UnitaMetrica;
  /** "basso" se un valore piu' basso e' migliore (es. frecce usate). */
  verso: "alto" | "basso";
  ultimo: number;
  migliore: number;
}

export interface RiepilogoGiocatore {
  nome: string;
  /** Timestamp dell'ultima pubblicazione. */
  aggiornatoIl: number;
  /** Data dell'ultimo allenamento registrato ("YYYY-MM-DD"). */
  ultimoAllenamento: string | null;
  /** Sessioni registrate negli ultimi 30 giorni. */
  sessioni30gg: number;
  statistiche: StatisticaPubblicata[];
}

function trentaGiorniFa(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return dataIso(d);
}

/** Costruisce il riepilogo a partire dai dati locali. */
export async function calcolaRiepilogo(
  nome: string,
): Promise<RiepilogoGiocatore> {
  const [esercizi, risultati] = await Promise.all([
    db.esercizi.toArray(),
    db.risultati.toArray(),
  ]);

  const soglia = trentaGiorniFa();
  const statistiche: StatisticaPubblicata[] = [];

  for (const esercizio of esercizi) {
    if (!esercizio.metriche?.length) continue;

    const suoi = risultati
      .filter((r) => r.esercizioId === esercizio.id)
      .sort(inOrdine);
    if (suoi.length === 0) continue;

    for (const m of esercizio.metriche) {
      const valori = suoi
        .filter((r) => m.id in r.valori)
        .map((r) => r.valori[m.id]);
      if (valori.length === 0) continue;

      const verso = m.verso ?? "alto";
      statistiche.push({
        esercizio: esercizio.nome,
        metrica: m.nome,
        unita: m.unita,
        verso,
        ultimo: valori[valori.length - 1],
        migliore:
          verso === "basso" ? Math.min(...valori) : Math.max(...valori),
      });
    }
  }

  const date = risultati.map((r) => r.data).sort();

  return {
    nome,
    aggiornatoIl: Date.now(),
    ultimoAllenamento: date.length ? date[date.length - 1] : null,
    sessioni30gg: date.filter((d) => d >= soglia).length,
    statistiche,
  };
}
