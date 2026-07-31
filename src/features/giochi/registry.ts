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
  co61100: { titolo: "61-100 Checkouts" },
};

/** Percorso della schermata di gioco per un dato esercizio. */
export function percorsoGioco(gioco: GiocoId, esercizioId: string): string {
  return `/gioco/${gioco}/${esercizioId}`;
}

/**
 * Giochi lanciabili direttamente dalla sezione Esercizi (senza programma).
 * I due giochi "a oltranza" partono in versione sfida a numero chiuso.
 */
export const GIOCHI_DA_ESERCIZI = new Set<GiocoId>(["co121", "bob27", "co61100"]);

/** True se l'esercizio-gioco puo' essere avviato dalla sezione Esercizi. */
export function giocabileDaEsercizi(gioco: GiocoId): boolean {
  return GIOCHI_DA_ESERCIZI.has(gioco);
}

/** Percorso di avvio dalla sezione Esercizi (sfida a 10 tentativi dove serve). */
export function percorsoDaEsercizi(gioco: GiocoId, esercizioId: string): string {
  const sfida = gioco === "co121" || gioco === "co61100";
  return `/gioco/${gioco}/${esercizioId}${sfida ? "?sfida=1" : ""}`;
}
