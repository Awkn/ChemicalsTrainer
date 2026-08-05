export interface RigaBarra {
  chiave: string;
  /** Etichetta a sinistra, corta: la colonna e' stretta. */
  etichetta: string;
  /** Riempimento della barra, 0-100. */
  percentuale: number;
  /** Testo a destra: il numero grezzo dietro alla percentuale. */
  testo: string;
}

/**
 * Elenco di valori con barra proporzionale. Serve a piu' schede (la resa sui
 * doppi, la distribuzione dei punteggi): la forma e' sempre quella, cambia
 * solo cosa si misura.
 */
export function ListaBarre({ righe }: { righe: RigaBarra[] }) {
  return (
    <ul className="barre-lista">
      {righe.map((r) => (
        <li key={r.chiave}>
          <span className="barre-nome">{r.etichetta}</span>
          <span className="barre-guscio">
            <span
              className="barre-riempi"
              style={{ width: `${Math.max(0, Math.min(100, r.percentuale))}%` }}
            />
          </span>
          <span className="barre-conto">{r.testo}</span>
        </li>
      ))}
    </ul>
  );
}
