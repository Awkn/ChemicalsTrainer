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
          onDati(voci);
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
