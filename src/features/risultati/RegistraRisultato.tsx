import { useMemo, useState } from "react";
import { registraRisultato } from "../../lib/repo";
import { dataIso } from "../../lib/date";
import type { Esercizio, MetricaDef } from "../../types";

interface Props {
  esercizio: Esercizio;
  onChiudi: () => void;
  onSalvato?: () => void;
}

/**
 * Modale per registrare il risultato di un esercizio in una data: un campo
 * per ogni metrica definita. Gli esercizi senza metriche non passano di qui,
 * si segnano con un semplice "fatto" dalla pagina Oggi.
 */
export function RegistraRisultato({ esercizio, onChiudi, onSalvato }: Props) {
  const metriche: MetricaDef[] = useMemo(
    () => esercizio.metriche ?? [],
    [esercizio],
  );

  const [data, setData] = useState(dataIso);
  const [valori, setValori] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [errore, setErrore] = useState<string | null>(null);

  async function salva() {
    const numerici: Record<string, number> = {};
    for (const m of metriche) {
      const grezzo = valori[m.id]?.trim();
      if (!grezzo) continue;
      const n = Number(grezzo.replace(",", "."));
      if (Number.isFinite(n)) numerici[m.id] = n;
    }

    if (Object.keys(numerici).length === 0) {
      setErrore("Inserisci almeno un valore.");
      return;
    }

    await registraRisultato({
      esercizioId: esercizio.id,
      data,
      valori: numerici,
      note: note.trim() || undefined,
    });
    onSalvato?.();
    onChiudi();
  }

  return (
    <div className="modale-sfondo" onClick={onChiudi}>
      <div className="modale" onClick={(e) => e.stopPropagation()}>
        <h3>Registra risultato</h3>
        <p className="mini">{esercizio.nome}</p>

        <label className="campo">
          <span>Data</span>
          <input
            type="date"
            value={data}
            max={dataIso()}
            onChange={(e) => setData(e.target.value)}
          />
        </label>

        {metriche.map((m) => (
          <label className="campo" key={m.id}>
            <span>
              {m.nome}
              {m.unita === "percentuale" ? " (%)" : ""}
              {m.obiettivo != null
                ? ` · obiettivo ${m.verso === "basso" ? "≤" : "≥"} ${m.obiettivo}`
                : ""}
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={valori[m.id] ?? ""}
              onChange={(e) =>
                setValori({ ...valori, [m.id]: e.target.value })
              }
              placeholder="—"
            />
          </label>
        ))}

        <label className="campo">
          <span>Note (opzionale)</span>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Sensazioni, condizioni…"
          />
        </label>

        {errore && <p className="esito-ko">⚠️ {errore}</p>}

        <div className="modale-azioni">
          <button className="bottone secondario" onClick={onChiudi}>
            Annulla
          </button>
          <button className="bottone" onClick={salva}>
            Salva
          </button>
        </div>
      </div>
    </div>
  );
}
