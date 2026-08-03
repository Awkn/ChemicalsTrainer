/**
 * Nomi doppi sulla bacheca.
 *
 * Due voci con lo stesso nome vengono mostrate come una sola (vedi
 * `unificaPerNome`): serve a non far comparire due volte chi ha reinstallato
 * l'app, ma nasconde anche due persone diverse che si chiamano uguale.
 *
 * Qui c'e' l'avviso che lo dice prima che succeda. Resta una cortesia, non
 * una garanzia: due iscrizioni nello stesso momento da telefoni diversi non
 * si vedono a vicenda. L'unicita' vera andrebbe imposta dal server.
 *
 * Modulo senza Firebase apposta: cosi' anche le pagine che non parlano con la
 * bacheca possono usarlo senza tirarsi dietro la libreria.
 */

/** Confronto tra nomi che ignora maiuscole e spazi in eccesso. */
export function chiaveNome(nome: string | undefined): string {
  return (nome ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Il nome del compagno che usa gia' quello scelto, `null` se e' libero.
 * Torna il nome com'e' scritto sulla bacheca, non come l'ha digitato chi
 * sceglie: e' quello che serve mostrare nell'avviso.
 */
export function nomeInUso(scelto: string, altrui: string[]): string | null {
  const chiave = chiaveNome(scelto);
  if (chiave === "") return null;
  return altrui.find((n) => chiaveNome(n) === chiave) ?? null;
}

/**
 * Avvisa che il nome e' gia' in uso e chiede se procedere comunque.
 * True se si va avanti.
 */
export function confermaNomeDuplicato(nome: string): boolean {
  return confirm(
    `C'è già un compagno che si chiama «${nome.trim()}». Sulla bacheca le vostre due voci verranno mostrate come una sola. Continuare?`,
  );
}
