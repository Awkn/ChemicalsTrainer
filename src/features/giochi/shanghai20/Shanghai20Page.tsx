import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../lib/db";
import { dataIso } from "../../../lib/date";
import { registraRisultato } from "../../../lib/repo";
import { usaUscitaGioco } from "../../../lib/uscitaGioco";
import {
  creaShanghai,
  finito,
  NIENTE,
  punti,
  registraVisita,
  VISITE,
  type Presi,
  type StatoShanghai,
} from "./logica";

/** I tre pezzi da prendere, nell'ordine in cui si leggono sul bersaglio. */
const PEZZI: { chiave: keyof Presi; etichetta: string; valore: string }[] = [
  { chiave: "singolo", etichetta: "Singolo", valore: "20" },
  { chiave: "triplo", etichetta: "Triplo", valore: "60" },
  { chiave: "doppio", etichetta: "Doppio", valore: "40" },
];

/**
 * Shanghai 20 giocabile: per ogni visita si toccano i pezzi presi e si passa
 * alla successiva. Venti visite, poi il risultato si salva da solo.
 */
export default function Shanghai20Page() {
  const { esercizioId } = useParams<{ esercizioId: string }>();
  const navigate = useNavigate();
  const esci = usaUscitaGioco();
  const esercizio = useLiveQuery(
    () => (esercizioId ? db.esercizi.get(esercizioId) : undefined),
    [esercizioId],
  );

  const [storia, setStoria] = useState<StatoShanghai[]>([creaShanghai()]);
  const stato = storia[storia.length - 1];
  // Selezione della visita in corso: vive fuori dallo stato del gioco perche'
  // finche' non si conferma non e' ancora successo niente.
  const [presi, setPresi] = useState<Presi>(NIENTE);
  const [salvato, setSalvato] = useState(false);

  const fine = finito(stato);

  useEffect(() => {
    if (!fine || salvato || !esercizio) return;
    registraRisultato({
      esercizioId: esercizio.id,
      data: dataIso(),
      valori: { completati: stato.completati },
    });
    setSalvato(true);
  }, [fine, salvato, esercizio]);

  function conferma() {
    setStoria((s) => [...s, registraVisita(s[s.length - 1], presi)]);
    setPresi(NIENTE);
  }

  function annulla() {
    setStoria((s) => (s.length > 1 ? s.slice(0, -1) : s));
    setPresi(NIENTE);
  }

  function ricomincia() {
    setStoria([creaShanghai()]);
    setPresi(NIENTE);
    setSalvato(false);
  }

  if (esercizioId && esercizio === undefined) return <p className="mini">Carico…</p>;
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

  if (fine) {
    const obiettivo = esercizio.metriche?.find(
      (m) => m.id === "completati",
    )?.obiettivo;
    const centrato = obiettivo != null && stato.completati >= obiettivo;
    return (
      <section className="centro-schermo">
        <div className="moneta">{centrato ? "🏆" : "🎯"}</div>
        <p className="occhiello">Shanghai 20 — finito</p>
        <p className="punteggio-finale">
          {stato.completati}/{VISITE}
        </p>
        <p className="mini">shanghai completati</p>
        <p className="mini">
          Singoli {stato.singoli} · Tripli {stato.tripli} · Doppi {stato.doppi} ·{" "}
          {punti(stato)} punti
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
        <h2>Shanghai 20</h2>
        <span className="mini">
          {stato.visita + 1}/{VISITE}
        </span>
      </div>

      <div className="bob27-obiettivo">
        <p className="occhiello">Prendi tutti e tre</p>
        <div className="bob27-bersaglio">20</div>
        <p className="mini">
          {stato.completati} shanghai su {stato.visita}{" "}
          {stato.visita === 1 ? "visita" : "visite"}
        </p>
      </div>

      <div className="sh-pezzi">
        {PEZZI.map((p) => (
          <button
            key={p.chiave}
            className={presi[p.chiave] ? "sh-pezzo preso" : "sh-pezzo"}
            aria-pressed={presi[p.chiave]}
            onClick={() => setPresi((v) => ({ ...v, [p.chiave]: !v[p.chiave] }))}
          >
            <strong>{p.etichetta}</strong>
            <span className="mini">{p.valore}</span>
          </button>
        ))}
      </div>

      <button className="bottone bottone-largo" onClick={conferma}>
        {/* Anche a mani vuote si va avanti: una visita storta e' un dato. */}
        Avanti
      </button>

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
