import { useEffect, useMemo, useState } from "react";
import { squadraConfigurata } from "../../lib/squadra/config";
import { ascoltaSquadra, type VoceSquadra } from "../../lib/squadra/client";
import { impostaNomeGiocatore, nomeGiocatore } from "../../lib/giocatore";
import { formattaValore } from "../../components/Grafico";
import type { UnitaMetrica } from "../../types";

export function SquadraPage() {
  const [nome, setNome] = useState(() => nomeGiocatore());
  const [bozzaNome, setBozzaNome] = useState("");
  const [voci, setVoci] = useState<VoceSquadra[] | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [statSelezionata, setStatSelezionata] = useState<string>("");

  useEffect(() => {
    if (!squadraConfigurata()) return;
    return ascoltaSquadra(
      (v) => {
        setVoci(v);
        setErrore(null);
      },
      (e) => setErrore(e.message),
    );
  }, []);

  // Elenco delle statistiche disponibili, unendo quelle di tutti i giocatori.
  const statistiche = useMemo(() => {
    const mappa = new Map<
      string,
      { esercizio: string; metrica: string; unita: UnitaMetrica; verso: string }
    >();
    for (const v of voci ?? []) {
      for (const s of v.statistiche ?? []) {
        mappa.set(`${s.esercizio} · ${s.metrica}`, s);
      }
    }
    return [...mappa.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [voci]);

  const chiaveAttiva =
    statistiche.find(([k]) => k === statSelezionata)?.[0] ??
    statistiche[0]?.[0] ??
    "";

  const classifica = useMemo(() => {
    if (!chiaveAttiva) return [];
    const def = statistiche.find(([k]) => k === chiaveAttiva)?.[1];
    if (!def) return [];
    const righe = (voci ?? [])
      .map((v) => {
        const s = (v.statistiche ?? []).find(
          (x) => `${x.esercizio} · ${x.metrica}` === chiaveAttiva,
        );
        return s ? { voce: v, migliore: s.migliore, ultimo: s.ultimo } : null;
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
    righe.sort((a, b) =>
      def.verso === "basso"
        ? a.migliore - b.migliore
        : b.migliore - a.migliore,
    );
    return righe.map((r, i) => ({ ...r, posizione: i + 1, unita: def.unita }));
  }, [voci, chiaveAttiva, statistiche]);

  // ---------- non configurata ----------
  if (!squadraConfigurata()) {
    return (
      <section>
        <Testa />
        <div className="vuoto">
          <p>
            La bacheca di squadra non è ancora attiva. Quando sarà collegata,
            qui vedrai le statistiche dei tuoi compagni. 👥
          </p>
        </div>
      </section>
    );
  }

  // ---------- nome non ancora scelto ----------
  if (!nome) {
    return (
      <section>
        <Testa />
        <div className="scheda">
          <h3>Come ti chiami?</h3>
          <p className="mini">
            Il nome che vedranno i compagni in classifica. Finché non lo
            scegli, i tuoi dati non vengono pubblicati.
          </p>
          <label className="campo">
            <span>Nome</span>
            <input
              value={bozzaNome}
              maxLength={24}
              onChange={(e) => setBozzaNome(e.target.value)}
              placeholder="Es. Andrea"
            />
          </label>
          <button
            className="bottone"
            disabled={!bozzaNome.trim()}
            onClick={() => {
              impostaNomeGiocatore(bozzaNome);
              setNome(nomeGiocatore());
            }}
          >
            Entra nella squadra
          </button>
        </div>
      </section>
    );
  }

  // ---------- bacheca ----------
  return (
    <section>
      <Testa />

      {errore && (
        <div className="avviso">
          ⚠️ Non riesco a leggere la bacheca: {errore}
        </div>
      )}

      {voci === null && !errore && <p className="mini">Carico…</p>}

      {voci && voci.length === 0 && (
        <div className="vuoto">
          <p>
            Ancora nessuno ha pubblicato. Registra un risultato e comparirai
            qui: i compagni vedranno la classifica aggiornarsi. 🎯
          </p>
        </div>
      )}

      {voci && voci.length > 0 && (
        <>
          <div className="scheda">
            <h3>Attività</h3>
            <ul className="lista-squadra">
              {[...voci]
                .sort((a, b) => (b.sessioni30gg ?? 0) - (a.sessioni30gg ?? 0))
                .map((v) => (
                  <li key={v.id} className="riga-squadra">
                    <span className={v.sonoIo ? "nome-gioc io" : "nome-gioc"}>
                      {v.nome}
                      {v.sonoIo && <span className="badge-io">tu</span>}
                    </span>
                    <span className="mini">
                      {v.sessioni30gg ?? 0} sessioni · ultima{" "}
                      {v.ultimoAllenamento
                        ? v.ultimoAllenamento.split("-").reverse().join("/")
                        : "—"}
                    </span>
                  </li>
                ))}
            </ul>
          </div>

          {statistiche.length > 0 && (
            <div className="scheda">
              <h3>Classifica</h3>
              <label className="campo">
                <span>Statistica</span>
                <select
                  value={chiaveAttiva}
                  onChange={(e) => setStatSelezionata(e.target.value)}
                >
                  {statistiche.map(([k]) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </label>

              <ul className="lista-squadra">
                {classifica.map((r) => (
                  <li key={r.voce.id} className="riga-squadra">
                    <span className={r.voce.sonoIo ? "nome-gioc io" : "nome-gioc"}>
                      <span className="posizione">{r.posizione}</span>
                      {r.voce.nome}
                      {r.voce.sonoIo && <span className="badge-io">tu</span>}
                    </span>
                    <span className="valore-classifica">
                      {formattaValore(r.migliore, r.unita)}
                      <span className="mini"> (ultimo {formattaValore(r.ultimo, r.unita)})</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Testa() {
  return (
    <div className="pagina-testa">
      <div>
        <p className="occhiello">Bacheca</p>
        <h2>Squadra</h2>
      </div>
    </div>
  );
}

// default export: consente il caricamento su richiesta (vedi App.tsx),
// cosi' la libreria Firebase non pesa sull'avvio dell'app.
export default SquadraPage;
