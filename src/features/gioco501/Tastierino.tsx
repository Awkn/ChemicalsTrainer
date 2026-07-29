import { useState } from "react";
import { punteggioValido } from "./logica501";

interface Props {
  /** Punteggio rimanente, per validazioni/hint. */
  rimanente: number;
  /** Chiamato all'invio con un punteggio valido. */
  onInvia: (punteggio: number) => void;
}

const RAPIDI = [26, 41, 45, 60, 81, 85, 100, 140, 180];

/**
 * Tastierino per inserire il totale (0-180) della tirata da 3 freccette.
 * Valida che sia un punteggio ottenibile; i "bust" invece sono ammessi e
 * gestiti dal motore di gioco.
 */
export function Tastierino({ rimanente, onInvia }: Props) {
  const [testo, setTesto] = useState("");
  const [errore, setErrore] = useState<string | null>(null);

  const valore = testo === "" ? null : parseInt(testo, 10);

  function digita(d: string) {
    setErrore(null);
    const nuovo = (testo + d).replace(/^0+(?=\d)/, "");
    if (parseInt(nuovo, 10) > 180) return; // niente sopra 180
    setTesto(nuovo);
  }

  function invia(p: number) {
    if (!punteggioValido(p)) {
      setErrore("Punteggio non ottenibile con 3 freccette.");
      return;
    }
    setTesto("");
    setErrore(null);
    onInvia(p);
  }

  return (
    <div className="tastierino">
      <div className="tast-display">
        <span className={valore == null ? "placeholder" : ""}>
          {valore == null ? "punteggio tirata" : valore}
        </span>
        {testo !== "" && (
          <button
            className="icona-btn mini-btn"
            onClick={() => setTesto(testo.slice(0, -1))}
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
        <button
          className="tast-btn"
          onClick={() => invia(0)}
          title="Nessun punto"
        >
          0
        </button>
        <button className="tast-btn" onClick={() => digita("0")}>
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

      <p className="mini tast-hint">Rimanente: {rimanente}</p>
    </div>
  );
}
