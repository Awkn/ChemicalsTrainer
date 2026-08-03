import { useEffect } from "react";

/**
 * Impedisce allo schermo di spegnersi finche' `attivo`.
 *
 * Giocando a freccette il telefono resta appoggiato e non lo si tocca per
 * minuti: senza questo si blocca da solo e va risvegliato a ogni visita.
 *
 * L'API (Screen Wake Lock) non c'e' ovunque — su iOS e' arrivata con Safari
 * 16.4 — e il permesso puo' essere negato, per esempio con la batteria quasi
 * scarica. In quei casi non si fa nulla: e' una comodita', non un requisito.
 */
export function usaSchermoAcceso(attivo: boolean): void {
  useEffect(() => {
    if (!attivo || !("wakeLock" in navigator)) return;

    let blocco: WakeLockSentinel | null = null;
    let annullato = false;

    const chiedi = async () => {
      // Se ne abbiamo gia' uno valido non se ne chiede un altro: ne
      // resterebbero due attivi e la pulizia ne rilascerebbe soltanto uno.
      if (blocco && !blocco.released) return;
      try {
        const nuovo = await navigator.wakeLock.request("screen");
        // Nel frattempo il componente puo' essere sparito: in quel caso il
        // blocco appena ottenuto va rilasciato subito, o resterebbe attivo.
        if (annullato) void nuovo.release();
        else blocco = nuovo;
      } catch {
        /* negato o non disponibile: si gioca lo stesso */
      }
    };

    // Il sistema rilascia il blocco quando la pagina passa in secondo piano
    // (schermata home, cambio app): tornando visibile va richiesto di nuovo.
    const alRitorno = () => {
      if (!annullato && document.visibilityState === "visible") void chiedi();
    };

    void chiedi();
    document.addEventListener("visibilitychange", alRitorno);

    return () => {
      annullato = true;
      document.removeEventListener("visibilitychange", alRitorno);
      void blocco?.release().catch(() => {});
    };
  }, [attivo]);
}
