import { Link, useParams } from "react-router-dom";
import { usaPartita } from "../../lib/partite";
import { Recap501 } from "../gioco501/Recap501";
import type { StatoPartita } from "../gioco501/logica501";

/**
 * Recap di una partita archiviata. Ogni gioco disegna il suo: qui si sceglie
 * quale in base a `gioco`, che e' l'unico campo che dice come leggere `stato`.
 */
export default function RecapPartitaPage() {
  const { id } = useParams();
  const partita = usaPartita(id);

  if (partita === undefined) return <p className="mini">Carico…</p>;

  if (partita === null) {
    return (
      <section>
        <div className="vuoto">
          <p>Questa partita non è più in archivio.</p>
          <Link className="bottone secondario" to="/partite">
            Torna alle partite
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <Link className="bottone secondario piccolo torna-partite" to="/partite">
        ← Le tue partite
      </Link>
      {partita.gioco === "501" && (
        <Recap501 stato={partita.stato as StatoPartita} />
      )}
    </>
  );
}
