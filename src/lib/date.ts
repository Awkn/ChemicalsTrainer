import type { Giorno } from "../types";

/**
 * Converte il giorno JS (Date.getDay(): 0 = Domenica ... 6 = Sabato)
 * nella nostra convenzione europea (0 = Lunedi ... 6 = Domenica).
 */
export function giornoDiOggi(data: Date = new Date()): Giorno {
  const js = data.getDay(); // 0 = Domenica
  return ((js + 6) % 7) as Giorno;
}
