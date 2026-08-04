import { Link } from "react-router-dom";
import { eliminaPartita, MAX_PARTITE, usaPartite } from "../../lib/partite";
import type { PartitaSalvata } from "../../types";

/**
 * Archivio delle ultime partite. La lista non sa niente delle regole dei
 * giochi: mostra il titolo gia' pronto salvato con la partita, e per il
 * dettaglio manda al recap del gioco che l'ha prodotta.
 */
export default function PartitePage() {
  const partite = usaPartite();

  return (
    <section>
      <div className="pagina-testa">
        <div>
          <p className="occhiello">Archivio</p>
          <h2>Le tue partite</h2>
        </div>
      </div>

      {partite && partite.length === 0 && (
        <div className="vuoto">
          <p>
            Nessuna partita in archivio. Gioca un 501 e a fine partita finisce
            qui, con tutto il recap. 🎯
          </p>
          <Link className="bottone" to="/501">
            Gioca un 501
          </Link>
        </div>
      )}

      {partite && partite.length > 0 && (
        <>
          <ul className="lista-partite">
            {partite.map((p) => (
              <RigaPartita key={p.id} partita={p} />
            ))}
          </ul>
          <p className="mini">
            Restano le ultime {MAX_PARTITE}: quando ne arriva una nuova, la più
            vecchia esce. Le statistiche invece restano tutte nei{" "}
            <Link to="/progressi">Progressi</Link>.
          </p>
        </>
      )}
    </section>
  );
}

function RigaPartita({ partita }: { partita: PartitaSalvata }) {
  return (
    <li className={`partita ${partita.vinta ? "vinta" : "persa"}`}>
      <Link to={`/partite/${partita.id}`} className="partita-corpo">
        <span className="partita-esito">{partita.vinta ? "🏆" : "—"}</span>
        <span className="partita-testi">
          <strong>{partita.titolo}</strong>
          <span className="mini">{partita.sottotitolo}</span>
          <span className="mini">{quando(partita.finita)}</span>
        </span>
      </Link>
      <button
        className="icona-btn mini-btn"
        title="Elimina dall'archivio"
        aria-label={`Elimina ${partita.titolo}`}
        onClick={() => {
          if (confirm("Togliere questa partita dall'archivio?")) {
            eliminaPartita(partita.id);
          }
        }}
      >
        🗑️
      </button>
    </li>
  );
}

export function quando(ms: number): string {
  return new Date(ms).toLocaleString("it-IT", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
