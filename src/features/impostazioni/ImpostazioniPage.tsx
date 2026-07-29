import { useRef, useState } from "react";
import { importaBundle } from "../../lib/exportImport";
import { esportaConBackup, usaStatoBackup } from "../../lib/backup";

export function ImpostazioniPage() {
  const inputFile = useRef<HTMLInputElement>(null);
  const [esito, setEsito] = useState<string | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const stato = usaStatoBackup();

  const ultimoBackupTesto =
    stato && !stato.maiFatto
      ? new Date(stato.ultimoBackup).toLocaleString("it-IT", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEsito(null);
    setErrore(null);
    try {
      const testo = await file.text();
      const r = await importaBundle(testo);
      setEsito(
        `Importati ${r.programmiImportati} programmi e ${r.eserciziImportati} esercizi.`,
      );
    } catch (err) {
      setErrore(err instanceof Error ? err.message : "Errore durante l'import.");
    } finally {
      // reset cosi' si puo' reimportare lo stesso file
      if (inputFile.current) inputFile.current.value = "";
    }
  }

  return (
    <section>
      <div className="pagina-testa">
        <div>
          <p className="occhiello">Dati</p>
          <h2>Condividi e salva</h2>
        </div>
      </div>

      <div className="scheda">
        <h3>📤 Esporta</h3>
        <p className="mini">
          Scarica un file con tutti i tuoi programmi ed esercizi. Passalo ai
          compagni (WhatsApp, email…) e loro lo importano qui.
        </p>
        <button className="bottone" onClick={() => esportaConBackup()}>
          Scarica file di backup
        </button>
        <p className="mini">
          {ultimoBackupTesto
            ? `Ultimo backup: ${ultimoBackupTesto}`
            : "Non hai ancora fatto un backup."}
        </p>
      </div>

      <div className="scheda">
        <h3>📥 Importa</h3>
        <p className="mini">
          Carica un file ricevuto da un compagno. I dati vengono aggiunti ai
          tuoi (nulla viene sovrascritto).
        </p>
        <input
          ref={inputFile}
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          hidden
        />
        <button
          className="bottone secondario"
          onClick={() => inputFile.current?.click()}
        >
          Scegli file da importare
        </button>
        {esito && <p className="esito-ok">✅ {esito}</p>}
        {errore && <p className="esito-ko">⚠️ {errore}</p>}
      </div>

      <div className="scheda">
        <h3>ℹ️ Info</h3>
        <p className="mini">
          I dati restano salvati solo su questo dispositivo (nel browser). Usa
          l'esportazione per non perderli o per spostarli su un altro
          telefono/PC.
        </p>
      </div>
    </section>
  );
}
