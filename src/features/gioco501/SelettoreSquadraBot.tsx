import { useMedieSquadra, type MediaCompagno } from "../../lib/squadra/useMedieSquadra";
import { squadraConfigurata } from "../../lib/squadra/config";

interface Props {
  /** compagnoId attualmente selezionato come livello del bot, se presente. */
  selezionatoId?: string;
  onScegli: (compagno: MediaCompagno) => void;
}

/**
 * Elenco dei compagni che hanno una media 501 (propria o condivisa): scegliendone
 * uno il bot gioca con la sua media. Carica Firebase solo quando viene montato.
 */
export function SelettoreSquadraBot({ selezionatoId, onScegli }: Props) {
  const { compagni, caricato } = useMedieSquadra();

  if (!squadraConfigurata()) {
    return (
      <p className="mini squadra-bot-vuoto">
        La bacheca di squadra non è configurata su questo dispositivo.
      </p>
    );
  }

  if (!caricato) {
    return (
      <p className="mini squadra-bot-vuoto">
        <span className="spinner" /> Carico le medie della squadra…
      </p>
    );
  }

  if (compagni.length === 0) {
    return (
      <p className="mini squadra-bot-vuoto">
        Nessuna media 501 ancora disponibile. Gioca una partita (verrà salvata)
        oppure aspetta che un compagno condivida la sua.
      </p>
    );
  }

  return (
    <div className="opzioni-lista">
      {compagni.map((c) => (
        <button
          key={c.id}
          className={selezionatoId === c.id ? "opzione attiva" : "opzione"}
          onClick={() => onScegli(c)}
        >
          <strong>
            {c.nome}
            {c.sonoIo ? " (tu)" : ""}
          </strong>
          <span className="mini">Media {Math.round(c.media)}</span>
        </button>
      ))}
    </div>
  );
}
