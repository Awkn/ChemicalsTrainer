/**
 * Modello del bersaglio (dartboard) per l'input a tocco.
 *
 * Tutto puro e senza React: qui vivono i numeri del tabellone, gli anelli, il
 * punteggio di ogni zona e la geometria necessaria a disegnarlo in SVG. Il
 * componente di input si limita a rendere questi dati e a raccogliere i tocchi.
 *
 * Nota sulle proporzioni: gli anelli di doppio e triplo su un bersaglio vero
 * sono strisce sottilissime. Riprodurle in scala reale renderebbe impossibile
 * centrarle col dito, percio' le bande qui sono ingrandite: il disegno resta
 * riconoscibile ma ogni zona e' comodamente toccabile.
 */

/** Anello colpito da una freccia. */
export type Anello = "singolo" | "doppio" | "triplo" | "bull" | "bullEsterno" | "fuori";

/** Una singola freccia: settore del tabellone (1-20, 25 per il bull) e anello. */
export interface Dardo {
  /** Numero del settore: 1..20, oppure 25 per il bull, 0 per "fuori". */
  settore: number;
  anello: Anello;
}

/** Numeri del tabellone in senso orario partendo dal 20 (in alto). */
export const SETTORI = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
];

/** Punti valsi da una freccia. */
export function puntiDardo(d: Dardo): number {
  switch (d.anello) {
    case "triplo":
      return d.settore * 3;
    case "doppio":
      return d.settore * 2;
    case "bull":
      return 50;
    case "bullEsterno":
      return 25;
    case "singolo":
      return d.settore;
    default:
      return 0;
  }
}

/** Etichetta breve, nello stile della tabella delle chiusure ("T20", "D16"). */
export function etichettaDardo(d: Dardo): string {
  switch (d.anello) {
    case "triplo":
      return `T${d.settore}`;
    case "doppio":
      return `D${d.settore}`;
    case "bull":
      return "Bull";
    case "bullEsterno":
      return "25";
    case "singolo":
      return String(d.settore);
    default:
      return "—";
  }
}

/** La freccia e' finita su un doppio? (il bull interno vale come doppio) */
export function eDoppio(d: Dardo): boolean {
  return d.anello === "doppio" || d.anello === "bull";
}

/** La freccia e' finita su un triplo? */
export function eTriplo(d: Dardo): boolean {
  return d.anello === "triplo";
}

export const DARDO_FUORI: Dardo = { settore: 0, anello: "fuori" };

// ---------------------------------------------------------------------------
// Geometria per il disegno SVG
// ---------------------------------------------------------------------------

/** Lato del riquadro SVG; il centro del bersaglio e' a (CENTRO, CENTRO). */
export const LATO = 440;
export const CENTRO = LATO / 2;

/** Raggi delle zone, dal centro verso l'esterno (bande ingrandite per il dito). */
export const RAGGI = {
  bull: 17,
  bullEsterno: 34,
  singoloInterno: 82,
  triplo: 108,
  singoloEsterno: 158,
  doppio: 190,
} as const;

/**
 * Anello nero esterno: porta i numeri ed e' anche la zona "fuori" (una freccia
 * finita li' vale 0), cosi' non serve un pulsante a parte che ruberebbe altezza.
 */
export const RAGGIO_BORDO = 220;

/** Raggio a cui compaiono i numeri, dentro l'anello nero esterno. */
export const RAGGIO_NUMERI = 205;

/** Ampiezza di un settore in gradi. */
const AMPIEZZA = 360 / SETTORI.length;

/** Angolo iniziale del settore i-esimo (0 = ore 12), in gradi. */
function angoloIniziale(i: number): number {
  // -90 porta lo zero in cima; meta' ampiezza centra il 20 sulla verticale.
  return -90 - AMPIEZZA / 2 + i * AMPIEZZA;
}

function puntoSuCerchio(raggio: number, gradi: number): [number, number] {
  const rad = (gradi * Math.PI) / 180;
  return [CENTRO + raggio * Math.cos(rad), CENTRO + raggio * Math.sin(rad)];
}

/**
 * Path SVG di un settore anulare (una "fetta" di un anello), dal raggio
 * interno a quello esterno, per il settore i-esimo.
 */
export function pathSettore(i: number, raggioInterno: number, raggioEsterno: number): string {
  const da = angoloIniziale(i);
  const a = da + AMPIEZZA;
  const [x1, y1] = puntoSuCerchio(raggioEsterno, da);
  const [x2, y2] = puntoSuCerchio(raggioEsterno, a);
  const [x3, y3] = puntoSuCerchio(raggioInterno, a);
  const [x4, y4] = puntoSuCerchio(raggioInterno, da);
  return [
    `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    `A ${raggioEsterno} ${raggioEsterno} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
    `L ${x3.toFixed(2)} ${y3.toFixed(2)}`,
    `A ${raggioInterno} ${raggioInterno} 0 0 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
    "Z",
  ].join(" ");
}

/** Posizione del numero del settore i-esimo, al centro della sua fetta. */
export function posizioneNumero(i: number): [number, number] {
  return puntoSuCerchio(RAGGIO_NUMERI, angoloIniziale(i) + AMPIEZZA / 2);
}

/**
 * Zone disegnabili di un settore, dall'interno verso l'esterno. Il bull non e'
 * qui: sono due cerchi, disegnati a parte.
 */
export const BANDE: { anello: Anello; da: number; a: number }[] = [
  { anello: "singolo", da: RAGGI.bullEsterno, a: RAGGI.singoloInterno },
  { anello: "triplo", da: RAGGI.singoloInterno, a: RAGGI.triplo },
  { anello: "singolo", da: RAGGI.triplo, a: RAGGI.singoloEsterno },
  { anello: "doppio", da: RAGGI.singoloEsterno, a: RAGGI.doppio },
];
