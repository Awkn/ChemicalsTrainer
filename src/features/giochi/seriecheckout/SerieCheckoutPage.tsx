import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../lib/db";
import { dataIso } from "../../../lib/date";
import { registraRisultato } from "../../../lib/repo";
import { suggerisciChiusura } from "../../../lib/checkout";
import { usaUscitaGioco } from "../../../lib/uscitaGioco";
import { contaDoppiVisita, unisciConti, type ContiDoppi } from "../../../lib/doppi";
import { registraDoppi } from "../../../lib/doppiStorico";
import { InputTirata } from "../../input/InputTirata";
import type { Tirata } from "../../input/tirata";
import {
  bersaglioCorrente,
  bersagliCasuali,
  creaSerie,
  finita,
  inviaPunteggio,
  percentuale,
  type StatoSerie,
} from "./logica";

/** Come si comporta la serie per ciascun esercizio che ci gira sopra. */
interface ConfigSerie {
  titolo: string;
  /** Cosa si sta facendo, in una riga. */
  sottotitolo: string;
  /** Id della metrica su cui salvare i checkout riusciti. */
  metrica: string;
  /** Da dove arrivano i doppi, per lo storico per bersaglio. */
  etichettaDoppi: string;
  /** La lista dei bersagli della sessione. */
  bersagli: () => number[];
}

/** Numeri fissi di Game Shot: gli ultimi turni di una partita vera. */
const GAME_SHOT = [52, 68, 81, 96, 100, 110, 121, 124, 130];

export const CONFIG: Record<string, ConfigSerie> = {
  co60170: {
    titolo: "Checkout 60-170",
    sottotitolo: "30 checkout casuali, una visita ciascuno.",
    metrica: "riusciti",
    etichettaDoppi: "60-170",
    bersagli: () => bersagliCasuali(30, 60, 170),
  },
  gameshot: {
    titolo: "Game Shot",
    sottotitolo: "Nove chiusure per vincere il match. Una visita ciascuna.",
    metrica: "chiuse",
    etichettaDoppi: "game shot",
    bersagli: () => GAME_SHOT,
  },
};

/**
 * Serie di checkout giocabile. Il bersaglio e' scritto grande con la chiusura
 * consigliata sotto, si inserisce quello che si e' fatto e si passa al
 * prossimo; alla fine della lista il risultato si salva da solo.
 */
export default function SerieCheckoutPage({ gioco }: { gioco: string }) {
  const config = CONFIG[gioco];
  const { esercizioId } = useParams<{ esercizioId: string }>();
  const navigate = useNavigate();
  const esci = usaUscitaGioco();
  const esercizio = useLiveQuery(
    () => (esercizioId ? db.esercizi.get(esercizioId) : undefined),
    [esercizioId],
  );

  const [storia, setStoria] = useState<StatoSerie[]>(() => [
    creaSerie(config.bersagli()),
  ]);
  const stato = storia[storia.length - 1];
  // I doppi seguono lo stesso storico, cosi' l'annulla li riporta indietro.
  const [storiaDoppi, setStoriaDoppi] = useState<ContiDoppi[]>([{}]);
  const doppi = storiaDoppi[storiaDoppi.length - 1];
  const [salvato, setSalvato] = useState(false);

  const fine = finita(stato);

  useEffect(() => {
    if (!fine || salvato || !esercizio) return;
    registraRisultato({
      esercizioId: esercizio.id,
      data: dataIso(),
      valori: { [config.metrica]: stato.riusciti },
    });
    registraDoppi(doppi, config.etichettaDoppi);
    setSalvato(true);
  }, [fine, salvato, esercizio]);

  function invia(t: Tirata) {
    const prima = bersaglioCorrente(stato);
    setStoria((s) => [
      ...s,
      inviaPunteggio(s[s.length - 1], t.punteggio, t.bust),
    ]);
    setStoriaDoppi((d) => [
      ...d,
      t.dardi && prima != null
        ? unisciConti(d[d.length - 1], contaDoppiVisita(prima, t.dardi))
        : d[d.length - 1],
    ]);
  }

  function annulla() {
    setStoria((s) => (s.length > 1 ? s.slice(0, -1) : s));
    setStoriaDoppi((d) => (d.length > 1 ? d.slice(0, -1) : d));
  }

  function nuovaSessione() {
    setStoria([creaSerie(config.bersagli())]);
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
    const totale = stato.bersagli.length;
    const obiettivo = esercizio.metriche?.find(
      (m) => m.id === config.metrica,
    )?.obiettivo;
    const centrato = obiettivo != null && stato.riusciti >= obiettivo;
    return (
      <section className="centro-schermo">
        <div className="moneta">{centrato ? "🏆" : "🎯"}</div>
        <p className="occhiello">{config.titolo} — finito</p>
        <p className="punteggio-finale">
          {stato.riusciti}/{totale}
        </p>
        <p className="mini">
          {percentuale(stato)}% di chiusure
          {obiettivo != null && ` · obiettivo ${obiettivo}`}
        </p>
        <p className="mini">💾 Risultato salvato nei Progressi.</p>
        <div className="modale-azioni">
          <button className="bottone secondario" onClick={() => navigate("/")}>
            Torna a Oggi
          </button>
          <button className="bottone" onClick={nuovaSessione}>
            Rigioca
          </button>
        </div>
      </section>
    );
  }

  const bersaglio = bersaglioCorrente(stato)!;
  const chiusura = suggerisciChiusura(bersaglio);
  return (
    <section className="co121 compatto">
      <div className="bob27-testa">
        <button
          className="icona-btn"
          aria-label="Esci dal gioco"
          onClick={() => esci("/", storia.length > 1)}
        >
          ✕
        </button>
        <h2>{config.titolo}</h2>
        <span className="mini">
          {stato.indice + 1}/{stato.bersagli.length}
        </span>
      </div>

      <div className="co121-rimanente">
        <span className="bob27-numero">{bersaglio}</span>
        {chiusura && (
          <div className="co121-chiusura">
            {chiusura.map((c, i) => (
              <span key={i} className="co121-freccia">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {stato.esitoUltimo && (
        <div
          className={`co121-esito ${
            stato.esitoUltimo === "riuscito" ? "chiuso" : "fallito"
          }`}
        >
          {stato.esitoUltimo === "riuscito" ? "✅ Chiuso!" : "❌ Mancato."}{" "}
          Prossimo bersaglio.
        </div>
      )}

      <div className="co121-stat">
        <div>
          <span className="co121-stat-num">
            {stato.riusciti}/{stato.indice}
          </span>
          <span className="mini">chiusi</span>
        </div>
        <div>
          <span className="co121-stat-num">{percentuale(stato)}%</span>
          <span className="mini">successo</span>
        </div>
      </div>

      <InputTirata rimanente={bersaglio} onInvia={invia} />

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
