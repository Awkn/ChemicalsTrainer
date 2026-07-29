import { useState } from "react";
import { Link } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";
import {
  aggiornaAssegnazione,
  assegnaEsercizio,
  eliminaProgramma,
  nuovoProgramma,
  rimuoviAssegnazione,
} from "../../lib/repo";
import { GIORNI, type Giorno } from "../../types";
import { useProgrammaAttivo } from "../../lib/useProgrammaAttivo";

export function ProgrammaPage() {
  const { programmi, attivo, seleziona } = useProgrammaAttivo();
  const esercizi = useLiveQuery(
    () => db.esercizi.orderBy("nome").toArray(),
    [],
  );

  // Tutte le assegnazioni del programma attivo, raggruppate per giorno.
  const assegnazioni = useLiveQuery(async () => {
    if (!attivo) return [];
    const asg = await db.assegnazioni
      .where("programmaId")
      .equals(attivo.id)
      .toArray();
    asg.sort((a, b) => a.ordine - b.ordine);
    return asg;
  }, [attivo?.id]);

  async function creaProgramma() {
    const nome = prompt("Nome del nuovo programma:");
    if (!nome?.trim()) return;
    const id = await nuovoProgramma({ nome: nome.trim() });
    seleziona(id);
  }

  async function rinomina() {
    if (!attivo) return;
    const nome = prompt("Nuovo nome:", attivo.nome);
    if (!nome?.trim()) return;
    await db.programmi.update(attivo.id, { nome: nome.trim() });
  }

  async function elimina() {
    if (!attivo) return;
    if (confirm(`Eliminare il programma "${attivo.nome}"?`)) {
      await eliminaProgramma(attivo.id);
    }
  }

  const perGiorno = (g: Giorno) =>
    assegnazioni?.filter((a) => a.giorno === g) ?? [];

  const nomeEsercizio = (id: string) =>
    esercizi?.find((e) => e.id === id)?.nome ?? "(esercizio eliminato)";

  return (
    <section>
      <div className="pagina-testa">
        <div>
          <p className="occhiello">Pianificazione</p>
          <h2>Programma settimanale</h2>
        </div>
        <button className="bottone" onClick={creaProgramma}>
          + Programma
        </button>
      </div>

      {programmi.length === 0 && (
        <div className="vuoto">
          <p>Crea il tuo primo programma per iniziare a pianificare.</p>
          <button className="bottone" onClick={creaProgramma}>
            Crea programma
          </button>
        </div>
      )}

      {attivo && (
        <>
          <div className="programma-barra">
            <select
              value={attivo.id}
              onChange={(e) => seleziona(e.target.value)}
            >
              {programmi.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
            <button className="icona-btn" title="Rinomina" onClick={rinomina}>
              ✏️
            </button>
            <button className="icona-btn" title="Elimina" onClick={elimina}>
              🗑️
            </button>
          </div>

          {esercizi?.length === 0 && (
            <div className="avviso">
              Non hai ancora esercizi.{" "}
              <Link to="/esercizi">Creane qualcuno</Link> per poterli assegnare
              ai giorni.
            </div>
          )}

          <div className="settimana">
            {GIORNI.map((g) => (
              <GiornoCard
                key={g.valore}
                giorno={g.valore}
                nome={g.nome}
                assegnazioni={perGiorno(g.valore)}
                nomeEsercizio={nomeEsercizio}
                esercizi={esercizi ?? []}
                programmaId={attivo.id}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

interface GiornoCardProps {
  giorno: Giorno;
  nome: string;
  assegnazioni: { id: string; esercizioId: string; note?: string }[];
  nomeEsercizio: (id: string) => string;
  esercizi: { id: string; nome: string }[];
  programmaId: string;
}

function GiornoCard({
  giorno,
  nome,
  assegnazioni,
  nomeEsercizio,
  esercizi,
  programmaId,
}: GiornoCardProps) {
  const [selezione, setSelezione] = useState("");

  async function aggiungi() {
    if (!selezione) return;
    await assegnaEsercizio(programmaId, giorno, selezione);
    setSelezione("");
  }

  return (
    <div className={`giorno-card ${assegnazioni.length ? "" : "giorno-vuoto"}`}>
      <h3>{nome}</h3>

      <ul className="giorno-lista">
        {assegnazioni.map((a) => (
          <li key={a.id} className="giorno-item">
            <div className="giorno-item-testa">
              <span>{nomeEsercizio(a.esercizioId)}</span>
              <button
                className="icona-btn mini-btn"
                title="Rimuovi"
                onClick={() => rimuoviAssegnazione(a.id)}
              >
                ✕
              </button>
            </div>
            <input
              className="nota-input"
              defaultValue={a.note ?? ""}
              placeholder="Nota / obiettivo per oggi (opzionale)"
              onBlur={(e) =>
                aggiornaAssegnazione(a.id, {
                  note: e.target.value.trim() || undefined,
                })
              }
            />
          </li>
        ))}
        {assegnazioni.length === 0 && (
          <li className="giorno-riposo">Riposo</li>
        )}
      </ul>

      {esercizi.length > 0 && (
        <div className="aggiungi-riga">
          <select
            value={selezione}
            onChange={(e) => setSelezione(e.target.value)}
          >
            <option value="">+ Aggiungi esercizio…</option>
            {esercizi.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
          <button
            className="bottone piccolo"
            disabled={!selezione}
            onClick={aggiungi}
          >
            Ok
          </button>
        </div>
      )}
    </div>
  );
}
