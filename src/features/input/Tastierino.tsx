import { useState } from "react";
import { punteggioValido } from "../gioco501/logica501";
import { tirataDaTotale, type Tirata } from "./tirata";

interface Props {
  /** Chiamato all'invio con un punteggio valido. */
  onInvia: (tirata: Tirata) => void;
  /** Passa all'input a bersaglio: il pulsante sta nel display, non in una riga a parte. */
  onCambiaModo?: () => void;
}

const RAPIDI = [26, 41, 45, 60, 81, 85, 100, 140, 180];

/**
 * Tastierino per inserire il totale (0-180) della tirata da 3 freccette.
 * Valida che sia un punteggio ottenibile; i "bust" invece sono ammessi e
 * gestiti dal motore di gioco.
 */
export function Tastierino({ onInvia, onCambiaModo }: Props) {
  const [testo, setTesto] = useState("");
  const [errore, setErrore] = useState<string | null>(null);

  const valore = testo === "" ? null : parseInt(testo, 10);

  function digita(d: string) {
    setErrore(null);
    // aggiornamento funzionale: con tocchi ravvicinati il valore letto dalla
    // closure sarebbe ancora quello vecchio e si perderebbero le cifre
    setTesto((precedente) => {
      const nuovo = (precedente + d).replace(/^0+(?=\d)/, "");
      return parseInt(nuovo, 10) > 180 ? precedente : nuovo; // niente sopra 180
    });
  }

  function invia(p: number) {
    if (!punteggioValido(p)) {
      setErrore("Punteggio non ottenibile con 3 freccette.");
      return;
    }
    setTesto("");
    setErrore(null);
    onInvia(tirataDaTotale(p));
  }

  return (
    <div className="tastierino">
      <div className="tast-display">
        {onCambiaModo && (
          <button
            className="brs-modo"
            onClick={onCambiaModo}
            aria-label="Passa all'input a bersaglio"
            title="Passa all'input a bersaglio"
          >
            🎯
          </button>
        )}
        <span className={valore == null ? "placeholder" : ""}>
          {valore == null ? "punteggio tirata" : valore}
        </span>
        {testo !== "" && (
          <button
            className="icona-btn mini-btn"
            onClick={() => setTesto((prec) => prec.slice(0, -1))}
            aria-label="Cancella"
          >
            ⌫
          </button>
        )}
      </div>

      {errore && <p className="esito-ko">⚠️ {errore}</p>}

      <div className="tast-rapidi">
        {RAPIDI.map((n) => (
          <button key={n} className="chip-punteggio" onClick={() => invia(n)}>
            {n}
          </button>
        ))}
      </div>

      <div className="tast-griglia">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} className="tast-btn" onClick={() => digita(d)}>
            {d}
          </button>
        ))}
        <button className="tast-btn" onClick={() => digita("0")}>
          0
        </button>
        <button className="tast-btn" onClick={() => digita("00")}>
          00
        </button>
        <button
          className="tast-btn invia"
          disabled={valore == null}
          onClick={() => valore != null && invia(valore)}
        >
          OK
        </button>
      </div>
    </div>
  );
}
