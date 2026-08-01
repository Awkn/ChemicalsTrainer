import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  type Auth,
  type User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import { firebaseConfig, squadraConfigurata } from "./config";
import type { RiepilogoGiocatore } from "./riepilogo";

/**
 * Accesso alla bacheca di squadra su Firestore.
 *
 * Ogni giocatore ha un documento in "squadra/{uid}", dove uid arriva
 * dall'accesso anonimo: nessuna password da ricordare, ma ognuno puo'
 * scrivere solo il proprio documento (lo impongono le regole lato server).
 * Tutti possono leggere l'intera collezione.
 */

const COLLEZIONE = "squadra";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let dbFirestore: Firestore | null = null;

function inizializza(): { auth: Auth; db: Firestore } | null {
  if (!squadraConfigurata()) return null;
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    dbFirestore = getFirestore(app);
  }
  return { auth: auth!, db: dbFirestore! };
}

/** Accede in forma anonima e restituisce l'utente (identita' del dispositivo). */
async function utente(): Promise<User | null> {
  const fb = inizializza();
  if (!fb) return null;
  if (fb.auth.currentUser) return fb.auth.currentUser;
  const cred = await signInAnonymously(fb.auth);
  return cred.user;
}

/**
 * Firestore + uid pronti all'uso (accesso anonimo effettuato). Serve ai moduli
 * che scrivono su Firestore (bacheca, backup). `null` se la squadra non e'
 * configurata o l'accesso non e' riuscito.
 */
export async function connessione(): Promise<{
  db: Firestore;
  uid: string;
} | null> {
  const fb = inizializza();
  const u = await utente();
  if (!fb || !u) return null;
  return { db: fb.db, uid: u.uid };
}

/** Pubblica (o aggiorna) il proprio riepilogo sulla bacheca. */
export async function pubblicaRiepilogo(
  riepilogo: RiepilogoGiocatore,
): Promise<void> {
  const fb = inizializza();
  const u = await utente();
  if (!fb || !u) return;
  await setDoc(doc(fb.db, COLLEZIONE, u.uid), riepilogo);
}

/** Rimuove il proprio riepilogo dalla bacheca. */
export async function rimuoviRiepilogo(): Promise<void> {
  const fb = inizializza();
  const u = await utente();
  if (!fb || !u) return;
  await deleteDoc(doc(fb.db, COLLEZIONE, u.uid));
}

export interface VoceSquadra extends RiepilogoGiocatore {
  id: string;
  /** True se questa voce e' la propria. */
  sonoIo: boolean;
}

/** Confronto tra nomi che ignora maiuscole e spazi in eccesso. */
function chiaveNome(nome: string | undefined): string {
  return (nome ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** A parita' di nome, quale voce tenere. */
function prevaleSu(a: VoceSquadra, b: VoceSquadra): boolean {
  // La propria voce non deve mai sparire: altrove "sonoIo" distingue i
  // compagni da se stessi, e perderla farebbe comparire un finto compagno.
  if (a.sonoIo !== b.sonoIo) return a.sonoIo;
  return (a.aggiornatoIl ?? 0) > (b.aggiornatoIl ?? 0);
}

/**
 * Riduce la bacheca a una voce per giocatore.
 *
 * L'identita' di un giocatore e' l'uid dell'accesso anonimo, che cambia se
 * quella sessione si perde: browser diverso, app reinstallata, oppure iOS che
 * libera lo spazio dell'app. La stessa persona si ritroverebbe cosi' con due
 * righe uguali. Non potendo cancellare il documento altrui (lo vietano le
 * regole), a parita' di nome si tiene la voce piu' aggiornata.
 *
 * Le voci senza nome non vengono accorpate: non avendo un nome da
 * confrontare, accorparle unirebbe persone diverse.
 */
export function unificaPerNome(voci: VoceSquadra[]): VoceSquadra[] {
  const migliore = new Map<string, VoceSquadra>();
  const senzaNome: VoceSquadra[] = [];

  for (const v of voci) {
    const chiave = chiaveNome(v.nome);
    if (!chiave) {
      senzaNome.push(v);
      continue;
    }
    const attuale = migliore.get(chiave);
    if (!attuale || prevaleSu(v, attuale)) migliore.set(chiave, v);
  }

  return [...migliore.values(), ...senzaNome];
}

/**
 * Resta in ascolto della bacheca: la callback viene richiamata a ogni
 * cambiamento. Restituisce la funzione per interrompere l'ascolto.
 */
export function ascoltaSquadra(
  onDati: (voci: VoceSquadra[]) => void,
  onErrore: (e: Error) => void,
): () => void {
  const fb = inizializza();
  if (!fb) return () => {};

  let stop: (() => void) | null = null;
  let annullato = false;

  utente()
    .then((u) => {
      if (annullato || !u) return;
      stop = onSnapshot(
        collection(fb.db, COLLEZIONE),
        (snap) => {
          const voci = snap.docs.map((d) => ({
            ...(d.data() as RiepilogoGiocatore),
            id: d.id,
            sonoIo: d.id === u.uid,
          }));
          // L'unificazione sta qui e non nelle pagine: cosi' vale per la
          // bacheca, per il bot livello squadra e per quello che verra' dopo.
          onDati(unificaPerNome(voci));
        },
        (e) => onErrore(e as Error),
      );
    })
    .catch((e) => onErrore(e as Error));

  return () => {
    annullato = true;
    stop?.();
  };
}
