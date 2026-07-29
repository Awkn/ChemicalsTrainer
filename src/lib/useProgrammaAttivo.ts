import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";

const CHIAVE = "darts-trainer:programmaAttivo";

/**
 * Gestisce quale programma e' "attivo" (quello mostrato nella pagina Oggi).
 * L'id resta salvato in localStorage; se il programma sparisce si ripiega
 * automaticamente sul primo disponibile.
 */
export function useProgrammaAttivo() {
  const programmi = useLiveQuery(
    () => db.programmi.orderBy("createdAt").toArray(),
    [],
  );
  const [idSalvato, setIdSalvato] = useState<string | null>(() =>
    localStorage.getItem(CHIAVE),
  );

  // Se l'id salvato non corrisponde a nessun programma, usa il primo.
  const idValido =
    programmi?.some((p) => p.id === idSalvato) ? idSalvato : programmi?.[0]?.id ?? null;

  useEffect(() => {
    if (idValido && idValido !== idSalvato) {
      localStorage.setItem(CHIAVE, idValido);
      setIdSalvato(idValido);
    }
  }, [idValido, idSalvato]);

  function seleziona(id: string) {
    localStorage.setItem(CHIAVE, id);
    setIdSalvato(id);
  }

  const attivo = programmi?.find((p) => p.id === idValido) ?? null;

  return { programmi: programmi ?? [], attivo, seleziona };
}
