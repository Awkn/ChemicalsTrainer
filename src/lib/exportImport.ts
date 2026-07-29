import { db } from "./db";
import { nuovoId } from "./id";
import type {
  Assegnazione,
  Esercizio,
  ExportBundle,
  Programma,
  Risultato,
} from "../types";

/**
 * Esporta l'intero database in un oggetto serializzabile in JSON.
 * Serve per passare programmi ai compagni (un file .json da importare).
 */
export async function esportaTutto(): Promise<ExportBundle> {
  const [programmi, esercizi, assegnazioni, risultati] = await Promise.all([
    db.programmi.toArray(),
    db.esercizi.toArray(),
    db.assegnazioni.toArray(),
    db.risultati.toArray(),
  ]);
  return {
    formato: "darts-trainer",
    versione: 2,
    esportatoIl: Date.now(),
    programmi,
    esercizi,
    assegnazioni,
    risultati,
  };
}

/** Avvia il download di un file JSON con tutti i dati. */
export async function scaricaExport(): Promise<void> {
  const bundle = await esportaTutto();
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const data = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `darts-trainer-${data}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function isBundle(x: unknown): x is ExportBundle {
  return (
    typeof x === "object" &&
    x !== null &&
    (x as ExportBundle).formato === "darts-trainer" &&
    Array.isArray((x as ExportBundle).programmi) &&
    Array.isArray((x as ExportBundle).esercizi) &&
    Array.isArray((x as ExportBundle).assegnazioni)
  );
}

/**
 * Importa un bundle. Per evitare collisioni di id con i dati gia' presenti,
 * rigenera gli id di programmi/esercizi e rimappa le assegnazioni.
 * I dati esistenti NON vengono cancellati: l'import e' additivo.
 */
export async function importaBundle(testoJson: string): Promise<{
  programmiImportati: number;
  eserciziImportati: number;
}> {
  const parsed: unknown = JSON.parse(testoJson);
  if (!isBundle(parsed)) {
    throw new Error(
      "File non valido: non sembra un export di Darts Trainer.",
    );
  }

  // mappe vecchio-id -> nuovo-id
  const mapEsercizi = new Map<string, string>();
  const mapProgrammi = new Map<string, string>();

  const eserciziNuovi: Esercizio[] = parsed.esercizi.map((e) => {
    const id = nuovoId();
    mapEsercizi.set(e.id, id);
    return { ...e, id };
  });

  const programmiNuovi: Programma[] = parsed.programmi.map((p) => {
    const id = nuovoId();
    mapProgrammi.set(p.id, id);
    return { ...p, id };
  });

  const assegnazioniNuove: Assegnazione[] = parsed.assegnazioni
    .filter(
      (a) => mapProgrammi.has(a.programmaId) && mapEsercizi.has(a.esercizioId),
    )
    .map((a) => ({
      ...a,
      id: nuovoId(),
      programmaId: mapProgrammi.get(a.programmaId)!,
      esercizioId: mapEsercizi.get(a.esercizioId)!,
    }));

  // I risultati esistono solo dalla versione 2; rimappa l'esercizio collegato.
  const risultatiNuovi: Risultato[] = (parsed.risultati ?? [])
    .filter((r) => mapEsercizi.has(r.esercizioId))
    .map((r) => ({
      ...r,
      id: nuovoId(),
      esercizioId: mapEsercizi.get(r.esercizioId)!,
    }));

  await db.transaction(
    "rw",
    db.esercizi,
    db.programmi,
    db.assegnazioni,
    db.risultati,
    async () => {
      await db.esercizi.bulkAdd(eserciziNuovi);
      await db.programmi.bulkAdd(programmiNuovi);
      await db.assegnazioni.bulkAdd(assegnazioniNuove);
      await db.risultati.bulkAdd(risultatiNuovi);
    },
  );

  return {
    programmiImportati: programmiNuovi.length,
    eserciziImportati: eserciziNuovi.length,
  };
}
