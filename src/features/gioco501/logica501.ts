/**
 * Motore di gioco del 501. Tutto puro (nessun React): riceve uno stato e
 * restituisce il nuovo stato. Cosi' la logica e' isolata e testabile.
 *
 * I due posti si chiamano "uno" e "due" e non "umano" e "bot": il secondo puo'
 * essere il computer oppure una persona in carne e ossa sullo stesso telefono,
 * e le regole del gioco sono le stesse per entrambi. Chi sia lo dice
 * `config.avversario`; solo il bot ha bisogno che qualcuno tiri per lui.
 *
 * Modello di input umano: si gioca su un bersaglio vero e si inserisce il
 * TOTALE segnato nella tirata (3 frecce). Alla chiusura si indica con quante
 * frecce (1-3) si e' chiuso, cosi' le statistiche a fine partita sono precise.
 * Il bot e' simulato in base alla sua media per 3 frecce e a una probabilita'
 * di chiusura crescente col livello.
 */

import type { Dardo } from "../../lib/bersaglio";
import { contaDoppiVisita, unisciConti, type ContiDoppi } from "../../lib/doppi";

/** I due posti al tavolo. Chi li occupa lo dice la configurazione. */
export type Giocatore = "uno" | "due";

/** Chi siede nel secondo posto. */
export type Avversario = "bot" | "umano";

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
    { id: "double", nome: "Double out", descr: "Si chiude solo su un doppio." },
    { id: "master", nome: "Master out", descr: "Si chiude su doppio o triplo." },
    { id: "single", nome: "Single out", descr: "Si chiude con qualsiasi bersaglio." },
  ];

export const MODI_INGRESSO: { id: ModoIngresso; nome: string; descr: string }[] =
  [
    { id: "single", nome: "Single in", descr: "Si entra con qualsiasi bersaglio." },
    { id: "master", nome: "Master in", descr: "Si entra su doppio o triplo." },
    { id: "double", nome: "Double in", descr: "Il punteggio conta dopo un doppio." },
  ];

/** Etichette brevi per i badge del recap. */
export function etichettaIngresso(m: ModoIngresso): string {
  return m === "double" ? "Double in" : m === "master" ? "Master in" : "Single in";
}
export function etichettaChiusura(m: ModoChiusura): string {
  return m === "double" ? "Double out" : m === "master" ? "Master out" : "Single out";
}

export const PUNTEGGI_INIZIALI = [301, 501, 701];

/** Configurazione scelta prima di iniziare la partita. */
export interface ConfigPartita {
  /** Chi occupa il secondo posto: il computer o una persona. */
  avversario: Avversario;
  /** Nomi dei due giocatori, usati solo quando si gioca in due. */
  nomi: [string, string];
  livello: Livello;
  puntiIniziali: number;
  formato: Formato;
  /** Quante unita' (leg o set, vedi `unita`) per "il meglio di" / "il primo a". */
  numero: number;
  unita: Unita;
  /** Leg che compongono un set. Ignorato quando si gioca a leg. */
  legNumero: number;
  ingresso: ModoIngresso;
  chiusura: ModoChiusura;
  /** Mostra la chiusura consigliata durante la partita. */
  mostraChiusura: boolean;
  /** Vittoria solo con due di scarto (leg o set: cio' che decide la partita). */
  dueLegDiff: boolean;
}

export function configPredefinita(livello: Livello): ConfigPartita {
  return {
    avversario: "bot",
    // Nomi neutri: finiscono dentro frasi ("Leg di ...") dove "Tu" stonerebbe.
    // La pagina sostituisce il primo col nome del profilo, se c'e'.
    nomi: ["Giocatore 1", "Giocatore 2"],
    livello,
    puntiIniziali: 501,
    formato: "bestof",
    numero: 5,
    unita: "legs",
    legNumero: 5,
    ingresso: "single",
    chiusura: "double",
    mostraChiusura: true,
    dueLegDiff: false,
  };
}

/** True se la partita si conta a set. */
export function aSet(cfg: ConfigPartita): boolean {
  return cfg.unita === "sets";
}

/**
 * Nomi da mostrare ai due posti. Contro il bot restano quelli di sempre:
 * "Tu" e "Bot" dicono gia' tutto e non c'e' niente da personalizzare.
 */
export function nomiVisualizzati(config: ConfigPartita): [string, string] {
  if (config.avversario === "bot") return ["Tu", "Bot"];
  return [config.nomi[0] || "Giocatore 1", config.nomi[1] || "Giocatore 2"];
}

/** Da "il meglio di N" a "quanti ne servono per vincere". */
function quantiPerVincere(formato: Formato, numero: number): number {
  return formato === "bestof" ? Math.floor(numero / 2) + 1 : numero;
}

/**
 * Unita' necessarie a vincere la partita: set se si gioca a set, altrimenti
 * leg (senza contare la regola dei due di scarto).
 */
export function perVincere(cfg: ConfigPartita): number {
  return quantiPerVincere(cfg.formato, cfg.numero);
}

/** Leg necessari a vincere un set. Senza set vale il conto della partita. */
export function legPerSet(cfg: ConfigPartita): number {
  return aSet(cfg)
    ? quantiPerVincere(cfg.formato, cfg.legNumero)
    : perVincere(cfg);
}

/** Descrizione del formato, uguale ovunque venga mostrato. */
export function nomeFormato(cfg: ConfigPartita): string {
  const verbo = cfg.formato === "bestof" ? "Al meglio di" : "Primo a";
  if (!aSet(cfg)) return `${verbo} ${cfg.numero} leg`;
  return `${verbo} ${cfg.numero} set da ${cfg.legNumero} leg`;
}

/** Totali NON ottenibili con 3 freccette. */
const TOTALI_IMPOSSIBILI = new Set([
  163, 166, 169, 172, 173, 175, 176, 177, 178, 179,
]);

/** Punteggi che non si possono chiudere (usati per double/master out). */
const BOGEY = new Set([159, 162, 163, 165, 166, 168, 169]);

/**
 * Tirata di una persona: il totale, piu' tutto quello che l'input riesce a
 * dire. Il tastierino conosce solo il punteggio; l'input a bersaglio sa anche
 * quante frecce sono servite, dove sono finite e se la visita e' sballata.
 */
export interface TirataUmana {
  punteggio: number;
  /** Frecce tirate nella visita; 3 quando non si sa. */
  frecce?: number;
  /** Sballo certo (zero raggiunto senza doppio), visibile solo per freccia. */
  bust?: boolean;
  /** Dettaglio delle singole frecce, se l'input le conosce. */
  dardi?: Dardo[];
}

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
  /**
   * Tentativi al doppio per bersaglio, contati freccia per freccia. Si
   * riempie solo giocando con l'input a bersaglio e a uscita con doppio:
   * altrove non c'e' modo di sapere dove sia finita ogni freccia.
   */
  doppi: ContiDoppi;
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
    doppi: {},
  };
}

export interface StatoLeg {
  puntiUno: number;
  puntiDue: number;
  turno: Giocatore;
  iniziato: Giocatore;
  ultimoUno: number | null;
  ultimoDue: number | null;
  bustUno: boolean;
  bustDue: boolean;
  vincitore: Giocatore | null;
  /** Visite e frecce del leg corrente (per First 9 e conteggio frecce). */
  visiteUno: number;
  visiteDue: number;
  frecceUno: number;
  frecceDue: number;
}

export interface StatoPartita {
  config: ConfigPartita;
  primo: Giocatore;
  /** Leg corrente DENTRO il set. Senza set e' il leg della partita. */
  numeroLeg: number;
  /** Leg vinti nel set corrente. Senza set sono quelli della partita. */
  legUno: number;
  legDue: number;
  /** Set corrente (1 se non si gioca a set). */
  numeroSet: number;
  /** Set vinti. Restano a zero se non si gioca a set. */
  setUno: number;
  setDue: number;
  /**
   * Vincitore del set appena concluso, finche' non si passa al successivo:
   * serve a mostrare il punteggio finale del set prima di azzerare i leg.
   */
  setChiuso: Giocatore | null;
  /**
   * Leg conclusi in tutta la partita. Da qui esce chi inizia il leg dopo:
   * il primo tiro si alterna senza interruzioni, anche a cavallo dei set.
   */
  legGiocati: number;
  /** Leg vinti in tutta la partita, per il recap. */
  legTotaliUno: number;
  legTotaliDue: number;
  leg: StatoLeg;
  statsUno: StatsGiocatore;
  statsDue: StatsGiocatore;
  vincitore: Giocatore | null;
  /** Istante di inizio, mostrato nel recap. */
  creato: number;
}

/** L'altro posto al tavolo. */
export function altroGiocatore(g: Giocatore): Giocatore {
  return g === "uno" ? "due" : "uno";
}

/** True se quel posto e' occupato dal computer. */
export function eBot(config: ConfigPartita, g: Giocatore): boolean {
  return g === "due" && config.avversario === "bot";
}

/** Punteggio rimanente di un giocatore nel leg. */
export function rimanenteDi(leg: StatoLeg, g: Giocatore): number {
  return g === "uno" ? leg.puntiUno : leg.puntiDue;
}

/** Statistiche di un giocatore. */
export function statsDi(stato: StatoPartita, g: Giocatore): StatsGiocatore {
  return g === "uno" ? stato.statsUno : stato.statsDue;
}

/** Lancio della moneta: chi inizia la partita. */
export function lancioMoneta(): Giocatore {
  return Math.random() < 0.5 ? "uno" : "due";
}

function creaLeg(iniziato: Giocatore, punti: number): StatoLeg {
  return {
    puntiUno: punti,
    puntiDue: punti,
    turno: iniziato,
    iniziato,
    ultimoUno: null,
    ultimoDue: null,
    bustUno: false,
    bustDue: false,
    vincitore: null,
    visiteUno: 0,
    visiteDue: 0,
    frecceUno: 0,
    frecceDue: 0,
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
    legUno: 0,
    legDue: 0,
    numeroSet: 1,
    setUno: 0,
    setDue: 0,
    setChiuso: null,
    legGiocati: 0,
    legTotaliUno: 0,
    legTotaliDue: 0,
    leg: creaLeg(primo, config.puntiIniziali),
    statsUno: statsVuote(),
    statsDue: statsVuote(),
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
  dardi?: Dardo[],
): EsitoApplica {
  const primo = giocatore === "uno";
  const rimanentePrima = rimanenteDi(leg, giocatore);
  const r: EsitoVisita = bustForzato
    ? { nuovoRimanente: rimanentePrima, chiuso: false, bust: true }
    : risultatoVisita(rimanentePrima, punteggio, modo);
  const tentativoChk = finibile(rimanentePrima, modo);

  const visiteLeg = (primo ? leg.visiteUno : leg.visiteDue) + 1;
  const frecceLeg = (primo ? leg.frecceUno : leg.frecceDue) + frecce;
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
    // I doppi si contano solo se si sa dove e' finita ogni freccia, e solo a
    // uscita con doppio: con Master o uscita diretta non si mira per forza li'.
    doppi:
      dardi && modo === "double"
        ? unisciConti(stats.doppi, contaDoppiVisita(rimanentePrima, dardi))
        : stats.doppi,
  };

  const nuovoLeg: StatoLeg = primo
    ? {
        ...leg,
        puntiUno: r.nuovoRimanente,
        ultimoUno: punteggio,
        bustUno: r.bust,
        visiteUno: visiteLeg,
        frecceUno: frecceLeg,
      }
    : {
        ...leg,
        puntiDue: r.nuovoRimanente,
        ultimoDue: punteggio,
        bustDue: r.bust,
        visiteDue: visiteLeg,
        frecceDue: frecceLeg,
      };

  return { leg: nuovoLeg, stats: nuoveStats, chiuso: r.chiuso };
}

/**
 * Chi ha vinto la partita, dati i punteggi nell'unita' che la decide: i leg
 * se si gioca a leg, i set se si gioca a set.
 */
function chiVincePartita(
  cfg: ConfigPartita,
  uno: number,
  due: number,
): Giocatore | null {
  const bersaglio = perVincere(cfg);
  if (cfg.dueLegDiff) {
    if (uno >= bersaglio && uno - due >= 2) return "uno";
    if (due >= bersaglio && due - uno >= 2) return "due";
    return null;
  }
  if (uno >= bersaglio) return "uno";
  if (due >= bersaglio) return "due";
  return null;
}

function risolviLeg(stato: StatoPartita, vincitore: Giocatore): StatoPartita {
  const uno = vincitore === "uno";
  const legUno = stato.legUno + (uno ? 1 : 0);
  const legDue = stato.legDue + (uno ? 0 : 1);

  const base: StatoPartita = {
    ...stato,
    legUno,
    legDue,
    legGiocati: stato.legGiocati + 1,
    legTotaliUno: stato.legTotaliUno + (uno ? 1 : 0),
    legTotaliDue: stato.legTotaliDue + (uno ? 0 : 1),
  };

  // Senza set sono i leg a decidere la partita.
  if (!aSet(stato.config)) {
    return { ...base, vincitore: chiVincePartita(stato.config, legUno, legDue) };
  }

  // Il set va a chi arriva per primo ai leg richiesti; i due di scarto, se
  // attivi, valgono sui set, che sono cio' che decide la partita.
  const perSet = legPerSet(stato.config);
  if (legUno < perSet && legDue < perSet) return base;

  const setUno = stato.setUno + (uno ? 1 : 0);
  const setDue = stato.setDue + (uno ? 0 : 1);
  return {
    ...base,
    setUno,
    setDue,
    setChiuso: vincitore,
    vincitore: chiVincePartita(stato.config, setUno, setDue),
  };
}

/**
 * Applica la visita di un giocatore (punteggio gia' validato). Quello che
 * l'input non sa ha un valore di ripiego: 3 frecce, nessuno sballo dichiarato
 * e nessun dettaglio per freccia.
 *
 * Vale per entrambi i posti: al bot serve solo qualcuno che gli calcoli il
 * punteggio prima (vedi `giocaBot`), le regole poi sono le stesse.
 */
export function giocaVisita(
  stato: StatoPartita,
  giocatore: Giocatore,
  tirata: TirataUmana,
): StatoPartita {
  const leg = stato.leg;
  if (leg.turno !== giocatore || leg.vincitore || stato.vincitore) return stato;

  const primo = giocatore === "uno";
  const res = applicaVisita(
    leg,
    primo ? stato.statsUno : stato.statsDue,
    giocatore,
    tirata.punteggio,
    tirata.frecce ?? 3,
    stato.config.chiusura,
    tirata.bust ?? false,
    tirata.dardi,
  );

  if (res.chiuso) {
    const stats: StatsGiocatore = {
      ...res.stats,
      frecceLegVinti: [
        ...res.stats.frecceLegVinti,
        primo ? res.leg.frecceUno : res.leg.frecceDue,
      ],
    };
    const conStats = primo
      ? { ...stato, statsUno: stats }
      : { ...stato, statsDue: stats };
    return risolviLeg(
      { ...conStats, leg: { ...res.leg, vincitore: giocatore } },
      giocatore,
    );
  }

  const nuovoLeg = { ...res.leg, turno: altroGiocatore(giocatore) };
  return primo
    ? { ...stato, leg: nuovoLeg, statsUno: res.stats }
    : { ...stato, leg: nuovoLeg, statsDue: res.stats };
}

/** Simula e applica la tirata del bot (chiude convenzionalmente con 3 frecce). */
export function giocaBot(stato: StatoPartita): StatoPartita {
  if (stato.leg.turno !== "due" || stato.config.avversario !== "bot") {
    return stato;
  }
  const punteggio = mossaBot(
    stato.leg.puntiDue,
    stato.config.livello,
    stato.config.chiusura,
    stato.config.puntiIniziali,
  );
  return giocaVisita(stato, "due", { punteggio, frecce: 3 });
}

/**
 * Passa al leg successivo, o al set successivo se quello appena finito ha
 * chiuso un set. Il primo tiro si alterna leg dopo leg senza ripartire a
 * ogni set: chi ha iniziato l'ultimo leg non inizia anche il primo del set
 * nuovo, che sarebbe un vantaggio doppio.
 */
export function avanzaLeg(stato: StatoPartita): StatoPartita {
  if (stato.vincitore) return stato;
  const iniziato =
    stato.legGiocati % 2 === 0 ? stato.primo : altroGiocatore(stato.primo);
  const leg = creaLeg(iniziato, stato.config.puntiIniziali);

  if (stato.setChiuso) {
    return {
      ...stato,
      numeroSet: stato.numeroSet + 1,
      numeroLeg: 1,
      legUno: 0,
      legDue: 0,
      setChiuso: null,
      leg,
    };
  }
  return { ...stato, numeroLeg: stato.numeroLeg + 1, leg };
}

/**
 * Stato in cui la palla torna a chi gioca: o tocca a lui tirare, o il leg e'
 * finito e deve decidere lui quando andare avanti. Sono i punti in cui ha
 * senso fermarsi tornando indietro.
 */
function decideIlPrimo(stato: StatoPartita): boolean {
  return stato.leg.vincitore != null || stato.leg.turno === "uno";
}

/**
 * Fin dove riportare lo storico degli stati per annullare l'ultima visita
 * (-1 se non c'e' niente da annullare).
 *
 * In due si torna indietro di una visita sola: il telefono e' in mano a chi ha
 * appena segnato. Contro il bot no: togliere solo la sua tirata non servirebbe
 * a niente, perche' la rigiocherebbe subito da solo. Si risale quindi fino al
 * turno del giocatore, cioe' si annulla anche la propria visita precedente:
 * 301-301 torna 401-401, e ripetendo si arriva al 501-501 di partenza.
 */
export function indiceAnnulla(storia: StatoPartita[]): number {
  if (storia.length < 2) return -1;
  let i = storia.length - 2;
  if (storia[i].config.avversario === "bot") {
    while (i > 0 && !decideIlPrimo(storia[i])) i--;
  }
  return i;
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

export interface RiepilogoPartita {
  /** "Tu 3 — 1 Bot", gia' pronto da mostrare in una lista. */
  titolo: string;
  /** Formato, punteggio iniziale e media di chi tiene il telefono. */
  sottotitolo: string;
  /** Esito dal punto di vista del giocatore 1. */
  vinta: boolean;
}

/**
 * Due righe che riassumono una partita finita, per l'archivio. Stanno qui
 * perche' e' qui che si sa cosa decide il punteggio (set o leg) e chi occupa
 * il secondo posto.
 */
export function riepilogoPartita(stato: StatoPartita): RiepilogoPartita {
  const nomi = nomiVisualizzati(stato.config);
  const conSet = aSet(stato.config);
  const uno = conSet ? stato.setUno : stato.legUno;
  const due = conSet ? stato.setDue : stato.legDue;
  const avversario =
    stato.config.avversario === "bot"
      ? `Bot · ${stato.config.livello.nome}`
      : nomi[1];
  return {
    titolo: `${nomi[0]} ${uno} — ${due} ${avversario}`,
    sottotitolo: `${nomeFormato(stato.config)} · ${stato.config.puntiIniziali} · media ${media3(stato.statsUno)}`,
    vinta: stato.vincitore === "uno",
  };
}
