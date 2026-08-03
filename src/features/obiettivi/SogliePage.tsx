import { useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";
import { impostaObiettivo } from "../../lib/repo";
import type { Esercizio, MetricaDef } from "../../types";

/**
 * Le soglie del cruscotto, modificabili.
 *
 * Vivono dentro la definizione delle metriche di ogni esercizio, dove finora
 * ci arrivavano solo il seed e le migrazioni. Qui si toccano a mano: gli
 * obiettivi di chi si allena cambiano man mano che migliora, e una soglia
 * ferma a un valore deciso da noi smette presto di dire qualcosa.
 *
 * Si salva uscendo dal campo, non con un pulsante finale: le righe sono
 * indipendenti, e un "Salva" unico farebbe credere che senza toccarlo le
 * modifiche vadano perse.
 */
export function SogliePage() {
  const esercizi = useLiveQuery(async () => {
    const tutti = await db.esercizi.orderBy("nome").toArray();
    return tutti.filter((e) => e.metriche && e.metriche.length > 0);
  }, []);

  if (!esercizi) return null;

  return (
    <section>
      <div className="pagina-testa">
        <div>
          <p className="occhiello">Progressi</p>
          <h2>Le tue soglie</h2>
        </div>
      </div>

      <div className="scheda">
        <p className="mini">
          Sono i traguardi su cui il cruscotto ti dà verde o rosso. Alzali man
          mano che migliori. Lascia il campo <strong>vuoto</strong> per non
          avere una soglia: la metrica resta nei grafici ma esce dal cruscotto.
        </p>
        <Link className="bottone secondario" to="/progressi">
          Torna ai progressi
        </Link>
      </div>

      {esercizi.length === 0 ? (
        <div className="vuoto">
          <p>Nessun esercizio con metriche da misurare.</p>
        </div>
      ) : (
        esercizi.map((e) => <SchedaEsercizio key={e.id} esercizio={e} />)
      )}
    </section>
  );
}

function SchedaEsercizio({ esercizio }: { esercizio: Esercizio }) {
  return (
    <div className="scheda">
      <h3>{esercizio.nome}</h3>
      <ul className="soglie-lista">
        {(esercizio.metriche ?? []).map((m) => (
          <RigaSoglia key={m.id} esercizioId={esercizio.id} metrica={m} />
        ))}
      </ul>
    </div>
  );
}

interface RigaProps {
  esercizioId: string;
  metrica: MetricaDef;
}

function RigaSoglia({ esercizioId, metrica }: RigaProps) {
  // `null` = non modificato, quindi si mostra il valore salvato. Cosi' il
  // campo segue il database senza doverlo risincronizzare a ogni scrittura.
  const [bozza, setBozza] = useState<string | null>(null);
  const [salvato, setSalvato] = useState(false);

  const valoreSalvato = metrica.obiettivo != null ? String(metrica.obiettivo) : "";
  const valore = bozza ?? valoreSalvato;
  const menoEMeglio = metrica.verso === "basso";

  /**
   * `testo` arriva dal campo, non dallo stato: cosi' il valore letto e' quello
   * che si vede, anche se React non ha ancora rifatto il giro.
   */
  async function conferma(testo: string) {
    const pulito = testo.trim().replace(",", ".");
    const numero = pulito === "" ? null : Number(pulito);

    // Testo non numerico o negativo: si torna al valore salvato invece di
    // scrivere qualcosa di insensato.
    if (numero != null && (!Number.isFinite(numero) || numero < 0)) {
      setBozza(null);
      return;
    }
    if (numero === metrica.obiettivo || (numero == null && metrica.obiettivo == null)) {
      setBozza(null);
      return;
    }

    await impostaObiettivo(esercizioId, metrica.id, numero);
    setBozza(null);
    setSalvato(true);
    setTimeout(() => setSalvato(false), 1500);
  }

  return (
    <li className="soglia-riga">
      <div className="soglia-nome">
        <span>{metrica.nome}</span>
        <span className="mini">
          {menoEMeglio ? "meno è meglio" : "più alto è meglio"}
          {metrica.obiettivo == null && " · nessuna soglia"}
        </span>
      </div>

      <div className="soglia-campo">
        <span className="soglia-segno">{menoEMeglio ? "≤" : "≥"}</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={valore}
          placeholder="—"
          aria-label={`Obiettivo per ${metrica.nome}`}
          onChange={(ev) => setBozza(ev.target.value)}
          onBlur={(ev) => conferma(ev.currentTarget.value)}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") ev.currentTarget.blur();
          }}
        />
        {metrica.unita === "percentuale" && (
          <span className="soglia-unita">%</span>
        )}
        <span className={salvato ? "soglia-ok visibile" : "soglia-ok"}>✓</span>
      </div>
    </li>
  );
}

export default SogliePage;
