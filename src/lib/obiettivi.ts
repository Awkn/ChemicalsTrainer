import { dataIso } from "./date";
import type { Esercizio, MetricaDef, Risultato } from "../types";

/**
 * Confronto tra quello che fai e le soglie che ti sei dato.
 *
 * Gli obiettivi per metrica esistono gia' nella libreria (MetricaDef.obiettivo)
 * e finora si vedevano solo come linea nei grafici, uno alla volta. Qui
 * diventano un quadro d'insieme: quali soglie stai rispettando e quali no.
 *
 * Si giudica sulla MEDIA della finestra, non sull'ultimo risultato ne' sul
 * migliore: una soglia come "checkout oltre il 35%" parla di come vai di
 * solito, non della serata fortunata. Il migliore resta accanto, perche' dice
 * un'altra cosa utile: se ci sei gia' arrivato almeno una volta.
 *
 * Modulo puro: nessun React, nessun database. Prende liste, restituisce righe.
 */

export interface RigaObiettivo {
  /** Identifica la riga: un esercizio puo' avere piu' metriche con obiettivo. */
  chiave: string;
  esercizioId: string;
  esercizio: string;
  metrica: MetricaDef;
  obiettivo: number;
  /** Media dei valori nella finestra. `null` se non l'hai mai misurata. */
  media: number | null;
  /** Miglior valore nella finestra (il piu' basso se meno e' meglio). */
  migliore: number | null;
  /** Quante volte l'hai misurata nella finestra. */
  sessioni: number;
  raggiunto: boolean;
  /**
   * Distanza dalla soglia in frazione dell'obiettivo (0 = centrato).
   * Serve a ordinare: mette davanti i traguardi a un passo.
   */
  scarto: number;
}

/** Primo giorno di una finestra di N giorni che finisce oggi (inclusi). */
export function inizioFinestra(giorni: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (giorni - 1));
  return dataIso(d);
}

/** True se il valore rispetta la soglia, tenendo conto del verso della metrica. */
export function raggiunge(
  metrica: MetricaDef,
  valore: number,
  obiettivo: number,
): boolean {
  return metrica.verso === "basso" ? valore <= obiettivo : valore >= obiettivo;
}

/** Quanto manca alla soglia, nell'unita' della metrica. Zero se raggiunta. */
export function distanza(riga: RigaObiettivo): number {
  if (riga.media == null || riga.raggiunto) return 0;
  return Math.abs(riga.obiettivo - riga.media);
}

function media(valori: number[]): number {
  return valori.reduce((s, v) => s + v, 0) / valori.length;
}

/**
 * Costruisce le righe del cruscotto. `dal` e' il primo giorno da considerare
 * ("YYYY-MM-DD"): fuori dalla finestra i risultati non contano.
 */
export function calcolaObiettivi(
  esercizi: Esercizio[],
  risultati: Risultato[],
  dal: string,
): RigaObiettivo[] {
  const perEsercizio = new Map<string, Risultato[]>();
  for (const r of risultati) {
    if (r.data < dal) continue;
    const lista = perEsercizio.get(r.esercizioId);
    if (lista) lista.push(r);
    else perEsercizio.set(r.esercizioId, [r]);
  }

  const righe: RigaObiettivo[] = [];

  for (const e of esercizi) {
    for (const m of e.metriche ?? []) {
      // Senza soglia non c'e' niente da giudicare: la metrica resta tracciata
      // nei grafici, ma qui non ha posto.
      if (m.obiettivo == null) continue;

      const valori = (perEsercizio.get(e.id) ?? [])
        .filter((r) => m.id in r.valori)
        .map((r) => r.valori[m.id]);

      const valore = valori.length > 0 ? media(valori) : null;
      const raggiunto = valore != null && raggiunge(m, valore, m.obiettivo);

      righe.push({
        chiave: `${e.id}:${m.id}`,
        esercizioId: e.id,
        esercizio: e.nome,
        metrica: m,
        obiettivo: m.obiettivo,
        media: valore,
        migliore:
          valori.length === 0
            ? null
            : m.verso === "basso"
              ? Math.min(...valori)
              : Math.max(...valori),
        sessioni: valori.length,
        raggiunto,
        scarto:
          valore == null || raggiunto
            ? 0
            : Math.abs(m.obiettivo - valore) / Math.abs(m.obiettivo || 1),
      });
    }
  }

  return ordina(righe);
}

/**
 * Ordine: prima quello su cui puoi agire. In cima i traguardi mancati, dal
 * piu' vicino (il prossimo a cadere) al piu' lontano; poi quelli raggiunti;
 * in fondo le metriche che nel periodo non hai mai misurato.
 */
function ordina(righe: RigaObiettivo[]): RigaObiettivo[] {
  return [...righe].sort((a, b) => {
    const aMisurata = a.media != null;
    const bMisurata = b.media != null;
    if (aMisurata !== bMisurata) return aMisurata ? -1 : 1;
    if (aMisurata && a.raggiunto !== b.raggiunto) return a.raggiunto ? 1 : -1;
    if (aMisurata && !a.raggiunto) return a.scarto - b.scarto;
    return (
      a.esercizio.localeCompare(b.esercizio) ||
      a.metrica.nome.localeCompare(b.metrica.nome)
    );
  });
}

/** Quante soglie rispetti, sul totale di quelle misurate nel periodo. */
export function conteggio(righe: RigaObiettivo[]): {
  raggiunti: number;
  misurati: number;
} {
  const misurati = righe.filter((r) => r.media != null);
  return {
    raggiunti: misurati.filter((r) => r.raggiunto).length,
    misurati: misurati.length,
  };
}
