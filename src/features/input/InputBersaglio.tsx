import { useState } from "react";
import {
  BANDE,
  CENTRO,
  DARDO_FUORI,
  eDoppio,
  eTriplo,
  etichettaDardo,
  LATO,
  pathSettore,
  posizioneNumero,
  puntiDardo,
  RAGGI,
  SETTORI,
  type Dardo,
} from "../../lib/bersaglio";
import type { ModoChiusura } from "../gioco501/logica501";
import type { Tirata } from "./tirata";

interface Props {
  /** Punteggio da abbattere: serve a capire da solo chiusure e sballi. */
  rimanente: number;
  /** Regola di chiusura in vigore (per decidere se uno zero e' valido). */
  chiusura?: ModoChiusura;
  onInvia: (tirata: Tirata) => void;
}

/** La freccia chiude, secondo la regola in vigore? */
function chiudeCon(d: Dardo, modo: ModoChiusura): boolean {
  if (modo === "single") return true;
  if (modo === "master") return eDoppio(d) || eTriplo(d);
  return eDoppio(d);
}

/**
 * Input a bersaglio: si tocca dove e' finita ogni freccia invece di calcolare
 * il totale a mente. La visita si chiude da sola quando le tre frecce sono
 * state inserite, quando il punteggio va a zero o quando si sballa: cosi' il
 * gioco sa quante frecce sono servite davvero e dove sono andate.
 */
export function InputBersaglio({ rimanente, chiusura = "double", onInvia }: Props) {
  const [dardi, setDardi] = useState<Dardo[]>([]);

  const totale = dardi.reduce((s, d) => s + puntiDardo(d), 0);
  const restante = rimanente - totale;

  function aggiungi(d: Dardo) {
    const nuovi = [...dardi, d];
    const somma = nuovi.reduce((s, x) => s + puntiDardo(x), 0);
    const dopo = rimanente - somma;

    // Zero: chiusura valida solo se l'ultima freccia rispetta la regola d'uscita.
    if (dopo === 0) {
      concludi(nuovi, somma, !chiudeCon(d, chiusura));
      return;
    }
    // Sballato: sotto zero, oppure a 1 quando serve un doppio per chiudere.
    if (dopo < 0 || (dopo === 1 && chiusura !== "single")) {
      concludi(nuovi, somma, true);
      return;
    }
    if (nuovi.length === 3) {
      concludi(nuovi, somma, false);
      return;
    }
    setDardi(nuovi);
  }

  function concludi(nuovi: Dardo[], somma: number, bust: boolean) {
    setDardi([]);
    onInvia({ punteggio: somma, frecce: nuovi.length, dardi: nuovi, bust });
  }

  function annullaUltimo() {
    setDardi((d) => d.slice(0, -1));
  }

  return (
    <div className="bersaglio-input">
      <div className="brs-display">
        <div className="brs-dardi">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`brs-dardo${dardi[i] ? " pieno" : ""}`}
            >
              {dardi[i] ? etichettaDardo(dardi[i]) : "·"}
            </span>
          ))}
        </div>
        <div className="brs-conti">
          <span className="brs-totale">{totale}</span>
          <span className="mini">resta {Math.max(restante, 0)}</span>
        </div>
        {dardi.length > 0 && (
          <button
            className="icona-btn mini-btn"
            onClick={annullaUltimo}
            aria-label="Cancella l'ultima freccia"
          >
            ⌫
          </button>
        )}
      </div>

      <svg
        className="brs-svg"
        viewBox={`0 0 ${LATO} ${LATO}`}
        role="group"
        aria-label="Bersaglio: tocca dove è finita la freccia"
      >
        <circle cx={CENTRO} cy={CENTRO} r={RAGGI.doppio + 22} className="brs-bordo" />

        {SETTORI.map((numero, i) =>
          BANDE.map((banda, b) => {
            const dardo: Dardo = { settore: numero, anello: banda.anello };
            // Colori alternati come sul tabellone vero: i settori pari sono
            // scuri con anelli rossi, i dispari chiari con anelli verdi.
            const scuro = i % 2 === 0;
            const anelloColorato = banda.anello !== "singolo";
            const classe = anelloColorato
              ? scuro
                ? "brs-rosso"
                : "brs-verde"
              : scuro
                ? "brs-nero"
                : "brs-crema";
            return (
              <path
                key={`${numero}-${b}`}
                d={pathSettore(i, banda.da, banda.a)}
                className={`brs-zona ${classe}`}
                onClick={() => aggiungi(dardo)}
              >
                <title>{etichettaDardo(dardo)}</title>
              </path>
            );
          }),
        )}

        <circle
          cx={CENTRO}
          cy={CENTRO}
          r={RAGGI.bullEsterno}
          className="brs-zona brs-verde"
          onClick={() => aggiungi({ settore: 25, anello: "bullEsterno" })}
        >
          <title>25</title>
        </circle>
        <circle
          cx={CENTRO}
          cy={CENTRO}
          r={RAGGI.bull}
          className="brs-zona brs-rosso"
          onClick={() => aggiungi({ settore: 25, anello: "bull" })}
        >
          <title>Bull</title>
        </circle>

        {SETTORI.map((numero, i) => {
          const [x, y] = posizioneNumero(i);
          return (
            <text
              key={`n${numero}`}
              x={x}
              y={y}
              className="brs-numero"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {numero}
            </text>
          );
        })}
      </svg>

      <button className="bottone secondario brs-fuori" onClick={() => aggiungi(DARDO_FUORI)}>
        Fuori (0)
      </button>
    </div>
  );
}
