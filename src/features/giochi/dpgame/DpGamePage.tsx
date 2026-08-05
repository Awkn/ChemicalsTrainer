import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../lib/db";
import { dataIso } from "../../../lib/date";
import { registraRisultato } from "../../../lib/repo";
import { usaUscitaGioco } from "../../../lib/uscitaGioco";
import { registraDoppi } from "../../../lib/doppiStorico";
import { unisciConti, type ContiDoppi } from "../../../lib/doppi";
import {
  creaDp,
  doppioCorrente,
  estraiDoppi,
  finito,
  PUNTI,
  registraEsito,
  type StatoDp,
} from "./logica";

/**
 * Doubles Pressure Game giocabile: dieci doppi estratti a sorte, e per ognuno
 * si dice con quale freccia e' stato chiuso. Le tre frecce valgono 3, 2 e 1
 * punto; mancarlo ne toglie uno.
 */
export default function DpGamePage() {
  const { esercizioId } = useParams<{ esercizioId: string }>();
  const navigate = useNavigate();
  const esci = usaUscitaGioco();
  const esercizio = useLiveQuery(
    () => (esercizioId ? db.esercizi.get(esercizioId) : undefined),
    [esercizioId],
  );

  const [storia, setStoria] = useState<StatoDp[]>(() => [creaDp(estraiDoppi())]);
  const stato = storia[storia.length - 1];
  // Tentativi al doppio, per lo storico per bersaglio: qui si sa esattamente
  // quale doppio si stava tirando e quante frecce ci sono andate.
  const [storiaDoppi, setStoriaDoppi] = useState<ContiDoppi[]>([{}]);
  const doppi = storiaDoppi[storiaDoppi.length - 1];
  const [salvato, setSalvato] = useState(false);

  const fine = finito(stato);

  useEffect(() => {
    if (!fine || salvato || !esercizio) return;
    registraRisultato({
      esercizioId: esercizio.id,
      data: dataIso(),
      valori: { punti: stato.punti },
    });
    registraDoppi(doppi, "pressure game");
    setSalvato(true);
  }, [fine, salvato, esercizio]);

  /** `freccia` = con quale freccia ha chiuso, null = non chiuso. */
  function esito(freccia: number | null) {
    const bersaglio = doppioCorrente(stato);
    setStoria((s) => [...s, registraEsito(s[s.length - 1], freccia)]);
    setStoriaDoppi((d) => [
      ...d,
      bersaglio == null
        ? d[d.length - 1]
        : unisciConti(d[d.length - 1], {
            // Chiudendo alla seconda freccia i tentativi sono due, uno buono;
            // non chiudendo sono tre, tutti sbagliati.
            [bersaglio]: {
              tentativi: freccia ?? PUNTI.length,
              colpiti: freccia == null ? 0 : 1,
            },
          }),
    ]);
  }

  function annulla() {
    setStoria((s) => (s.length > 1 ? s.slice(0, -1) : s));
    setStoriaDoppi((d) => (d.length > 1 ? d.slice(0, -1) : d));
  }

  function ricomincia() {
    setStoria([creaDp(estraiDoppi())]);
    setStoriaDoppi([{}]);
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
    const obiettivo = esercizio.metriche?.find((m) => m.id === "punti")?.obiettivo;
    const centrato = obiettivo != null && stato.punti >= obiettivo;
    return (
      <section className="centro-schermo">
        <div className="moneta">{centrato ? "🏆" : "🎯"}</div>
        <p className="occhiello">Doubles Pressure Game — finito</p>
        <p className="punteggio-finale">{stato.punti}</p>
        <p className="mini">
          {stato.chiusi}/{stato.doppi.length} doppi chiusi
          {obiettivo != null && ` · obiettivo ${obiettivo} punti`}
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

  const doppio = doppioCorrente(stato)!;
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
        <h2>Doubles Pressure</h2>
        <span className="mini">
          {stato.indice + 1}/{stato.doppi.length}
        </span>
      </div>

      <div className="bob27-obiettivo">
        <p className="occhiello">Chiudi in 3 frecce</p>
        <div className="bob27-bersaglio">{doppio}</div>
        <p className="mini">
          {stato.punti} {Math.abs(stato.punti) === 1 ? "punto" : "punti"} ·{" "}
          {stato.chiusi} chiusi
          {stato.ultimo != null &&
            ` · ultimo ${stato.ultimo > 0 ? `+${stato.ultimo}` : stato.ultimo}`}
        </p>
      </div>

      {/* Una riga sola: con quale freccia l'hai chiuso, o niente. */}
      <div className="dp-frecce">
        {PUNTI.map((p, i) => (
          <button key={p} className="dp-btn preso" onClick={() => esito(i + 1)}>
            <strong>{i + 1}ª</strong>
            <span className="mini">+{p}</span>
          </button>
        ))}
        <button className="dp-btn mancato" onClick={() => esito(null)}>
          <strong>Fuori</strong>
          <span className="mini">−1</span>
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
