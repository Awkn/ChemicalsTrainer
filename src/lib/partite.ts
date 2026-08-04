import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import { nuovoId } from "./id";
import type { PartitaSalvata } from "../types";

/**
 * Archivio delle partite concluse. Tiene solo le ultime: lo scopo e' rivedere
 * com'e' andata di recente, non conservare tutto (per le tendenze nel tempo ci
 * sono gia' i Progressi, che salvano le metriche partita per partita).
 *
 * Il modulo non sa niente delle regole dei giochi: riceve lo stato finale del
 * motore e lo ripone com'e'. A rileggerlo e' il recap del gioco che l'ha
 * prodotto, che quello stato lo conosce gia'.
 */

/** Quante partite restano in archivio. Le piu' vecchie vengono eliminate. */
export const MAX_PARTITE = 10;

/** Archivia una partita finita e taglia via quelle in eccesso. */
export async function salvaPartita(
  partita: Omit<PartitaSalvata, "id">,
): Promise<string> {
  const id = nuovoId();
  await db.partite.add({ ...partita, id });
  await potaVecchie();
  return id;
}

/** Elimina le partite oltre le ultime MAX_PARTITE. */
async function potaVecchie(): Promise<void> {
  const daButtare = await db.partite
    .orderBy("finita")
    .reverse()
    .offset(MAX_PARTITE)
    .primaryKeys();
  if (daButtare.length > 0) await db.partite.bulkDelete(daButtare);
}

export async function eliminaPartita(id: string): Promise<void> {
  await db.partite.delete(id);
}

/** Le partite in archivio, dalla piu' recente. `undefined` finche' carica. */
export function usaPartite(): PartitaSalvata[] | undefined {
  return useLiveQuery(
    () => db.partite.orderBy("finita").reverse().toArray(),
    [],
  );
}

/** Una singola partita. `null` se non c'e' (o non c'e' piu'). */
export function usaPartita(id: string | undefined): PartitaSalvata | null | undefined {
  return useLiveQuery(
    async () => (id ? ((await db.partite.get(id)) ?? null) : null),
    [id],
  );
}
