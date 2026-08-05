import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";
import { percorsoDaEsercizi } from "./registry";
import type { GiocoId } from "../../types";

/**
 * Hub dei giochi: accesso rapido dalla barra in basso, senza passare da un
 * programma. Ogni gioco parte nella sua forma giocabile (i due "a oltranza"
 * come sfida a 10 tentativi) e a fine partita salva e condivide il risultato.
 */

interface VoceGioco {
  chiave: string;
  titolo: string;
  descrizione: string;
  icona: string;
  /** Percorso fisso (501) oppure gioco da collegare al suo esercizio. */
  percorsoFisso?: string;
  gioco?: GiocoId;
}

const GIOCHI_HUB: VoceGioco[] = [
  {
    chiave: "501",
    titolo: "501",
    descrizione: "Contro il bot o contro un amico: livelli, recap, statistiche.",
    icona: "🤖",
    percorsoFisso: "/501",
  },
  {
    chiave: "co121",
    titolo: "121 Checkout",
    descrizione: "Sfida a scaletta: 10 tentativi, sali chiudendo.",
    icona: "🎯",
    gioco: "co121",
  },
  {
    chiave: "bob27",
    titolo: "Bob's 27",
    descrizione: "Doppi da D1 fino al Bull.",
    icona: "🅱️",
    gioco: "bob27",
  },
  {
    chiave: "atc",
    titolo: "Around the Clock",
    descrizione: "Doppi in sequenza da D1 a D20.",
    icona: "🕐",
    gioco: "atc",
  },
  {
    chiave: "co61100",
    titolo: "61-100 Checkouts",
    descrizione: "Sfida da 10 checkout casuali.",
    icona: "🔟",
    gioco: "co61100",
  },
  {
    chiave: "co60170",
    titolo: "Checkout 60-170",
    descrizione: "30 chiusure casuali, una visita ciascuna.",
    icona: "🎲",
    gioco: "co60170",
  },
  {
    chiave: "gameshot",
    titolo: "Game Shot",
    descrizione: "I nove finali di partita, uno dopo l'altro.",
    icona: "🏁",
    gioco: "gameshot",
  },
  {
    chiave: "shanghai20",
    titolo: "Shanghai 20",
    descrizione: "Singolo, triplo e doppio del 20 nella stessa visita.",
    icona: "🀄",
    gioco: "shanghai20",
  },
  {
    chiave: "dpgame",
    titolo: "Doubles Pressure Game",
    descrizione: "Dieci doppi a sorte: prima freccia +3, fuori −1.",
    icona: "💥",
    gioco: "dpgame",
  },
  {
    chiave: "ladder",
    titolo: "Doubles Ladder",
    descrizione: "Da D1 a D20 in sequenza, 3 frecce per doppio.",
    icona: "🪜",
    gioco: "ladder",
  },
  {
    chiave: "pressuredoubles",
    titolo: "Pressure Doubles",
    descrizione: "Cinque doppi, cinque centri di fila ciascuno.",
    icona: "🔥",
    gioco: "pressuredoubles",
  },
  {
    chiave: "cricket",
    titolo: "Cricket",
    descrizione: "Contro un amico o contro il bot, classico o cut-throat.",
    icona: "🏏",
    percorsoFisso: "/cricket",
  },
  {
    chiave: "drilldoppio",
    titolo: "Doppio mirato",
    descrizione: "21 frecce su un solo doppio, per lavorare sul punto debole.",
    icona: "🔴",
    percorsoFisso: "/drill-doppio",
  },
];

export function GiochiPage() {
  const esercizi = useLiveQuery(() => db.esercizi.toArray(), []);

  // Primo esercizio di libreria per ciascun tipo di gioco.
  const perGioco = new Map<GiocoId, string>();
  esercizi?.forEach((e) => {
    if (e.gioco && !perGioco.has(e.gioco)) perGioco.set(e.gioco, e.id);
  });

  return (
    <section>
      <div className="pagina-testa">
        <div>
          <p className="occhiello">Gioca</p>
          <h2>Giochi</h2>
        </div>
      </div>

      <p className="mini">
        Scegli un gioco e parti: il risultato viene salvato nei Progressi e
        condiviso in squadra.
      </p>

      <div className="giochi-griglia">
        {GIOCHI_HUB.map((v) => {
          const esercizioId = v.gioco ? perGioco.get(v.gioco) : undefined;
          const to =
            v.percorsoFisso ??
            (v.gioco && esercizioId
              ? percorsoDaEsercizi(v.gioco, esercizioId)
              : null);
          if (!to) return null; // esercizio non ancora in libreria

          return (
            <Link key={v.chiave} to={to} className="gioco-card">
              <span className="gioco-icona">{v.icona}</span>
              <strong>{v.titolo}</strong>
              <span className="mini">{v.descrizione}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
