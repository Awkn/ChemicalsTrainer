import type { Dardo } from "../../../lib/bersaglio";

/**
 * Motore del Cricket. Tutto puro (nessun React): riceve uno stato e ne
 * restituisce uno nuovo.
 *
 * Regole: si gioca su 20, 19, 18, 17, 16, 15 e bull. Un numero si "chiude"
 * con 3 segni (singolo 1, doppio 2, triplo 3; bull esterno 1, bull interno 2).
 * Chiuso un numero, i colpi in piu' fanno punti finche' l'avversario non lo
 * ha chiuso a sua volta. Vince chi ha chiuso tutto stando in vantaggio nei
 * punti — o in svantaggio, giocando a cut-throat, dove i punti che fai
 * vanno all'avversario.
 */

/** Numeri in gioco, dal piu' alto: il bull vale 25. */
export const NUMERI_CRICKET = [20, 19, 18, 17, 16, 15, 25] as const;

/** Segni necessari per chiudere un numero. */
export const SEGNI_PER_CHIUDERE = 3;

export type Punteggio = "classico" | "cutthroat";

export const MODI_PUNTEGGIO: { id: Punteggio; nome: string; descr: string }[] = [
  {
    id: "classico",
    nome: "Classico",
    descr: "I punti li fai tu. Vince chi chiude tutto senza essere sotto.",
  },
  {
    id: "cutthroat",
    nome: "Cut-throat",
    descr: "I punti li regali all'avversario. Vince chi ne ha meno.",
  },
];

export interface LivelloCricket {
  id: string;
  nome: string;
  /** Segni medi per freccia: 1 significa un segno a freccia. */
  segniPerFreccia: number;
  nota?: string;
}

export const LIVELLI_CRICKET: LivelloCricket[] = [
  { id: "base", nome: "Base", segniPerFreccia: 0.45 },
  { id: "medio", nome: "Medio", segniPerFreccia: 0.7 },
  { id: "alto", nome: "Alto", segniPerFreccia: 1 },
  { id: "super", nome: "Super", segniPerFreccia: 1.4 },
  { id: "letale", nome: "Letale", segniPerFreccia: 1.9 },
];

export interface GiocatoreCricket {
  nome: string;
  /** Segni per numero, fermi a 3: oltre non serve accumulare. */
  segni: Record<number, number>;
  punti: number;
}

export interface ConfigCricket {
  punteggio: Punteggio;
  /** null quando si gioca contro un amico sullo stesso telefono. */
  bot: LivelloCricket | null;
  nomi: [string, string];
}

/** Cosa ha prodotto l'ultima visita, per raccontarla a schermo. */
export interface EsitoVisita {
  di: 0 | 1;
  /** Etichette dei segni messi, es. ["20", "20", "Bull"]. */
  segni: string[];
  /** Punti prodotti dalla visita (a chi vadano dipende dal modo). */
  punti: number;
}

export interface StatoCricket {
  config: ConfigCricket;
  giocatori: [GiocatoreCricket, GiocatoreCricket];
  turno: 0 | 1;
  ultima: EsitoVisita | null;
  vincitore: 0 | 1 | null;
  creato: number;
}

function giocatoreVuoto(nome: string): GiocatoreCricket {
  const segni: Record<number, number> = {};
  for (const n of NUMERI_CRICKET) segni[n] = 0;
  return { nome, segni, punti: 0 };
}

export function creaPartita(config: ConfigCricket): StatoCricket {
  return {
    config,
    giocatori: [
      giocatoreVuoto(config.nomi[0]),
      giocatoreVuoto(config.nomi[1]),
    ],
    turno: 0,
    ultima: null,
    vincitore: null,
    creato: Date.now(),
  };
}

export function etichettaNumero(n: number): string {
  return n === 25 ? "Bull" : String(n);
}

/** Il numero e' chiuso da questo giocatore? */
export function chiuso(g: GiocatoreCricket, numero: number): boolean {
  return (g.segni[numero] ?? 0) >= SEGNI_PER_CHIUDERE;
}

/** Ha chiuso tutti i numeri in gioco? */
export function haChiusoTutto(g: GiocatoreCricket): boolean {
  return NUMERI_CRICKET.every((n) => chiuso(g, n));
}

/** Numero e segni prodotti da una freccia, o null se e' fuori dai bersagli. */
export function segniDaDardo(
  d: Dardo,
): { numero: number; segni: number } | null {
  if (d.anello === "bull") return { numero: 25, segni: 2 };
  if (d.anello === "bullEsterno") return { numero: 25, segni: 1 };
  if (!NUMERI_CRICKET.includes(d.settore as (typeof NUMERI_CRICKET)[number])) {
    return null;
  }
  if (d.anello === "triplo") return { numero: d.settore, segni: 3 };
  if (d.anello === "doppio") return { numero: d.settore, segni: 2 };
  if (d.anello === "singolo") return { numero: d.settore, segni: 1 };
  return null;
}

function clona(g: GiocatoreCricket): GiocatoreCricket {
  return { ...g, segni: { ...g.segni } };
}

/**
 * Applica i segni di una freccia su un numero e restituisce i punti prodotti.
 * I segni in eccesso fanno punti solo se l'avversario non ha ancora chiuso
 * quel numero: se lo ha chiuso anche lui, il numero e' morto.
 */
function applicaSegni(
  giocatori: [GiocatoreCricket, GiocatoreCricket],
  di: 0 | 1,
  numero: number,
  segni: number,
): number {
  const mio = giocatori[di];
  const suo = giocatori[di === 0 ? 1 : 0];

  const prima = mio.segni[numero] ?? 0;
  const mancanti = Math.max(SEGNI_PER_CHIUDERE - prima, 0);
  const usati = Math.min(segni, mancanti);
  mio.segni[numero] = prima + usati;

  const eccesso = segni - usati;
  if (eccesso <= 0 || chiuso(suo, numero)) return 0;
  return eccesso * numero;
}

/** Assegna i punti secondo il modo: a chi tira, o all'avversario. */
function assegnaPunti(
  giocatori: [GiocatoreCricket, GiocatoreCricket],
  di: 0 | 1,
  punti: number,
  modo: Punteggio,
): void {
  if (punti === 0) return;
  const destinatario = modo === "cutthroat" ? (di === 0 ? 1 : 0) : di;
  giocatori[destinatario].punti += punti;
}

/**
 * Vincitore secondo il modo di punteggio: serve aver chiuso tutti i numeri e
 * non essere dalla parte sbagliata del punteggio.
 */
function calcolaVincitore(
  giocatori: [GiocatoreCricket, GiocatoreCricket],
  modo: Punteggio,
): 0 | 1 | null {
  for (const i of [0, 1] as const) {
    const mio = giocatori[i];
    const suo = giocatori[i === 0 ? 1 : 0];
    if (!haChiusoTutto(mio)) continue;
    const vince =
      modo === "cutthroat" ? mio.punti <= suo.punti : mio.punti >= suo.punti;
    if (vince) return i;
  }
  return null;
}

/** Applica una visita (fino a 3 frecce) e passa il turno. */
export function giocaVisita(stato: StatoCricket, dardi: Dardo[]): StatoCricket {
  if (stato.vincitore != null) return stato;

  const di = stato.turno;
  const giocatori: [GiocatoreCricket, GiocatoreCricket] = [
    clona(stato.giocatori[0]),
    clona(stato.giocatori[1]),
  ];

  const etichette: string[] = [];
  let punti = 0;

  for (const d of dardi) {
    const colpo = segniDaDardo(d);
    if (!colpo) continue; // freccia fuori dai numeri del Cricket
    punti += applicaSegni(giocatori, di, colpo.numero, colpo.segni);
    for (let k = 0; k < colpo.segni; k++) {
      etichette.push(etichettaNumero(colpo.numero));
    }
  }

  assegnaPunti(giocatori, di, punti, stato.config.punteggio);
  const vincitore = calcolaVincitore(giocatori, stato.config.punteggio);

  return {
    ...stato,
    giocatori,
    turno: di === 0 ? 1 : 0,
    ultima: { di, segni: etichette, punti },
    vincitore,
  };
}

// ---------------------------------------------------------------------------
// Bot
// ---------------------------------------------------------------------------

/**
 * Segni di una singola freccia del bot. Le probabilita' sono calibrate perche'
 * la media risulti `segniPerFreccia`: piu' sale il livello, piu' spesso arriva
 * il triplo. I coefficienti vanno tenuti abbastanza alti da lasciare spazio ai
 * singoli anche al livello massimo: se la somma satura, la media promessa non
 * sarebbe raggiungibile e il livello risulterebbe piu' debole del dichiarato.
 */
export function segniBot(livello: LivelloCricket): number {
  const m = livello.segniPerFreccia;
  const pTriplo = Math.min(0.45, m * 0.18);
  const pDoppio = Math.min(0.25, m * 0.12);
  const pSingolo = Math.max(
    0,
    Math.min(1 - pTriplo - pDoppio, m - 3 * pTriplo - 2 * pDoppio),
  );
  const r = Math.random();
  if (r < pTriplo) return 3;
  if (r < pTriplo + pDoppio) return 2;
  if (r < pTriplo + pDoppio + pSingolo) return 1;
  return 0;
}

/**
 * Numero a cui punta il bot: prima chiude i propri numeri partendo dal piu'
 * alto, poi va a fare punti sui numeri che l'avversario non ha ancora chiuso.
 */
export function bersaglioBot(stato: StatoCricket, di: 0 | 1): number | null {
  const mio = stato.giocatori[di];
  const suo = stato.giocatori[di === 0 ? 1 : 0];

  const daChiudere = NUMERI_CRICKET.find((n) => !chiuso(mio, n));
  if (daChiudere != null) return daChiudere;

  return NUMERI_CRICKET.find((n) => !chiuso(suo, n)) ?? null;
}

/** Simula e applica la visita del bot. */
export function giocaVisitaBot(stato: StatoCricket): StatoCricket {
  const livello = stato.config.bot;
  if (!livello || stato.vincitore != null) return stato;

  const di = stato.turno;
  const giocatori: [GiocatoreCricket, GiocatoreCricket] = [
    clona(stato.giocatori[0]),
    clona(stato.giocatori[1]),
  ];
  const etichette: string[] = [];
  let punti = 0;

  for (let freccia = 0; freccia < 3; freccia++) {
    // Il bersaglio si ricalcola a ogni freccia: chiuso un numero, si passa oltre.
    const parziale: StatoCricket = { ...stato, giocatori };
    const numero = bersaglioBot(parziale, di);
    if (numero == null) break;

    const segni = segniBot(livello);
    if (segni === 0) continue;

    punti += applicaSegni(giocatori, di, numero, segni);
    for (let k = 0; k < segni; k++) etichette.push(etichettaNumero(numero));
  }

  assegnaPunti(giocatori, di, punti, stato.config.punteggio);
  const vincitore = calcolaVincitore(giocatori, stato.config.punteggio);

  return {
    ...stato,
    giocatori,
    turno: di === 0 ? 1 : 0,
    ultima: { di, segni: etichette, punti },
    vincitore,
  };
}
