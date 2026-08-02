import { ListaDoppi } from "../../components/ListaDoppi";
import { percentualeDoppi } from "../../lib/doppi";
import { usaStoricoDoppi } from "../../lib/doppiStorico";

const GIORNI = 90;
/** Tentativi minimi perche' un bersaglio entri in classifica. */
const MINIMO = 5;

/**
 * Resa su ogni doppio negli ultimi mesi, sommando tutte le sessioni giocate
 * con l'input a bersaglio. A differenza del recap di fine partita qui i numeri
 * sono abbastanza da fidarsi: e' questo il dato che dice su cosa allenarsi.
 */
export function SchedaDoppi() {
  const storico = usaStoricoDoppi(GIORNI, MINIMO);
  if (!storico.caricato) return null;

  // Nessun tentativo registrato: si spiega come ottenerli, senza ingombrare.
  if (storico.totale.tentativi === 0) {
    return (
      <div className="scheda">
        <h3>🎯 I tuoi doppi</h3>
        <p className="mini">
          Giocando con l'input a bersaglio l'app conta quante volte centri il
          doppio avendolo davvero davanti, e ti dice su quale sei più debole.
          Attivalo col pulsante 🎯 durante una partita.
        </p>
      </div>
    );
  }

  const { totale, classifica, peggiore, sessioni } = storico;

  return (
    <div className="scheda">
      <div className="metrica-testa">
        <h3>🎯 I tuoi doppi</h3>
        <div className="metrica-valore">
          <strong>{percentualeDoppi(totale)}%</strong>
        </div>
      </div>
      <p className="mini">
        {totale.colpiti} centri su {totale.tentativi} tentativi · {sessioni}{" "}
        {sessioni === 1 ? "sessione" : "sessioni"} negli ultimi {GIORNI} giorni.
      </p>

      {peggiore && (
        <p className="doppio-debole">
          Punto debole: <strong>{peggiore.doppio}</strong> ·{" "}
          {peggiore.percentuale}% ({peggiore.conto.colpiti}/
          {peggiore.conto.tentativi})
        </p>
      )}

      {classifica.length > 0 ? (
        <ListaDoppi righe={classifica} />
      ) : (
        <p className="mini">
          Ancora pochi tentativi per bersaglio: servono almeno {MINIMO} tiri sullo
          stesso doppio perché la percentuale voglia dire qualcosa.
        </p>
      )}
    </div>
  );
}
