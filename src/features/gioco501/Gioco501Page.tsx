import { useEffect, useState } from "react";
import { InputTirata } from "../input/InputTirata";
import { usaModoInput } from "../input/preferenza";
import type { Tirata } from "../input/tirata";
import { Impostazioni501 } from "./Impostazioni501";
import { Recap501 } from "./Recap501";
import { suggerisciChiusura } from "../../lib/checkout";
import { db } from "../../lib/db";
import { registraRisultato } from "../../lib/repo";
import { dataIso } from "../../lib/date";
import {
  avanzaLeg,
  checkoutPerc,
  configPredefinita,
  creaPartita,
  giocaBot,
  giocaUmano,
  lancioMoneta,
  LIVELLI,
  media3,
  mediaFirst9,
  risultatoVisita,
  type ConfigPartita,
  type StatoLeg,
  type StatoPartita,
} from "./logica501";

/** Esercizio di libreria su cui salvare le statistiche del 501 vs bot. */
const NOME_ESERCIZIO_501 = "501 contro il computer";

type Fase = "setup" | "moneta" | "gioco";

export function Gioco501Page() {
  const modoInput = usaModoInput();
  const [fase, setFase] = useState<Fase>("setup");
  const [config, setConfig] = useState<ConfigPartita>(() =>
    configPredefinita(LIVELLI[1]),
  );
  const [stato, setStato] = useState<StatoPartita | null>(null);
  // Punteggio che chiude un leg, in attesa che l'utente indichi le frecce usate.
  const [chiusura, setChiusura] = useState<number | null>(null);
  // Le statistiche della partita finita sono state salvate nell'esercizio 501.
  const [salvato, setSalvato] = useState(false);

  // Il bot gioca da solo quando e' il suo turno.
  useEffect(() => {
    if (
      fase !== "gioco" ||
      !stato ||
      stato.vincitore ||
      stato.leg.vincitore ||
      stato.leg.turno !== "bot"
    ) {
      return;
    }
    const t = setTimeout(() => setStato((s) => (s ? giocaBot(s) : s)), 950);
    return () => clearTimeout(t);
  }, [fase, stato]);

  // A partita finita salva le mie statistiche nell'esercizio 501 (una volta):
  // finiscono nei Progressi e, tramite la sincronizzazione, sulla bacheca.
  useEffect(() => {
    if (!stato || !stato.vincitore || salvato) return;
    if (stato.statsUmano.frecce === 0) {
      setSalvato(true);
      return;
    }
    let annullato = false;
    (async () => {
      const es = await db.esercizi
        .where("nome")
        .equals(NOME_ESERCIZIO_501)
        .first();
      if (es && !annullato) {
        await registraRisultato({
          esercizioId: es.id,
          data: dataIso(),
          valori: {
            media: media3(stato.statsUmano),
            first9: mediaFirst9(stato.statsUmano),
            checkout: checkoutPerc(stato.statsUmano),
          },
        });
      }
      if (!annullato) setSalvato(true);
    })();
    return () => {
      annullato = true;
    };
  }, [stato, salvato]);

  function avvia() {
    const primo = lancioMoneta();
    setStato(creaPartita(config, primo));
    setChiusura(null);
    setSalvato(false);
    setFase("moneta");
  }

  function rivincita() {
    if (!stato) return;
    const primo = lancioMoneta();
    setStato(creaPartita(stato.config, primo));
    setChiusura(null);
    setSalvato(false);
    setFase("moneta");
  }

  // L'umano invia la tirata. Col tastierino si conosce solo il totale: se
  // chiude, chiedo con quante frecce. Col bersaglio le frecce sono gia' note
  // (e cosi' pure gli sballi che dal totale non si vedrebbero), quindi si
  // applica direttamente senza domande.
  function inviaUmano(t: Tirata) {
    if (!stato) return;
    const frecce = t.frecce ?? 3;
    if (t.bust) {
      setStato(giocaUmano(stato, t.punteggio, frecce, true));
      return;
    }
    const chiude = risultatoVisita(
      stato.leg.puntiUmano,
      t.punteggio,
      stato.config.chiusura,
    ).chiuso;
    if (chiude && t.frecce == null) {
      setChiusura(t.punteggio);
    } else {
      setStato(giocaUmano(stato, t.punteggio, frecce));
    }
  }

  function confermaChiusura(frecce: number) {
    if (!stato || chiusura == null) return;
    setStato(giocaUmano(stato, chiusura, frecce));
    setChiusura(null);
  }

  // ---------- SETUP ----------
  if (fase === "setup") {
    return (
      <Impostazioni501 config={config} onChange={setConfig} onAvvia={avvia} />
    );
  }

  if (!stato) return null;

  // ---------- LANCIO MONETA ----------
  if (fase === "moneta") {
    const inizioUmano = stato.primo === "umano";
    return (
      <section className="centro-schermo">
        <div className="moneta">🪙</div>
        <p className="occhiello">Lancio della moneta</p>
        <h2>{inizioUmano ? "Inizi tu!" : "Inizia il bot"}</h2>
        <p className="mini">
          {stato.config.livello.nome} · {stato.config.puntiIniziali} ·{" "}
          {formatoNome(stato.config)}
        </p>
        <button
          className="bottone bottone-largo"
          onClick={() => setFase("gioco")}
        >
          Vai 🎯
        </button>
      </section>
    );
  }

  // ---------- PARTITA FINITA ----------
  if (stato.vincitore) {
    return (
      <Recap501
        stato={stato}
        salvato={salvato}
        onRivincita={rivincita}
        onImpostazioni={() => setFase("setup")}
      />
    );
  }

  // ---------- GIOCO ----------
  const leg = stato.leg;
  const legFinito = leg.vincitore != null;
  // Col bersaglio i pannitelli diventano una riga sola: l'altezza risparmiata
  // serve a far entrare tutto il tabellone nello schermo del telefono.
  const compatto = modoInput === "bersaglio";

  return (
    <section className="gioco">
      <div className="gioco-testa">
        <span className="mini">Leg {stato.numeroLeg}</span>
        <span className="leg-score">
          {stato.legUmano} — {stato.legBot}
        </span>
        <span className="mini">{formatoNome(stato.config)}</span>
      </div>

      {compatto ? (
        <TavoloCompatto
          leg={leg}
          legFinito={legFinito}
          chiusura={
            stato.config.mostraChiusura
              ? suggerisciChiusura(leg.puntiUmano)
              : null
          }
        />
      ) : (
        <div className="tavolo">
          <PannelloGiocatore
            nome="Tu"
            punti={leg.puntiUmano}
            ultimo={leg.ultimoUmano}
            bust={leg.bustUmano}
            media={media3(stato.statsUmano)}
            attivo={leg.turno === "umano" && !legFinito}
            vincitore={leg.vincitore === "umano"}
          />
          <PannelloGiocatore
            nome="Bot"
            punti={leg.puntiBot}
            ultimo={leg.ultimoBot}
            bust={leg.bustBot}
            media={media3(stato.statsBot)}
            attivo={leg.turno === "bot" && !legFinito}
            vincitore={leg.vincitore === "bot"}
          />
        </div>
      )}

      {legFinito ? (
        <div className="fine-leg">
          <h3>
            {leg.vincitore === "umano" ? "Leg tuo! 🎯" : "Leg al bot 🤖"}
          </h3>
          <button
            className="bottone bottone-largo"
            onClick={() => setStato(avanzaLeg(stato))}
          >
            Prossimo leg
          </button>
        </div>
      ) : chiusura != null ? (
        <div className="chiusura-frecce">
          <h3>Chiuso con {chiusura}! Con quante frecce?</h3>
          <div className="chiusura-scelte">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                className="bottone"
                onClick={() => confermaChiusura(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            className="bottone secondario piccolo"
            onClick={() => setChiusura(null)}
          >
            ↶ Annulla
          </button>
        </div>
      ) : leg.turno === "umano" ? (
        <>
          {stato.config.mostraChiusura && !compatto && (
            <SuggerimentoChiusura rimanente={leg.puntiUmano} />
          )}
          <InputTirata
            rimanente={leg.puntiUmano}
            chiusura={stato.config.chiusura}
            onInvia={inviaUmano}
          />
        </>
      ) : (
        <div className="attesa-bot">
          <span className="spinner" /> Il bot sta tirando…
        </div>
      )}
    </section>
  );
}

function formatoNome(config: ConfigPartita): string {
  const verbo = config.formato === "bestof" ? "Al meglio di" : "Primo a";
  const unita = config.unita === "legs" ? "leg" : "set";
  return `${verbo} ${config.numero} ${unita}`;
}

interface TavoloCompattoProps {
  leg: StatoLeg;
  legFinito: boolean;
  /** Chiusura consigliata, mostrata qui dentro per non occupare un'altra riga. */
  chiusura: string[] | null;
}

/**
 * Punteggi su una riga sola, per l'input a bersaglio. Rispetto ai pannelli
 * grandi si perde la media (resta comunque nel recap) e si guadagnano ~90px
 * di altezza, che vanno tutti al tabellone.
 */
function TavoloCompatto({ leg, legFinito, chiusura }: TavoloCompattoProps) {
  const sotto = (bust: boolean, ultimo: number | null) =>
    bust ? "BUST" : ultimo != null ? `↩ ${ultimo}` : "—";

  return (
    <div className="tavolo-compatto">
      <div
        className={`tc-lato${leg.turno === "umano" && !legFinito ? " attivo" : ""}`}
      >
        <span className="tc-nome">TU</span>
        <span className="tc-punti">{leg.puntiUmano}</span>
        {chiusura ? (
          <span className="tc-co">
            {chiusura.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </span>
        ) : (
          <span className="tc-sotto">{sotto(leg.bustUmano, leg.ultimoUmano)}</span>
        )}
      </div>
      <div
        className={`tc-lato${leg.turno === "bot" && !legFinito ? " attivo" : ""}`}
      >
        <span className="tc-nome">BOT</span>
        <span className="tc-punti">{leg.puntiBot}</span>
        <span className="tc-sotto">{sotto(leg.bustBot, leg.ultimoBot)}</span>
      </div>
    </div>
  );
}

/** Mostra la chiusura consigliata quando il rimanente e' un checkout. */
function SuggerimentoChiusura({ rimanente }: { rimanente: number }) {
  const chiusura = suggerisciChiusura(rimanente);
  if (!chiusura) return null;
  return (
    <div className="suggerimento-chiusura">
      <span className="mini">Chiusura</span>
      <div className="co121-chiusura">
        {chiusura.map((c, i) => (
          <span key={i} className="co121-freccia">
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

interface PannelloProps {
  nome: string;
  punti: number;
  ultimo: number | null;
  bust: boolean;
  media: number;
  attivo: boolean;
  vincitore: boolean;
}

function PannelloGiocatore({
  nome,
  punti,
  ultimo,
  bust,
  media,
  attivo,
  vincitore,
}: PannelloProps) {
  return (
    <div
      className={`pannello${attivo ? " attivo" : ""}${
        vincitore ? " vincitore" : ""
      }`}
    >
      <div className="pannello-nome">{nome}</div>
      <div className="pannello-punti">{punti}</div>
      <div className="pannello-sotto">
        {bust ? (
          <span className="bust">BUST</span>
        ) : ultimo != null ? (
          <span>ultima: {ultimo}</span>
        ) : (
          <span className="mini">—</span>
        )}
      </div>
      <div className="pannello-media">media {media}</div>
    </div>
  );
}
