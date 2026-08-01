import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../lib/db";
import { registraRisultato } from "../../../lib/repo";
import { dataIso } from "../../../lib/date";
import { suggerisciChiusura } from "../../../lib/checkout";
import { InputTirata } from "../../input/InputTirata";
import type { Tirata } from "../../input/tirata";
import Co121SfidaPage from "./Co121SfidaPage";
import {
  crea121,
  dardiRimasti,
  inviaPunteggio,
  percentualeSuccesso,
  risultato121,
  type Stato121,
} from "./logica";

/**
 * 121 Checkout giocabile. Con `?sfida=1` (dalla sezione Esercizi) parte la
 * versione a scaletta da 10 tentativi; altrimenti la sessione classica a
 * oltranza, che a fine sessione salva la percentuale di chiusure riuscite.
 */
export default function Co121Page() {
  const [params] = useSearchParams();
  if (params.get("sfida")) return <Co121SfidaPage />;
  return <Co121Oltranza />;
}

function Co121Oltranza() {
  const { esercizioId } = useParams<{ esercizioId: string }>();
  const navigate = useNavigate();

  const esercizio = useLiveQuery(
    () => (esercizioId ? db.esercizi.get(esercizioId) : undefined),
    [esercizioId],
  );

  // Storico degli stati: l'ultimo e' quello corrente, i precedenti per l'annulla.
  const [storia, setStoria] = useState<Stato121[]>([crea121()]);
  const stato = storia[storia.length - 1];
  const [fine, setFine] = useState(false);
  const [salvato, setSalvato] = useState(false);

  // Salvataggio a fine sessione (una volta sola), solo se c'e' stato almeno un tentativo.
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

  function invia(t: Tirata) {
    setStoria((s) => [...s, inviaPunteggio(s[s.length - 1], t.punteggio, t.bust)]);
  }

  function annulla() {
    setStoria((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }

  function nuovaSessione() {
    setStoria([crea121()]);
    setFine(false);
    setSalvato(false);
  }

  if (esercizioId && esercizio === undefined) {
    return <p className="mini">Carico…</p>;
  }
  if (!esercizio) {
    return (
      <section className="centro-schermo">
        <p>Esercizio non trovato.</p>
        <button className="bottone" onClick={() => navigate("/")}>
          Torna a Oggi
        </button>
      </section>
    );
  }

  // ---------- FINE SESSIONE ----------
  if (fine) {
    const r = risultato121(stato);
    const obiettivo = esercizio.metriche?.find((m) => m.id === "successo")?.obiettivo;
    const centrato = obiettivo != null && r.successo >= obiettivo;
    return (
      <section className="centro-schermo">
        <div className="moneta">{centrato ? "🏆" : "🎯"}</div>
        <p className="occhiello">121 Checkout — sessione finita</p>
        <p className="punteggio-finale">{r.successo}%</p>
        <p className="mini">
          {r.chiusi} chiuse su {r.tentativi} tentativi
          {obiettivo != null && ` · obiettivo ${obiettivo}%`}
        </p>
        <p className="mini">
          {stato.tentativi > 0
            ? "💾 Risultato salvato nei Progressi."
            : "Nessun tentativo: niente da salvare."}
        </p>
        <div className="modale-azioni">
          <button className="bottone secondario" onClick={() => navigate("/")}>
            Torna a Oggi
          </button>
          <button className="bottone" onClick={nuovaSessione}>
            Nuova sessione
          </button>
        </div>
      </section>
    );
  }

  // ---------- GIOCO ----------
  const chiusura = suggerisciChiusura(stato.rimanente);

  return (
    <section className="co121 compatto">
      <div className="bob27-testa">
        <button
          className="icona-btn"
          aria-label="Esci dal gioco"
          onClick={() => navigate("/")}
        >
          ✕
        </button>
        <h2>121 Checkout</h2>
        <span className="mini">Tentativo {stato.tentativi + 1}</span>
      </div>

      <div className="co121-rimanente">
        <span className="bob27-numero">{stato.rimanente}</span>
        {chiusura && (
          <div className="co121-chiusura">
            {chiusura.map((c, i) => (
              <span key={i} className="co121-freccia">{c}</span>
            ))}
          </div>
        )}
      </div>

      {stato.esitoUltimo && (
        <div className={`co121-esito ${stato.esitoUltimo}`}>
          {stato.esitoUltimo === "chiuso"
            ? "✅ Chiusa! Nuovo 121."
            : "❌ Non chiusa. Nuovo 121."}
        </div>
      )}

      <div className="co121-stat">
        <div>
          <span className="co121-stat-num">{dardiRimasti(stato)}</span>
          <span className="mini">dardi rimasti</span>
        </div>
        <div>
          <span className="co121-stat-num">
            {stato.chiusi}/{stato.tentativi}
          </span>
          <span className="mini">chiuse</span>
        </div>
        <div>
          <span className="co121-stat-num">{percentualeSuccesso(stato)}%</span>
          <span className="mini">successo</span>
        </div>
        <div>
          <span className="co121-stat-num">{stato.serie}</span>
          <span className="mini">serie</span>
        </div>
      </div>

      <InputTirata rimanente={stato.rimanente} onInvia={invia} />

      <div className="co121-azioni">
        <button
          className="bottone secondario piccolo"
          onClick={annulla}
          disabled={storia.length === 1}
        >
          ↶ Annulla
        </button>
        <button className="bottone piccolo" onClick={() => setFine(true)}>
          Termina sessione
        </button>
      </div>
    </section>
  );
}
