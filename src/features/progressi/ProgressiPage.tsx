import { useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";
import { eliminaRisultato, risultatiPerEsercizio } from "../../lib/repo";
import { Grafico, formattaValore } from "../../components/Grafico";
import { dataIso } from "../../lib/date";
import { eMiglioramento, type MetricaDef } from "../../types";
import { CruscottoObiettivi } from "./CruscottoObiettivi";
import { SchedaDoppi } from "./SchedaDoppi";

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
          <p className="mini">
            Nel frattempo puoi già decidere i tuoi{" "}
            <Link to="/obiettivi">traguardi</Link>.
          </p>
        </div>
      </section>
    );
  }

  // Esercizi senza metriche (es. riscaldamenti): si mostra la costanza.
  const metriche: MetricaDef[] = esercizio?.metriche ?? [];
  const daSpuntare = metriche.length === 0;

  return (
    <section>
      <div className="pagina-testa">
        <div>
          <p className="occhiello">Statistiche</p>
          <h2>Progressi</h2>
        </div>
      </div>

      {/* Cruscotto e doppi non appartengono a un esercizio: il primo li
          attraversa tutti, i secondi arrivano da piu' giochi. Stanno quindi
          sopra al selettore, non dentro. */}
      <CruscottoObiettivi />
      <SchedaDoppi />

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

      {daSpuntare && <Costanza date={(risultati ?? []).map((r) => r.data)} />}

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
                  // la freccia indica la direzione, il colore se e' un progresso
                  <span
                    className={
                      eMiglioramento(m, delta) ? "delta su" : "delta giu"
                    }
                  >
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
        <h3>{daSpuntare ? "Quando l'hai fatto" : "Sessioni registrate"}</h3>
        <ul className="lista-sessioni">
          {[...(risultati ?? [])]
            .sort((a, b) => b.data.localeCompare(a.data))
            .map((r) => (
              <li key={r.id} className="sessione">
                <div>
                  <strong>{r.data}</strong>
                  <span className="sessione-valori">
                    {daSpuntare
                      ? "✓ Fatto"
                      : metriche
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

/**
 * Riepilogo di costanza per gli esercizi senza punteggio: quante volte sono
 * stati fatti, quando l'ultima volta e quanti negli ultimi 30 giorni.
 */
function Costanza({ date }: { date: string[] }) {
  if (date.length === 0) return null;

  const ordinate = [...date].sort();
  const ultima = ordinate[ordinate.length - 1];

  const limite = new Date();
  limite.setDate(limite.getDate() - 30);
  const soglia = dataIso(limite);
  const ultimi30 = ordinate.filter((d) => d >= soglia).length;

  const oggi = dataIso();
  const ieri = new Date();
  ieri.setDate(ieri.getDate() - 1);
  const etichettaUltima =
    ultima === oggi
      ? "oggi"
      : ultima === dataIso(ieri)
        ? "ieri"
        : ultima.split("-").reverse().join("/");

  return (
    <div className="scheda costanza">
      <div className="costanza-box">
        <strong>{date.length}</strong>
        <span className="mini">volte in totale</span>
      </div>
      <div className="costanza-box">
        <strong>{ultimi30}</strong>
        <span className="mini">ultimi 30 giorni</span>
      </div>
      <div className="costanza-box">
        <strong>{etichettaUltima}</strong>
        <span className="mini">ultima volta</span>
      </div>
    </div>
  );
}
