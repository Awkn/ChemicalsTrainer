import type { DoppioConResa } from "../lib/doppi";

interface Props {
  /** Bersagli gia' ordinati (di norma dal peggiore al migliore). */
  righe: DoppioConResa[];
}

/** Resa su ogni doppio: nome, barra e centri su tentativi. */
export function ListaDoppi({ righe }: Props) {
  return (
    <ul className="doppi-lista">
      {righe.map((d) => (
        <li key={d.doppio}>
          <span className="doppi-nome">{d.doppio}</span>
          <span className="doppi-barra">
            <span className="doppi-riempi" style={{ width: `${d.percentuale}%` }} />
          </span>
          <span className="doppi-conto">
            {d.conto.colpiti}/{d.conto.tentativi}
          </span>
        </li>
      ))}
    </ul>
  );
}
