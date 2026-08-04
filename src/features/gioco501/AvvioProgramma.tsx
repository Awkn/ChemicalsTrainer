import { SelettoreLivello } from "../../components/SelettoreLivello";
import { LIVELLI, nomeFormato, type ConfigPartita } from "./logica501";

interface Props {
  config: ConfigPartita;
  onChange: (config: ConfigPartita) => void;
  onAvvia: () => void;
}

/**
 * Avvio del 501 quando parte da un esercizio del programma. Il formato lo
 * decide l'esercizio (vedi FORMATO_PROGRAMMA), quindi non c'e' niente da
 * configurare tranne quanto forte deve essere l'avversario: si sceglie il
 * livello e si tira. Per una partita su misura c'e' Giochi → 501.
 */
export function AvvioProgramma({ config, onChange, onAvvia }: Props) {
  const indice = Math.max(
    0,
    LIVELLI.findIndex((l) => l.id === config.livello.id),
  );

  return (
    <section>
      <div className="pagina-testa">
        <div>
          <p className="occhiello">Allenamento</p>
          <h2>501 contro il computer</h2>
        </div>
      </div>

      <div className="scheda">
        <SelettoreLivello
          livelli={LIVELLI.map((l) => ({
            nome: l.nome,
            nota: `media ${l.media}`,
          }))}
          indice={indice}
          onCambia={(i) => onChange({ ...config, livello: LIVELLI[i] })}
          etichetta="Quanto forte deve giocare?"
        />
        <p className="mini">
          Scegli un livello poco sopra la tua media: è lì che si migliora.
        </p>
      </div>

      <p className="mini avvio-formato">
        {nomeFormato(config)} · {config.puntiIniziali} · Double out
      </p>

      <button className="bottone bottone-largo" onClick={onAvvia}>
        🎲 Lancia la moneta e inizia
      </button>

      <p className="mini">
        A fine partita media, first 9, checkout % e doppi finiscono da soli nei
        Progressi.
      </p>
    </section>
  );
}
