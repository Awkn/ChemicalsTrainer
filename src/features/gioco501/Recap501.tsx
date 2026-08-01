import {
  checkoutPerc,
  etichettaChiusura,
  etichettaIngresso,
  media3,
  mediaFirst9,
  migliorLeg,
  peggiorLeg,
  type StatoPartita,
} from "./logica501";
import {
  classificaDoppi,
  percentualeDoppi,
  totaleDoppi,
} from "../../lib/doppi";

interface Props {
  stato: StatoPartita;
  /** True quando le statistiche sono state salvate nell'esercizio 501. */
  salvato?: boolean;
  onRivincita: () => void;
  onImpostazioni: () => void;
}

/** Recap statistico a fine partita, in stile scheda risultato. */
export function Recap501({ stato, salvato, onRivincita, onImpostazioni }: Props) {
  const { config, statsUmano, statsBot } = stato;
  const vintoUmano = stato.vincitore === "umano";

  const titolo = `${config.formato === "bestof" ? "Al meglio di" : "Primo a"} ${
    config.numero
  } ${config.unita === "legs" ? "leg" : "set"} · ${config.puntiIniziali}`;

  // Dettaglio sui doppi: esiste solo se si e' giocato con l'input a bersaglio.
  const doppi = totaleDoppi(statsUmano.doppi);
  const perBersaglio = classificaDoppi(statsUmano.doppi);

  const righe: { label: string; umano: string; bot: string }[] = [
    {
      label: "Media 3 dart",
      umano: fmt(media3(statsUmano)),
      bot: fmt(media3(statsBot)),
    },
    {
      label: "First 9 avg.",
      umano: fmt(mediaFirst9(statsUmano)),
      bot: fmt(mediaFirst9(statsBot)),
    },
    {
      label: "Checkout %",
      umano: `${fmt(checkoutPerc(statsUmano))}%`,
      bot: `${fmt(checkoutPerc(statsBot))}%`,
    },
    {
      label: "Checkout",
      umano: `${statsUmano.chkRiusciti}/${statsUmano.chkTentativi}`,
      bot: `${statsBot.chkRiusciti}/${statsBot.chkTentativi}`,
    },
    {
      label: "Chiusura più alta",
      umano: opz(statsUmano.highFinish),
      bot: opz(statsBot.highFinish),
    },
    {
      label: "Punteggio più alto",
      umano: opz(statsUmano.highScore),
      bot: opz(statsBot.highScore),
    },
    {
      label: "Miglior leg",
      umano: frecce(migliorLeg(statsUmano)),
      bot: frecce(migliorLeg(statsBot)),
    },
    {
      label: "Peggior leg",
      umano: frecce(peggiorLeg(statsUmano)),
      bot: frecce(peggiorLeg(statsBot)),
    },
  ];

  return (
    <section className="recap">
      <header className={`recap-testa ${vintoUmano ? "vinto" : "perso"}`}>
        <h2>{titolo}</h2>
        <p className="recap-data">{dataOra(stato.creato)}</p>
        <div className="recap-badge">
          <span>{etichettaIngresso(config.ingresso)}</span>
          <span>{etichettaChiusura(config.chiusura)}</span>
        </div>
        <div className="recap-score">
          <div className="recap-giocatore">
            <span>Tu</span>
            <span className="recap-trofeo">{vintoUmano ? "🏆" : ""}</span>
          </div>
          <div className="recap-punteggio">
            {stato.legUmano} — {stato.legBot}
          </div>
          <div className="recap-giocatore">
            <span>Bot · {config.livello.nome}</span>
            <span className="recap-trofeo">{!vintoUmano ? "🏆" : ""}</span>
          </div>
        </div>
      </header>

      <div className="recap-tabella">
        {righe.map((r) => (
          <div className="recap-riga" key={r.label}>
            <span className="recap-val">{r.umano}</span>
            <span className="recap-label">{r.label}</span>
            <span className="recap-val">{r.bot}</span>
          </div>
        ))}
      </div>

      {doppi.tentativi > 0 && (
        <div className="recap-doppi">
          <h3>
            I tuoi doppi{" "}
            <span className="recap-doppi-tot">
              {doppi.colpiti}/{doppi.tentativi} · {percentualeDoppi(doppi)}%
            </span>
          </h3>
          <p className="mini">
            Contati freccia per freccia: quante volte hai centrato il doppio
            avendolo davvero davanti.
          </p>
          <ul className="doppi-lista">
            {perBersaglio.map((d) => (
              <li key={d.doppio}>
                <span className="doppi-nome">{d.doppio}</span>
                <span className="doppi-barra">
                  <span
                    className="doppi-riempi"
                    style={{ width: `${d.percentuale}%` }}
                  />
                </span>
                <span className="doppi-conto">
                  {d.conto.colpiti}/{d.conto.tentativi}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {salvato && (
        <p className="mini recap-salvato">
          💾 Statistiche salvate nei Progressi e condivise in squadra.
        </p>
      )}

      <div className="modale-azioni">
        <button className="bottone secondario" onClick={onImpostazioni}>
          Impostazioni
        </button>
        <button className="bottone" onClick={onRivincita}>
          Rivincita
        </button>
      </div>
    </section>
  );
}

function fmt(n: number): string {
  return String(n);
}

/** Statistica assente → trattino. */
function opz(n: number): string {
  return n > 0 ? String(n) : "—";
}

function frecce(n: number | null): string {
  return n == null ? "—" : `${n} frecce`;
}

function dataOra(ms: number): string {
  return new Date(ms).toLocaleString("it-IT", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
