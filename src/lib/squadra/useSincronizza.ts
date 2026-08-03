import { useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { usaNomeGiocatore } from "../giocatore";
import { squadraConfigurata } from "./config";
import { calcolaRiepilogo } from "./riepilogo";

/**
 * Tiene aggiornata la bacheca di squadra: ripubblica il riepilogo quando
 * cambiano i risultati locali e quando si sceglie (o si cambia) il nome. Non
 * fa nulla se manca la configurazione o se il nome non c'e' ancora.
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

  // Il nome deve arrivare da un hook, non da una lettura secca: cambiandolo
  // questo effetto deve ripartire, o entrando in squadra non si pubblica
  // nulla fino al riavvio dell'app.
  const nome = usaNomeGiocatore();

  const ultimaInviata = useRef<string | null>(null);
  const nomeAllAvvio = useRef(nome);

  useEffect(() => {
    if (!squadraConfigurata() || firma === undefined) return;
    if (!nome) {
      // Uscito dalla squadra: dimenticando cosa e' stato pubblicato, un
      // eventuale rientro ripubblica anche senza nuovi risultati.
      ultimaInviata.current = null;
      return;
    }

    // Il nome fa parte della chiave: cambiandolo si ripubblica anche se i
    // risultati sono gli stessi.
    const chiave = `${nome}|${firma}`;
    if (ultimaInviata.current === chiave) return;

    // Se il nome e' diverso da quello con cui l'app e' partita vuol dire che
    // si e' appena entrati in squadra: si pubblica subito, perche' si sta
    // guardando la bacheca aspettando di comparire.
    const attesa = nome === nomeAllAvvio.current ? 3000 : 0;

    const timer = setTimeout(async () => {
      try {
        // import su richiesta: Firebase si carica solo se c'e' da pubblicare
        const { pubblicaRiepilogo } = await import("./client");
        const riepilogo = await calcolaRiepilogo(nome);
        await pubblicaRiepilogo(riepilogo);
        ultimaInviata.current = chiave;
      } catch (e) {
        // offline o permessi: si riprovera' al prossimo cambiamento
        console.warn("Pubblicazione riepilogo non riuscita:", e);
      }
    }, attesa);

    return () => clearTimeout(timer);
  }, [firma, nome]);
}
