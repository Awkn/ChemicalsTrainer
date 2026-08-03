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
import { nomeGiocatore } from "../../lib/giocatore";
import { percentualeDoppi, totaleDoppi } from "../../lib/doppi";
import { registraDoppi } from "../../lib/doppiStorico";
import {
  aSet,
  avanzaLeg,
  checkoutPerc,
  configPredefinita,
  creaPartita,
  giocaBot,
  giocaVisita,
  lancioMoneta,
  LIVELLI,
  media3,
  mediaFirst9,
  nomeFormato,
  nomiVisualizzati,
  rimanenteDi,
  risultatoVisita,
  type ConfigPartita,
  type Giocatore,
  type StatoLeg,
  type StatoPartita,
} from "./logica501";

/** Esercizio di libreria su cui salvare le statistiche del 501. */
const NOME_ESERCIZIO_501 = "501 contro il computer";

type Fase = "setup" | "moneta" | "gioco";

export function Gioco501Page() {
  const modoInput = usaModoInput();
  const [fase, setFase] = useState<Fase>("setup");
  const [config, setConfig] = useState<ConfigPartita>(() => {
    const base = configPredefinita(LIVELLI[1]);
    // Chi ha gia' un nome sulla bacheca non deve riscriverlo per giocare in due.
    const mio = nomeGiocatore();
    return mio ? { ...base, nomi: [mio, base.nomi[1]] } : base;
  });
  const [stato, setStato] = useState<StatoPartita | null>(null);
  // Tirata che chiude un leg, in attesa che l'utente indichi le frecce usate.
  const [chiusura, setChiusura] = useState<Tirata | null>(null);
  // Le statistiche della partita finita sono state salvate nell'esercizio 501.
  const [salvato, setSalvato] = useState(false);

  // Il bot gioca da solo quando e' il suo turno. Giocando in due non tocca a
  // nessuno tirare al posto di qualcun altro.
  useEffect(() => {
    if (
      fase !== "gioco" ||
      !stato ||
      stato.config.avversario !== "bot" ||
      stato.vincitore ||
      stato.leg.vincitore ||
      stato.leg.turno !== "due"
    ) {
      return;
    }
    const t = setTimeout(() => setStato((s) => (s ? giocaBot(s) : s)), 950);
    return () => clearTimeout(t);
  }, [fase, stato]);

  // A partita finita salva le statistiche del GIOCATORE 1 nell'esercizio 501
  // (una volta): finiscono nei Progressi e, tramite la sincronizzazione, sulla
  // bacheca. Quelle del secondo posto restano nel recap: sono di chi ha in mano
  // il telefono solo quando gioca da primo, e non vanno nel suo storico.
  useEffect(() => {
    if (!stato || !stato.vincitore || salvato) return;
    if (stato.statsUno.frecce === 0) {
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
        const valori: Record<string, number> = {
          media: media3(stato.statsUno),
          first9: mediaFirst9(stato.statsUno),
          checkout: checkoutPerc(stato.statsUno),
        };
        // La percentuale vera esiste solo se si e' giocato a bersaglio: senza
        // tentativi registrati non si salva, per non sporcare lo storico con 0.
        const doppi = totaleDoppi(stato.statsUno.doppi);
        if (doppi.tentativi > 0) valori.doppi = percentualeDoppi(doppi);

        await registraRisultato({ esercizioId: es.id, data: dataIso(), valori });
        // Lo storico per bersaglio vive a parte: serve a capire nel tempo su
        // quale doppio si sbaglia, cosa che una sola partita non puo' dire.
        await registraDoppi(stato.statsUno.doppi, "501");
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

  // Arriva la tirata di chi ha il turno. Col tastierino si conosce solo il
  // totale: se chiude, chiedo con quante frecce. Col bersaglio le frecce sono
  // gia' note (e cosi' pure gli sballi che dal totale non si vedrebbero),
  // quindi si applica direttamente senza domande.
  function inviaTirata(t: Tirata) {
    if (!stato) return;
    const di = stato.leg.turno;
    if (t.bust) {
      setStato(giocaVisita(stato, di, t));
      return;
    }
    const chiude = risultatoVisita(
      rimanenteDi(stato.leg, di),
      t.punteggio,
      stato.config.chiusura,
    ).chiuso;
    if (chiude && t.frecce == null) {
      setChiusura(t);
    } else {
      setStato(giocaVisita(stato, di, t));
    }
  }

  function confermaChiusura(frecce: number) {
    if (!stato || !chiusura) return;
    setStato(giocaVisita(stato, stato.leg.turno, { ...chiusura, frecce }));
    setChiusura(null);
  }

  // ---------- SETUP ----------
  if (fase === "setup") {
    return (
      <Impostazioni501 config={config} onChange={setConfig} onAvvia={avvia} />
    );
  }

  if (!stato) return null;

  const nomi = nomiVisualizzati(stato.config);
  const controBot = stato.config.avversario === "bot";
  const nomeDi = (g: Giocatore) => (g === "uno" ? nomi[0] : nomi[1]);

  // ---------- LANCIO MONETA ----------
  if (fase === "moneta") {
    const inizioUno = stato.primo === "uno";
    return (
      <section className="centro-schermo">
        <div className="moneta">🪙</div>
        <p className="occhiello">Lancio della moneta</p>
        <h2>
          {controBot
            ? inizioUno
              ? "Inizi tu!"
              : "Inizia il bot"
            : `Inizia ${nomeDi(stato.primo)}`}
        </h2>
        <p className="mini">
          {controBot ? `${stato.config.livello.nome} · ` : ""}
          {stato.config.puntiIniziali} · {nomeFormato(stato.config)}
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
  const attesaBot = controBot && leg.turno === "due";
  const rimanente = rimanenteDi(leg, leg.turno);
  const conSet = aSet(stato.config);
  // A set il punteggio grosso e' quello dei set: sono loro a decidere la
  // partita, i leg dicono solo a che punto e' il set in corso.
  const setChiuso = stato.setChiuso;
  // Col bersaglio i pannelli diventano una riga sola: l'altezza risparmiata
  // serve a far entrare tutto il tabellone nello schermo del telefono.
  const compatto = modoInput === "bersaglio";

  return (
    <section className="gioco">
      <div className="gioco-testa">
        <span className="mini">
          {conSet ? `Set ${stato.numeroSet} · Leg ${stato.numeroLeg}` : `Leg ${stato.numeroLeg}`}
        </span>
        <span className="gioco-punteggio">
          <span className="leg-score">
            {conSet ? stato.setUno : stato.legUno} —{" "}
            {conSet ? stato.setDue : stato.legDue}
          </span>
          {conSet && (
            <span className="mini">
              leg {stato.legUno} — {stato.legDue}
            </span>
          )}
        </span>
        <span className="mini">{nomeFormato(stato.config)}</span>
      </div>

      {compatto ? (
        <TavoloCompatto
          leg={leg}
          nomi={nomi}
          legFinito={legFinito}
          chiusura={
            stato.config.mostraChiusura
              ? suggerisciChiusura(rimanenteDi(leg, "uno"))
              : null
          }
          chiusuraDue={
            stato.config.mostraChiusura && !controBot
              ? suggerisciChiusura(rimanenteDi(leg, "due"))
              : null
          }
        />
      ) : (
        <div className="tavolo">
          <PannelloGiocatore
            nome={nomi[0]}
            punti={leg.puntiUno}
            ultimo={leg.ultimoUno}
            bust={leg.bustUno}
            media={media3(stato.statsUno)}
            attivo={leg.turno === "uno" && !legFinito}
            vincitore={leg.vincitore === "uno"}
          />
          <PannelloGiocatore
            nome={nomi[1]}
            punti={leg.puntiDue}
            ultimo={leg.ultimoDue}
            bust={leg.bustDue}
            media={media3(stato.statsDue)}
            attivo={leg.turno === "due" && !legFinito}
            vincitore={leg.vincitore === "due"}
          />
        </div>
      )}

      {legFinito ? (
        <div className="fine-leg">
          <h3>
            {esitoParziale(
              setChiuso ? "Set" : "Leg",
              leg.vincitore!,
              controBot,
              nomeDi,
            )}
          </h3>
          {setChiuso && (
            <p className="mini">
              Set chiuso {stato.legUno} — {stato.legDue} · ora {stato.setUno} —{" "}
              {stato.setDue}
            </p>
          )}
          <button
            className="bottone bottone-largo"
            onClick={() => setStato(avanzaLeg(stato))}
          >
            {setChiuso ? "Prossimo set" : "Prossimo leg"}
          </button>
        </div>
      ) : chiusura != null ? (
        <div className="chiusura-frecce">
          <h3>Chiuso con {chiusura.punteggio}! Con quante frecce?</h3>
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
      ) : attesaBot ? (
        <div className="attesa-bot">
          <span className="spinner" /> Il bot sta tirando…
        </div>
      ) : (
        <>
          {/* Giocando in due il telefono passa di mano: dire di chi e' il
              turno evita che segni la visita la persona sbagliata. */}
          {!controBot && (
            <p className="turno-di">
              Tocca a <strong>{nomeDi(leg.turno)}</strong>
            </p>
          )}
          {stato.config.mostraChiusura && !compatto && (
            <SuggerimentoChiusura rimanente={rimanente} />
          )}
          <InputTirata
            rimanente={rimanente}
            chiusura={stato.config.chiusura}
            onInvia={inviaTirata}
          />
        </>
      )}
    </section>
  );
}

/** "Leg tuo!" / "Set al bot" / "Leg di Lorenzo", secondo chi sta giocando. */
function esitoParziale(
  cosa: "Leg" | "Set",
  vincitore: Giocatore,
  controBot: boolean,
  nomeDi: (g: Giocatore) => string,
): string {
  if (!controBot) return `${cosa} di ${nomeDi(vincitore)} 🎯`;
  return vincitore === "uno" ? `${cosa} tuo! 🎯` : `${cosa} al bot 🤖`;
}

interface TavoloCompattoProps {
  leg: StatoLeg;
  nomi: [string, string];
  legFinito: boolean;
  /** Chiusura consigliata, mostrata qui dentro per non occupare un'altra riga. */
  chiusura: string[] | null;
  /** Come sopra per il secondo giocatore: al bot non serve un suggerimento. */
  chiusuraDue: string[] | null;
}

/**
 * Punteggi su una riga sola, per l'input a bersaglio. Rispetto ai pannelli
 * grandi si perde la media (resta comunque nel recap) e si guadagnano ~90px
 * di altezza, che vanno tutti al tabellone.
 */
function TavoloCompatto({
  leg,
  nomi,
  legFinito,
  chiusura,
  chiusuraDue,
}: TavoloCompattoProps) {
  const sotto = (bust: boolean, ultimo: number | null) =>
    bust ? "BUST" : ultimo != null ? `↩ ${ultimo}` : "—";

  return (
    <div className="tavolo-compatto">
      <div
        className={`tc-lato${leg.turno === "uno" && !legFinito ? " attivo" : ""}`}
      >
        <span className="tc-nome">{nomi[0].toUpperCase()}</span>
        <span className="tc-punti">{leg.puntiUno}</span>
        {chiusura ? (
          <span className="tc-co">
            {chiusura.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </span>
        ) : (
          <span className="tc-sotto">{sotto(leg.bustUno, leg.ultimoUno)}</span>
        )}
      </div>
      <div
        className={`tc-lato${leg.turno === "due" && !legFinito ? " attivo" : ""}`}
      >
        <span className="tc-nome">{nomi[1].toUpperCase()}</span>
        <span className="tc-punti">{leg.puntiDue}</span>
        {chiusuraDue ? (
          <span className="tc-co">
            {chiusuraDue.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </span>
        ) : (
          <span className="tc-sotto">{sotto(leg.bustDue, leg.ultimoDue)}</span>
        )}
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
