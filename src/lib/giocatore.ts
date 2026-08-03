import { useEffect, useState } from "react";

/**
 * Identita' locale del giocatore: il nome mostrato agli altri nella bacheca
 * di squadra. Vive in localStorage, non nel database degli allenamenti.
 */

const CHIAVE = "darts-trainer:nomeGiocatore";

const ascoltatori = new Set<() => void>();

export function nomeGiocatore(): string | null {
  const n = localStorage.getItem(CHIAVE);
  return n && n.trim() ? n : null;
}

export function impostaNomeGiocatore(nome: string): void {
  const pulito = nome.trim().slice(0, 24);
  if (pulito) localStorage.setItem(CHIAVE, pulito);
  else localStorage.removeItem(CHIAVE);
  ascoltatori.forEach((f) => f());
}

/**
 * Nome come stato React, aggiornato da qualunque punto lo cambi.
 *
 * Serve soprattutto alla pubblicazione sulla bacheca: entrando in squadra
 * deve accorgersene subito, senza aspettare che l'app venga riavviata.
 */
export function usaNomeGiocatore(): string | null {
  const [valore, setValore] = useState(nomeGiocatore);
  useEffect(() => {
    const aggiorna = () => setValore(nomeGiocatore());
    ascoltatori.add(aggiorna);
    // Tra l'avvio del componente e questo momento il nome puo' essere gia'
    // cambiato: si riallinea, o resterebbe indietro per sempre.
    aggiorna();
    return () => {
      ascoltatori.delete(aggiorna);
    };
  }, []);
  return valore;
}
