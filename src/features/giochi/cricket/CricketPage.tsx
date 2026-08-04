import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InvitoRipresa } from "../../../components/InvitoRipresa";
import { SelettoreLivello } from "../../../components/SelettoreLivello";
import {
  leggiRipresa,
  salvaRipresa,
  scartaRipresa,
  type Ripresa,
} from "../../../lib/ripresa";
import { InputBersaglio } from "../../input/InputBersaglio";
import type { Tirata } from "../../input/tirata";
import { usaVerticale } from "../../../lib/orientamento";
import { usaUscitaGioco } from "../../../lib/uscitaGioco";
import {
  chiuso,
  creaPartita,
  etichettaNumero,
  giocaVisita,
  giocaVisitaBot,
  LIVELLI_CRICKET,
  MODI_PUNTEGGIO,
  NUMERI_CRICKET,
  SEGNI_PER_CHIUDERE,
  type ConfigCricket,
  type LivelloCricket,
  type Punteggio,
  type StatoCricket,
} from "./logica";

/**
 * Cricket: contro un amico sullo stesso telefono oppure contro il bot.
 * Serve per forza l'input a bersaglio, perche' qui conta dove finisce ogni
 * freccia e non il totale della visita.
 */
/** Chiave sotto cui vive la partita di Cricket lasciata a meta'. */
const RIPRESA_CRICKET = "cricket";

export default function CricketPage() {
  const navigate = useNavigate();
  const esci = usaUscitaGioco();
  const [ripresa, setRipresa] = useState<Ripresa<StatoCricket> | null>(() =>
    leggiRipresa<StatoCricket>(RIPRESA_CRICKET),
  );
  const [config, setConfig] = useState<ConfigCricket>({
    punteggio: "classico",
    bot: LIVELLI_CRICKET[1],
    nomi: ["Tu", "Bot"],
  });
  const [stato, setStato] = useState<StatoCricket | null>(null);
  const verticale = usaVerticale();
  // Scelta di giocare comunque in verticale: serve a chi ha il blocco
  // rotazione attivo, che altrimenti non potrebbe entrare in partita.
  const [ignoraVerticale, setIgnoraVerticale] = useState(false);

  // Quando tocca al bot, gioca da solo dopo una pausa.
  useEffect(() => {
    if (!stato || stato.vincitore != null || !stato.config.bot) return;
    if (stato.turno !== 1) return;
    const t = setTimeout(() => setStato((s) => (s ? giocaVisitaBot(s) : s)), 900);
    return () => clearTimeout(t);
  }, [stato]);

  // Copia di sicurezza a ogni visita: se il sistema chiude la PWA la partita
  // si ritrova. A partita finita non c'e' piu' niente da riprendere.
  useEffect(() => {
    if (!stato) return;
    if (stato.vincitore != null) {
      scartaRipresa(RIPRESA_CRICKET);
      return;
    }
    const [a, b] = stato.giocatori;
    salvaRipresa(
      RIPRESA_CRICKET,
      `${a.nome} ${a.punti} — ${b.punti} ${b.nome}`,
      stato,
    );
  }, [stato]);

  function avvia() {
    setRipresa(null);
    scartaRipresa(RIPRESA_CRICKET);
    setStato(creaPartita(config));
  }

  function riprendi() {
    if (!ripresa) return;
    setStato(ripresa.dati);
    setRipresa(null);
  }

  function invia(t: Tirata) {
    if (!stato) return;
    setStato(giocaVisita(stato, t.dardi ?? []));
  }

  // ---------- SETUP ----------
  if (!stato) {
    return (
      <>
        {ripresa && (
          <InvitoRipresa
            ripresa={ripresa}
            onRiprendi={riprendi}
            onScarta={() => {
              setRipresa(null);
              scartaRipresa(RIPRESA_CRICKET);
            }}
          />
        )}
        <Setup config={config} onChange={setConfig} onAvvia={avvia} />
      </>
    );
  }

  const [g0, g1] = stato.giocatori;

  // ---------- FINE PARTITA ----------
  if (stato.vincitore != null) {
    const vinc = stato.giocatori[stato.vincitore];
    return (
      <section className="centro-schermo">
        <div className="moneta">🏆</div>
        <p className="occhiello">
          Cricket {stato.config.punteggio === "cutthroat" ? "cut-throat" : ""}
        </p>
        <h2>{vinc.nome} vince!</h2>
        <p className="punteggio-finale">
          {g0.punti} — {g1.punti}
        </p>
        <p className="mini">
          {g0.nome} {g0.punti} · {g1.nome} {g1.punti}
        </p>
        <div className="modale-azioni">
          <button className="bottone secondario" onClick={() => setStato(null)}>
            Impostazioni
          </button>
          <button className="bottone" onClick={avvia}>
            Rivincita
          </button>
        </div>
      </section>
    );
  }

  // ---------- PARTITA ----------
  const attesaBot = stato.config.bot != null && stato.turno === 1;

  // In verticale tabellone e bersaglio si contendono l'altezza: si chiede di
  // girare il telefono. La via d'uscita e' obbligatoria, non una cortesia:
  // con il blocco rotazione attivo l'utente resterebbe fuori dal gioco.
  if (verticale && !ignoraVerticale) {
    return (
      <div className="cricket-schermo ruota">
        <div className="ck-ruota">
          <span className="ck-ruota-icona">📱</span>
          <h2>Gira il telefono</h2>
          <p className="mini">
            In orizzontale il tabellone sta di fianco al bersaglio: si segna
            senza scorrere.
          </p>
          <div className="modale-azioni">
            <button className="bottone secondario" onClick={() => navigate("/giochi")}>
              Esci
            </button>
            <button className="bottone" onClick={() => setIgnoraVerticale(true)}>
              Gioca in verticale
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cricket-schermo">
      <div className="ck-colonna-punteggi">
        <div className="bob27-testa">
          <button
            className="icona-btn"
            aria-label="Esci dal gioco"
            onClick={() => esci("/giochi", stato.ultima != null)}
          >
            ✕
          </button>
          <h2>Cricket</h2>
          <span className="mini">
            {stato.config.punteggio === "cutthroat" ? "cut-throat" : "classico"}
          </span>
        </div>

        <div className="cricket-tabellone">
          <div className={`ck-testa${stato.turno === 0 ? " attivo" : ""}`}>
            <span className="ck-nome">{g0.nome}</span>
            <span className="ck-punti">{g0.punti}</span>
          </div>
          <div className="ck-testa-num">Cricket</div>
          <div className={`ck-testa${stato.turno === 1 ? " attivo" : ""}`}>
            <span className="ck-nome">{g1.nome}</span>
            <span className="ck-punti">{g1.punti}</span>
          </div>

          {NUMERI_CRICKET.map((n) => {
            // Numero morto: chiuso da entrambi, non fa piu' punti a nessuno.
            const morto = chiuso(g0, n) && chiuso(g1, n);
            return (
              <div className={`ck-riga${morto ? " morto" : ""}`} key={n}>
                <Segni valore={g0.segni[n] ?? 0} />
                <span className="ck-numero">{etichettaNumero(n)}</span>
                <Segni valore={g1.segni[n] ?? 0} />
              </div>
            );
          })}
        </div>

        {stato.ultima && (
          <p className="mini ck-ultima">
            {stato.giocatori[stato.ultima.di].nome}:{" "}
            {stato.ultima.segni.length > 0
              ? riassumiSegni(stato.ultima.segni)
              : "nessun segno"}
            {stato.ultima.punti > 0 && ` · ${stato.ultima.punti} punti`}
          </p>
        )}
      </div>

      <div className="ck-colonna-input">
        {attesaBot ? (
          <div className="attesa-bot">
            <span className="spinner" /> Il bot sta tirando…
          </div>
        ) : (
          <InputBersaglio onInvia={invia} />
        )}
      </div>
    </div>
  );
}

/** "20 ×7 · Bull ×2" invece di ripetere ogni singolo segno. */
function riassumiSegni(segni: string[]): string {
  const conteggi = new Map<string, number>();
  for (const s of segni) conteggi.set(s, (conteggi.get(s) ?? 0) + 1);
  return [...conteggi]
    .map(([numero, quanti]) => (quanti > 1 ? `${numero} ×${quanti}` : numero))
    .join(" · ");
}

/** I segni di un numero: barra, croce, cerchio quando e' chiuso. */
function Segni({ valore }: { valore: number }) {
  const pieno = valore >= SEGNI_PER_CHIUDERE;
  return (
    <span className={`ck-segni${pieno ? " chiuso" : ""}`}>
      {valore === 0 ? "" : valore === 1 ? "/" : valore === 2 ? "✕" : "⊗"}
    </span>
  );
}

interface SetupProps {
  config: ConfigCricket;
  onChange: (c: ConfigCricket) => void;
  onAvvia: () => void;
}

function Setup({ config, onChange, onAvvia }: SetupProps) {
  const controBot = config.bot != null;

  function scegliAvversario(bot: LivelloCricket | null) {
    onChange({
      ...config,
      bot,
      // Il nome dell'avversario segue la scelta, ma resta modificabile.
      nomi: [config.nomi[0], bot ? "Bot" : "Amico"],
    });
  }

  return (
    <section>
      <div className="pagina-testa">
        <div>
          <p className="occhiello">Partita</p>
          <h2>Cricket</h2>
        </div>
      </div>

      <div className="scheda">
        <h3>Contro chi giochi?</h3>
        <div className="imp-segmento verticale">
          <button
            className={!controBot ? "attivo" : ""}
            onClick={() => scegliAvversario(null)}
          >
            Un amico
          </button>
          <button
            className={controBot ? "attivo" : ""}
            onClick={() => scegliAvversario(LIVELLI_CRICKET[1])}
          >
            Il bot
          </button>
        </div>
        <p className="mini">
          {controBot
            ? "Il bot tira da solo al suo turno."
            : "Stesso telefono, a turno: passatelo dopo ogni visita."}
        </p>
      </div>

      {controBot && (
        <div className="scheda">
          <SelettoreLivello
            livelli={LIVELLI_CRICKET.map((l) => ({
              nome: l.nome,
              nota: `${l.segniPerFreccia} segni a freccia`,
            }))}
            indice={Math.max(
              0,
              LIVELLI_CRICKET.findIndex((l) => l.id === config.bot?.id),
            )}
            onCambia={(i) => onChange({ ...config, bot: LIVELLI_CRICKET[i] })}
          />
        </div>
      )}

      <div className="scheda">
        <h3>Nomi</h3>
        <label className="campo">
          <span>Giocatore 1</span>
          <input
            value={config.nomi[0]}
            maxLength={12}
            onChange={(e) =>
              onChange({ ...config, nomi: [e.target.value, config.nomi[1]] })
            }
          />
        </label>
        <label className="campo">
          <span>Giocatore 2</span>
          <input
            value={config.nomi[1]}
            maxLength={12}
            onChange={(e) =>
              onChange({ ...config, nomi: [config.nomi[0], e.target.value] })
            }
          />
        </label>
      </div>

      <div className="scheda">
        <h3>Punteggio</h3>
        <div className="opzioni-lista">
          {MODI_PUNTEGGIO.map((m) => (
            <button
              key={m.id}
              className={config.punteggio === m.id ? "opzione attiva" : "opzione"}
              onClick={() => onChange({ ...config, punteggio: m.id as Punteggio })}
            >
              <strong>{m.nome}</strong>
              <span className="mini">{m.descr}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        className="bottone bottone-largo"
        onClick={onAvvia}
        disabled={!config.nomi[0].trim() || !config.nomi[1].trim()}
      >
        Inizia 🎯
      </button>
    </section>
  );
}
