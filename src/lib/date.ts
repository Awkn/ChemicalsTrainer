import type { Giorno } from "../types";

/**
 * Converte il giorno JS (Date.getDay(): 0 = Domenica ... 6 = Sabato)
 * nella nostra convenzione europea (0 = Lunedi ... 6 = Domenica).
 */
export function giornoDiOggi(data: Date = new Date()): Giorno {
  const js = data.getDay(); // 0 = Domenica
  return ((js + 6) % 7) as Giorno;
}

/**
 * Data in formato "YYYY-MM-DD" secondo il fuso ORARIO LOCALE.
 * Non usare toISOString(): converte in UTC e a inizio giornata (in Italia
 * fino alle 01:00/02:00) restituirebbe il giorno precedente.
 */
export function dataIso(data: Date = new Date()): string {
  const anno = data.getFullYear();
  const mese = String(data.getMonth() + 1).padStart(2, "0");
  const giorno = String(data.getDate()).padStart(2, "0");
  return `${anno}-${mese}-${giorno}`;
}
