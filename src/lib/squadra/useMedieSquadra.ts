import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { nomeGiocatore } from "../giocatore";
import { squadraConfigurata } from "./config";
import type { VoceSquadra } from "./client";

/**
 * Medie 3-dart contro il bot dei compagni di squadra, per il "bot livello
 * squadra" del 501. La propria media viene calcolata in locale (funziona
 * anche offline e prima della sincronizzazione); quelle degli altri arrivano
 * dalla bacheca condivisa.
 */

export interface MediaCompagno {
  id: string;
  nome: string;
  media: number;
  sonoIo: boolean;
}

/** Nome dell'esercizio e della metrica da cui leggere la media 501. */
const ESERCIZIO_501 = "501 contro il computer";
const METRICA_MEDIA = "Media 3 dart";

/** Media locale piu' recente dell'utente sull'esercizio 501. */
function useMiaMedia501(): MediaCompagno | null {
  return (
    useLiveQuery(async () => {
      const esercizio = await db.esercizi
        .where("nome")
        .equals(ESERCIZIO_501)
        .first();
      if (!esercizio) return null;

      const metrica = esercizio.metriche?.find((m) => m.nome === METRICA_MEDIA);
      if (!metrica) return null;

      const risultati = await db.risultati
        .where("esercizioId")
        .equals(esercizio.id)
        .toArray();
      const conMedia = risultati
        .filter((r) => metrica.id in r.valori)
        .sort((a, b) => a.data.localeCompare(b.data));
      if (conMedia.length === 0) return null;

      const media = conMedia[conMedia.length - 1].valori[metrica.id];
      if (!(media > 0)) return null;

      return {
        id: "io",
        nome: nomeGiocatore() ?? "Tu",
        media,
        sonoIo: true,
      };
    }, []) ?? null
  );
}

export function useMedieSquadra(): { compagni: MediaCompagno[]; caricato: boolean } {
  const mia = useMiaMedia501();
  const [altri, setAltri] = useState<MediaCompagno[]>([]);
  const [caricato, setCaricato] = useState(!squadraConfigurata());

  useEffect(() => {
    if (!squadraConfigurata()) return;
    let stop = () => {};
    let annullato = false;

    // Firebase si carica solo qui, quando si apre il selettore squadra.
    import("./client")
      .then(({ ascoltaSquadra }) => {
        if (annullato) return;
        stop = ascoltaSquadra(
          (voci: VoceSquadra[]) => {
            const lista: MediaCompagno[] = [];
            for (const v of voci) {
              if (v.sonoIo) continue; // la propria media arriva dai dati locali
              const s = v.statistiche?.find(
                (x) => x.metrica === METRICA_MEDIA && x.ultimo > 0,
              );
              if (s) lista.push({ id: v.id, nome: v.nome, media: s.ultimo, sonoIo: false });
            }
            setAltri(lista);
            setCaricato(true);
          },
          () => setCaricato(true),
        );
      })
      .catch(() => setCaricato(true));

    return () => {
      annullato = true;
      stop();
    };
  }, []);

  const compagni = (mia ? [mia, ...altri] : altri).sort(
    (a, b) => b.media - a.media,
  );
  return { compagni, caricato };
}
