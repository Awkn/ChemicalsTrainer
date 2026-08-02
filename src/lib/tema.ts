import { useEffect, useState } from "react";

/**
 * Tema chiaro/scuro. "notte" e' quello storico dell'app (i colori dello
 * stemma su fondo nero) e resta il predefinito; "giorno" schiarisce lo sfondo
 * tenendo il viola di squadra.
 *
 * La scelta finisce in un attributo sull'elemento radice: il CSS ridefinisce
 * le sue variabili sotto `:root[data-tema="giorno"]`, quindi il resto del
 * foglio di stile non cambia di una riga.
 */

export type Tema = "notte" | "giorno";

const CHIAVE = "darts-trainer:tema";

/** Colore della barra di sistema del browser/PWA, per ciascun tema. */
const COLORE_BARRA: Record<Tema, string> = {
  notte: "#0a0810",
  giorno: "#f5f4fa",
};

const ascoltatori = new Set<() => void>();

export function tema(): Tema {
  return localStorage.getItem(CHIAVE) === "giorno" ? "giorno" : "notte";
}

/** Scrive il tema nel documento. Va chiamata anche all'avvio, prima di React. */
export function applicaTema(scelto: Tema = tema()): void {
  document.documentElement.dataset.tema = scelto;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", COLORE_BARRA[scelto]);
}

export function setTema(scelto: Tema): void {
  // "notte" e' il predefinito: non serve salvarlo.
  if (scelto === "notte") localStorage.removeItem(CHIAVE);
  else localStorage.setItem(CHIAVE, scelto);
  applicaTema(scelto);
  ascoltatori.forEach((f) => f());
}

/** Tema come stato React, aggiornato da qualunque punto lo cambi. */
export function usaTema(): Tema {
  const [valore, setValore] = useState(tema);
  useEffect(() => {
    const aggiorna = () => setValore(tema());
    ascoltatori.add(aggiorna);
    return () => {
      ascoltatori.delete(aggiorna);
    };
  }, []);
  return valore;
}
