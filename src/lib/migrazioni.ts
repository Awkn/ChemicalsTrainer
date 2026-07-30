import { db } from "./db";
import type { GiocoId, MetricaDef } from "../types";

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

/**
 * Rende "Bob's 27" un gioco interattivo e gli aggiunge la metrica dei doppi %,
 * senza toccare eventuali personalizzazioni: aggiorna solo cio' che manca.
 */
async function collegaGiocoBob27(): Promise<void> {
  const esercizi = await db.esercizi.where("nome").equals("Bob's 27").toArray();
  for (const e of esercizi) {
    const modifiche: { gioco?: GiocoId; metriche?: MetricaDef[] } = {};
    if (e.gioco == null) modifiche.gioco = "bob27";
    const haPerc = e.metriche?.some((m) => m.id === "perc");
    if (!haPerc) {
      modifiche.metriche = [
        ...(e.metriche ?? []),
        { id: "perc", nome: "Doppi %", unita: "percentuale" },
      ];
    }
    if (Object.keys(modifiche).length > 0) await db.esercizi.update(e.id, modifiche);
  }
}

/** Rende "121 Challenge" un gioco interattivo (la metrica c'e' gia'). */
async function collegaGioco121(): Promise<void> {
  const esercizi = await db.esercizi.where("nome").equals("121 Challenge").toArray();
  for (const e of esercizi) {
    if (e.gioco == null) await db.esercizi.update(e.id, { gioco: "co121" });
  }
}

/** Collega i giochi "around the clock" agli esercizi gia' in libreria. */
async function collegaGiochiAtc(): Promise<void> {
  const GIOCO_PER_NOME: Record<string, GiocoId> = {
    "Around the Clock Doubles": "atc",
    "Doubles Ladder": "ladder",
    "Pressure Doubles": "pressuredoubles",
  };
  const esercizi = await db.esercizi.toArray();
  for (const e of esercizi) {
    const gioco = GIOCO_PER_NOME[e.nome];
    if (gioco && e.gioco == null) await db.esercizi.update(e.id, { gioco });
  }
}

const MIGRAZIONI: { versione: number; esegui: () => Promise<void> }[] = [
  { versione: 1, esegui: assegnaMetricheMancanti },
  { versione: 2, esegui: correggiVersoFrecce },
  { versione: 3, esegui: collegaGiocoBob27 },
  { versione: 4, esegui: collegaGioco121 },
  { versione: 5, esegui: collegaGiochiAtc },
];

export async function applicaMigrazioni(): Promise<void> {
  const applicate = Number(localStorage.getItem(CHIAVE) ?? 0);
  for (const m of MIGRAZIONI) {
    if (m.versione <= applicate) continue;
    await m.esegui();
    localStorage.setItem(CHIAVE, String(m.versione));
  }
}
