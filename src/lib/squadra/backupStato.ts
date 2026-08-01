import { useEffect, useState } from "react";

/**
 * Stato locale del backup nel cloud (senza Firebase): codice di ripristino,
 * flag "attivo" e momento dell'ultimo backup. Vive in localStorage cosi' e'
 * leggibile ovunque senza caricare la libreria Firebase, che serve solo per le
 * operazioni vere (upload/ripristino) in backupCloud.ts.
 */

const K_CODICE = "darts-trainer:backupCodice";
const K_ATTIVO = "darts-trainer:backupCloudAttivo";
const K_ULTIMO = "darts-trainer:ultimoBackupCloud";
const K_FIRMA = "darts-trainer:backupFirma";

// localStorage non e' reattivo: notifichiamo a mano chi osserva.
const ascoltatori = new Set<() => void>();
function notifica(): void {
  ascoltatori.forEach((f) => f());
}

export function codiceBackup(): string | null {
  return localStorage.getItem(K_CODICE);
}
export function backupCloudAttivo(): boolean {
  return localStorage.getItem(K_ATTIVO) === "1";
}
export function ultimoBackupCloud(): number {
  return Number(localStorage.getItem(K_ULTIMO) ?? 0);
}
export function firmaBackup(): string | null {
  return localStorage.getItem(K_FIRMA);
}

export function setCodice(codice: string): void {
  localStorage.setItem(K_CODICE, codice);
  notifica();
}
export function setAttivo(attivo: boolean): void {
  if (attivo) localStorage.setItem(K_ATTIVO, "1");
  else localStorage.removeItem(K_ATTIVO);
  notifica();
}
export function setUltimoBackupCloud(quando: number): void {
  localStorage.setItem(K_ULTIMO, String(quando));
  notifica();
}
export function setFirmaBackup(firma: string): void {
  localStorage.setItem(K_FIRMA, firma);
}

// ---------- Codice di ripristino ----------

// Alfabeto senza caratteri ambigui (niente 0/O/1/I). 32 simboli: bias nullo.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Genera un codice di ripristino di 12 caratteri (~60 bit di entropia). */
export function generaCodice(): string {
  const buf = new Uint8Array(12);
  crypto.getRandomValues(buf);
  let s = "";
  for (const b of buf) s += ALFABETO[b % 32];
  return s;
}

/** Formatta il codice per la lettura: ABCD-EFGH-JKLM. */
export function formattaCodice(codice: string): string {
  return codice.replace(/(.{4})(.{4})(.{4})/, "$1-$2-$3");
}

/** Riporta un codice inserito dall'utente alla forma canonica (id documento). */
export function normalizzaCodice(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// ---------- Hook reattivo ----------

export interface StatoBackupCloud {
  attivo: boolean;
  codice: string | null;
  ultimo: number;
}

function leggi(): StatoBackupCloud {
  return {
    attivo: backupCloudAttivo(),
    codice: codiceBackup(),
    ultimo: ultimoBackupCloud(),
  };
}

/** Stato del backup nel cloud come stato React, aggiornato quando cambia. */
export function usaStatoBackupCloud(): StatoBackupCloud {
  const [valore, setValore] = useState(leggi);
  useEffect(() => {
    const aggiorna = () => setValore(leggi());
    ascoltatori.add(aggiorna);
    return () => {
      ascoltatori.delete(aggiorna);
    };
  }, []);
  return valore;
}
