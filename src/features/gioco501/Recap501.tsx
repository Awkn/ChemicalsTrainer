import {
  checkoutPerc,
  etichettaChiusura,
  etichettaIngresso,
  media3,
  mediaFirst9,
  migliorLeg,
  nomiVisualizzati,
  peggiorLeg,
  type StatoPartita,
  type StatsGiocatore,
} from "./logica501";
import {
  classificaDoppi,
  percentualeDoppi,
  totaleDoppi,
} from "../../lib/doppi";
import { ListaDoppi } from "../../components/ListaDoppi";

interface Props {
  stato: StatoPartita;
  /** True quando le statistiche sono state salvate nell'esercizio 501. */
  salvato?: boolean;
  onRivincita: () => void;
  onImpostazioni: () => void;
}

/** Recap statistico a fine partita, in stile scheda risultato. */
export function Recap501({ stato, salvato, onRivincita, onImpostazioni }: Props) {
  const { config, statsUno, statsDue } = stato;
  const vintoUno = stato.vincitore === "uno";
  const controBot = config.avversario === "bot";
  const nomi = nomiVisualizzati(config);

  const titolo = `${config.formato === "bestof" ? "Al meglio di" : "Primo a"} ${
    config.numero
  } ${config.unita === "legs" ? "leg" : "set"} · ${config.puntiIniziali}`;

  const righe: { label: string; uno: string; due: string }[] = [
    {
      label: "Media 3 dart",
      uno: fmt(media3(statsUno)),
      due: fmt(media3(statsDue)),
    },
    {
      label: "First 9 avg.",
      uno: fmt(mediaFirst9(statsUno)),
      due: fmt(mediaFirst9(statsDue)),
    },
    {
      label: "Checkout %",
      uno: `${fmt(checkoutPerc(statsUno))}%`,
      due: `${fmt(checkoutPerc(statsDue))}%`,
    },
    {
      label: "Checkout",
      uno: `${statsUno.chkRiusciti}/${statsUno.chkTentativi}`,
      due: `${statsDue.chkRiusciti}/${statsDue.chkTentativi}`,
    },
    {
      label: "Chiusura più alta",
      uno: opz(statsUno.highFinish),
      due: opz(statsDue.highFinish),
    },
    {
      label: "Punteggio più alto",
      uno: opz(statsUno.highScore),
      due: opz(statsDue.highScore),
    },
    {
      label: "Miglior leg",
      uno: frecce(migliorLeg(statsUno)),
      due: frecce(migliorLeg(statsDue)),
    },
    {
      label: "Peggior leg",
      uno: frecce(peggiorLeg(statsUno)),
      due: frecce(peggiorLeg(statsDue)),
    },
  ];

  return (
    <section className="recap">
      <header className={`recap-testa ${vintoUno ? "vinto" : "perso"}`}>
        <h2>{titolo}</h2>
        <p className="recap-data">{dataOra(stato.creato)}</p>
        <div className="recap-badge">
          <span>{etichettaIngresso(config.ingresso)}</span>
          <span>{etichettaChiusura(config.chiusura)}</span>
        </div>
        <div className="recap-score">
          <div className="recap-giocatore">
            <span>{nomi[0]}</span>
            <span className="recap-trofeo">{vintoUno ? "🏆" : ""}</span>
          </div>
          <div className="recap-punteggio">
            {stato.legUno} — {stato.legDue}
          </div>
          <div className="recap-giocatore">
            <span>{controBot ? `Bot · ${config.livello.nome}` : nomi[1]}</span>
            <span className="recap-trofeo">{!vintoUno ? "🏆" : ""}</span>
          </div>
        </div>
      </header>

      <div className="recap-tabella">
        {righe.map((r) => (
          <div className="recap-riga" key={r.label}>
            <span className="recap-val">{r.uno}</span>
            <span className="recap-label">{r.label}</span>
            <span className="recap-val">{r.due}</span>
          </div>
        ))}
      </div>

      {/* Il dettaglio sui doppi esiste solo giocando con l'input a bersaglio.
          In due lo si mostra per entrambi: hanno tirato tutti e due. */}
      <SchedaDoppiPartita
        titolo={controBot ? "I tuoi doppi" : `I doppi di ${nomi[0]}`}
        stats={statsUno}
      />
      {!controBot && (
        <SchedaDoppiPartita titolo={`I doppi di ${nomi[1]}`} stats={statsDue} />
      )}

      {salvato && (
        <p className="mini recap-salvato">
          💾 Statistiche salvate nei Progressi e condivise in squadra.
          {!controBot && ` Sono quelle di ${nomi[0]}.`}
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

/** Resa sui doppi di un giocatore. Non compare se non ci sono tentativi. */
function SchedaDoppiPartita({
  titolo,
  stats,
}: {
  titolo: string;
  stats: StatsGiocatore;
}) {
  const doppi = totaleDoppi(stats.doppi);
  if (doppi.tentativi === 0) return null;

  return (
    <div className="recap-doppi">
      <h3>
        {titolo}{" "}
        <span className="recap-doppi-tot">
          {doppi.colpiti}/{doppi.tentativi} · {percentualeDoppi(doppi)}%
        </span>
      </h3>
      <p className="mini">
        Contati freccia per freccia: quante volte il doppio è stato centrato
        avendolo davvero davanti.
      </p>
      <ListaDoppi righe={classificaDoppi(stats.doppi)} />
    </div>
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
