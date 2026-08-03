import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usaUscitaGioco } from "../../../lib/uscitaGioco";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../lib/db";
import { registraRisultato } from "../../../lib/repo";
import { dataIso } from "../../../lib/date";
import {
  BERSAGLI,
  bersaglioCorrente,
  creaBob27,
  FRECCE_PER_BERSAGLIO,
  percentualeDoppi,
  risultatoBob27,
  tiraFreccia,
  type StatoBob27,
} from "./logica";

/**
 * Bob's 27 giocabile. Ogni freccia si registra con "Centrato" o "Mancato";
 * l'annulla ripristina lo stato precedente. A fine partita salva punteggio e
 * percentuale di doppi nei risultati dell'esercizio.
 */
export default function Bob27Page() {
  const { esercizioId } = useParams<{ esercizioId: string }>();
  const navigate = useNavigate();
  const esci = usaUscitaGioco();

  const esercizio = useLiveQuery(
    () => (esercizioId ? db.esercizi.get(esercizioId) : undefined),
    [esercizioId],
  );

  // Storico degli stati: l'ultimo e' quello corrente, i precedenti servono per l'annulla.
  const [storia, setStoria] = useState<StatoBob27[]>([creaBob27()]);
  const stato = storia[storia.length - 1];
  const [salvato, setSalvato] = useState(false);

  // Salvataggio automatico a fine partita (una volta sola).
  useEffect(() => {
    if (!stato.finito || salvato || !esercizio) return;
    const r = risultatoBob27(stato);
    registraRisultato({
      esercizioId: esercizio.id,
      data: dataIso(),
      valori: { punteggio: r.punteggio, perc: r.percentuale },
    });
    setSalvato(true);
  }, [stato.finito, salvato, esercizio]);

  function tira(colpito: boolean) {
    setStoria((s) => [...s, tiraFreccia(s[s.length - 1], colpito)]);
  }

  function annulla() {
    setStoria((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }

  function ricomincia() {
    setStoria([creaBob27()]);
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

  // ---------- FINE PARTITA ----------
  if (stato.finito) {
    const r = risultatoBob27(stato);
    const obiettivo = esercizio.metriche?.find((m) => m.id === "punteggio")?.obiettivo;
    const centrato = obiettivo != null && r.punteggio >= obiettivo;
    return (
      <section className="centro-schermo">
        <div className="moneta">{centrato ? "🏆" : "🎯"}</div>
        <p className="occhiello">Bob's 27 — finita</p>
        <p className="punteggio-finale">{r.punteggio}</p>
        <p className="mini">
          {r.doppiCentrati} doppi su {r.frecceTirate} frecce · {r.percentuale}%
          {obiettivo != null && ` · obiettivo ${obiettivo}`}
        </p>
        <p className="mini">💾 Risultato salvato nei Progressi.</p>
        <div className="modale-azioni">
          <button className="bottone secondario" onClick={() => navigate("/")}>
            Torna a Oggi
          </button>
          <button className="bottone" onClick={ricomincia}>
            Rigioca
          </button>
        </div>
      </section>
    );
  }

  // ---------- GIOCO ----------
  const bersaglio = bersaglioCorrente(stato)!;
  const tentativiRimasti = FRECCE_PER_BERSAGLIO - stato.mancatiSuTarget;

  return (
    <section className="bob27">
      <div className="bob27-testa">
        <button
          className="icona-btn"
          aria-label="Esci dal gioco"
          onClick={() => esci("/", storia.length > 1)}
        >
          ✕
        </button>
        <h2>Bob's 27</h2>
        <span className="mini">
          {stato.indice + 1}/{BERSAGLI.length}
        </span>
      </div>

      <div className="bob27-punteggio">
        <span className="bob27-numero">{stato.punteggio}</span>
        <div className="bob27-stat">
          <span>
            Doppi centrati <strong>{stato.doppiCentrati}/{stato.frecceTirate}</strong>
          </span>
          <span>
            Percentuale <strong>{percentualeDoppi(stato)}%</strong>
          </span>
        </div>
      </div>

      <div className="bob27-obiettivo">
        <p className="occhiello">Obiettivo</p>
        <div className="bob27-bersaglio">{bersaglio.etichetta}</div>
        <div
          className="bob27-frecce"
          aria-label={`${tentativiRimasti} tentativi rimasti su ${bersaglio.etichetta}`}
        >
          {Array.from({ length: FRECCE_PER_BERSAGLIO }, (_, i) => (
            <span
              key={i}
              className={i < stato.mancatiSuTarget ? "freccia mancata" : "freccia"}
            />
          ))}
        </div>
      </div>

      <div className="bob27-azioni">
        <button className="bob27-btn mancato" onClick={() => tira(false)}>
          Mancato
        </button>
        <button className="bob27-btn centro" onClick={() => tira(true)}>
          ✓ {bersaglio.etichetta}
        </button>
      </div>

      <button
        className="bottone secondario piccolo bob27-annulla"
        onClick={annulla}
        disabled={storia.length === 1}
      >
        ↶ Annulla
      </button>
    </section>
  );
}
