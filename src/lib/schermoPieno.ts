import { useEffect, useState } from "react";

/**
 * Schermo pieno: mentre si gioca, intestazione e barra di navigazione
 * spariscono e la partita si prende tutto.
 *
 * Non e' vezzo grafico. Sul telefono quelle due barre valgono un centinaio di
 * pixel, e su uno schermo da iPhone erano la differenza fra avere il tasto di
 * invio sotto il pollice e doverlo andare a cercare scorrendo.
 *
 * Lo accende la pagina che sta giocando, non il Layout: solo lei sa se si e'
 * davvero in partita o ancora nelle impostazioni. Chi lo accende DEVE anche
 * spegnerlo uscendo, e deve offrire una via d'uscita sua, perche' la barra in
 * basso non c'e' piu.
 */

let acceso = false;
const ascoltatori = new Set<() => void>();

export function impostaSchermoPieno(valore: boolean): void {
  if (acceso === valore) return;
  acceso = valore;
  ascoltatori.forEach((f) => f());
}

export function usaSchermoPieno(): boolean {
  const [valore, setValore] = useState(acceso);
  useEffect(() => {
    const aggiorna = () => setValore(acceso);
    ascoltatori.add(aggiorna);
    aggiorna(); // riallinea se e' cambiato fra render ed effetto
    return () => {
      ascoltatori.delete(aggiorna);
    };
  }, []);
  return valore;
}

/**
 * Tiene lo schermo pieno finche' la condizione e' vera, e lo rilascia
 * uscendo dalla pagina qualunque sia il motivo.
 */
export function usaTieniSchermoPieno(attivo: boolean): void {
  useEffect(() => {
    impostaSchermoPieno(attivo);
    return () => impostaSchermoPieno(false);
  }, [attivo]);
}
