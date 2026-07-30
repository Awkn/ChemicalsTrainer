import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../lib/db";
import { registraRisultato } from "../../../lib/repo";
import { dataIso } from "../../../lib/date";
import { suggerisciChiusura } from "../../../lib/checkout";
import { Tastierino } from "../../gioco501/Tastierino";
import {
  bersaglioCasuale,
  creaCo61100,
  inviaPunteggio,
  percentualeSuccesso,
  risultatoCo61100,
  type StatoCo61100,
} from "./logica";

/** 61-100 Checkouts giocabile: bersaglio casuale, una visita per chiuderlo. */
export default function Co61100Page() {
  const { esercizioId } = useParams<{ esercizioId: string }>();
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

  const invia = (punteggio: number) =>
    setStoria((s) => [
      ...s,
      inviaPunteggio(s[s.length - 1], punteggio, bersaglioCasuale()),
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
        <button className="bottone" onClick={() => navigate("/")}>Torna a Oggi</button>
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
        <p className="occhiello">61-100 Checkouts — sessione finita</p>
        <p className="punteggio-finale">{r.successo}%</p>
        <p className="mini">
          {r.riusciti} chiusi su {r.tentativi}
          {obiettivo != null && ` · obiettivo ${obiettivo}%`}
        </p>
        <p className="mini">
          {stato.tentativi > 0
            ? "💾 Risultato salvato nei Progressi."
            : "Nessun tentativo: niente da salvare."}
        </p>
        <div className="modale-azioni">
          <button className="bottone secondario" onClick={() => navigate("/")}>Torna a Oggi</button>
          <button className="bottone" onClick={nuovaSessione}>Nuova sessione</button>
        </div>
      </section>
    );
  }

  const chiusura = suggerisciChiusura(stato.bersaglio);
  return (
    <section className="co121">
      <div className="bob27-testa">
        <button className="icona-btn" aria-label="Esci dal gioco" onClick={() => navigate("/")}>✕</button>
        <h2>61-100 Checkouts</h2>
        <span className="mini">Tentativo {stato.tentativi + 1}</span>
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

      <Tastierino rimanente={stato.bersaglio} onInvia={invia} />

      <div className="co121-azioni">
        <button className="bottone secondario piccolo" onClick={annulla} disabled={storia.length === 1}>
          ↶ Annulla
        </button>
        <button className="bottone piccolo" onClick={() => setFine(true)}>
          Termina sessione
        </button>
      </div>
    </section>
  );
}
