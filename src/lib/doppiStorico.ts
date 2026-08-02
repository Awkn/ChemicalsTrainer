import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import { dataIso } from "./date";
import { nuovoId } from "./id";
import {
  classificaDoppi,
  totaleDoppi,
  unisciConti,
  type ContiDoppi,
  type ContoDoppio,
  type DoppioConResa,
} from "./doppi";

/**
 * Storico dei tentativi al doppio, accumulato tra le sessioni.
 *
 * Una singola partita dice poco: con tre tentativi su un bersaglio basta un
 * errore per farlo sembrare un punto debole. Sommando molte sessioni la resa
 * su ogni doppio diventa un dato affidabile, ed e' quello che serve per
 * allenarsi sul bersaglio giusto.
 */

/** Salva i doppi di una sessione. Non scrive nulla se non ci sono tentativi. */
export async function registraDoppi(
  conti: ContiDoppi,
  gioco: string,
  data = dataIso(),
): Promise<void> {
  if (totaleDoppi(conti).tentativi === 0) return;
  await db.doppi.add({
    id: nuovoId(),
    data,
    createdAt: Date.now(),
    gioco,
    conti,
  });
}

/** Giorno di `giorni` fa in formato "YYYY-MM-DD". */
function sogliaGiorni(giorni: number): string {
  const d = new Date();
  d.setDate(d.getDate() - giorni);
  return dataIso(d);
}

export interface StoricoDoppi {
  /** Conteggi sommati nel periodo. */
  conti: ContiDoppi;
  totale: ContoDoppio;
  /** Bersagli dal peggiore al migliore (solo quelli con abbastanza tentativi). */
  classifica: DoppioConResa[];
  /** Il punto debole: il peggiore con tentativi a sufficienza, se c'e'. */
  peggiore: DoppioConResa | null;
  /** Sessioni considerate. */
  sessioni: number;
  caricato: boolean;
}

/**
 * Tentativi al doppio degli ultimi `giorni`, gia' aggregati.
 *
 * `minimo` e' quanti tentativi servono su un bersaglio perche' compaia in
 * classifica: sotto quella soglia la percentuale e' troppo ballerina per
 * dire qualcosa.
 */
export function usaStoricoDoppi(giorni = 90, minimo = 5): StoricoDoppi {
  const righe = useLiveQuery(
    () => db.doppi.where("data").aboveOrEqual(sogliaGiorni(giorni)).toArray(),
    [giorni],
  );

  if (!righe) {
    return {
      conti: {},
      totale: { tentativi: 0, colpiti: 0 },
      classifica: [],
      peggiore: null,
      sessioni: 0,
      caricato: false,
    };
  }

  const conti = righe.reduce<ContiDoppi>((acc, r) => unisciConti(acc, r.conti), {});
  const classifica = classificaDoppi(conti, minimo);

  return {
    conti,
    totale: totaleDoppi(conti),
    classifica,
    peggiore: classifica[0] ?? null,
    sessioni: righe.length,
    caricato: true,
  };
}
