import type { DoppioConResa } from "../lib/doppi";
import { ListaBarre } from "./ListaBarre";

interface Props {
  /** Bersagli gia' ordinati (di norma dal peggiore al migliore). */
  righe: DoppioConResa[];
}

/** Resa su ogni doppio: nome, barra e centri su tentativi. */
export function ListaDoppi({ righe }: Props) {
  return (
    <ListaBarre
      righe={righe.map((d) => ({
        chiave: d.doppio,
        etichetta: d.doppio,
        percentuale: d.percentuale,
        testo: `${d.conto.colpiti}/${d.conto.tentativi}`,
      }))}
    />
  );
}
