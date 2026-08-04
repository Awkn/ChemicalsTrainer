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
  const [programmi, esercizi, assegnazioni, risultati, doppi, partite] =
    await Promise.all([
      db.programmi.toArray(),
      db.esercizi.toArray(),
      db.assegnazioni.toArray(),
      db.risultati.toArray(),
      db.doppi.toArray(),
      db.partite.toArray(),
    ]);
  return {
    formato: "darts-trainer",
    versione: 4,
    esportatoIl: Date.now(),
    programmi,
    esercizi,
    assegnazioni,
    risultati,
    doppi,
    partite,
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

/** Interpreta e valida un bundle serializzato in JSON. */
export function parseBundle(testoJson: string): ExportBundle {
  const parsed: unknown = JSON.parse(testoJson);
  if (!isBundle(parsed)) {
    throw new Error("Backup non valido: non sembra un export di Darts Trainer.");
  }
  return parsed;
}

export interface ConteggiRipristino {
  esercizi: number;
  programmi: number;
  assegnazioni: number;
  risultati: number;
}

/**
 * Ripristina un backup SOSTITUENDO i dati locali: azzera le tabelle e ricarica
 * gli oggetti con i loro id originali. A differenza dell'import additivo, cosi'
 * si riproduce esattamente lo stato salvato, senza duplicare la libreria.
 */
export async function ripristinaBundle(
  bundle: ExportBundle,
): Promise<ConteggiRipristino> {
  const risultati = bundle.risultati ?? [];
  const doppi = bundle.doppi ?? [];
  const partite = bundle.partite ?? [];
  // Oltre le cinque tabelle Dexie vuole l'elenco in un array.
  await db.transaction(
    "rw",
    [db.esercizi, db.programmi, db.assegnazioni, db.risultati, db.doppi, db.partite],
    async () => {
      await Promise.all([
        db.esercizi.clear(),
        db.programmi.clear(),
        db.assegnazioni.clear(),
        db.risultati.clear(),
        db.doppi.clear(),
        db.partite.clear(),
      ]);
      await db.esercizi.bulkAdd(bundle.esercizi);
      await db.programmi.bulkAdd(bundle.programmi);
      await db.assegnazioni.bulkAdd(bundle.assegnazioni);
      await db.risultati.bulkAdd(risultati);
      await db.doppi.bulkAdd(doppi);
      await db.partite.bulkAdd(partite);
    },
  );
  return {
    esercizi: bundle.esercizi.length,
    programmi: bundle.programmi.length,
    assegnazioni: bundle.assegnazioni.length,
    risultati: risultati.length,
  };
}

/**
 * Importa un bundle. Per evitare collisioni di id con i dati gia' presenti,
 * rigenera gli id di programmi/esercizi e rimappa le assegnazioni.
 * I dati esistenti NON vengono cancellati: l'import e' additivo.
 *
 * I tentativi al doppio e le partite archiviate restano fuori di proposito: un
 * file importato arriva da un compagno, e le sue partite non sono le proprie.
 * Nel backup personale invece ci sono (vedi ripristinaBundle).
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
