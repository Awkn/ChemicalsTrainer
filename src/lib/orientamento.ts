import { useEffect, useState } from "react";

/**
 * True quando il dispositivo e' in verticale.
 *
 * Serve ai giochi che stanno stretti in verticale (Cricket affianca tabellone
 * e bersaglio). Non esiste modo di forzare la rotazione da web: `screen
 * .orientation.lock()` richiede il fullscreen e su iOS Safari non e'
 * disponibile, quindi si puo' solo chiedere all'utente di girare il telefono.
 */
export function usaVerticale(): boolean {
  const query = "(orientation: portrait)";
  const [verticale, setVerticale] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const aggiorna = () => setVerticale(mq.matches);
    mq.addEventListener("change", aggiorna);
    aggiorna();
    return () => mq.removeEventListener("change", aggiorna);
  }, []);

  return verticale;
}
