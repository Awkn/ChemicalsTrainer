import { eDoppio, puntiDardo, type Dardo } from "./bersaglio";

/**
 * Statistiche sui doppi, ricavate dalle singole frecce.
 *
 * Finche' si inserisce solo il totale della visita, il "checkout %" si puo'
 * soltanto stimare: si conta quante visite iniziate da un punteggio chiudibile
 * sono finite in chiusura. Conoscendo dove e' finita ogni freccia si passa
 * invece alla misura vera usata nei dardi: doppi colpiti su doppi tentati.
 */

/** Tentativi e centri su un singolo bersaglio. */
export interface ContoDoppio {
  tentativi: number;
  colpiti: number;
}

/** Conteggi per bersaglio: chiave "D20", "D16", "Bull". */
export type ContiDoppi = Record<string, ContoDoppio>;

export const CONTO_VUOTO: ContoDoppio = { tentativi: 0, colpiti: 0 };

/**
 * Il doppio che chiude esattamente questo punteggio con una freccia sola,
 * oppure null se il punteggio non si chiude in un colpo.
 */
export function doppioDiChiusura(rimanente: number): string | null {
  if (rimanente === 50) return "Bull";
  if (rimanente >= 2 && rimanente <= 40 && rimanente % 2 === 0) {
    return `D${rimanente / 2}`;
  }
  return null;
}

function aggiungi(conti: ContiDoppi, doppio: string, colpito: boolean): void {
  const c = conti[doppio] ?? CONTO_VUOTO;
  conti[doppio] = {
    tentativi: c.tentativi + 1,
    colpiti: c.colpiti + (colpito ? 1 : 0),
  };
}

/**
 * Registra i tentativi al doppio di una visita, freccia per freccia.
 *
 * Una freccia conta come tentativo quando il punteggio rimasto PRIMA di
 * tirarla si chiude con quel solo doppio: e' il momento in cui si sta
 * davvero mirando li'. Vale a uscita con doppio; con Master o uscita diretta
 * la nozione di "tentativo al doppio" non avrebbe senso e chi chiama non
 * deve invocarla.
 */
export function contaDoppiVisita(
  rimanenteIniziale: number,
  dardi: Dardo[],
): ContiDoppi {
  const conti: ContiDoppi = {};
  let resto = rimanenteIniziale;

  for (const d of dardi) {
    const bersaglio = doppioDiChiusura(resto);
    const punti = puntiDardo(d);
    if (bersaglio) aggiungi(conti, bersaglio, punti === resto && eDoppio(d));

    const dopo = resto - punti;
    // Chiuso (0) o sballato (sotto zero, oppure 1 che non si chiude): si smette.
    if (dopo <= 1) break;
    resto = dopo;
  }

  return conti;
}

/**
 * Tentativi dichiarati a mano su un doppio, per chi gioca col tastierino.
 * Li' del dettaglio per freccia non si sa niente: si chiede quante frecce sono
 * andate al doppio e, se la visita ha chiuso, l'ultima e' quella buona.
 *
 * E' una stima: partendo da 32 e chiudendo in due frecce, magari la prima ha
 * preso il singolo 16 e la seconda il D8. Il totale di tentativi e centri
 * resta giusto, e sbagliata puo' essere solo l'attribuzione al bersaglio.
 * Chi vuole il dato esatto gioca con l'input a bersaglio.
 */
export function tentativiDichiarati(
  doppio: string,
  frecce: number,
  chiuso: boolean,
): ContiDoppi {
  if (frecce <= 0) return {};
  return { [doppio]: { tentativi: frecce, colpiti: chiuso ? 1 : 0 } };
}

/** Somma due mappe di conteggi (per accumulare visita dopo visita). */
export function unisciConti(a: ContiDoppi, b: ContiDoppi): ContiDoppi {
  const out: ContiDoppi = { ...a };
  for (const [doppio, v] of Object.entries(b)) {
    const c = out[doppio] ?? CONTO_VUOTO;
    out[doppio] = {
      tentativi: c.tentativi + v.tentativi,
      colpiti: c.colpiti + v.colpiti,
    };
  }
  return out;
}

/** Totale complessivo su tutti i bersagli. */
export function totaleDoppi(conti: ContiDoppi): ContoDoppio {
  return Object.values(conti).reduce(
    (acc, c) => ({
      tentativi: acc.tentativi + c.tentativi,
      colpiti: acc.colpiti + c.colpiti,
    }),
    CONTO_VUOTO,
  );
}

/** Percentuale di centri, arrotondata a un decimale (0 se nessun tentativo). */
export function percentualeDoppi(c: ContoDoppio): number {
  return c.tentativi === 0 ? 0 : Math.round((c.colpiti / c.tentativi) * 1000) / 10;
}

export interface DoppioConResa {
  doppio: string;
  conto: ContoDoppio;
  percentuale: number;
}

/** Bersagli ordinati dal peggiore al migliore, con almeno `minimo` tentativi. */
export function classificaDoppi(conti: ContiDoppi, minimo = 1): DoppioConResa[] {
  return Object.entries(conti)
    .filter(([, c]) => c.tentativi >= minimo)
    .map(([doppio, conto]) => ({
      doppio,
      conto,
      percentuale: percentualeDoppi(conto),
    }))
    .sort(
      (a, b) =>
        a.percentuale - b.percentuale ||
        // a parita' di resa viene prima chi ha piu' tentativi: e' piu' solido
        b.conto.tentativi - a.conto.tentativi,
    );
}

/**
 * Il doppio con la resa peggiore. Serve un minimo di tentativi, altrimenti un
 * singolo errore basterebbe a eleggere un bersaglio a "punto debole".
 */
export function doppioPeggiore(
  conti: ContiDoppi,
  minimo = 3,
): DoppioConResa | null {
  return classificaDoppi(conti, minimo)[0] ?? null;
}
