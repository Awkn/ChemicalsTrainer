import { eDoppio, puntiDardo, type Dardo } from "./bersaglio";
import { suggerisciChiusura } from "./checkout";

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
 * Tentativi dichiarati a mano su un doppio, per chi gioca col tastierino e NON
 * ha chiuso. La domanda che gli e' stata fatta nomina il bersaglio ("quante
 * frecce al D20?"), quindi la risposta si prende alla lettera: tutte quelle
 * frecce sono andate li'. Se la visita non ha segnato niente e' anche la
 * verita' esatta — senza punti il rimanente non si e' mosso.
 */
export function tentativiDichiarati(doppio: string, frecce: number): ContiDoppi {
  if (frecce <= 0) return {};
  return { [doppio]: { tentativi: frecce, colpiti: 0 } };
}

/** Punti di un'etichetta della tabella: "T20" → 60, "D8" → 16, "Bull" → 50. */
function puntiEtichetta(etichetta: string): number | null {
  if (etichetta === "Bull") return 50;
  const m = /^([TD]?)(\d+)$/.exec(etichetta);
  if (!m) return null;
  const n = Number(m[2]);
  return m[1] === "T" ? n * 3 : m[1] === "D" ? n * 2 : n;
}

/**
 * Dove ti lascia un doppio sbagliato. Di norma la freccia finisce nel singolo
 * dello stesso numero (da 40 resti a 20, e miri al D10). Quando quel singolo
 * non lascia a sua volta un doppio secco — il bull, o i numeri come 38 che
 * lascerebbero 19 — si assume che la freccia sia uscita dal bersaglio e il
 * rimanente non cambia: e' quello che deve essere successo, altrimenti da li'
 * non si sarebbe chiuso.
 */
function restoDopoErrore(resto: number): number {
  const meta = resto / 2;
  return doppioDiChiusura(meta) != null ? meta : resto;
}

/**
 * Dove ti lascia UNA freccia di piazzamento, seguendo la tabella delle
 * chiusure. Un passo alla volta e non un salto al doppio finale: da 170
 * servono due frecce per arrivare al bull, e chi le conta come tentativi
 * gonfia i numeri.
 */
function restoDopoPiazzamento(resto: number): number | null {
  const strada = suggerisciChiusura(resto);
  if (!strada || strada.length < 2) return null;
  const punti = puntiEtichetta(strada[0]);
  return punti == null ? null : resto - punti;
}

/**
 * Tentativi al doppio di una visita che ha CHIUSO, ricostruiti dal rimanente
 * e dal numero di frecce dichiarato.
 *
 * Col tastierino il dettaglio per freccia non c'e', ma la strada per chiudere
 * e' quasi obbligata e si puo' ripercorrere: da 40 si mira al D20, se non e'
 * l'ultima freccia vuol dire che ha sbagliato (restando a 20) e la successiva
 * va al D10, e cosi' via. Le frecce che cadono su un rimanente non chiudibile
 * con un doppio solo sono piazzamenti — da 100 la prima freccia prepara, non
 * tenta — e non contano come tentativi.
 *
 * Resta una stima: se la prima freccia e' finita fuori dal bersaglio invece
 * che nel singolo, il secondo tentativo era ancora sullo stesso doppio. Ma
 * sbaglia molto meno spesso di quanto sbagliasse attribuire tutto al doppio di
 * partenza, e soprattutto non regala piu' un centro a un bersaglio che non e'
 * stato colpito. Chi vuole il dato esatto gioca con l'input a bersaglio.
 */
export function tentativiChiusura(rimanente: number, frecce: number): ContiDoppi {
  const conti: ContiDoppi = {};
  let resto = rimanente;
  let centrato = false;

  for (let i = 0; i < frecce; i++) {
    const ultima = i === frecce - 1;
    const bersaglio = doppioDiChiusura(resto);

    if (bersaglio == null) {
      const dopo = restoDopoPiazzamento(resto);
      if (dopo == null) break; // strada non ricostruibile: meglio non inventare
      resto = dopo;
      continue;
    }

    aggiungi(conti, bersaglio, ultima);
    if (ultima) {
      centrato = true;
      break;
    }
    resto = restoDopoErrore(resto);
  }

  // La visita ha chiuso, quindi un doppio e' stato colpito di sicuro: se le
  // frecce dichiarate finiscono prima che la ricostruzione ci arrivi (succede
  // dichiarandone meno di quante ne servivano davvero) il centro va comunque
  // segnato, sul doppio con cui la tabella chiude quel punteggio. Cosi' i
  // doppi colpiti restano sempre quanti i leg vinti.
  if (!centrato) {
    const finale = doppioFinale(rimanente);
    if (finale) aggiungi(conti, finale, true);
  }

  return conti;
}

/** Il doppio con cui si chiude quel punteggio, secondo la tabella. */
function doppioFinale(rimanente: number): string | null {
  const secco = doppioDiChiusura(rimanente);
  if (secco) return secco;
  const strada = suggerisciChiusura(rimanente);
  if (!strada) return null;
  const ultimo = strada[strada.length - 1];
  return ultimo === "Bull" || /^D\d+$/.test(ultimo) ? ultimo : null;
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
