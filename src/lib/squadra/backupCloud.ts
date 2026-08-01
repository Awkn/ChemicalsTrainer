import { doc, getDoc, setDoc } from "firebase/firestore";
import { connessione } from "./client";
import {
  esportaTutto,
  parseBundle,
  ripristinaBundle,
  type ConteggiRipristino,
} from "../exportImport";
import { segnaBackup } from "../backup";
import { nomeGiocatore } from "../giocatore";
import {
  codiceBackup,
  generaCodice,
  normalizzaCodice,
  setAttivo,
  setCodice,
  setUltimoBackupCloud,
} from "./backupStato";

/**
 * Backup completo nel cloud, "strada semplice": l'intero database viene
 * serializzato e salvato in un documento Firestore identificato da un CODICE
 * DI RIPRISTINO casuale (non dall'uid del dispositivo). Chi conosce il codice
 * puo' ritrovare il backup da un altro telefono. Nessun account da creare.
 *
 * Il documento e' un JSON in un solo campo: robusto e sotto il limite di 1 MiB
 * per documento (i dati di una squadra sono piccoli).
 */

const COLLEZIONE = "backup";
const LIMITE_BYTE = 950_000;

/** Traduce gli errori Firestore piu' comuni in messaggi utili all'utente. */
function traduciErrore(e: unknown): Error {
  const codice = (e as { code?: string })?.code ?? "";
  if (codice === "permission-denied") {
    return new Error(
      "Backup nel cloud non ancora abilitato: vanno pubblicate le regole Firestore aggiornate (sezione /backup).",
    );
  }
  if (codice === "unavailable") {
    return new Error("Sei offline: riprova quando torni online.");
  }
  return e instanceof Error ? e : new Error("Operazione nel cloud non riuscita.");
}

export interface EsitoBackup {
  codice: string;
  quando: number;
}

/** Salva subito il backup nel cloud (attivandolo se non lo era). */
export async function backupOra(): Promise<EsitoBackup> {
  const conn = await connessione();
  if (!conn) {
    throw new Error("Backup non disponibile: manca la connessione alla squadra.");
  }

  let codice = codiceBackup();
  if (!codice) {
    codice = generaCodice();
    setCodice(codice);
  }

  const bundle = await esportaTutto();
  const json = JSON.stringify(bundle);
  if (json.length > LIMITE_BYTE) {
    throw new Error(
      "Il backup supera il limite del cloud (~1 MB). Usa l'export su file.",
    );
  }

  const quando = Date.now();
  try {
    await setDoc(doc(conn.db, COLLEZIONE, codice), {
      formato: "darts-trainer-backup",
      versione: 2,
      aggiornatoIl: quando,
      nome: nomeGiocatore() ?? null,
      json,
    });
  } catch (e) {
    throw traduciErrore(e);
  }

  setAttivo(true);
  setUltimoBackupCloud(quando);
  segnaBackup(quando); // un backup cloud vale come backup: silenzia il promemoria
  return { codice, quando };
}

export interface EsitoRipristino {
  codice: string;
  conteggi: ConteggiRipristino;
}

/**
 * Ripristina da un codice: scarica il backup e SOSTITUISCE i dati locali.
 * Da qui in poi il dispositivo continua a fare backup su quello stesso codice.
 */
export async function ripristinaDaCloud(input: string): Promise<EsitoRipristino> {
  const codice = normalizzaCodice(input);
  if (codice.length < 8) throw new Error("Codice di ripristino non valido.");

  const conn = await connessione();
  if (!conn) {
    throw new Error("Ripristino non disponibile: manca la connessione alla squadra.");
  }

  let snap;
  try {
    snap = await getDoc(doc(conn.db, COLLEZIONE, codice));
  } catch (e) {
    throw traduciErrore(e);
  }
  if (!snap.exists()) {
    throw new Error("Nessun backup trovato per questo codice.");
  }

  const dati = snap.data() as { json?: string };
  if (!dati.json) throw new Error("Backup danneggiato: dati mancanti.");

  const bundle = parseBundle(dati.json);
  const conteggi = await ripristinaBundle(bundle);

  setCodice(codice);
  setAttivo(true);
  setUltimoBackupCloud(Date.now());
  return { codice, conteggi };
}
