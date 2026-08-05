/**
 * Condivisione di un testo con le app del telefono.
 *
 * Dove c'e' il foglio di condivisione nativo (iOS e Android) si apre quello,
 * ed e' il caso normale: da li' il risultato finisce nel gruppo della squadra
 * in due tocchi. Sul desktop non c'e' quasi mai, e allora si copia negli
 * appunti: meglio di un pulsante che non fa niente.
 */

export type EsitoCondivisione = "condiviso" | "copiato" | "annullato" | "fallito";

export async function condividiTesto(
  titolo: string,
  testo: string,
): Promise<EsitoCondivisione> {
  if (navigator.share) {
    try {
      await navigator.share({ title: titolo, text: testo });
      return "condiviso";
    } catch (e) {
      // L'utente che chiude il foglio non e' un errore da segnalare.
      if (e instanceof DOMException && e.name === "AbortError") return "annullato";
      // Se il foglio non si apre proprio (permessi, browser strani) si
      // ripiega sugli appunti invece di lasciare il pulsante muto.
    }
  }

  try {
    await navigator.clipboard.writeText(testo);
    return "copiato";
  } catch {
    return "fallito";
  }
}
