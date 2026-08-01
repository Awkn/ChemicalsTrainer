/**
 * Motore di gioco del 501 contro il bot. Tutto puro (nessun React): riceve uno
 * stato e restituisce il nuovo stato. Cosi' la logica e' isolata e testabile.
 *
 * Modello di input umano: si gioca su un bersaglio vero e si inserisce il
 * TOTALE segnato nella tirata (3 frecce). Alla chiusura si indica con quante
 * frecce (1-3) si e' chiuso, cosi' le statistiche a fine partita sono precise.
 * Il bot e' simulato in base alla sua media per 3 frecce e a una probabilita'
 * di chiusura crescente col livello.
 */

export type Giocatore = "umano" | "bot";

export type LivelloId =
  | "base"
  | "medio"
  | "alto"
  | "super"
  | "letale"
  | "fuego"
  | "squadra";

export interface Livello {
  id: LivelloId;
  nome: string;
  /** Media punti per tirata da 3 frecce. */
  media: number;
  /** Probabilita' di chiudere quando il punteggio e' alla portata. */
  pCheckout: number;
  /** Punteggio massimo dal quale il bot tenta la chiusura. */
  capCheckout: number;
  /**
   * Tirate prestabilite: se presente, il bot ripete sempre questa sequenza
   * invece di tirare attorno alla media. Usato per il leg perfetto.
   */
  sequenza?: number[];
  /** Testo mostrato nella scelta del livello al posto della media. */
  nota?: string;
  /** Se e' un "bot livello squadra", id del compagno di cui imita la media. */
  compagnoId?: string;
}

/**
 * Costruisce un livello a partire dalla media condivisa di un compagno:
 * probabilita' e cap di chiusura sono interpolati sugli ancoraggi dei livelli
 * fissi, cosi' il bot "gioca come" chi ha quella media.
 */
export function livelloDaMedia(
  nome: string,
  media: number,
  compagnoId: string,
): Livello {
  const ancore = [
    { m: 30, p: 0.08, c: 40 },
    { m: 40, p: 0.12, c: 50 },
    { m: 55, p: 0.2, c: 80 },
    { m: 65, p: 0.3, c: 110 },
    { m: 80, p: 0.45, c: 140 },
    { m: 95, p: 0.6, c: 170 },
    { m: 110, p: 0.78, c: 170 },
    { m: 140, p: 0.92, c: 170 },
  ];
  const x = Math.max(ancore[0].m, Math.min(ancore[ancore.length - 1].m, media));
  let p = ancore[0].p;
  let c = ancore[0].c;
  for (let i = 0; i < ancore.length - 1; i++) {
    const a = ancore[i];
    const b = ancore[i + 1];
    if (x >= a.m && x <= b.m) {
      const t = (x - a.m) / (b.m - a.m);
      p = a.p + t * (b.p - a.p);
      c = Math.round(a.c + t * (b.c - a.c));
      break;
    }
  }
  return {
    id: "squadra",
    nome,
    media,
    pCheckout: Math.round(p * 100) / 100,
    capCheckout: c,
    compagnoId,
  };
}

export const LIVELLI: Livello[] = [
  { id: "base", nome: "Base", media: 40, pCheckout: 0.12, capCheckout: 50 },
  { id: "medio", nome: "Medio", media: 55, pCheckout: 0.2, capCheckout: 80 },
  { id: "alto", nome: "Alto", media: 65, pCheckout: 0.3, capCheckout: 110 },
  { id: "super", nome: "Super", media: 80, pCheckout: 0.45, capCheckout: 140 },
  { id: "letale", nome: "Letale", media: 95, pCheckout: 0.6, capCheckout: 170 },
  {
    id: "fuego",
    nome: "Fuego 🔥",
    media: 167,
    pCheckout: 1,
    capCheckout: 170,
    sequenza: [180, 180, 141],
    nota: "Leg perfetto: 180 · 180 · 141",
  },
];

export type ModoChiusura = "single" | "master" | "double";
export type ModoIngresso = "single" | "master" | "double";
export type Formato = "bestof" | "firstto";
export type Unita = "legs" | "sets";

export const MODI_CHIUSURA: { id: ModoChiusura; nome: string; descr: string }[] =
  [
    { id: "double", nome: "Uscita con doppio", descr: "Si chiude solo su un doppio." },
    { id: "master", nome: "Uscita Master", descr: "Si chiude su doppio o triplo." },
    { id: "single", nome: "Uscita diretta", descr: "Si chiude con qualsiasi bersaglio." },
  ];

export const MODI_INGRESSO: { id: ModoIngresso; nome: string; descr: string }[] =
  [
    { id: "single", nome: "Ingresso diretto", descr: "Si entra con qualsiasi bersaglio." },
    { id: "double", nome: "Ingresso con doppio", descr: "Il punteggio conta dopo un doppio." },
    { id: "master", nome: "Ingresso Master", descr: "Si entra su doppio o triplo." },
  ];

/** Etichette brevi per i badge del recap. */
export function etichettaIngresso(m: ModoIngresso): string {
  return m === "double" ? "Ingresso doppio" : m === "master" ? "Ingresso master" : "Ingresso diretto";
}
export function etichettaChiusura(m: ModoChiusura): string {
  return m === "double" ? "Uscita doppio" : m === "master" ? "Uscita master" : "Uscita diretta";
}

export const PUNTEGGI_INIZIALI = [301, 501, 701];

/** Configurazione scelta prima di iniziare la partita. */
export interface ConfigPartita {
  livello: Livello;
  puntiIniziali: number;
  formato: Formato;
  /** Numero di leg per "il meglio di" / "il primo a". */
  numero: number;
  unita: Unita;
  ingresso: ModoIngresso;
  chiusura: ModoChiusura;
  /** Mostra la chiusura consigliata durante la partita. */
  mostraChiusura: boolean;
  /** Vittoria solo con due leg di scarto. */
  dueLegDiff: boolean;
}

export function configPredefinita(livello: Livello): ConfigPartita {
  return {
    livello,
    puntiIniziali: 501,
    formato: "bestof",
    numero: 5,
    unita: "legs",
    ingresso: "single",
    chiusura: "double",
    mostraChiusura: true,
    dueLegDiff: false,
  };
}

/** Leg necessari per vincere la partita (senza contare la regola dei 2 di scarto). */
export function legPerVincere(cfg: ConfigPartita): number {
  return cfg.formato === "bestof" ? Math.floor(cfg.numero / 2) + 1 : cfg.numero;
}

/** Totali NON ottenibili con 3 freccette. */
const TOTALI_IMPOSSIBILI = new Set([
  163, 166, 169, 172, 173, 175, 176, 177, 178, 179,
]);

/** Punteggi che non si possono chiudere (usati per double/master out). */
const BOGEY = new Set([159, 162, 163, 165, 166, 168, 169]);

/** Statistiche accumulate su tutta la partita, per il recap finale. */
export interface StatsGiocatore {
  /** Punti segnati (esclusi i bust). */
  punti: number;
  /** Frecce tirate in totale. */
  frecce: number;
  /** Punti e frecce delle prime 3 visite di ogni leg (First 9). */
  first9Punti: number;
  first9Frecce: number;
  /** Visite iniziate da un punteggio chiudibile. */
  chkTentativi: number;
  /** Chiusure riuscite (= leg vinti). */
  chkRiusciti: number;
  /** Punteggio piu' alto in una visita. */
  highScore: number;
  /** Chiusura piu' alta. */
  highFinish: number;
  /** Frecce usate in ciascun leg vinto (per miglior/peggior leg). */
  frecceLegVinti: number[];
}

function statsVuote(): StatsGiocatore {
  return {
    punti: 0,
    frecce: 0,
    first9Punti: 0,
    first9Frecce: 0,
    chkTentativi: 0,
    chkRiusciti: 0,
    highScore: 0,
    highFinish: 0,
    frecceLegVinti: [],
  };
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
  /** Visite e frecce del leg corrente (per First 9 e conteggio frecce). */
  visiteUmano: number;
  visiteBot: number;
  frecceUmano: number;
  frecceBot: number;
}

export interface StatoPartita {
  config: ConfigPartita;
  primo: Giocatore;
  numeroLeg: number;
  legUmano: number;
  legBot: number;
  leg: StatoLeg;
  statsUmano: StatsGiocatore;
  statsBot: StatsGiocatore;
  vincitore: Giocatore | null;
  /** Istante di inizio, mostrato nel recap. */
  creato: number;
}

export function avversario(g: Giocatore): Giocatore {
  return g === "umano" ? "bot" : "umano";
}

/** Lancio della moneta: chi inizia la partita. */
export function lancioMoneta(): Giocatore {
  return Math.random() < 0.5 ? "umano" : "bot";
}

function creaLeg(iniziato: Giocatore, punti: number): StatoLeg {
  return {
    puntiUmano: punti,
    puntiBot: punti,
    turno: iniziato,
    iniziato,
    ultimoUmano: null,
    ultimoBot: null,
    bustUmano: false,
    bustBot: false,
    vincitore: null,
    visiteUmano: 0,
    visiteBot: 0,
    frecceUmano: 0,
    frecceBot: 0,
  };
}

export function creaPartita(
  config: ConfigPartita,
  primo: Giocatore,
): StatoPartita {
  return {
    config,
    primo,
    numeroLeg: 1,
    legUmano: 0,
    legBot: 0,
    leg: creaLeg(primo, config.puntiIniziali),
    statsUmano: statsVuote(),
    statsBot: statsVuote(),
    vincitore: null,
    creato: Date.now(),
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

/** Il totale rimanente e' chiudibile in una visita? */
export function finibile(rimanente: number, modo: ModoChiusura): boolean {
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

/**
 * Punteggio successivo di una sequenza prestabilita, dedotto dal rimanente:
 * il percorso e' deterministico (es. 501 → 321 → 141 → 0), quindi il punteggio
 * rimasto identifica sempre la tirata da fare.
 */
function tirataDaSequenza(
  rimanente: number,
  sequenza: number[],
  puntiIniziali: number,
): number {
  let restante = puntiIniziali;
  for (const tirata of sequenza) {
    if (restante === rimanente) return tirata;
    restante -= tirata;
  }
  // Fuori sequenza (non dovrebbe accadere): chiude se puo', altrimenti tira al massimo.
  return Math.min(rimanente, sequenza[0] ?? 0);
}

/** Calcola il punteggio della tirata del bot (mai bust, sempre ottenibile). */
export function mossaBot(
  rimanente: number,
  livello: Livello,
  modo: ModoChiusura,
  puntiIniziali: number,
): number {
  if (livello.sequenza) {
    return tirataDaSequenza(rimanente, livello.sequenza, puntiIniziali);
  }
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

interface EsitoApplica {
  leg: StatoLeg;
  stats: StatsGiocatore;
  chiuso: boolean;
}

/**
 * Applica una visita di un giocatore aggiornando leg e statistiche.
 * `frecce` sono le frecce effettivamente tirate (3, o meno se si chiude o si
 * sballa prima). Con `bustForzato` chi chiama dichiara uno sballo che dal solo
 * totale non si vedrebbe (es. zero raggiunto senza doppio): lo sa solo
 * l'input a bersaglio, che registra le frecce una per una.
 */
function applicaVisita(
  leg: StatoLeg,
  stats: StatsGiocatore,
  giocatore: Giocatore,
  punteggio: number,
  frecce: number,
  modo: ModoChiusura,
  bustForzato = false,
): EsitoApplica {
  const umano = giocatore === "umano";
  const rimanentePrima = umano ? leg.puntiUmano : leg.puntiBot;
  const r: EsitoVisita = bustForzato
    ? { nuovoRimanente: rimanentePrima, chiuso: false, bust: true }
    : risultatoVisita(rimanentePrima, punteggio, modo);
  const tentativoChk = finibile(rimanentePrima, modo);

  const visiteLeg = (umano ? leg.visiteUmano : leg.visiteBot) + 1;
  const frecceLeg = (umano ? leg.frecceUmano : leg.frecceBot) + frecce;
  const inFirst9 = visiteLeg <= 3;

  const nuoveStats: StatsGiocatore = {
    ...stats,
    punti: stats.punti + (r.bust ? 0 : punteggio),
    frecce: stats.frecce + frecce,
    first9Punti: stats.first9Punti + (inFirst9 && !r.bust ? punteggio : 0),
    first9Frecce: stats.first9Frecce + (inFirst9 ? frecce : 0),
    chkTentativi: stats.chkTentativi + (tentativoChk ? 1 : 0),
    chkRiusciti: stats.chkRiusciti + (r.chiuso ? 1 : 0),
    highScore: !r.bust && punteggio > stats.highScore ? punteggio : stats.highScore,
    highFinish: r.chiuso && punteggio > stats.highFinish ? punteggio : stats.highFinish,
  };

  const nuovoLeg: StatoLeg = umano
    ? {
        ...leg,
        puntiUmano: r.nuovoRimanente,
        ultimoUmano: punteggio,
        bustUmano: r.bust,
        visiteUmano: visiteLeg,
        frecceUmano: frecceLeg,
      }
    : {
        ...leg,
        puntiBot: r.nuovoRimanente,
        ultimoBot: punteggio,
        bustBot: r.bust,
        visiteBot: visiteLeg,
        frecceBot: frecceLeg,
      };

  return { leg: nuovoLeg, stats: nuoveStats, chiuso: r.chiuso };
}

function risolviLeg(stato: StatoPartita, vincitore: Giocatore): StatoPartita {
  const legUmano = stato.legUmano + (vincitore === "umano" ? 1 : 0);
  const legBot = stato.legBot + (vincitore === "bot" ? 1 : 0);
  const bersaglio = legPerVincere(stato.config);
  let vincitorePartita: Giocatore | null = null;
  if (stato.config.dueLegDiff) {
    if (legUmano >= bersaglio && legUmano - legBot >= 2) vincitorePartita = "umano";
    else if (legBot >= bersaglio && legBot - legUmano >= 2) vincitorePartita = "bot";
  } else {
    if (legUmano >= bersaglio) vincitorePartita = "umano";
    else if (legBot >= bersaglio) vincitorePartita = "bot";
  }
  return { ...stato, legUmano, legBot, vincitore: vincitorePartita };
}

/**
 * Applica la tirata dell'umano (punteggio gia' validato). `frecce` sono quelle
 * tirate nella visita: 3 col tastierino, il numero esatto quando si chiude o
 * quando si gioca con l'input a bersaglio. Con `bustForzato` la visita e'
 * sballata anche se il totale porterebbe a zero (zero senza doppio).
 */
export function giocaUmano(
  stato: StatoPartita,
  punteggio: number,
  frecce = 3,
  bustForzato = false,
): StatoPartita {
  const leg = stato.leg;
  if (leg.turno !== "umano" || leg.vincitore || stato.vincitore) return stato;

  const res = applicaVisita(
    leg,
    stato.statsUmano,
    "umano",
    punteggio,
    frecce,
    stato.config.chiusura,
    bustForzato,
  );

  if (res.chiuso) {
    const statsUmano: StatsGiocatore = {
      ...res.stats,
      frecceLegVinti: [...res.stats.frecceLegVinti, res.leg.frecceUmano],
    };
    const nuovoLeg = { ...res.leg, vincitore: "umano" as const };
    return risolviLeg({ ...stato, leg: nuovoLeg, statsUmano }, "umano");
  }
  const nuovoLeg = { ...res.leg, turno: "bot" as const };
  return { ...stato, leg: nuovoLeg, statsUmano: res.stats };
}

/** Simula e applica la tirata del bot (chiude convenzionalmente con 3 frecce). */
export function giocaBot(stato: StatoPartita): StatoPartita {
  const leg = stato.leg;
  if (leg.turno !== "bot" || leg.vincitore || stato.vincitore) return stato;

  const punteggio = mossaBot(
    leg.puntiBot,
    stato.config.livello,
    stato.config.chiusura,
    stato.config.puntiIniziali,
  );
  const res = applicaVisita(leg, stato.statsBot, "bot", punteggio, 3, stato.config.chiusura);

  if (res.chiuso) {
    const statsBot: StatsGiocatore = {
      ...res.stats,
      frecceLegVinti: [...res.stats.frecceLegVinti, res.leg.frecceBot],
    };
    const nuovoLeg = { ...res.leg, vincitore: "bot" as const };
    return risolviLeg({ ...stato, leg: nuovoLeg, statsBot }, "bot");
  }
  const nuovoLeg = { ...res.leg, turno: "umano" as const };
  return { ...stato, leg: nuovoLeg, statsBot: res.stats };
}

/** Passa al leg successivo alternando chi inizia. */
export function avanzaLeg(stato: StatoPartita): StatoPartita {
  if (stato.vincitore) return stato;
  const numeroLeg = stato.numeroLeg + 1;
  // leg dispari: inizia chi ha vinto la moneta; leg pari: l'avversario
  const iniziato =
    numeroLeg % 2 === 1 ? stato.primo : avversario(stato.primo);
  return {
    ...stato,
    numeroLeg,
    leg: creaLeg(iniziato, stato.config.puntiIniziali),
  };
}

function arrotonda2(x: number): number {
  return Math.round(x * 100) / 100;
}

/** Media per 3 frecce (0 se nessuna freccia). */
export function media3(s: StatsGiocatore): number {
  return s.frecce === 0 ? 0 : arrotonda2((s.punti / s.frecce) * 3);
}

/** Media dei primi 9 dardi di ogni leg. */
export function mediaFirst9(s: StatsGiocatore): number {
  return s.first9Frecce === 0 ? 0 : arrotonda2((s.first9Punti / s.first9Frecce) * 3);
}

/** Percentuale di chiusura (chiusure / tentativi). */
export function checkoutPerc(s: StatsGiocatore): number {
  return s.chkTentativi === 0 ? 0 : arrotonda2((s.chkRiusciti / s.chkTentativi) * 100);
}

/** Frecce del leg vinto piu' rapido (null se non ne ha vinti). */
export function migliorLeg(s: StatsGiocatore): number | null {
  return s.frecceLegVinti.length ? Math.min(...s.frecceLegVinti) : null;
}

/** Frecce del leg vinto piu' lento (null se non ne ha vinti). */
export function peggiorLeg(s: StatsGiocatore): number | null {
  return s.frecceLegVinti.length ? Math.max(...s.frecceLegVinti) : null;
}
