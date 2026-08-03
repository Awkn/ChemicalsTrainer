import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usaUscitaGioco } from "../../../lib/uscitaGioco";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../lib/db";
import { registraRisultato } from "../../../lib/repo";
import { dataIso } from "../../../lib/date";
import {
  creaLadder,
  doppioCorrente,
  FRECCE_PER_DOPPIO,
  NUMERO_DOPPI,
  percentualeChiusi,
  risultatoLadder,
  tiraFreccia,
  type StatoLadder,
} from "./logica";

/** Doubles Ladder giocabile: D1..D20, max 3 frecce per doppio. */
export default function LadderPage() {
  const { esercizioId } = useParams<{ esercizioId: string }>();
  const navigate = useNavigate();
  const esci = usaUscitaGioco();
  const esercizio = useLiveQuery(
    () => (esercizioId ? db.esercizi.get(esercizioId) : undefined),
    [esercizioId],
  );

  const [storia, setStoria] = useState<StatoLadder[]>([creaLadder()]);
  const stato = storia[storia.length - 1];
  const [salvato, setSalvato] = useState(false);

  useEffect(() => {
    if (!stato.finito || salvato || !esercizio) return;
    const r = risultatoLadder(stato);
    registraRisultato({
      esercizioId: esercizio.id,
      data: dataIso(),
      valori: { perc: r.perc, chiusi: r.chiusi, frecce: r.frecce },
    });
    setSalvato(true);
  }, [stato.finito, salvato, esercizio]);

  const tira = (colpito: boolean) =>
    setStoria((s) => [...s, tiraFreccia(s[s.length - 1], colpito)]);
  const annulla = () => setStoria((s) => (s.length > 1 ? s.slice(0, -1) : s));
  const ricomincia = () => {
    setStoria([creaLadder()]);
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

  if (stato.finito) {
    const r = risultatoLadder(stato);
    return (
      <section className="centro-schermo">
        <div className="moneta">🎯</div>
        <p className="occhiello">Doubles Ladder — finito</p>
        <p className="punteggio-finale">{r.perc}%</p>
        <p className="mini">{r.chiusi}/{NUMERO_DOPPI} doppi chiusi · {r.frecce} frecce</p>
        <p className="mini">💾 Risultato salvato nei Progressi.</p>
        <div className="modale-azioni">
          <button className="bottone secondario" onClick={() => navigate("/")}>Torna a Oggi</button>
          <button className="bottone" onClick={ricomincia}>Rigioca</button>
        </div>
      </section>
    );
  }

  const doppio = doppioCorrente(stato)!;
  return (
    <section className="bob27">
      <div className="bob27-testa">
        <button className="icona-btn" aria-label="Esci dal gioco" onClick={() => esci("/", storia.length > 1)}>✕</button>
        <h2>Doubles Ladder</h2>
        <span className="mini">{stato.indice + 1}/{NUMERO_DOPPI}</span>
      </div>

      <div className="bob27-punteggio">
        <span className="bob27-numero">{stato.chiusi}</span>
        <div className="bob27-stat">
          <span>doppi chiusi <strong>{percentualeChiusi(stato)}%</strong></span>
          <span>frecce <strong>{stato.frecce}</strong></span>
        </div>
      </div>

      <div className="bob27-obiettivo">
        <p className="occhiello">Obiettivo</p>
        <div className="bob27-bersaglio">{doppio}</div>
        <div className="bob27-frecce" aria-label={`${FRECCE_PER_DOPPIO - stato.mancatiSuTarget} tentativi rimasti`}>
          {Array.from({ length: FRECCE_PER_DOPPIO }, (_, i) => (
            <span key={i} className={i < stato.mancatiSuTarget ? "freccia mancata" : "freccia"} />
          ))}
        </div>
      </div>

      <div className="bob27-azioni">
        <button className="bob27-btn mancato" onClick={() => tira(false)}>Mancato</button>
        <button className="bob27-btn centro" onClick={() => tira(true)}>✓ {doppio}</button>
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
