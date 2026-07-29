import { useState } from "react";
import { esportaConBackup, usaStatoBackup } from "../../lib/backup";

/**
 * Avviso discreto che invita a salvare un backup quando ci sono dati non
 * ancora esportati. Compare in cima alle pagine; si puo' chiudere e riappare
 * se nel frattempo vengono registrati nuovi allenamenti.
 */
export function PromemoriaBackup() {
  const stato = usaStatoBackup();
  // Firma dello stato a cui l'utente ha chiuso l'avviso. Include il momento
  // dell'ultimo backup, oltre al conteggio: cosi' dopo un backup (che azzera
  // il conteggio) un nuovo allenamento fa comunque riapparire l'avviso.
  const [chiusoA, setChiusoA] = useState<string | null>(null);
  const [salvataggio, setSalvataggio] = useState(false);

  if (!stato) return null;

  const primoBackup = stato.maiFatto && stato.haQualcosa;
  const daMostrare = primoBackup || stato.allenamentiDaSalvare > 0;
  if (!daMostrare) return null;

  const firma = `${stato.ultimoBackup}:${stato.allenamentiDaSalvare}`;
  if (chiusoA === firma) return null;

  async function salva() {
    setSalvataggio(true);
    try {
      await esportaConBackup();
    } finally {
      setSalvataggio(false);
    }
  }

  const n = stato.allenamentiDaSalvare;
  const messaggio = primoBackup
    ? "Non hai ancora un backup. Salva una copia dei tuoi dati per non rischiare di perderli."
    : `Hai ${n} allenament${n === 1 ? "o" : "i"} non ancora salvat${
        n === 1 ? "o" : "i"
      } in un backup.`;

  return (
    <div className="promemoria-backup" role="status">
      <div className="promemoria-testo">
        <span className="promemoria-icona" aria-hidden="true">💾</span>
        <span>{messaggio}</span>
      </div>
      <div className="promemoria-azioni">
        <button className="bottone piccolo" onClick={salva} disabled={salvataggio}>
          {salvataggio ? "Salvo…" : "Scarica backup"}
        </button>
        <button
          className="promemoria-chiudi"
          aria-label="Chiudi il promemoria"
          onClick={() => setChiusoA(firma)}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
