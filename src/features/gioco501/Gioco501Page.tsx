import { useEffect, useState } from "react";
import { Tastierino } from "./Tastierino";
import {
  avanzaLeg,
  creaPartita,
  giocaBot,
  giocaUmano,
  lancioMoneta,
  LIVELLI,
  media3,
  MODI_CHIUSURA,
  type LivelloId,
  type ModoChiusura,
  type StatoPartita,
} from "./logica501";

type Fase = "setup" | "moneta" | "gioco";

export function Gioco501Page() {
  const [fase, setFase] = useState<Fase>("setup");
  const [livelloId, setLivelloId] = useState<LivelloId>("medio");
  const [modo, setModo] = useState<ModoChiusura>("double");
  const [stato, setStato] = useState<StatoPartita | null>(null);

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

  function avvia() {
    const livello = LIVELLI.find((l) => l.id === livelloId)!;
    const primo = lancioMoneta();
    setStato(creaPartita(livello, modo, primo));
    setFase("moneta");
  }

  function rivincita() {
    if (!stato) return;
    const primo = lancioMoneta();
    setStato(creaPartita(stato.livello, stato.modo, primo));
    setFase("moneta");
  }

  // ---------- SETUP ----------
  if (fase === "setup") {
    return (
      <section>
        <div className="pagina-testa">
          <div>
            <p className="occhiello">Partita</p>
            <h2>501 contro il bot</h2>
          </div>
        </div>

        <p className="mini">
          Al meglio dei {5} leg (vince chi arriva a 3). Giochi sul bersaglio
          vero e inserisci il punteggio di ogni tirata; il bot risponde da solo.
        </p>

        <div className="scheda">
          <h3>Livello del bot</h3>
          <div className="opzioni-lista">
            {LIVELLI.map((l) => (
              <button
                key={l.id}
                className={
                  livelloId === l.id ? "opzione attiva" : "opzione"
                }
                onClick={() => setLivelloId(l.id)}
              >
                <strong>{l.nome}</strong>
                <span className="mini">Media {l.media}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="scheda">
          <h3>Modo di chiusura</h3>
          <div className="opzioni-lista">
            {MODI_CHIUSURA.map((m) => (
              <button
                key={m.id}
                className={modo === m.id ? "opzione attiva" : "opzione"}
                onClick={() => setModo(m.id)}
              >
                <strong>{m.nome}</strong>
                <span className="mini">{m.descr}</span>
              </button>
            ))}
          </div>
        </div>

        <button className="bottone bottone-largo" onClick={avvia}>
          🎲 Lancia la moneta e inizia
        </button>
      </section>
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
          {stato.livello.nome} · {modoNome(stato.modo)}
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
    const vinto = stato.vincitore === "umano";
    return (
      <section className="centro-schermo">
        <div className="moneta">{vinto ? "🏆" : "🤖"}</div>
        <p className="occhiello">Partita finita</p>
        <h2>{vinto ? "Hai vinto!" : "Ha vinto il bot"}</h2>
        <p className="punteggio-finale">
          {stato.legUmano} — {stato.legBot}
        </p>
        <p className="mini">
          Tua media: {media3(stato.statsUmano)} · Bot: {media3(stato.statsBot)}
        </p>
        <div className="modale-azioni">
          <button className="bottone secondario" onClick={() => setFase("setup")}>
            Impostazioni
          </button>
          <button className="bottone" onClick={rivincita}>
            Rivincita
          </button>
        </div>
      </section>
    );
  }

  // ---------- GIOCO ----------
  const leg = stato.leg;
  const legFinito = leg.vincitore != null;

  return (
    <section className="gioco">
      <div className="gioco-testa">
        <span className="mini">Leg {stato.numeroLeg}</span>
        <span className="leg-score">
          {stato.legUmano} — {stato.legBot}
        </span>
        <span className="mini">Best of {5}</span>
      </div>

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
      ) : leg.turno === "umano" ? (
        <Tastierino
          rimanente={leg.puntiUmano}
          onInvia={(p) => setStato(giocaUmano(stato, p))}
        />
      ) : (
        <div className="attesa-bot">
          <span className="spinner" /> Il bot sta tirando…
        </div>
      )}
    </section>
  );
}

function modoNome(m: ModoChiusura): string {
  return MODI_CHIUSURA.find((x) => x.id === m)?.nome ?? m;
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
