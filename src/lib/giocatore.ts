/**
 * Identita' locale del giocatore: il nome mostrato agli altri nella bacheca
 * di squadra. Vive in localStorage, non nel database degli allenamenti.
 */

const CHIAVE = "darts-trainer:nomeGiocatore";

export function nomeGiocatore(): string | null {
  const n = localStorage.getItem(CHIAVE);
  return n && n.trim() ? n : null;
}

export function impostaNomeGiocatore(nome: string): void {
  const pulito = nome.trim().slice(0, 24);
  if (pulito) localStorage.setItem(CHIAVE, pulito);
  else localStorage.removeItem(CHIAVE);
}
