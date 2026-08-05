import { Link } from "react-router-dom";
import { ListaBarre } from "../../components/ListaBarre";
import { usaPartite } from "../../lib/partite";
import {
  distribuzione,
  unisciFasce,
  type StatoPartita,
} from "../gioco501/logica501";

/**
 * Come tiri, sommando le partite in archivio.
 *
 * Nel recap la distribuzione parla di una serata sola, e una serata puo'
 * mentire. Qui le partite si sommano: e' questo il numero che dice se il
 * problema e' la punta (pochi 100+) o la costanza (troppe sotto i 60).
 * Si ferma alle partite in archivio perche' sono le uniche che conservano il
 * dettaglio dei tiri: nei Progressi restano solo le medie.
 */
export function SchedaDistribuzione() {
  const partite = usaPartite();
  if (!partite) return null;

  // Le partite archiviate prima di questa scheda non hanno le fasce: si
  // contano solo quelle che le portano, altrimenti il totale mentirebbe.
  const conFasce = partite
    .filter((p) => p.gioco === "501")
    .map((p) => (p.stato as StatoPartita).statsUno?.fasce)
    .filter((f) => f != null);

  const righe = distribuzione(unisciFasce(conFasce));
  if (righe.length === 0) return null;

  const visite = righe.reduce((s, f) => s + f.visite, 0);
  const conDati = conFasce.length;

  return (
    <div className="scheda">
      <div className="metrica-testa">
        <h3>📊 Come tiri</h3>
        <div className="metrica-valore">
          <strong>{visite}</strong>
        </div>
      </div>
      <p className="mini">
        Tirate da 3 freccette in {conDati}{" "}
        {conDati === 1 ? "partita" : "partite"} d'<Link to="/partite">archivio</Link>.
      </p>
      <ListaBarre
        righe={righe.map((f) => ({
          chiave: f.id,
          etichetta: f.etichetta,
          percentuale: f.percentuale,
          testo: `${f.visite} · ${f.percentuale}%`,
        }))}
      />
    </div>
  );
}
