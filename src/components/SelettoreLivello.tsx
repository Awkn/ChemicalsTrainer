export interface VoceLivello {
  nome: string;
  /** Riga piccola sotto lo slider: media, segni a freccia, nota... */
  nota: string;
}

/**
 * Come li chiamerebbe uno della squadra i due capi della scala. Stanno SOTTO
 * il numero, non al suo posto: da soli non direbbero a quale gradino
 * corrispondono, e il righello serve prima di tutto a quello.
 */
const ESTREMI = { primo: "floscio", ultimo: "canna" };

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
  /** Oltre una dozzina di gradini le tacche non stanno piu' sotto un dito. */
  const fitte = livelli.length > 12;
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
        {livelli.map((_, i) => {
          // Con pochi gradini le tacche sono anche pulsanti e si numerano
          // tutte; con venti sarebbero larghe un dito di neonato e i numeri si
          // toccherebbero, quindi restano decorative e se ne scrive una ogni
          // cinque, come su un righello.
          // Gli estremi sono sempre numerati: sono i due che portano anche il
          // soprannome, e senza numero non si capirebbe di quale gradino sia.
          const numerata =
            fitte ? i === 0 || i === ultimo || (i + 1) % 5 === 0 : true;
          const etichetta = numerata ? i + 1 : "";
          const soprannome =
            i === 0 ? ESTREMI.primo : i === ultimo ? ESTREMI.ultimo : null;
          const classe = `livelli-tacca${i === indice ? " attiva" : ""}${
            numerata ? "" : " muta"
          }`;
          const dentro = (
            <>
              <span className="livelli-segno" />
              <span>{etichetta}</span>
              {soprannome && (
                <span className="livelli-soprannome">{soprannome}</span>
              )}
            </>
          );
          return fitte ? (
            <span key={i} className={classe} aria-hidden="true">
              {dentro}
            </span>
          ) : (
            <button
              key={i}
              className={classe}
              onClick={() => onCambia(i)}
              aria-label={livelli[i].nome}
              tabIndex={-1}
            >
              {dentro}
            </button>
          );
        })}
      </div>

      <p className="mini livelli-descr">
        {descrizione ?? (scelto ? `${scelto.nome} · ${scelto.nota}` : "")}
      </p>
    </div>
  );
}
