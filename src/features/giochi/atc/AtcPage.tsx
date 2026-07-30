import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../lib/db";
import { registraRisultato } from "../../../lib/repo";
import { dataIso } from "../../../lib/date";
import {
  creaAtc,
  doppioCorrente,
  NUMERO_DOPPI,
  risultatoAtc,
  tiraFreccia,
  type StatoAtc,
} from "./logica";

/** Around the Clock Doubles giocabile: D1..D20, una freccia alla volta. */
export default function AtcPage() {
  const { esercizioId } = useParams<{ esercizioId: string }>();
  const navigate = useNavigate();
  const esercizio = useLiveQuery(
    () => (esercizioId ? db.esercizi.get(esercizioId) : undefined),
    [esercizioId],
  );

  const [storia, setStoria] = useState<StatoAtc[]>([creaAtc()]);
  const stato = storia[storia.length - 1];
  const [salvato, setSalvato] = useState(false);

  useEffect(() => {
    if (!stato.finito || salvato || !esercizio) return;
    registraRisultato({
      esercizioId: esercizio.id,
      data: dataIso(),
      valori: { frecce: risultatoAtc(stato).frecce },
    });
    setSalvato(true);
  }, [stato.finito, salvato, esercizio]);

  const tira = (colpito: boolean) =>
    setStoria((s) => [...s, tiraFreccia(s[s.length - 1], colpito)]);
  const annulla = () => setStoria((s) => (s.length > 1 ? s.slice(0, -1) : s));
  const ricomincia = () => {
    setStoria([creaAtc()]);
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
    const r = risultatoAtc(stato);
    return (
      <section className="centro-schermo">
        <div className="moneta">🎯</div>
        <p className="occhiello">Around the Clock — finito</p>
        <p className="punteggio-finale">{r.frecce}</p>
        <p className="mini">frecce per completare D1 → D20</p>
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
        <button className="icona-btn" aria-label="Esci dal gioco" onClick={() => navigate("/")}>✕</button>
        <h2>Around the Clock</h2>
        <span className="mini">{stato.indice + 1}/{NUMERO_DOPPI}</span>
      </div>

      <div className="bob27-punteggio">
        <span className="bob27-numero">{stato.frecce}</span>
        <div className="bob27-stat">
          <span>frecce usate</span>
        </div>
      </div>

      <div className="bob27-obiettivo">
        <p className="occhiello">Obiettivo</p>
        <div className="bob27-bersaglio">{doppio}</div>
        <p className="mini">una freccia alla volta · se prendi, avanzi</p>
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
