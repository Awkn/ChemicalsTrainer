import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../lib/db";
import { registraRisultato } from "../../../lib/repo";
import { dataIso } from "../../../lib/date";
import { suggerisciChiusura } from "../../../lib/checkout";
import {
  creaSfida121,
  tenta,
  TENTATIVI_121,
  type StatoSfida121,
} from "./logicaSfida";

/**
 * Sfida "121 a scaletta" (10 tentativi) lanciata dalla sezione Esercizi:
 * chiudi il bersaglio per salire, mancalo per scendere. Alla fine salva il
 * numero piu' alto raggiunto, che viene condiviso in squadra.
 */
export default function Co121SfidaPage() {
  const { esercizioId } = useParams<{ esercizioId: string }>();
  const navigate = useNavigate();

  const esercizio = useLiveQuery(
    () => (esercizioId ? db.esercizi.get(esercizioId) : undefined),
    [esercizioId],
  );

  const [storia, setStoria] = useState<StatoSfida121[]>([creaSfida121()]);
  const stato = storia[storia.length - 1];
  const [salvato, setSalvato] = useState(false);

  // Salvataggio del record a sfida conclusa (una volta sola).
  useEffect(() => {
    if (!stato.finito || salvato || !esercizio) return;
    registraRisultato({
      esercizioId: esercizio.id,
      data: dataIso(),
      valori: { record: stato.record },
    });
    setSalvato(true);
  }, [stato.finito, salvato, esercizio]);

  function esito(riuscito: boolean) {
    setStoria((s) => [...s, tenta(s[s.length - 1], riuscito)]);
  }
  function annulla() {
    setStoria((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }
  function nuovaSfida() {
    setStoria([creaSfida121()]);
    setSalvato(false);
  }

  if (esercizioId && esercizio === undefined) {
    return <p className="mini">Carico…</p>;
  }
  if (!esercizio) {
    return (
      <section className="centro-schermo">
        <p>Esercizio non trovato.</p>
        <button className="bottone" onClick={() => navigate("/esercizi")}>
          Torna agli esercizi
        </button>
      </section>
    );
  }

  // ---------- FINE SFIDA ----------
  if (stato.finito) {
    const obiettivo = esercizio.metriche?.find((m) => m.id === "record")?.obiettivo;
    const centrato = obiettivo != null && stato.record >= obiettivo;
    return (
      <section className="centro-schermo">
        <div className="moneta">{centrato ? "🏆" : "🎯"}</div>
        <p className="occhiello">121 a scaletta — sfida finita</p>
        <p className="punteggio-finale">{stato.record}</p>
        <p className="mini">
          numero più alto raggiunto · {stato.chiusi} chiusi su {TENTATIVI_121}
          {obiettivo != null && ` · obiettivo ${obiettivo}`}
        </p>
        <p className="mini">💾 Risultato salvato e condiviso in squadra.</p>
        <div className="modale-azioni">
          <button className="bottone secondario" onClick={() => navigate("/esercizi")}>
            Torna agli esercizi
          </button>
          <button className="bottone" onClick={nuovaSfida}>
            Nuova sfida
          </button>
        </div>
      </section>
    );
  }

  // ---------- GIOCO ----------
  const chiusura = suggerisciChiusura(stato.bersaglio);

  return (
    <section className="co121">
      <div className="bob27-testa">
        <button
          className="icona-btn"
          aria-label="Esci dalla sfida"
          onClick={() => navigate("/esercizi")}
        >
          ✕
        </button>
        <h2>121 a scaletta</h2>
        <span className="mini">
          Tentativo {stato.tentativo + 1}/{TENTATIVI_121}
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
            ? "✅ Chiuso! Si sale."
            : "❌ Mancato. Si scende."}
        </div>
      )}

      <div className="co121-stat">
        <div>
          <span className="co121-stat-num">{stato.record}</span>
          <span className="mini">record</span>
        </div>
        <div>
          <span className="co121-stat-num">{stato.chiusi}</span>
          <span className="mini">chiusi</span>
        </div>
      </div>

      <div className="sfida-esiti">
        <button className="bottone ko-grande" onClick={() => esito(false)}>
          ❌ Mancato
        </button>
        <button className="bottone ok-grande" onClick={() => esito(true)}>
          ✅ Chiuso
        </button>
      </div>

      <div className="co121-azioni">
        <button
          className="bottone secondario piccolo"
          onClick={annulla}
          disabled={storia.length === 1}
        >
          ↶ Annulla
        </button>
      </div>
    </section>
  );
}
