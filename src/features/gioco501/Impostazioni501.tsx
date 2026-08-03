import { useState } from "react";
import { SelettoreSquadraBot } from "./SelettoreSquadraBot";
import {
  LIVELLI,
  livelloDaMedia,
  MODI_CHIUSURA,
  MODI_INGRESSO,
  PUNTEGGI_INIZIALI,
  type ConfigPartita,
} from "./logica501";

interface Props {
  config: ConfigPartita;
  onChange: (config: ConfigPartita) => void;
  onAvvia: () => void;
}

/** Schermata di configurazione della partita 501 contro il bot. */
export function Impostazioni501({ config, onChange, onAvvia }: Props) {
  const patch = (p: Partial<ConfigPartita>) => onChange({ ...config, ...p });

  // "Personalizzato" attivo quando il punteggio non e' uno dei preset.
  const personalizzato = !PUNTEGGI_INIZIALI.includes(config.puntiIniziali);
  const [valoreCustom, setValoreCustom] = useState(
    personalizzato ? config.puntiIniziali : 170,
  );

  const passoNumero = (d: number) => {
    const n = Math.min(15, Math.max(1, config.numero + d));
    patch({ numero: n });
  };

  const passoLegSet = (d: number) => {
    const n = Math.min(15, Math.max(1, config.legNumero + d));
    patch({ legNumero: n });
  };

  const botSquadra = config.livello.id === "squadra";
  const [mostraSquadra, setMostraSquadra] = useState(botSquadra);
  const controBot = config.avversario === "bot";

  return (
    <section>
      <div className="pagina-testa">
        <div>
          <p className="occhiello">Partita</p>
          <h2>{controBot ? "501 contro il bot" : "501 in due"}</h2>
        </div>
      </div>

      {/* Avversario */}
      <div className="scheda">
        <h3>Contro chi giochi?</h3>
        <div className="imp-segmento verticale">
          <button
            className={controBot ? "attivo" : ""}
            onClick={() => patch({ avversario: "bot" })}
          >
            🤖 Il bot
          </button>
          <button
            className={!controBot ? "attivo" : ""}
            onClick={() => patch({ avversario: "umano" })}
          >
            👥 Un amico
          </button>
        </div>
        <p className="mini">
          {controBot
            ? "Il bot tira da solo al suo turno."
            : "Stesso telefono, a turno: passatelo dopo ogni visita. Nei Progressi finiscono le statistiche del giocatore 1."}
        </p>

        {!controBot && (
          <>
            <label className="campo">
              <span>Giocatore 1</span>
              <input
                value={config.nomi[0]}
                maxLength={12}
                onChange={(e) =>
                  patch({ nomi: [e.target.value, config.nomi[1]] })
                }
              />
            </label>
            <label className="campo">
              <span>Giocatore 2</span>
              <input
                value={config.nomi[1]}
                maxLength={12}
                onChange={(e) =>
                  patch({ nomi: [config.nomi[0], e.target.value] })
                }
              />
            </label>
          </>
        )}
      </div>

      {/* Formato: meglio di / primo a · numero · legs/sets */}
      <div className="imp-formato">
        <div className="imp-segmento verticale">
          <button
            className={config.formato === "bestof" ? "attivo" : ""}
            onClick={() => patch({ formato: "bestof" })}
          >
            Il meglio di
          </button>
          <button
            className={config.formato === "firstto" ? "attivo" : ""}
            onClick={() => patch({ formato: "firstto" })}
          >
            Il primo a
          </button>
        </div>

        <div className="imp-stepper">
          <button aria-label="Aumenta" onClick={() => passoNumero(1)}>
            ⌃
          </button>
          <span>{config.numero}</span>
          <button aria-label="Diminuisci" onClick={() => passoNumero(-1)}>
            ⌄
          </button>
        </div>

        <div className="imp-segmento verticale">
          <button
            className={config.unita === "legs" ? "attivo" : ""}
            onClick={() => patch({ unita: "legs" })}
          >
            Legs
          </button>
          <button
            className={config.unita === "sets" ? "attivo" : ""}
            onClick={() => patch({ unita: "sets" })}
          >
            Sets
          </button>
        </div>
      </div>

      {/* A set servono due conti: quanti set fanno la partita (sopra) e
          quanti leg fanno un set. */}
      {config.unita === "sets" && (
        <div className="imp-legset">
          <span>Ogni set:</span>
          <div className="imp-stepper orizzontale">
            <button aria-label="Meno leg per set" onClick={() => passoLegSet(-1)}>
              −
            </button>
            <span>{config.legNumero}</span>
            <button aria-label="Più leg per set" onClick={() => passoLegSet(1)}>
              +
            </button>
          </div>
          <span>{config.formato === "bestof" ? "leg (al meglio di)" : "leg"}</span>
        </div>
      )}

      {/* Punteggio iniziale */}
      <div className="imp-punti">
        {PUNTEGGI_INIZIALI.map((p) => (
          <button
            key={p}
            className={config.puntiIniziali === p ? "attivo" : ""}
            onClick={() => patch({ puntiIniziali: p })}
          >
            {p}
          </button>
        ))}
        <button
          className={personalizzato ? "attivo custom" : "custom"}
          onClick={() => patch({ puntiIniziali: valoreCustom })}
        >
          <span className="mini">Personalizzato</span>
          <input
            type="number"
            min={2}
            max={999}
            value={valoreCustom}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              const v = Math.min(999, Math.max(2, Number(e.target.value) || 2));
              setValoreCustom(v);
              patch({ puntiIniziali: v });
            }}
          />
        </button>
      </div>

      {/* Ingresso */}
      <div className="imp-riga3">
        {MODI_INGRESSO.map((m) => (
          <button
            key={m.id}
            className={config.ingresso === m.id ? "attivo" : ""}
            onClick={() => patch({ ingresso: m.id })}
          >
            {m.nome}
          </button>
        ))}
      </div>

      {/* Uscita */}
      <div className="imp-riga3">
        {MODI_CHIUSURA.map((m) => (
          <button
            key={m.id}
            className={config.chiusura === m.id ? "attivo" : ""}
            onClick={() => patch({ chiusura: m.id })}
          >
            {m.nome}
          </button>
        ))}
      </div>

      {/* Interruttori */}
      <label className="imp-switch">
        <span>
          Percentuale in chiusura{" "}
          <span
            className="imp-info"
            title="Mostra la chiusura consigliata durante la partita."
          >
            ?
          </span>
        </span>
        <input
          type="checkbox"
          checked={config.mostraChiusura}
          onChange={(e) => patch({ mostraChiusura: e.target.checked })}
        />
        <span className="imp-slider" />
      </label>

      <label className="imp-switch">
        <span>
          Due {config.unita === "sets" ? "set" : "leg"} di scarto{" "}
          <span
            className="imp-info"
            title="Per vincere non basta arrivare al traguardo: bisogna staccare l'avversario di due."
          >
            ?
          </span>
        </span>
        <input
          type="checkbox"
          checked={config.dueLegDiff}
          onChange={(e) => patch({ dueLegDiff: e.target.checked })}
        />
        <span className="imp-slider" />
      </label>

      {/* Livello del bot: giocando in due non serve a niente. */}
      {controBot && (
      <div className="scheda">
        <h3>Livello del bot</h3>
        <div className="opzioni-lista">
          {LIVELLI.map((l) => (
            <button
              key={l.id}
              className={config.livello.id === l.id ? "opzione attiva" : "opzione"}
              onClick={() => patch({ livello: l })}
            >
              <strong>{l.nome}</strong>
              <span className="mini">{l.nota ?? `Media ${l.media}`}</span>
            </button>
          ))}

          <button
            className={`opzione squadra-bot-toggle${botSquadra ? " attiva" : ""}`}
            onClick={() => setMostraSquadra((v) => !v)}
          >
            <strong>Bot livello squadra 👥</strong>
            <span className="mini">
              {botSquadra
                ? `Stai sfidando: ${config.livello.nome} (media ${Math.round(
                    config.livello.media,
                  )})`
                : "Gioca con la media di un compagno di squadra"}
            </span>
          </button>

          {mostraSquadra && (
            <SelettoreSquadraBot
              selezionatoId={botSquadra ? config.livello.compagnoId : undefined}
              onScegli={(c) =>
                patch({ livello: livelloDaMedia(c.nome, c.media, c.id) })
              }
            />
          )}
        </div>
      </div>
      )}

      <button className="bottone bottone-largo" onClick={onAvvia}>
        🎲 Lancia la moneta e inizia
      </button>
    </section>
  );
}
