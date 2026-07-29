import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import { scaricaExport } from "./exportImport";

/**
 * Tiene traccia dell'ultimo backup (esportazione) e di quanti dati sono stati
 * creati da allora, per invitare l'utente a salvare prima di rischiare di
 * perdere tutto. Il momento dell'ultimo backup vive in localStorage; i dati
 * stanno solo in questo dispositivo, quindi l'export e' l'unica vera copia.
 */

const CHIAVE = "darts-trainer:ultimoBackup";

// localStorage non e' reattivo: notifichiamo a mano chi osserva l'ultimo backup.
const ascoltatori = new Set<() => void>();

/** Momento dell'ultimo backup in millisecondi, oppure 0 se non e' mai stato fatto. */
export function ultimoBackup(): number {
  return Number(localStorage.getItem(CHIAVE) ?? 0);
}

/** Registra che un backup e' appena stato fatto. */
export function segnaBackup(quando: number = Date.now()): void {
  localStorage.setItem(CHIAVE, String(quando));
  ascoltatori.forEach((notifica) => notifica());
}

/** Esporta i dati in un file e registra il momento del backup. */
export async function esportaConBackup(): Promise<void> {
  await scaricaExport();
  segnaBackup();
}

/** Ultimo backup come stato React, aggiornato quando cambia. */
function usaUltimoBackup(): number {
  const [valore, setValore] = useState(ultimoBackup);
  useEffect(() => {
    const aggiorna = () => setValore(ultimoBackup());
    ascoltatori.add(aggiorna);
    return () => {
      ascoltatori.delete(aggiorna);
    };
  }, []);
  return valore;
}

export interface StatoBackup {
  /** Momento dell'ultimo backup (0 = mai). */
  ultimoBackup: number;
  /** True se non e' mai stato fatto un backup. */
  maiFatto: boolean;
  /** Allenamenti (risultati) registrati dopo l'ultimo backup. */
  allenamentiDaSalvare: number;
  /** True se c'e' qualcosa da salvare (almeno un programma o un risultato). */
  haQualcosa: boolean;
}

/**
 * Stato del backup, reattivo: cambia sia quando si registra un allenamento
 * sia quando si esporta. `undefined` finche' la prima lettura non e' pronta.
 */
export function usaStatoBackup(): StatoBackup | undefined {
  const soglia = usaUltimoBackup();
  return useLiveQuery(async () => {
    const [allenamentiDaSalvare, programmi, risultatiTotali] = await Promise.all([
      db.risultati.filter((r) => r.createdAt > soglia).count(),
      db.programmi.count(),
      db.risultati.count(),
    ]);
    return {
      ultimoBackup: soglia,
      maiFatto: soglia === 0,
      allenamentiDaSalvare,
      haQualcosa: programmi > 0 || risultatiTotali > 0,
    };
  }, [soglia]);
}
