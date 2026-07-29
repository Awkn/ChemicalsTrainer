import { useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";
import { dataIso, giornoDiOggi } from "../../lib/date";
import { annullaFatto, segnaFatto } from "../../lib/repo";
import {
  eCompletamento,
  GIORNI,
  soloCompletamento,
  type Esercizio,
} from "../../types";
import { useProgrammaAttivo } from "../../lib/useProgrammaAttivo";
import { RegistraRisultato } from "../risultati/RegistraRisultato";

export function OggiPage() {
  const { programmi, attivo, seleziona } = useProgrammaAttivo();
  const oggi = giornoDiOggi();
  const dataOggi = dataIso();
  const [daRegistrare, setDaRegistrare] = useState<Esercizio | null>(null);

  // Esercizi gia' spuntati oggi (solo quelli senza metriche).
  const fattiOggi = useLiveQuery(async () => {
    const odierni = await db.risultati.where("data").equals(dataOggi).toArray();
    return new Set(odierni.filter(eCompletamento).map((r) => r.esercizioId));
  }, [dataOggi]);

  // Assegnazioni di oggi per il programma attivo, arricchite con l'esercizio.
  const compiti = useLiveQuery(async () => {
    if (!attivo) return [];
    const asg = await db.assegnazioni
      .where("[programmaId+giorno]")
      .equals([attivo.id, oggi])
      .toArray();
    asg.sort((a, b) => a.ordine - b.ordine);
    return Promise.all(
      asg.map(async (a) => ({
        assegnazione: a,
        esercizio: await db.esercizi.get(a.esercizioId),
      })),
    );
  }, [attivo?.id, oggi]);

  const nomeGiorno = GIORNI[oggi].nome;

  return (
    <section>
      <div className="pagina-testa">
        <div>
          <p className="occhiello">Allenamento di oggi</p>
          <h2>{nomeGiorno}</h2>
        </div>
      </div>

      {programmi.length > 1 && (
        <label className="campo">
          <span>Programma</span>
          <select
            value={attivo?.id ?? ""}
            onChange={(e) => seleziona(e.target.value)}
          >
            {programmi.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>
      )}

      {!attivo && (
        <div className="vuoto">
          <p>Non hai ancora nessun programma.</p>
          <Link className="bottone" to="/programma">
            Crea un programma
          </Link>
        </div>
      )}

      {attivo && compiti?.length === 0 && (
        <div className="vuoto">
          <p>
            Oggi ({nomeGiorno}) non hai esercizi programmati. Riposo! 😌
          </p>
          <Link className="bottone secondario" to="/programma">
            Modifica il programma
          </Link>
        </div>
      )}

      <ul className="lista-compiti">
        {compiti?.map(({ assegnazione, esercizio }) =>
          esercizio ? (
            <li key={assegnazione.id} className="compito">
              <div className="compito-testa">
                <span className={`tag tag-${slug(esercizio.categoria)}`}>
                  {esercizio.categoria}
                </span>
                <h3>{esercizio.nome}</h3>
                {esercizio.durataMin != null && (
                  <span className="durata">{esercizio.durataMin}′</span>
                )}
              </div>
              {esercizio.descrizione && (
                <p className="compito-desc">{esercizio.descrizione}</p>
              )}
              <p className="compito-obiettivo">
                🎯 {assegnazione.note || esercizio.obiettivo || "Nessun obiettivo"}
              </p>
              {soloCompletamento(esercizio) ? (
                <button
                  className={
                    fattiOggi?.has(esercizio.id)
                      ? "bottone piccolo compito-registra fatto"
                      : "bottone secondario piccolo compito-registra"
                  }
                  onClick={() =>
                    fattiOggi?.has(esercizio.id)
                      ? annullaFatto(esercizio.id, dataOggi)
                      : segnaFatto(esercizio.id, dataOggi)
                  }
                >
                  {fattiOggi?.has(esercizio.id) ? "✓ Fatto" : "Segna come fatto"}
                </button>
              ) : (
                <button
                  className="bottone secondario piccolo compito-registra"
                  onClick={() => setDaRegistrare(esercizio)}
                >
                  ＋ Registra risultato
                </button>
              )}
            </li>
          ) : null,
        )}
      </ul>

      {daRegistrare && (
        <RegistraRisultato
          esercizio={daRegistrare}
          onChiudi={() => setDaRegistrare(null)}
        />
      )}
    </section>
  );
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, "");
}
