/**
 * Pressure Doubles: si affrontano in ordine D16, D20, D10, D8, D12. Per ogni
 * doppio bisogna centrarne 5 di fila; se si sbaglia la serie riparte da zero.
 * Per ciascun doppio si registra la percentuale (colpi sul totale dei tiri).
 *
 * Funzioni pure: l'annulla si ottiene tenendo lo storico degli stati.
 */

export const CONSECUTIVI_OBIETTIVO = 5;

/** Doppi nell'ordine dell'esercizio, con l'id della metrica corrispondente. */
export const DOPPI: { valore: number; metrica: string }[] = [
  { valore: 16, metrica: "d16" },
  { valore: 20, metrica: "d20" },
  { valore: 10, metrica: "d10" },
  { valore: 8, metrica: "d8" },
  { valore: 12, metrica: "d12" },
];

export interface StatoPressure {
  /** Doppio corrente (0..4). A fine esercizio = DOPPI.length. */
  indice: number;
  /** Centri consecutivi sul doppio corrente (0..5). */
  consecutivi: number;
  /** Per ogni doppio: centri e tiri totali. */
  perDoppio: { colpi: number; tiri: number }[];
  finito: boolean;
}

export function creaPressure(): StatoPressure {
  return {
    indice: 0,
    consecutivi: 0,
    perDoppio: DOPPI.map(() => ({ colpi: 0, tiri: 0 })),
    finito: false,
  };
}

/** Doppio corrente ("D16"...), o null a fine esercizio. */
export function doppioCorrente(stato: StatoPressure): string | null {
  return stato.finito ? null : `D${DOPPI[stato.indice].valore}`;
}

export function tiraFreccia(stato: StatoPressure, colpito: boolean): StatoPressure {
  if (stato.finito) return stato;

  const perDoppio = stato.perDoppio.map((d, i) =>
    i === stato.indice
      ? { colpi: d.colpi + (colpito ? 1 : 0), tiri: d.tiri + 1 }
      : d,
  );

  if (!colpito) {
    // Serie interrotta: riparte da zero, stesso doppio.
    return { ...stato, perDoppio, consecutivi: 0 };
  }

  const consecutivi = stato.consecutivi + 1;
  if (consecutivi >= CONSECUTIVI_OBIETTIVO) {
    const indice = stato.indice + 1;
    return {
      ...stato,
      perDoppio,
      consecutivi: 0,
      indice,
      finito: indice >= DOPPI.length,
    };
  }
  return { ...stato, perDoppio, consecutivi };
}

export function percentuale(d: { colpi: number; tiri: number }): number {
  return d.tiri === 0 ? 0 : Math.round((d.colpi / d.tiri) * 100);
}

/** Valori per i risultati: { d16: %, d20: %, ... } secondo gli id delle metriche. */
export function risultatoPressure(stato: StatoPressure): Record<string, number> {
  const valori: Record<string, number> = {};
  DOPPI.forEach((d, i) => {
    valori[d.metrica] = percentuale(stato.perDoppio[i]);
  });
  return valori;
}
