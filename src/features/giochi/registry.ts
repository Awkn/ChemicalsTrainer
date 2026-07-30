import type { GiocoId } from "../../types";

/**
 * Registro dei giochi interattivi. Un esercizio con `gioco` impostato viene
 * avviato invece di aprire il modulo "Registra risultato". Aggiungere qui i
 * nuovi giochi (e la relativa route in App.tsx).
 */
export const GIOCHI: Record<GiocoId, { titolo: string }> = {
  bob27: { titolo: "Bob's 27" },
  co121: { titolo: "121 Checkout" },
  atc: { titolo: "Around the Clock" },
  ladder: { titolo: "Doubles Ladder" },
  pressuredoubles: { titolo: "Pressure Doubles" },
};

/** Percorso della schermata di gioco per un dato esercizio. */
export function percorsoGioco(gioco: GiocoId, esercizioId: string): string {
  return `/gioco/${gioco}/${esercizioId}`;
}
