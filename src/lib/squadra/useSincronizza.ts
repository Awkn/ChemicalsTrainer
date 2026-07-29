import { useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { nomeGiocatore } from "../giocatore";
import { squadraConfigurata } from "./config";
import { calcolaRiepilogo } from "./riepilogo";

/**
 * Tiene aggiornata la bacheca di squadra: quando cambiano i risultati locali
 * ripubblica il riepilogo. Non fa nulla se manca la configurazione o se il
 * giocatore non ha ancora scelto un nome.
 *
 * L'invio e' ritardato di qualche secondo per non pubblicare a ogni singolo
 * tocco mentre si registrano piu' risultati di fila.
 */
export function useSincronizzaSquadra(): void {
  // Firma dei dati locali: cambia a ogni inserimento, modifica o rimozione.
  const firma = useLiveQuery(async () => {
    const risultati = await db.risultati.toArray();
    const ultimo = risultati.reduce((max, r) => Math.max(max, r.createdAt), 0);
    return `${risultati.length}:${ultimo}`;
  }, []);

  const ultimaInviata = useRef<string | null>(null);

  useEffect(() => {
    if (!squadraConfigurata() || firma === undefined) return;
    const nome = nomeGiocatore();
    if (!nome) return;
    if (ultimaInviata.current === firma) return;

    const timer = setTimeout(async () => {
      try {
        // import su richiesta: Firebase si carica solo se c'e' da pubblicare
        const { pubblicaRiepilogo } = await import("./client");
        const riepilogo = await calcolaRiepilogo(nome);
        await pubblicaRiepilogo(riepilogo);
        ultimaInviata.current = firma;
      } catch (e) {
        // offline o permessi: si riprovera' al prossimo cambiamento
        console.warn("Pubblicazione riepilogo non riuscita:", e);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [firma]);
}
