import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";
import { calcolaRecord } from "../../lib/record";
import { formattaValore } from "../../components/Grafico";

/** Giorno in cui e' stato fatto il record, es. "5 ago 2026". */
function quando(iso: string): string {
  const [a, m, g] = iso.split("-").map(Number);
  return new Date(a, m - 1, g).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * I personal best: il valore migliore di sempre per ogni metrica di ogni
 * esercizio giocato. Chi non ha ancora giocato non compare, e se non hai
 * giocato a niente la scheda non c'e' proprio: una bacheca vuota non dice
 * niente a nessuno.
 */
export function SchedaRecord() {
  const righe = useLiveQuery(async () => {
    const [esercizi, risultati] = await Promise.all([
      db.esercizi.toArray(),
      db.risultati.toArray(),
    ]);
    return calcolaRecord(esercizi, risultati);
  }, []);

  if (!righe || righe.length === 0) return null;

  return (
    <div className="scheda">
      <h3>🏅 Personal bests</h3>
      <p className="mini">
        Il tuo risultato migliore di sempre, gioco per gioco. Su tutto lo
        storico: un record resta tale anche se è di mesi fa.
      </p>

      {righe.map((r) => (
        <div className="pb-gioco" key={r.esercizioId}>
          <div className="pb-testa">
            <strong>{r.esercizio}</strong>
            <span className="mini">
              {r.sessioni} {r.sessioni === 1 ? "sessione" : "sessioni"}
            </span>
          </div>
          <ul className="pb-lista">
            {r.record.map((x) => (
              <li key={x.metrica.id}>
                {/* Quante volte l'hai eguagliato sta con il nome, non con la
                    data: le due colonne di destra restano larghe uguali e i
                    valori si leggono incolonnati. */}
                <span className="pb-metrica">
                  {x.metrica.nome}
                  {x.volte > 1 ? ` · ${x.volte} volte` : ""}
                </span>
                <strong className="pb-valore">
                  {formattaValore(x.valore, x.metrica.unita)}
                </strong>
                <span className="mini pb-quando">{quando(x.data)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
