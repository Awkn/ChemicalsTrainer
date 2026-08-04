export interface VoceLivello {
  nome: string;
  /** Riga piccola sotto lo slider: media, segni a freccia, nota... */
  nota: string;
}

interface Props {
  livelli: VoceLivello[];
  /** Indice del livello scelto. */
  indice: number;
  onCambia: (indice: number) => void;
  /**
   * Badge in alto a destra. Di norma "Lv. N": si passa qualcosa d'altro solo
   * quando il livello attivo non appartiene alla scala (es. il bot squadra).
   */
  badge?: string;
  /** Riga sotto lo slider, se serve dire qualcosa di diverso dal livello. */
  descrizione?: string;
  /** Etichetta per chi non vede lo slider. */
  etichetta?: string;
}

/**
 * Scelta del livello del bot con uno slider invece che con una lista di
 * schede: gli stessi livelli in un settimo dello spazio, che sulla schermata
 * di configurazione (gia' lunga) e' quello che conta.
 *
 * L'ultimo livello e' per definizione il piu' cattivo: al posto del suo numero
 * la scala mostra un teschio.
 */
export function SelettoreLivello({
  livelli,
  indice,
  onCambia,
  badge,
  descrizione,
  etichetta = "Livello del bot",
}: Props) {
  const ultimo = livelli.length - 1;
  const scelto = livelli[indice];
  // Posizione del riempimento: il pollice sta al centro della sua corsa, non
  // sul bordo, quindi agli estremi la barra non arriva mai proprio a 0 o 100.
  const frazione = ultimo > 0 ? indice / ultimo : 0;

  return (
    <div className="livelli">
      <div className="livelli-testa">
        <span>{etichetta}</span>
        <span className="livelli-badge">{badge ?? `Lv. ${indice + 1}`}</span>
      </div>

      <input
        className="livelli-slider"
        type="range"
        min={0}
        max={ultimo}
        step={1}
        value={indice}
        style={{ "--pos": `${frazione * 100}%` } as React.CSSProperties}
        onChange={(e) => onCambia(Number(e.target.value))}
        aria-label={etichetta}
        aria-valuetext={scelto?.nome}
      />

      <div className="livelli-tacche">
        {livelli.map((l, i) => (
          <button
            key={l.nome}
            className={`livelli-tacca${i === indice ? " attiva" : ""}`}
            onClick={() => onCambia(i)}
            aria-label={l.nome}
            tabIndex={-1}
          >
            <span className="livelli-segno" />
            <span>{i === ultimo ? "💀" : i + 1}</span>
          </button>
        ))}
      </div>

      <p className="mini livelli-descr">
        {descrizione ?? (scelto ? `${scelto.nome} · ${scelto.nota}` : "")}
      </p>
    </div>
  );
}
