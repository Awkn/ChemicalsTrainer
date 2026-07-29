import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";
import {
  aggiornaEsercizio,
  eliminaEsercizio,
  nuovoEsercizio,
} from "../../lib/repo";
import { CATEGORIE, type Categoria, type Esercizio } from "../../types";

const vuoto = {
  nome: "",
  categoria: "Scoring" as Categoria,
  descrizione: "",
  obiettivo: "",
  durata: "",
};

export function EserciziPage() {
  const esercizi = useLiveQuery(
    () => db.esercizi.orderBy("nome").toArray(),
    [],
  );
  const [inModifica, setInModifica] = useState<Esercizio | null>(null);
  const [form, setForm] = useState(vuoto);

  function apriNuovo() {
    setInModifica(null);
    setForm(vuoto);
    setAperto(true);
  }

  function apriModifica(e: Esercizio) {
    setInModifica(e);
    setForm({
      nome: e.nome,
      categoria: e.categoria,
      descrizione: e.descrizione,
      obiettivo: e.obiettivo ?? "",
      durata: e.durataMin != null ? String(e.durataMin) : "",
    });
    setAperto(true);
  }

  const [aperto, setAperto] = useState(false);

  async function salva() {
    if (!form.nome.trim()) return;
    const durataNum = parseInt(form.durata, 10);
    const dati = {
      nome: form.nome.trim(),
      categoria: form.categoria,
      descrizione: form.descrizione.trim(),
      obiettivo: form.obiettivo.trim() || undefined,
      durataMin: Number.isFinite(durataNum) && durataNum > 0 ? durataNum : undefined,
    };
    if (inModifica) {
      await aggiornaEsercizio(inModifica.id, dati);
    } else {
      await nuovoEsercizio(dati);
    }
    setAperto(false);
  }

  async function elimina(e: Esercizio) {
    if (
      confirm(
        `Eliminare "${e.nome}"? Verra' rimosso anche da tutti i programmi.`,
      )
    ) {
      await eliminaEsercizio(e.id);
    }
  }

  return (
    <section>
      <div className="pagina-testa">
        <div>
          <p className="occhiello">Libreria</p>
          <h2>Esercizi</h2>
        </div>
        <button className="bottone" onClick={apriNuovo}>
          + Nuovo
        </button>
      </div>

      {esercizi?.length === 0 && (
        <div className="vuoto">
          <p>Nessun esercizio in libreria.</p>
        </div>
      )}

      <ul className="lista-esercizi">
        {esercizi?.map((e) => (
          <li key={e.id} className="esercizio-riga">
            <div className="esercizio-info">
              <span className={`tag tag-${slug(e.categoria)}`}>
                {e.categoria}
              </span>
              <div>
                <h3>{e.nome}</h3>
                {e.obiettivo && <p className="mini">🎯 {e.obiettivo}</p>}
              </div>
            </div>
            <div className="azioni">
              <button className="icona-btn" onClick={() => apriModifica(e)}>
                ✏️
              </button>
              <button className="icona-btn" onClick={() => elimina(e)}>
                🗑️
              </button>
            </div>
          </li>
        ))}
      </ul>

      {aperto && (
        <div className="modale-sfondo" onClick={() => setAperto(false)}>
          <div className="modale" onClick={(ev) => ev.stopPropagation()}>
            <h3>{inModifica ? "Modifica esercizio" : "Nuovo esercizio"}</h3>

            <label className="campo">
              <span>Nome</span>
              <input
                value={form.nome}
                autoFocus
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Es. Scoring 100+"
              />
            </label>

            <label className="campo">
              <span>Categoria</span>
              <select
                value={form.categoria}
                onChange={(e) =>
                  setForm({ ...form, categoria: e.target.value as Categoria })
                }
              >
                {CATEGORIE.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="campo">
              <span>Descrizione</span>
              <textarea
                value={form.descrizione}
                rows={3}
                onChange={(e) =>
                  setForm({ ...form, descrizione: e.target.value })
                }
                placeholder="Come si svolge l'esercizio"
              />
            </label>

            <label className="campo">
              <span>Obiettivo (opzionale)</span>
              <input
                value={form.obiettivo}
                onChange={(e) =>
                  setForm({ ...form, obiettivo: e.target.value })
                }
                placeholder="Es. 10 tirate, media > 60"
              />
            </label>

            <label className="campo">
              <span>Durata in minuti (opzionale)</span>
              <input
                type="number"
                min={1}
                value={form.durata}
                onChange={(e) => setForm({ ...form, durata: e.target.value })}
                placeholder="Es. 15"
              />
            </label>

            <div className="modale-azioni">
              <button
                className="bottone secondario"
                onClick={() => setAperto(false)}
              >
                Annulla
              </button>
              <button className="bottone" onClick={salva}>
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z]/g, "");
}
