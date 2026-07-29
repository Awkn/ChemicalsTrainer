/**
 * Motore di gioco del 501 contro il bot. Tutto puro (nessun React): riceve uno
 * stato e restituisce il nuovo stato. Cosi' la logica e' isolata e testabile.
 *
 * Modello di input umano: si gioca su un bersaglio vero e si inserisce il
 * TOTALE segnato nella tirata (3 frecce). Il bot e' simulato in base alla sua
 * media per 3 frecce e a una probabilita' di chiusura crescente col livello.
 */

export type Giocatore = "umano" | "bot";

export type LivelloId = "base" | "medio" | "alto" | "super" | "letale";

export interface Livello {
  id: LivelloId;
  nome: string;
  /** Media punti per tirata da 3 frecce. */
  media: number;
  /** Probabilita' di chiudere quando il punteggio e' alla portata. */
  pCheckout: number;
  /** Punteggio massimo dal quale il bot tenta la chiusura. */
  capCheckout: number;
}

export const LIVELLI: Livello[] = [
  { id: "base", nome: "Base", media: 40, pCheckout: 0.12, capCheckout: 50 },
  { id: "medio", nome: "Medio", media: 55, pCheckout: 0.2, capCheckout: 80 },
  { id: "alto", nome: "Alto", media: 65, pCheckout: 0.3, capCheckout: 110 },
  { id: "super", nome: "Super", media: 80, pCheckout: 0.45, capCheckout: 140 },
  { id: "letale", nome: "Letale", media: 95, pCheckout: 0.6, capCheckout: 170 },
];

export type ModoChiusura = "single" | "master" | "double";

export const MODI_CHIUSURA: { id: ModoChiusura; nome: string; descr: string }[] =
  [
    { id: "single", nome: "Single out", descr: "Si chiude con qualsiasi bersaglio." },
    { id: "master", nome: "Master out", descr: "Si chiude su doppio o triplo." },
    { id: "double", nome: "Double out", descr: "Si chiude solo su un doppio." },
  ];

export const PUNTI_INIZIALI = 501;
export const BEST_OF = 5;
export const LEG_PER_VINCERE = 3;

/** Totali NON ottenibili con 3 freccette. */
const TOTALI_IMPOSSIBILI = new Set([
  163, 166, 169, 172, 173, 175, 176, 177, 178, 179,
]);

/** Punteggi che non si possono chiudere (usati per double/master out). */
const BOGEY = new Set([159, 162, 163, 165, 166, 168, 169]);

export interface StatsGiocatore {
  punti: number;
  visite: number;
}

export interface StatoLeg {
  puntiUmano: number;
  puntiBot: number;
  turno: Giocatore;
  iniziato: Giocatore;
  ultimoUmano: number | null;
  ultimoBot: number | null;
  bustUmano: boolean;
  bustBot: boolean;
  vincitore: Giocatore | null;
}

export interface StatoPartita {
  livello: Livello;
  modo: ModoChiusura;
  primo: Giocatore;
  numeroLeg: number;
  legUmano: number;
  legBot: number;
  leg: StatoLeg;
  statsUmano: StatsGiocatore;
  statsBot: StatsGiocatore;
  vincitore: Giocatore | null;
}

export function avversario(g: Giocatore): Giocatore {
  return g === "umano" ? "bot" : "umano";
}

/** Lancio della moneta: chi inizia la partita. */
export function lancioMoneta(): Giocatore {
  return Math.random() < 0.5 ? "umano" : "bot";
}

function creaLeg(iniziato: Giocatore): StatoLeg {
  return {
    puntiUmano: PUNTI_INIZIALI,
    puntiBot: PUNTI_INIZIALI,
    turno: iniziato,
    iniziato,
    ultimoUmano: null,
    ultimoBot: null,
    bustUmano: false,
    bustBot: false,
    vincitore: null,
  };
}

export function creaPartita(
  livello: Livello,
  modo: ModoChiusura,
  primo: Giocatore,
): StatoPartita {
  return {
    livello,
    modo,
    primo,
    numeroLeg: 1,
    legUmano: 0,
    legBot: 0,
    leg: creaLeg(primo),
    statsUmano: { punti: 0, visite: 0 },
    statsBot: { punti: 0, visite: 0 },
    vincitore: null,
  };
}

export interface EsitoVisita {
  nuovoRimanente: number;
  chiuso: boolean;
  bust: boolean;
}

/** Applica una tirata a un punteggio rimanente secondo il modo di chiusura. */
export function risultatoVisita(
  rimanente: number,
  punteggio: number,
  modo: ModoChiusura,
): EsitoVisita {
  const nuovo = rimanente - punteggio;
  if (nuovo === 0) {
    return { nuovoRimanente: 0, chiuso: true, bust: false };
  }
  const richiedeDoppia = modo !== "single";
  if (nuovo < 0 || (richiedeDoppia && nuovo === 1)) {
    // bust: il punteggio resta quello di inizio tirata
    return { nuovoRimanente: rimanente, chiuso: false, bust: true };
  }
  return { nuovoRimanente: nuovo, chiuso: false, bust: false };
}

/** Verifica che un totale sia un valido punteggio da 3 freccette (0..180). */
export function punteggioValido(p: number): boolean {
  return Number.isInteger(p) && p >= 0 && p <= 180 && !TOTALI_IMPOSSIBILI.has(p);
}

function finibile(rimanente: number, modo: ModoChiusura): boolean {
  if (rimanente < 2 || rimanente > 170) return false;
  if (modo !== "single" && BOGEY.has(rimanente)) return false;
  return true;
}

// distribuzione ~normale (Box-Muller) per simulare la resa del bot
function gauss(media: number, sd: number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return media + Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
}

function totaleOttenibile(n: number): number {
  let x = Math.round(n);
  if (x < 0) x = 0;
  if (x > 180) x = 180;
  while (x > 0 && TOTALI_IMPOSSIBILI.has(x)) x -= 1;
  return x;
}

/** Calcola il punteggio della tirata del bot (mai bust, sempre ottenibile). */
export function mossaBot(
  rimanente: number,
  livello: Livello,
  modo: ModoChiusura,
): number {
  if (
    finibile(rimanente, modo) &&
    rimanente <= livello.capCheckout &&
    Math.random() < livello.pCheckout
  ) {
    return rimanente; // chiude
  }
  const sd = Math.max(12, livello.media * 0.32);
  let s = totaleOttenibile(gauss(livello.media, sd));
  const maxSicuro = rimanente - 2; // non scendere sotto 2 (evita bust)
  if (s > maxSicuro) s = totaleOttenibile(Math.max(0, maxSicuro));
  return s;
}

function aggiornaStats(
  s: StatsGiocatore,
  punteggio: number,
  bust: boolean,
): StatsGiocatore {
  return {
    punti: s.punti + (bust ? 0 : punteggio),
    visite: s.visite + 1,
  };
}

function risolviLeg(stato: StatoPartita, vincitore: Giocatore): StatoPartita {
  const legUmano = stato.legUmano + (vincitore === "umano" ? 1 : 0);
  const legBot = stato.legBot + (vincitore === "bot" ? 1 : 0);
  let vincitorePartita: Giocatore | null = null;
  if (legUmano >= LEG_PER_VINCERE) vincitorePartita = "umano";
  else if (legBot >= LEG_PER_VINCERE) vincitorePartita = "bot";
  return { ...stato, legUmano, legBot, vincitore: vincitorePartita };
}

/** Applica la tirata dell'umano (punteggio gia' validato). */
export function giocaUmano(stato: StatoPartita, punteggio: number): StatoPartita {
  const leg = stato.leg;
  if (leg.turno !== "umano" || leg.vincitore || stato.vincitore) return stato;

  const r = risultatoVisita(leg.puntiUmano, punteggio, stato.modo);
  const statsUmano = aggiornaStats(stato.statsUmano, punteggio, r.bust);
  const nuovoLeg: StatoLeg = {
    ...leg,
    ultimoUmano: punteggio,
    bustUmano: r.bust,
    puntiUmano: r.nuovoRimanente,
  };

  if (r.chiuso) {
    nuovoLeg.vincitore = "umano";
    return risolviLeg({ ...stato, leg: nuovoLeg, statsUmano }, "umano");
  }
  nuovoLeg.turno = "bot";
  return { ...stato, leg: nuovoLeg, statsUmano };
}

/** Simula e applica la tirata del bot. */
export function giocaBot(stato: StatoPartita): StatoPartita {
  const leg = stato.leg;
  if (leg.turno !== "bot" || leg.vincitore || stato.vincitore) return stato;

  const punteggio = mossaBot(leg.puntiBot, stato.livello, stato.modo);
  const r = risultatoVisita(leg.puntiBot, punteggio, stato.modo);
  const statsBot = aggiornaStats(stato.statsBot, punteggio, r.bust);
  const nuovoLeg: StatoLeg = {
    ...leg,
    ultimoBot: punteggio,
    bustBot: r.bust,
    puntiBot: r.nuovoRimanente,
  };

  if (r.chiuso) {
    nuovoLeg.vincitore = "bot";
    return risolviLeg({ ...stato, leg: nuovoLeg, statsBot }, "bot");
  }
  nuovoLeg.turno = "umano";
  return { ...stato, leg: nuovoLeg, statsBot };
}

/** Passa al leg successivo alternando chi inizia. */
export function avanzaLeg(stato: StatoPartita): StatoPartita {
  if (stato.vincitore) return stato;
  const numeroLeg = stato.numeroLeg + 1;
  // leg dispari: inizia chi ha vinto la moneta; leg pari: l'avversario
  const iniziato =
    numeroLeg % 2 === 1 ? stato.primo : avversario(stato.primo);
  return { ...stato, numeroLeg, leg: creaLeg(iniziato) };
}

/** Media per 3 frecce di un giocatore (0 se nessuna tirata). */
export function media3(s: StatsGiocatore): number {
  return s.visite === 0 ? 0 : Math.round((s.punti / s.visite) * 10) / 10;
}
