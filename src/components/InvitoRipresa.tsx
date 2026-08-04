import { quandoRipresa, type Ripresa } from "../lib/ripresa";

interface Props {
  ripresa: Ripresa<unknown>;
  onRiprendi: () => void;
  onScarta: () => void;
}

/**
 * Invito a riprendere una partita lasciata a meta'. Si offre, non si riprende
 * da soli: ritrovarsi dentro una partita vecchia quando se ne voleva iniziare
 * una nuova sarebbe peggio del problema che si vuole risolvere.
 */
export function InvitoRipresa({ ripresa, onRiprendi, onScarta }: Props) {
  return (
    <div className="scheda ripresa">
      <div className="ripresa-testi">
        <strong>⏸️ Partita in corso</strong>
        <span className="mini">
          {ripresa.descrizione} · {quandoRipresa(ripresa.aggiornata)}
        </span>
      </div>
      <div className="ripresa-azioni">
        <button className="bottone secondario piccolo" onClick={onScarta}>
          Scarta
        </button>
        <button className="bottone piccolo" onClick={onRiprendi}>
          ▶ Riprendi
        </button>
      </div>
    </div>
  );
}
