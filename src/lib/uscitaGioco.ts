import { useNavigate } from "react-router-dom";

/**
 * Uscita da un gioco, con conferma quando c'e' qualcosa da perdere.
 *
 * Le sessioni vivono solo nella memoria del componente: uscire a meta' butta
 * via tutto senza salvare nulla, e la ✕ sta a un dito di distanza dai pulsanti
 * che si premono in continuazione. La conferma si chiede solo a partita
 * iniziata, altrimenti sarebbe un intralcio a vuoto.
 */
export function usaUscitaGioco(): (dove: string, inCorso: boolean) => void {
  const navigate = useNavigate();

  return (dove, inCorso) => {
    if (
      inCorso &&
      !confirm("La sessione in corso andrà persa: non è ancora stata salvata. Uscire?")
    ) {
      return;
    }
    navigate(dove);
  };
}
