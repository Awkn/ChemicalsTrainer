import { db } from "./db";
import type { MetricaDef } from "../types";

/**
 * Aggiornamenti una tantum dei dati gia' presenti sul dispositivo.
 *
 * La libreria di esercizi viene creata solo al PRIMO avvio (vedi seed.ts):
 * chi ha gia' installato l'app non vedrebbe mai le metriche aggiunte dopo.
 * Queste migrazioni colmano quel divario. Ognuna gira una volta sola: il
 * numero dell'ultima applicata resta in localStorage.
 *
 * Regola: non si sovrascrive mai una definizione gia' presente, cosi' le
 * personalizzazioni dell'utente restano intatte.
 */

const CHIAVE = "darts-trainer:migrazioni";

/** Metriche da assegnare agli esercizi di libreria che ne sono sprovvisti. */
const METRICHE_PER_NOME: Record<string, MetricaDef[]> = {
  "Around the Clock Doubles": [
    { id: "frecce", nome: "Frecce usate", unita: "numero", verso: "basso" },
  ],
  "Cricket Accuracy": [
    { id: "triple", nome: "Triple centrate", unita: "numero" },
  ],
  "Game Shot": [
    {
      id: "chiuse",
      nome: "Chiusure riuscite (su 9)",
      unita: "numero",
      obiettivo: 5,
    },
  ],
};

/** Assegna le metriche agli esercizi che non ne hanno, abbinandoli per nome. */
async function assegnaMetricheMancanti(): Promise<void> {
  const esercizi = await db.esercizi.toArray();
  for (const e of esercizi) {
    const metriche = METRICHE_PER_NOME[e.nome];
    if (!metriche) continue;
    if (e.metriche && e.metriche.length > 0) continue; // gia' definite: non tocco
    await db.esercizi.update(e.id, { metriche });
  }
}

/** Marca "Frecce usate" come metrica in cui meno e' meglio. */
async function correggiVersoFrecce(): Promise<void> {
  const esercizi = await db.esercizi.toArray();
  for (const e of esercizi) {
    const daCorreggere = e.metriche?.some(
      (m) => m.id === "frecce" && m.verso == null,
    );
    if (!daCorreggere) continue;
    const metriche = e.metriche!.map((m) =>
      m.id === "frecce" ? { ...m, verso: "basso" as const } : m,
    );
    await db.esercizi.update(e.id, { metriche });
  }
}

const MIGRAZIONI: { versione: number; esegui: () => Promise<void> }[] = [
  { versione: 1, esegui: assegnaMetricheMancanti },
  { versione: 2, esegui: correggiVersoFrecce },
];

export async function applicaMigrazioni(): Promise<void> {
  const applicate = Number(localStorage.getItem(CHIAVE) ?? 0);
  for (const m of MIGRAZIONI) {
    if (m.versione <= applicate) continue;
    await m.esegui();
    localStorage.setItem(CHIAVE, String(m.versione));
  }
}
