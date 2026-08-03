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
  // Nome con cui si e' gia' sulla bacheca. All'avvio si presume sia quello
  // salvato: se non lo fosse, la pubblicazione lo rimettera' a posto.
  const nomeInBacheca = useRef(nome);

  useEffect(() => {
    if (!squadraConfigurata() || firma === undefined) return;
    if (!nome) {
      // Uscito dalla squadra: dimenticando cosa e' stato pubblicato, un
      // eventuale rientro ripubblica anche senza nuovi risultati.
      ultimaInviata.current = null;
      nomeInBacheca.current = null;
      return;
    }

    // Il nome fa parte della chiave: cambiandolo si ripubblica anche se i
    // risultati sono gli stessi.
    const chiave = `${nome}|${firma}`;
    if (ultimaInviata.current === chiave) return;

    // Se sulla bacheca c'e' un altro nome (o non ci si e' ancora) si pubblica
    // subito: si e' appena entrati in squadra o ci si e' rinominati, e in
    // entrambi i casi si sta guardando il risultato. L'attesa serve solo a
    // non pubblicare a ogni tocco mentre si registrano piu' risultati.
    const attesa = nome === nomeInBacheca.current ? 3000 : 0;

    const timer = setTimeout(async () => {
      try {
        // import su richiesta: Firebase si carica solo se c'e' da pubblicare
        const { pubblicaRiepilogo } = await import("./client");
        const riepilogo = await calcolaRiepilogo(nome);
        await pubblicaRiepilogo(riepilogo);
        ultimaInviata.current = chiave;
        nomeInBacheca.current = nome;
      } catch (e) {
        // offline o permessi: si riprovera' al prossimo cambiamento
        console.warn("Pubblicazione riepilogo non riuscita:", e);
      }
    }, attesa);

    return () => clearTimeout(timer);
  }, [firma, nome]);
}
