import { useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";
import { formattaValore } from "../../components/Grafico";
import {
  calcolaObiettivi,
  conteggio,
  distanza,
  inizioFinestra,
  type RigaObiettivo,
} from "../../lib/obiettivi";

/** Finestre di lettura. Trenta giorni: un mese di allenamenti sta dentro. */
const PERIODI = [
  { giorni: 7, nome: "7 giorni" },
  { giorni: 30, nome: "30 giorni" },
  { giorni: 90, nome: "90 giorni" },
];

/**
 * Le soglie che ti sei dato, tutte insieme: quali stai rispettando e quanto
 * manca alle altre. Sta in cima ai Progressi perche' risponde alla domanda
 * con cui si apre la pagina — "come sto andando?" — prima dei grafici, che
 * rispondono a "come sto andando su questo".
 */
export function CruscottoObiettivi() {
  const [giorni, setGiorni] = useState(30);

  const dati = useLiveQuery(
    async () => {
      const [esercizi, risultati] = await Promise.all([
        db.esercizi.toArray(),
        db.risultati.toArray(),
      ]);
      return calcolaObiettivi(esercizi, risultati, inizioFinestra(giorni));
    },
    [giorni],
  );

  if (!dati) return null;

  // Nessuna metrica ha una soglia: niente da giudicare, ma la porta per
  // impostarne una deve restare aperta, o non ci si arriverebbe piu'.
  if (dati.length === 0) {
    return (
      <div className="scheda">
        <h3>🏁 Obiettivi</h3>
        <p className="mini">
          Non hai soglie impostate. Dandoti un traguardo su una metrica, qui
          vedrai a colpo d'occhio se lo stai rispettando.
        </p>
        <Link className="bottone secondario" to="/obiettivi">
          Imposta le soglie
        </Link>
      </div>
    );
  }

  const misurate = dati.filter((r) => r.media != null);
  const mai = dati.filter((r) => r.media == null);
  const { raggiunti, misurati } = conteggio(dati);

  return (
    <div className="scheda">
      <div className="metrica-testa">
        <h3>🏁 Obiettivi</h3>
        {misurati > 0 && (
          <div className="metrica-valore">
            <strong>
              {raggiunti}/{misurati}
            </strong>
          </div>
        )}
      </div>

      {/* La voglia di ritoccare una soglia viene guardando il cruscotto:
          la scorciatoia sta qui, non sepolta nelle impostazioni. */}
      <Link className="mini obi-modifica" to="/obiettivi">
        ⚙️ Modifica le soglie
      </Link>

      <div className="imp-segmento obi-periodo">
        {PERIODI.map((p) => (
          <button
            key={p.giorni}
            className={giorni === p.giorni ? "attivo" : ""}
            onClick={() => setGiorni(p.giorni)}
          >
            {p.nome}
          </button>
        ))}
      </div>

      {misurate.length === 0 ? (
        <p className="mini">
          In questo periodo non hai registrato nessuna delle metriche con un
          obiettivo. Allarga il periodo o registra una sessione.
        </p>
      ) : (
        <>
          <p className="mini">
            {raggiunti === misurati
              ? "Le rispetti tutte. 🎯"
              : `Rispetti ${raggiunti} soglie su ${misurati} misurate negli ultimi ${giorni} giorni.`}
          </p>
          <ul className="obi-lista">
            {misurate.map((r) => (
              <Riga key={r.chiave} riga={r} />
            ))}
          </ul>
        </>
      )}

      {mai.length > 0 && (
        <details className="obi-mancanti">
          <summary>Non misurate in questo periodo ({mai.length})</summary>
          <ul className="obi-lista">
            {mai.map((r) => (
              <li key={r.chiave} className="obi-riga vuota">
                <div className="obi-intestazione">
                  <span className="obi-nome">{r.metrica.nome}</span>
                  <span className="mini">
                    obiettivo {segno(r)}
                    {formattaValore(r.obiettivo, r.metrica.unita)}
                  </span>
                </div>
                <span className="mini obi-esercizio">{r.esercizio}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/** "≥" o "≤" secondo il verso della metrica. */
function segno(r: RigaObiettivo): string {
  return r.metrica.verso === "basso" ? "≤ " : "≥ ";
}

/**
 * Quanto sei vicino alla soglia, da 0 a 1. Per le metriche in cui meno e'
 * meglio il rapporto si rovescia, cosi' la barra si legge allo stesso modo:
 * piena = ci sei.
 */
function riempimento(r: RigaObiettivo): number {
  if (r.media == null || r.obiettivo === 0) return 0;
  const quota =
    r.metrica.verso === "basso"
      ? r.media === 0
        ? 1
        : r.obiettivo / r.media
      : r.media / r.obiettivo;
  return Math.max(0, Math.min(1, quota));
}

function Riga({ riga }: { riga: RigaObiettivo }) {
  const unita = riga.metrica.unita;
  const manca = distanza(riga);

  return (
    <li className={riga.raggiunto ? "obi-riga ok" : "obi-riga ko"}>
      <div className="obi-intestazione">
        <span className="obi-nome">
          {riga.raggiunto ? "✅" : "🎯"} {riga.metrica.nome}
        </span>
        <span className="obi-valore">
          {formattaValore(riga.media!, unita)}
        </span>
      </div>

      <div className="obi-barra">
        <span style={{ width: `${riempimento(riga) * 100}%` }} />
      </div>

      <div className="obi-piede">
        <span className="mini obi-esercizio">
          {riga.esercizio} · {riga.sessioni}{" "}
          {riga.sessioni === 1 ? "volta" : "volte"}
          {riga.migliore != null &&
            riga.sessioni > 1 &&
            ` · meglio ${formattaValore(riga.migliore, unita)}`}
        </span>
        <span className="mini">
          {riga.raggiunto
            ? `obiettivo ${segno(riga)}${formattaValore(riga.obiettivo, unita)}`
            : `ti manca ${formattaValore(manca, unita)}`}
        </span>
      </div>
    </li>
  );
}
