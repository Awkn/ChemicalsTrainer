import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { squadraConfigurata } from "../../lib/squadra/config";
import {
  ascoltaSquadra,
  rimuoviRiepilogo,
  type VoceSquadra,
} from "../../lib/squadra/client";
import { impostaNomeGiocatore, usaNomeGiocatore } from "../../lib/giocatore";
import { confermaNomeDuplicato, nomeInUso } from "../../lib/squadra/nomeUnico";
import { formattaValore } from "../../components/Grafico";
import type { UnitaMetrica } from "../../types";

export function SquadraPage() {
  // Il nome arriva dallo stato condiviso: sceglierlo qui avvia la
  // pubblicazione sulla bacheca (vedi useSincronizzaSquadra) senza riavvii.
  const nome = usaNomeGiocatore();
  const [bozzaNome, setBozzaNome] = useState("");
  const [voci, setVoci] = useState<VoceSquadra[] | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [statSelezionata, setStatSelezionata] = useState<string>("");
  const [erroreUscita, setErroreUscita] = useState<string | null>(null);
  const [uscendo, setUscendo] = useState(false);
  const [giro, setGiro] = useState(0);

  // Riaprendo la PWA dopo che il sistema l'ha messa a riposo la connessione
  // puo' essere caduta senza che nessuno se ne accorga: si riparte in ascolto,
  // cosi' i dati sono freschi senza dover ricaricare l'app.
  useEffect(() => {
    const alRitorno = () => {
      if (document.visibilityState === "visible") setGiro((g) => g + 1);
    };
    document.addEventListener("visibilitychange", alRitorno);
    return () => document.removeEventListener("visibilitychange", alRitorno);
  }, []);

  useEffect(() => {
    if (!squadraConfigurata()) return;
    return ascoltaSquadra(
      (v) => {
        setVoci(v);
        setErrore(null);
      },
      (e) => setErrore(e.message),
    );
  }, [giro]);

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

  /**
   * Entra in squadra col nome scelto. Se un compagno lo usa gia' lo si dice
   * prima, ma la scelta resta all'utente: gli omonimi veri esistono.
   */
  function entraInSquadra() {
    // Se la bacheca non e' ancora arrivata non c'e' nulla con cui confrontare:
    // si va avanti, l'avviso e' un aiuto, non un lasciapassare.
    const altrui = (voci ?? []).filter((v) => !v.sonoIo).map((v) => v.nome);
    const gia = nomeInUso(bozzaNome, altrui);
    if (gia && !confermaNomeDuplicato(gia)) return;
    impostaNomeGiocatore(bozzaNome);
  }

  /**
   * Toglie la propria voce dalla bacheca. Il nome va cancellato subito dopo:
   * e' quello che tiene accesa la pubblicazione automatica, e senza di lui il
   * documento non verrebbe ricreato al prossimo allenamento. Se la rimozione
   * non riesce (offline, permessi) il nome resta, cosi' si puo' riprovare.
   */
  async function esciDallaSquadra() {
    if (
      !confirm(
        "La tua voce sparirà dalla bacheca dei compagni. I tuoi allenamenti restano su questo dispositivo. Continuare?",
      )
    ) {
      return;
    }
    setUscendo(true);
    setErroreUscita(null);
    try {
      await rimuoviRiepilogo();
      impostaNomeGiocatore("");
      setBozzaNome("");
    } catch (e) {
      setErroreUscita(
        e instanceof Error ? e.message : "Uscita dalla squadra non riuscita.",
      );
    } finally {
      setUscendo(false);
    }
  }

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
            onClick={entraInSquadra}
          >
            Entra nella squadra
          </button>
        </div>
      </section>
    );
  }

  // ---------- bacheca ----------
  // Tra "entra in squadra" e la comparsa della propria riga passa il tempo di
  // scrivere su Firestore: dirlo evita di sembrare fermi (o peggio, di far
  // leggere "ancora nessuno ha pubblicato" a chi si e' appena iscritto).
  const inArrivo = voci !== null && !voci.some((v) => v.sonoIo);

  return (
    <section>
      <Testa />

      {errore && (
        <div className="avviso">
          ⚠️ Non riesco a leggere la bacheca: {errore}
        </div>
      )}

      {voci === null && !errore && <p className="mini">Carico…</p>}

      {inArrivo && (
        <p className="mini">
          <span className="spinner" /> Ti sto pubblicando sulla bacheca…
        </p>
      )}

      {voci && voci.length === 0 && !inArrivo && (
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

      <div className="scheda">
        <h3>La tua identità</h3>
        <p className="mini">
          Sei in squadra come <strong>{nome}</strong>. Lo cambi da{" "}
          <Link to="/impostazioni">Impostazioni → Profilo</Link>.
        </p>
        <button
          className="bottone secondario"
          onClick={esciDallaSquadra}
          disabled={uscendo}
        >
          {uscendo ? "Attendi…" : "Esci dalla squadra"}
        </button>
        <p className="mini">
          Toglie la tua voce dalla bacheca dei compagni. I tuoi allenamenti
          restano su questo dispositivo e puoi rientrare quando vuoi.
        </p>
        {erroreUscita && <p className="esito-ko">⚠️ {erroreUscita}</p>}
      </div>
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
