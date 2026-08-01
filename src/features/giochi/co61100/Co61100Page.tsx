import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../lib/db";
import { registraRisultato } from "../../../lib/repo";
import { dataIso } from "../../../lib/date";
import { suggerisciChiusura } from "../../../lib/checkout";
import { InputTirata } from "../../input/InputTirata";
import type { Tirata } from "../../input/tirata";
import {
  bersaglioCasuale,
  creaCo61100,
  inviaPunteggio,
  percentualeSuccesso,
  risultatoCo61100,
  type StatoCo61100,
} from "./logica";

/** Numero di tentativi della sfida a numero chiuso (dalla sezione Esercizi). */
const TENTATIVI_SFIDA = 10;

/**
 * 61-100 Checkouts giocabile: bersaglio casuale, una visita per chiuderlo.
 * Con `?sfida=1` (dalla sezione Esercizi) e' una sfida da 10 tentativi che si
 * conclude da sola; altrimenti la sessione classica a oltranza.
 */
export default function Co61100Page() {
  const { esercizioId } = useParams<{ esercizioId: string }>();
  const [params] = useSearchParams();
  const sfida = !!params.get("sfida");
  const tornaA = sfida ? "/esercizi" : "/";
  const navigate = useNavigate();
  const esercizio = useLiveQuery(
    () => (esercizioId ? db.esercizi.get(esercizioId) : undefined),
    [esercizioId],
  );

  const [storia, setStoria] = useState<StatoCo61100[]>(() => [
    creaCo61100(bersaglioCasuale()),
  ]);
  const stato = storia[storia.length - 1];
  const [fine, setFine] = useState(false);
  const [salvato, setSalvato] = useState(false);

  // Nella sfida la sessione si chiude da sola raggiunti i 10 tentativi.
  useEffect(() => {
    if (sfida && !fine && stato.tentativi >= TENTATIVI_SFIDA) setFine(true);
  }, [sfida, fine, stato.tentativi]);

  useEffect(() => {
    if (!fine || salvato || !esercizio) return;
    if (stato.tentativi > 0) {
      registraRisultato({
        esercizioId: esercizio.id,
        data: dataIso(),
        valori: { successo: percentualeSuccesso(stato) },
      });
    }
    setSalvato(true);
  }, [fine, salvato, esercizio]);

  const invia = (t: Tirata) =>
    setStoria((s) => [
      ...s,
      inviaPunteggio(s[s.length - 1], t.punteggio, bersaglioCasuale(), t.bust),
    ]);
  const annulla = () => setStoria((s) => (s.length > 1 ? s.slice(0, -1) : s));
  const nuovaSessione = () => {
    setStoria([creaCo61100(bersaglioCasuale())]);
    setFine(false);
    setSalvato(false);
  };

  if (esercizioId && esercizio === undefined) return <p className="mini">Carico…</p>;
  if (!esercizio) {
    return (
      <section className="centro-schermo">
        <p>Esercizio non trovato.</p>
        <button className="bottone" onClick={() => navigate(tornaA)}>Indietro</button>
      </section>
    );
  }

  if (fine) {
    const r = risultatoCo61100(stato);
    const obiettivo = esercizio.metriche?.find((m) => m.id === "successo")?.obiettivo;
    const centrato = obiettivo != null && r.successo >= obiettivo;
    return (
      <section className="centro-schermo">
        <div className="moneta">{centrato ? "🏆" : "🎯"}</div>
        <p className="occhiello">
          {sfida ? "Sfida 61-100 — finita" : "61-100 Checkouts — sessione finita"}
        </p>
        <p className="punteggio-finale">{r.successo}%</p>
        <p className="mini">
          {r.riusciti} chiusi su {r.tentativi}
          {obiettivo != null && ` · obiettivo ${obiettivo}%`}
        </p>
        <p className="mini">
          {stato.tentativi > 0
            ? sfida
              ? "💾 Risultato salvato e condiviso in squadra."
              : "💾 Risultato salvato nei Progressi."
            : "Nessun tentativo: niente da salvare."}
        </p>
        <div className="modale-azioni">
          <button className="bottone secondario" onClick={() => navigate(tornaA)}>
            {sfida ? "Torna agli esercizi" : "Torna a Oggi"}
          </button>
          <button className="bottone" onClick={nuovaSessione}>
            {sfida ? "Nuova sfida" : "Nuova sessione"}
          </button>
        </div>
      </section>
    );
  }

  const chiusura = suggerisciChiusura(stato.bersaglio);
  return (
    <section className="co121 compatto">
      <div className="bob27-testa">
        <button className="icona-btn" aria-label="Esci dal gioco" onClick={() => navigate(tornaA)}>✕</button>
        <h2>{sfida ? "Sfida 61-100" : "61-100 Checkouts"}</h2>
        <span className="mini">
          Tentativo {Math.min(stato.tentativi + 1, TENTATIVI_SFIDA)}
          {sfida ? `/${TENTATIVI_SFIDA}` : ""}
        </span>
      </div>

      <div className="co121-rimanente">
        <span className="bob27-numero">{stato.bersaglio}</span>
        {chiusura && (
          <div className="co121-chiusura">
            {chiusura.map((c, i) => (
              <span key={i} className="co121-freccia">{c}</span>
            ))}
          </div>
        )}
      </div>

      {stato.esitoUltimo && (
        <div className={`co121-esito ${stato.esitoUltimo === "riuscito" ? "chiuso" : "fallito"}`}>
          {stato.esitoUltimo === "riuscito"
            ? "✅ Chiuso! Nuovo bersaglio."
            : "❌ Mancato. Nuovo bersaglio."}
        </div>
      )}

      <div className="co121-stat">
        <div>
          <span className="co121-stat-num">{stato.riusciti}/{stato.tentativi}</span>
          <span className="mini">chiusi</span>
        </div>
        <div>
          <span className="co121-stat-num">{percentualeSuccesso(stato)}%</span>
          <span className="mini">successo</span>
        </div>
      </div>

      <InputTirata rimanente={stato.bersaglio} onInvia={invia} />

      <div className="co121-azioni">
        <button className="bottone secondario piccolo" onClick={annulla} disabled={storia.length === 1}>
          ↶ Annulla
        </button>
        {!sfida && (
          <button className="bottone piccolo" onClick={() => setFine(true)}>
            Termina sessione
          </button>
        )}
      </div>
    </section>
  );
}
