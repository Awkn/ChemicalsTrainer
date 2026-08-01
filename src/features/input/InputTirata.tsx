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
 * La scelta viene ricordata per tutti i giochi. I giochi consumano sempre la
 * stessa `Tirata`, quindi non gli importa quale dei due sia attivo.
 *
 * Lo scambio e' un pulsantino dentro la barra dell'input attivo (🎯 nel
 * tastierino, 🔢 nel bersaglio) invece di una riga di linguette a se': su un
 * telefono quella riga sarebbe altezza tolta al gioco, che gia' fatica a
 * entrare nello schermo.
 */
export function InputTirata({ rimanente, chiusura, onInvia }: Props) {
  const modo = usaModoInput();

  if (modo === "bersaglio") {
    return (
      <InputBersaglio
        rimanente={rimanente}
        chiusura={chiusura}
        onInvia={onInvia}
        onCambiaModo={() => setModoInput("tastierino")}
      />
    );
  }

  return (
    <Tastierino onInvia={onInvia} onCambiaModo={() => setModoInput("bersaglio")} />
  );
}
