import { useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { squadraConfigurata } from "./config";
import {
  backupCloudAttivo,
  firmaBackup,
  setFirmaBackup,
} from "./backupStato";

/**
 * Se il backup nel cloud e' attivo, ripubblica l'intero database poco dopo un
 * cambiamento (con debounce, come la sincronizzazione della bacheca). Non fa
 * nulla — e non carica Firebase — se il backup non e' attivo.
 */
export function useBackupAutomatico(): void {
  // Firma dei dati: cambia a ogni inserimento/modifica/rimozione.
  const firma = useLiveQuery(async () => {
    const [esercizi, programmi, assegnazioni, risultati] = await Promise.all([
      db.esercizi.count(),
      db.programmi.count(),
      db.assegnazioni.count(),
      db.risultati.toArray(),
    ]);
    const ultimo = risultati.reduce((m, r) => Math.max(m, r.createdAt), 0);
    return `${esercizi}:${programmi}:${assegnazioni}:${risultati.length}:${ultimo}`;
  }, []);

  const inCorso = useRef(false);

  useEffect(() => {
    if (!squadraConfigurata() || !backupCloudAttivo() || firma === undefined) {
      return;
    }
    // Gia' allineato (anche tra sessioni diverse): niente da ricaricare.
    if (firmaBackup() === firma || inCorso.current) return;

    const timer = setTimeout(async () => {
      inCorso.current = true;
      try {
        // Firebase si carica solo qui, se il backup e' attivo e c'e' da salvare.
        const { backupOra } = await import("./backupCloud");
        await backupOra();
        setFirmaBackup(firma);
      } catch (e) {
        // offline o permessi: si riprovera' al prossimo cambiamento
        console.warn("Backup cloud automatico non riuscito:", e);
      } finally {
        inCorso.current = false;
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [firma]);
}
