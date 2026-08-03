import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { registraDoppi } from "../../../lib/doppiStorico";
import { usaUscitaGioco } from "../../../lib/uscitaGioco";
import {
  annullaTiro,
  BERSAGLI,
  bersaglioValido,
  colpiti,
  creaDrill,
  FRECCE_DRILL,
  frecceTirate,
  percentualeDrill,
  rimaste,
  serieMigliore,
  tira,
  type StatoDrill,
} from "./logica";

/**
 * Allenamento mirato su un doppio. Ci si arriva dalla scheda "I tuoi doppi"
 * con il bersaglio piu' debole gia' scelto (?doppio=D16), oppure si sceglie a
 * mano. A fine sessione i tentativi finiscono nello stesso storico che ha
 * segnalato il punto debole: e' cosi' che si vede se sta migliorando.
 */
export default function DrillDoppioPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const esci = usaUscitaGioco();

  // Arrivando dalla scheda dei doppi il bersaglio e' gia' deciso: si parte
  // subito, senza far ripetere una scelta gia' fatta.
  const suggerito = params.get("doppio");
  const [stato, setStato] = useState<StatoDrill | null>(() =>
    suggerito && bersaglioValido(suggerito) ? creaDrill(suggerito) : null,
  );
  const [salvato, setSalvato] = useState(false);

  // A sessione finita i tentativi vanno nello storico, una volta sola.
  useEffect(() => {
    if (!stato?.finito || salvato) return;
    registraDoppi(
      { [stato.bersaglio]: { tentativi: frecceTirate(stato), colpiti: colpiti(stato) } },
      "drill",
    );
    setSalvato(true);
  }, [stato, salvato]);

  function avvia(b: string) {
    setStato(creaDrill(b));
    setSalvato(false);
  }

  // ---------- SCELTA DEL BERSAGLIO ----------
  if (!stato) {
    return (
      <section>
        <div className="pagina-testa">
          <div>
            <p className="occhiello">Allenamento</p>
            <h2>Doppio mirato</h2>
          </div>
        </div>

        <div className="scheda">
          <h3>Su quale doppio ti alleni?</h3>
          <p className="mini">
            {FRECCE_DRILL} frecce sullo stesso bersaglio. Segni solo centro o
            errore: il risultato entra nella tua statistica dei doppi.
          </p>
          <div className="drill-bersagli">
            {BERSAGLI.map((b) => (
              <button
                key={b}
                className="chip-punteggio"
                onClick={() => avvia(b)}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ---------- FINE SESSIONE ----------
  if (stato.finito) {
    return (
      <section className="centro-schermo">
        <div className="moneta">🎯</div>
        <p className="occhiello">Doppio mirato — {stato.bersaglio}</p>
        <p className="punteggio-finale">{percentualeDrill(stato)}%</p>
        <p className="mini">
          {colpiti(stato)} centri su {frecceTirate(stato)} frecce · miglior serie{" "}
          {serieMigliore(stato)}
        </p>
        <p className="mini">
          {salvato ? "💾 Aggiunto alla tua statistica dei doppi." : "Salvo…"}
        </p>
        <div className="modale-azioni">
          <button className="bottone secondario" onClick={() => navigate("/progressi")}>
            Vedi i progressi
          </button>
          <button className="bottone" onClick={() => avvia(stato.bersaglio)}>
            Ancora
          </button>
        </div>
      </section>
    );
  }

  // ---------- SESSIONE IN CORSO ----------
  const tirate = frecceTirate(stato);
  return (
    <section className="co121 compatto">
      <div className="bob27-testa">
        <button
          className="icona-btn"
          aria-label="Esci dall'allenamento"
          onClick={() => esci("/progressi", tirate > 0)}
        >
          ✕
        </button>
        <h2>Doppio mirato</h2>
        <span className="mini">
          {tirate}/{FRECCE_DRILL}
        </span>
      </div>

      <div className="co121-rimanente">
        <span className="bob27-numero">{stato.bersaglio}</span>
      </div>

      <div className="co121-stat">
        <div>
          <span className="co121-stat-num">
            {colpiti(stato)}/{tirate}
          </span>
          <span className="mini">centri</span>
        </div>
        <div>
          <span className="co121-stat-num">{percentualeDrill(stato)}%</span>
          <span className="mini">resa</span>
        </div>
        <div>
          <span className="co121-stat-num">{rimaste(stato)}</span>
          <span className="mini">frecce</span>
        </div>
      </div>

      <div className="drill-striscia">
        {Array.from({ length: FRECCE_DRILL }, (_, i) => (
          <span
            key={i}
            className={
              i < stato.esiti.length
                ? stato.esiti[i]
                  ? "drill-tacca centro"
                  : "drill-tacca errore"
                : "drill-tacca"
            }
          />
        ))}
      </div>

      <div className="sfida-esiti">
        <button
          className="bottone bottone-largo"
          onClick={() => setStato(tira(stato, true))}
        >
          ✅ Centrato
        </button>
        <button
          className="bottone secondario bottone-largo"
          onClick={() => setStato(tira(stato, false))}
        >
          ❌ Mancato
        </button>
      </div>

      <div className="co121-azioni">
        <button
          className="bottone secondario piccolo"
          onClick={() => setStato(annullaTiro(stato))}
          disabled={tirate === 0}
        >
          ↶ Annulla
        </button>
        <button
          className="bottone piccolo"
          onClick={() => setStato({ ...stato, finito: true })}
          disabled={tirate === 0}
        >
          Termina
        </button>
      </div>
    </section>
  );
}
