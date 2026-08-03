import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usaUscitaGioco } from "../../../lib/uscitaGioco";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../lib/db";
import { registraRisultato } from "../../../lib/repo";
import { dataIso } from "../../../lib/date";
import {
  CONSECUTIVI_OBIETTIVO,
  creaPressure,
  DOPPI,
  doppioCorrente,
  percentuale,
  risultatoPressure,
  tiraFreccia,
  type StatoPressure,
} from "./logica";

/** Pressure Doubles giocabile: 5 doppi, 5 centri consecutivi ciascuno. */
export default function PressureDoublesPage() {
  const { esercizioId } = useParams<{ esercizioId: string }>();
  const navigate = useNavigate();
  const esci = usaUscitaGioco();
  const esercizio = useLiveQuery(
    () => (esercizioId ? db.esercizi.get(esercizioId) : undefined),
    [esercizioId],
  );

  const [storia, setStoria] = useState<StatoPressure[]>([creaPressure()]);
  const stato = storia[storia.length - 1];
  const [salvato, setSalvato] = useState(false);

  useEffect(() => {
    if (!stato.finito || salvato || !esercizio) return;
    registraRisultato({
      esercizioId: esercizio.id,
      data: dataIso(),
      valori: risultatoPressure(stato),
    });
    setSalvato(true);
  }, [stato.finito, salvato, esercizio]);

  const tira = (colpito: boolean) =>
    setStoria((s) => [...s, tiraFreccia(s[s.length - 1], colpito)]);
  const annulla = () => setStoria((s) => (s.length > 1 ? s.slice(0, -1) : s));
  const ricomincia = () => {
    setStoria([creaPressure()]);
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
    const valori = risultatoPressure(stato);
    return (
      <section className="centro-schermo">
        <div className="moneta">🎯</div>
        <p className="occhiello">Pressure Doubles — finito</p>
        <ul className="lista-squadra" style={{ width: "100%", maxWidth: "20rem" }}>
          {DOPPI.map((d) => (
            <li key={d.metrica} className="riga-squadra">
              <span className="nome-gioc">D{d.valore}</span>
              <span className="valore-classifica">{valori[d.metrica]}%</span>
            </li>
          ))}
        </ul>
        <p className="mini">💾 Risultato salvato nei Progressi.</p>
        <div className="modale-azioni">
          <button className="bottone secondario" onClick={() => navigate("/")}>Torna a Oggi</button>
          <button className="bottone" onClick={ricomincia}>Rigioca</button>
        </div>
      </section>
    );
  }

  const doppio = doppioCorrente(stato)!;
  const corrente = stato.perDoppio[stato.indice];
  return (
    <section className="bob27">
      <div className="bob27-testa">
        <button className="icona-btn" aria-label="Esci dal gioco" onClick={() => esci("/", storia.length > 1)}>✕</button>
        <h2>Pressure Doubles</h2>
        <span className="mini">{stato.indice + 1}/{DOPPI.length}</span>
      </div>

      <div className="bob27-obiettivo">
        <p className="occhiello">Obiettivo · 5 di fila</p>
        <div className="bob27-bersaglio">{doppio}</div>
        <div className="bob27-frecce" aria-label={`${stato.consecutivi} centri consecutivi`}>
          {Array.from({ length: CONSECUTIVI_OBIETTIVO }, (_, i) => (
            <span key={i} className={i < stato.consecutivi ? "freccia centro" : "freccia"} />
          ))}
        </div>
        <p className="mini">
          {corrente.colpi}/{corrente.tiri} · {percentuale(corrente)}%
        </p>
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
