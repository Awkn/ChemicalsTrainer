import { InputBersaglio } from "./InputBersaglio";
import { Tastierino } from "./Tastierino";
import { setModoInput, usaModoInput } from "./preferenza";
import type { ModoChiusura } from "../gioco501/logica501";
import type { Tirata } from "./tirata";

interface Props {
  /** Punteggio da abbattere (rimanente del leg o bersaglio da chiudere). */
  rimanente: number;
  /** Regola di chiusura, usata dall'input a bersaglio. */
  chiusura?: ModoChiusura;
  onInvia: (tirata: Tirata) => void;
}

/**
 * Inserimento della tirata, nel modo scelto dall'utente: tastierino (totale
 * delle 3 frecce) oppure bersaglio (si tocca dove e' finita ogni freccia).
 * Il pulsante in alto scambia i due e la scelta viene ricordata per tutti i
 * giochi. I giochi consumano sempre la stessa `Tirata`, quindi non gli importa
 * quale dei due sia attivo.
 */
export function InputTirata({ rimanente, chiusura, onInvia }: Props) {
  const modo = usaModoInput();
  const bersaglio = modo === "bersaglio";

  return (
    <div className="input-tirata">
      <div className="input-scelta">
        <button
          className={`input-tab${!bersaglio ? " attivo" : ""}`}
          onClick={() => setModoInput("tastierino")}
          aria-pressed={!bersaglio}
        >
          🔢 Tastierino
        </button>
        <button
          className={`input-tab${bersaglio ? " attivo" : ""}`}
          onClick={() => setModoInput("bersaglio")}
          aria-pressed={bersaglio}
        >
          🎯 Bersaglio
        </button>
      </div>

      {bersaglio ? (
        <InputBersaglio
          rimanente={rimanente}
          chiusura={chiusura}
          onInvia={onInvia}
        />
      ) : (
        <Tastierino rimanente={rimanente} onInvia={onInvia} />
      )}
    </div>
  );
}
