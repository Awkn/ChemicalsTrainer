import { db } from "./db";
import { nuovoId } from "./id";
import type { Categoria, Esercizio, GiocoId, MetricaDef } from "../types";

/**
 * Al primo avvio popola solo la LIBRERIA di esercizi (con le relative metriche).
 * Nessun programma preimpostato: ogni giocatore si crea il proprio programma
 * settimanale dalla scheda Programma, scegliendo tra questi esercizi pronti.
 */

type Chiave = string;

interface DefEsercizio {
  chiave: Chiave;
  nome: string;
  categoria: Categoria;
  descrizione: string;
  obiettivo?: string;
  durataMin?: number;
  metriche?: MetricaDef[];
  gioco?: GiocoId;
}

const ESERCIZI: DefEsercizio[] = [
  // --- Riscaldamenti (varianti per sessione) ---
  {
    chiave: "ris-lun",
    nome: "Riscaldamento",
    categoria: "Riscaldamento",
    durataMin: 10,
    descrizione:
      "100 frecce senza guardare il punteggio.\nCerca: movimento identico, rilascio pulito, ritmo costante.",
    obiettivo: "100 frecce a ritmo costante",
  },
  {
    chiave: "ris-mer",
    nome: "Warm-up",
    categoria: "Riscaldamento",
    durataMin: 5,
    descrizione: "50 frecce libere.",
    obiettivo: "50 frecce",
  },
  {
    chiave: "ris-ven",
    nome: "Warm-up",
    categoria: "Riscaldamento",
    durataMin: 10,
    descrizione: "100 frecce.",
    obiettivo: "100 frecce",
  },
  {
    chiave: "ris-sera",
    nome: "Warm-up",
    categoria: "Riscaldamento",
    durataMin: 10,
    descrizione: "Riscaldamento libero prima della sessione serale.",
    obiettivo: "10 minuti",
  },

  // --- Lunedi: Fondamentali ---
  {
    chiave: "t20-precision",
    nome: "T20 Precision",
    categoria: "Tripli",
    durataMin: 15,
    descrizione:
      "10 visite sul T20.\nPunteggio: 3 = tripla, 1 = singolo, 0 = fuori.",
    obiettivo: "Oltre 45 punti",
    metriche: [{ id: "punti", nome: "Punti", unita: "punti", obiettivo: 45 }],
  },
  {
    chiave: "doubles-ladder",
    nome: "Doubles Ladder",
    categoria: "Doppi",
    durataMin: 20,
    descrizione:
      "Chiudi in sequenza da D1 a D20.\nMax 3 frecce per doppio: se fallisci passi al successivo.\nSegna: frecce usate, doppi chiusi, percentuale.\nRipeti ogni settimana per confrontare i progressi.",
    obiettivo: "Traccia la % di doppi chiusi",
    gioco: "ladder",
    metriche: [
      { id: "perc", nome: "Doppi chiusi %", unita: "percentuale" },
      { id: "chiusi", nome: "Doppi chiusi", unita: "numero" },
      { id: "frecce", nome: "Frecce usate", unita: "numero", verso: "basso" },
    ],
  },
  {
    chiave: "bull",
    nome: "Bull",
    categoria: "Altro",
    durataMin: 5,
    descrizione: "50 tiri al Bull.\nSegna: Single Bull e Bull pieno.",
    obiettivo: "50 Bull",
    metriche: [
      { id: "bull-pieno", nome: "Bull pieni", unita: "numero" },
      { id: "single-bull", nome: "Single Bull", unita: "numero" },
    ],
  },

  // --- Mercoledi: Doppi ---
  {
    chiave: "atc-doubles",
    nome: "Around the Clock Doubles",
    categoria: "Around the Clock",
    durataMin: 20,
    descrizione:
      "Da D1 a D20, una sola freccia.\nSe prendi vai avanti; se sbagli ritenti finche' non prendi.",
    obiettivo: "Completa D1 → D20",
    gioco: "atc",
    metriche: [
      { id: "frecce", nome: "Frecce usate", unita: "numero", verso: "basso" },
    ],
  },
  {
    chiave: "bobs-27",
    nome: "Bob's 27",
    categoria: "Doppi",
    durataMin: 20,
    descrizione:
      "Parti da 27 punti, da D1 fino al Bull.\nDoppio preso: + valore. Doppio sbagliato con 3 frecce: - valore.\nTocca 'Inizia' e segui il bersaglio: il punteggio si calcola da solo.",
    obiettivo: "Oltre 250 punti",
    gioco: "bob27",
    metriche: [
      { id: "punteggio", nome: "Punteggio", unita: "punti", obiettivo: 250 },
      { id: "perc", nome: "Doppi %", unita: "percentuale" },
    ],
  },
  {
    chiave: "co-61-100",
    nome: "61-100 Checkouts",
    categoria: "Checkout",
    durataMin: 10,
    descrizione:
      "Esce un checkout casuale tra 61 e 100.\nHai una visita (3 frecce) per chiuderlo: inserisci il punteggio.\nSessione a oltranza: alla fine salva la percentuale di chiusure.",
    obiettivo: "Almeno il 40% di chiusure",
    gioco: "co61100",
    metriche: [
      { id: "successo", nome: "Checkout %", unita: "percentuale", obiettivo: 40 },
    ],
  },

  // --- Venerdi: Controllo e scoring ---
  {
    chiave: "cricket-accuracy",
    nome: "Cricket Accuracy",
    categoria: "Tripli",
    durataMin: 15,
    descrizione:
      "Tira solo: 20, 19, 18, 17, 16, 15, Bull.\nCerca la precisione sulle triple.",
    obiettivo: "Tripla precisione",
    metriche: [{ id: "triple", nome: "Triple centrate", unita: "numero" }],
  },
  {
    chiave: "scoring-100",
    nome: "100+ Scoring",
    categoria: "Scoring",
    durataMin: 15,
    descrizione: "20 visite sul T20.\nConta: 100+, 140+, 180.",
    obiettivo: "Oltre il 50% di visite da 100+",
    metriche: [
      { id: "v100", nome: "Visite 100+", unita: "numero", obiettivo: 10 },
      { id: "v140", nome: "Visite 140+", unita: "numero", obiettivo: 4 },
      { id: "v180", nome: "180", unita: "numero" },
    ],
  },
  {
    chiave: "finishing-drill",
    nome: "Finishing Drill",
    categoria: "Checkout",
    durataMin: 15,
    descrizione:
      "Parti da: 40, 32, 24, 20, 16, 8.\n5 tentativi per ogni numero.\nConta la percentuale.",
    obiettivo: "Traccia la % di chiusure",
    metriche: [{ id: "perc", nome: "Chiusure %", unita: "percentuale" }],
  },

  // --- Martedi sera: Match Day ---
  {
    chiave: "match-501",
    nome: "501 contro il computer",
    categoria: "Partita",
    durataMin: 45,
    descrizione:
      "Partita al meglio di 11 leg contro il bot.\nScegli un livello leggermente sopra la tua media.\nMedia, first 9, checkout % e doppi si registrano da soli a fine partita.",
    obiettivo: "Gioca la partita e batti il bot",
    gioco: "g501",
    metriche: [
      { id: "media", nome: "Media 3 dart", unita: "punti" },
      { id: "first9", nome: "First 9", unita: "punti" },
      { id: "checkout", nome: "Checkout %", unita: "percentuale", obiettivo: 35 },
      { id: "doppi", nome: "Doppi %", unita: "percentuale", obiettivo: 40 },
    ],
  },
  {
    chiave: "pressure-doubles",
    nome: "Pressure Doubles",
    categoria: "Doppi",
    durataMin: 20,
    descrizione:
      "Doppi: D16, D20, D10, D8, D12.\nPer ognuno devi fare 5 consecutivi.\nSe sbagli ricominci.",
    obiettivo: "5 consecutivi per doppio",
    gioco: "pressuredoubles",
    metriche: [
      { id: "d16", nome: "D16 %", unita: "percentuale", obiettivo: 45 },
      { id: "d20", nome: "D20 %", unita: "percentuale", obiettivo: 40 },
      { id: "d10", nome: "D10 %", unita: "percentuale", obiettivo: 40 },
      { id: "d8", nome: "D8 %", unita: "percentuale", obiettivo: 50 },
      { id: "d12", nome: "D12 %", unita: "percentuale" },
    ],
  },
  {
    chiave: "challenge-121",
    nome: "121 Challenge",
    categoria: "Checkout",
    durataMin: 15,
    descrizione:
      "Parti sempre da 121, hai 9 frecce.\nInserisci il punteggio a ogni round: se chiudi conti +1, altrimenti si riprova.\nSessione a oltranza: alla fine salva la percentuale di chiusure.\nDalla sezione Esercizi parte la sfida a scaletta (10 tentativi).",
    obiettivo: "Almeno il 50% di successo",
    gioco: "co121",
    metriche: [
      { id: "successo", nome: "Successo %", unita: "percentuale", obiettivo: 50 },
      { id: "record", nome: "Record 121", unita: "numero", obiettivo: 124 },
    ],
  },

  // --- Giovedi sera: Serata pressione ---
  {
    chiave: "co-60-170",
    nome: "Checkout 60-170",
    categoria: "Checkout",
    durataMin: 30,
    descrizione:
      "Esce un checkout casuale fra 60 e 170, trenta volte.\nUna visita (3 frecce) per chiuderlo, poi si passa al prossimo.\nTocca 'Gioca ora': i riusciti si contano da soli.",
    obiettivo: "Traccia i checkout riusciti",
    gioco: "co60170",
    metriche: [
      { id: "riusciti", nome: "Riusciti su 30", unita: "numero" },
    ],
  },
  {
    chiave: "doubles-pressure-game",
    nome: "Doubles Pressure Game",
    categoria: "Doppi",
    durataMin: 20,
    descrizione:
      "Dieci doppi estratti a sorte, da chiudere entro 3 frecce.\nPrima freccia: +3, seconda: +2, terza: +1. Fuori: -1.\nTocca 'Gioca ora' e di' con quale freccia hai chiuso.",
    obiettivo: "Oltre 20 punti",
    gioco: "dpgame",
    metriche: [{ id: "punti", nome: "Punti", unita: "punti", obiettivo: 20 }],
  },
  {
    chiave: "shanghai-20",
    nome: "Shanghai 20",
    categoria: "Tripli",
    durataMin: 15,
    descrizione:
      "In una visita: Single 20, Treble 20, Double 20.\nRipeti 20 volte.\nTocca 'Gioca ora' e segna cosa hai preso a ogni visita.",
    obiettivo: "20 ripetizioni",
    gioco: "shanghai20",
    metriche: [
      { id: "completati", nome: "Shanghai completati", unita: "numero" },
    ],
  },
  {
    chiave: "game-shot",
    nome: "Game Shot",
    categoria: "Checkout",
    durataMin: 15,
    descrizione:
      "Solo gli ultimi turni: 52, 68, 81, 96, 100, 110, 121, 124, 130.\nOgni turno e' 'per vincere il match': una visita sola.\nNon ritirare mai le frecce se sbagli la prima: gioca sempre la soluzione migliore.",
    obiettivo: "Chiudi sotto pressione",
    gioco: "gameshot",
    metriche: [
      {
        id: "chiuse",
        nome: "Chiusure riuscite (su 9)",
        unita: "numero",
        obiettivo: 5,
      },
    ],
  },
];

export async function seedSePrimoAvvio(): Promise<void> {
  const giaPopolato = (await db.esercizi.count()) > 0;
  if (giaPopolato) return;

  const now = Date.now();

  // Solo la libreria di esercizi: niente programma, lo crea l'utente.
  const esercizi: Esercizio[] = ESERCIZI.map((def) => ({
    id: nuovoId(),
    nome: def.nome,
    categoria: def.categoria,
    descrizione: def.descrizione,
    obiettivo: def.obiettivo,
    durataMin: def.durataMin,
    metriche: def.metriche,
    gioco: def.gioco,
    createdAt: now,
  }));

  await db.esercizi.bulkAdd(esercizi);
}
