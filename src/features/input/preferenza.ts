import { useEffect, useState } from "react";

/**
 * Modo di inserimento della tirata scelto dall'utente. Vive in localStorage
 * cosi' la scelta vale per tutti i giochi e resta anche dopo la chiusura
 * dell'app; localStorage non e' reattivo, quindi notifichiamo a mano.
 */

export type ModoInput = "tastierino" | "bersaglio";

const CHIAVE = "darts-trainer:modoInput";
const PREDEFINITO: ModoInput = "tastierino";

const ascoltatori = new Set<() => void>();

export function modoInput(): ModoInput {
  return localStorage.getItem(CHIAVE) === "bersaglio" ? "bersaglio" : PREDEFINITO;
}

export function setModoInput(modo: ModoInput): void {
  if (modo === PREDEFINITO) localStorage.removeItem(CHIAVE);
  else localStorage.setItem(CHIAVE, modo);
  ascoltatori.forEach((f) => f());
}

/** Modo di input come stato React, aggiornato quando cambia da qualsiasi punto. */
export function usaModoInput(): ModoInput {
  const [valore, setValore] = useState(modoInput);
  useEffect(() => {
    const aggiorna = () => setValore(modoInput());
    ascoltatori.add(aggiorna);
    return () => {
      ascoltatori.delete(aggiorna);
    };
  }, []);
  return valore;
}
