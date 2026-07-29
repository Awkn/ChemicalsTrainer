import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";
import { eliminaRisultato, risultatiPerEsercizio } from "../../lib/repo";
import { Grafico, formattaValore } from "../../components/Grafico";
import { METRICA_GENERICA, type MetricaDef } from "../../types";

export function ProgressiPage() {
  // Solo esercizi che hanno almeno un risultato registrato.
  const esercizi = useLiveQuery(async () => {
    const tutti = await db.esercizi.orderBy("nome").toArray();
    const conteggi = await Promise.all(
      tutti.map((e) => db.risultati.where("esercizioId").equals(e.id).count()),
    );
    return tutti.filter((_, i) => conteggi[i] > 0);
  }, []);

  const [selId, setSelId] = useState<string | null>(null);
  const idEffettivo =
    selId && esercizi?.some((e) => e.id === selId)
      ? selId
      : esercizi?.[0]?.id ?? null;

  const esercizio = esercizi?.find((e) => e.id === idEffettivo) ?? null;

  const risultati = useLiveQuery(
    () => (idEffettivo ? risultatiPerEsercizio(idEffettivo) : Promise.resolve([])),
    [idEffettivo],
  );

  if (esercizi && esercizi.length === 0) {
    return (
      <section>
        <div className="pagina-testa">
          <div>
            <p className="occhiello">Statistiche</p>
            <h2>Progressi</h2>
          </div>
        </div>
        <div className="vuoto">
          <p>
            Non hai ancora registrato risultati. Vai su <strong>Oggi</strong> e
            tocca <em>Registra</em> sotto un esercizio per iniziare a tracciare i
            tuoi progressi. 📈
          </p>
        </div>
      </section>
    );
  }

  // metriche da mostrare: quelle definite sull'esercizio, o quella generica.
  const metriche: MetricaDef[] =
    esercizio?.metriche && esercizio.metriche.length > 0
      ? esercizio.metriche
      : [{ id: METRICA_GENERICA, nome: "Valore", unita: "numero" }];

  return (
    <section>
      <div className="pagina-testa">
        <div>
          <p className="occhiello">Statistiche</p>
          <h2>Progressi</h2>
        </div>
      </div>

      <label className="campo">
        <span>Esercizio</span>
        <select
          value={idEffettivo ?? ""}
          onChange={(e) => setSelId(e.target.value)}
        >
          {esercizi?.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>
      </label>

      {metriche.map((m) => {
        const serie = (risultati ?? [])
          .filter((r) => m.id in r.valori)
          .map((r) => ({ data: r.data, valore: r.valori[m.id] }));
        if (serie.length === 0) return null;

        const ultimo = serie[serie.length - 1].valore;
        const prec = serie.length > 1 ? serie[serie.length - 2].valore : null;
        const delta = prec != null ? ultimo - prec : null;

        return (
          <div className="scheda" key={m.id}>
            <div className="metrica-testa">
              <h3>{m.nome}</h3>
              <div className="metrica-valore">
                <strong>{formattaValore(ultimo, m.unita)}</strong>
                {delta != null && delta !== 0 && (
                  <span className={delta > 0 ? "delta su" : "delta giu"}>
                    {delta > 0 ? "▲" : "▼"}{" "}
                    {formattaValore(Math.abs(delta), m.unita)}
                  </span>
                )}
              </div>
            </div>
            <Grafico punti={serie} obiettivo={m.obiettivo} unita={m.unita} />
          </div>
        );
      })}

      <div className="scheda">
        <h3>Sessioni registrate</h3>
        <ul className="lista-sessioni">
          {[...(risultati ?? [])]
            .sort((a, b) => b.data.localeCompare(a.data))
            .map((r) => (
              <li key={r.id} className="sessione">
                <div>
                  <strong>{r.data}</strong>
                  <span className="sessione-valori">
                    {metriche
                      .filter((m) => m.id in r.valori)
                      .map(
                        (m) =>
                          `${m.nome}: ${formattaValore(r.valori[m.id], m.unita)}`,
                      )
                      .join(" · ")}
                  </span>
                  {r.note && <p className="mini">{r.note}</p>}
                </div>
                <button
                  className="icona-btn mini-btn"
                  title="Elimina"
                  onClick={() => eliminaRisultato(r.id)}
                >
                  🗑️
                </button>
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
}
