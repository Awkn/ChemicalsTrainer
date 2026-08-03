import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { importaBundle } from "../../lib/exportImport";
import { esportaConBackup, usaStatoBackup } from "../../lib/backup";
import {
  formattaCodice,
  usaStatoBackupCloud,
} from "../../lib/squadra/backupStato";
import { squadraConfigurata } from "../../lib/squadra/config";
import { impostaNomeGiocatore, usaNomeGiocatore } from "../../lib/giocatore";
import { confermaNomeDuplicato, nomeInUso } from "../../lib/squadra/nomeUnico";
import { setTema, usaTema } from "../../lib/tema";
import { setModoInput, usaModoInput } from "../input/preferenza";

function dataOra(ms: number): string {
  return new Date(ms).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ImpostazioniPage() {
  const inputFile = useRef<HTMLInputElement>(null);
  const [esito, setEsito] = useState<string | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const stato = usaStatoBackup();
  const temaAttuale = usaTema();
  const modoInput = usaModoInput();

  // ---------- Profilo ----------
  const nome = usaNomeGiocatore();
  // `null` = non ancora modificato, quindi si mostra il nome vero. Cosi' il
  // campo segue il nome anche se cambia altrove, senza doverlo risincronizzare.
  const [bozzaNome, setBozzaNome] = useState<string | null>(null);
  const [nomeCambiato, setNomeCambiato] = useState(false);
  const [controlloNome, setControlloNome] = useState(false);
  const nomeInCampo = bozzaNome ?? nome ?? "";
  const puoSalvareNome =
    nomeInCampo.trim().length > 0 && nomeInCampo.trim() !== nome;

  /**
   * Rinomina il profilo. A differenza della bacheca qui l'elenco dei compagni
   * non c'e', quindi lo si legge al momento: una lettura sola, solo quando si
   * rinomina davvero, cosi' Firebase non pesa sull'apertura di questa pagina.
   */
  async function salvaNome() {
    const scelto = nomeInCampo.trim();
    setControlloNome(true);
    try {
      const { nomiAltrui } = await import("../../lib/squadra/client");
      const gia = nomeInUso(scelto, await nomiAltrui());
      if (gia && !confermaNomeDuplicato(gia)) return;
    } catch {
      // bacheca non raggiungibile: l'avviso e' una cortesia, non un requisito,
      // e non deve impedire di rinominarsi da offline
    } finally {
      setControlloNome(false);
    }
    impostaNomeGiocatore(scelto);
    setBozzaNome(null);
    setNomeCambiato(true);
  }

  // ---------- Backup nel cloud ----------
  const cloud = usaStatoBackupCloud();
  const [codiceInput, setCodiceInput] = useState("");
  const [cloudOk, setCloudOk] = useState<string | null>(null);
  const [cloudKo, setCloudKo] = useState<string | null>(null);
  const [occupato, setOccupato] = useState(false);
  const [copiato, setCopiato] = useState(false);

  const ultimoBackupTesto =
    stato && !stato.maiFatto ? dataOra(stato.ultimoBackup) : null;

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

  function messaggioErrore(e: unknown): string {
    return e instanceof Error ? e.message : "Operazione non riuscita.";
  }

  async function backupOra() {
    setOccupato(true);
    setCloudOk(null);
    setCloudKo(null);
    try {
      const { backupOra } = await import("../../lib/squadra/backupCloud");
      await backupOra();
      setCloudOk("Backup salvato nel cloud.");
    } catch (e) {
      setCloudKo(messaggioErrore(e));
    } finally {
      setOccupato(false);
    }
  }

  async function ripristina() {
    if (
      !confirm(
        "Il ripristino SOSTITUIRÀ i dati attuali di questo dispositivo con quelli del backup. Continuare?",
      )
    ) {
      return;
    }
    setOccupato(true);
    setCloudOk(null);
    setCloudKo(null);
    try {
      const { ripristinaDaCloud } = await import("../../lib/squadra/backupCloud");
      const r = await ripristinaDaCloud(codiceInput);
      setCloudOk(
        `Ripristinati ${r.conteggi.esercizi} esercizi, ${r.conteggi.programmi} programmi e ${r.conteggi.risultati} risultati.`,
      );
      setCodiceInput("");
    } catch (e) {
      setCloudKo(messaggioErrore(e));
    } finally {
      setOccupato(false);
    }
  }

  async function copiaCodice() {
    if (!cloud.codice) return;
    try {
      await navigator.clipboard.writeText(formattaCodice(cloud.codice));
      setCopiato(true);
      setTimeout(() => setCopiato(false), 1500);
    } catch {
      /* clipboard non disponibile: l'utente puo' comunque leggerlo */
    }
  }

  return (
    <section>
      <div className="pagina-testa">
        <div>
          <p className="occhiello">Impostazioni</p>
          <h2>Preferenze e dati</h2>
        </div>
      </div>

      {/* ---------- Profilo ---------- */}
      {squadraConfigurata() && (
        <div className="scheda">
          <h3>👤 Profilo</h3>
          {nome ? (
            <>
              <p className="mini">
                Il nome con cui ti vedono i compagni sulla bacheca. Cambiandolo
                si aggiorna la tua riga esistente: i risultati e la posizione in
                classifica restano quelli, non riparti da zero.
              </p>
              <label className="campo">
                <span>Nome</span>
                <input
                  value={nomeInCampo}
                  maxLength={24}
                  placeholder="Es. Andrea"
                  onChange={(e) => {
                    setBozzaNome(e.target.value);
                    setNomeCambiato(false);
                  }}
                />
              </label>
              <button
                className="bottone"
                disabled={!puoSalvareNome || controlloNome}
                onClick={salvaNome}
              >
                {controlloNome ? "Attendi…" : "Cambia nome"}
              </button>
              {nomeCambiato && (
                <p className="esito-ok">
                  ✅ Per i compagni ora sei <strong>{nome}</strong>.
                </p>
              )}
            </>
          ) : (
            <p className="mini">
              Non sei ancora in squadra. Il nome si sceglie la prima volta dalla{" "}
              <Link to="/squadra">bacheca</Link>, poi lo cambi da qui.
            </p>
          )}
        </div>
      )}

      {/* ---------- Aspetto ---------- */}
      <div className="scheda">
        <h3>🎨 Aspetto</h3>
        <label className="imp-switch">
          <span>Modalità notte</span>
          <input
            type="checkbox"
            checked={temaAttuale === "notte"}
            onChange={(e) => setTema(e.target.checked ? "notte" : "giorno")}
          />
          <span className="imp-slider" />
        </label>
        <p className="mini">
          {temaAttuale === "notte"
            ? "Fondo scuro coi colori della squadra: comodo la sera e in sala."
            : "Fondo chiaro: si legge meglio con molta luce."}
        </p>
      </div>

      {/* ---------- Inserimento dei punteggi ---------- */}
      <div className="scheda">
        <h3>🎯 Come segni i punteggi</h3>
        <div className="imp-segmento verticale">
          <button
            className={modoInput === "tastierino" ? "attivo" : ""}
            onClick={() => setModoInput("tastierino")}
          >
            🔢 Tastierino
          </button>
          <button
            className={modoInput === "bersaglio" ? "attivo" : ""}
            onClick={() => setModoInput("bersaglio")}
          >
            🎯 Bersaglio
          </button>
        </div>
        <p className="mini">
          {modoInput === "bersaglio"
            ? "Tocchi dove è finita ogni freccia: l'app riconosce da sola gli sballi e conta i doppi centrati."
            : "Scrivi il totale della tirata. Più rapido, ma senza statistiche sui doppi."}{" "}
          Puoi cambiarlo anche durante una partita, col pulsante nella barra
          dell'input. Cricket usa sempre il bersaglio.
        </p>
      </div>

      {/* ---------- Backup nel cloud ---------- */}
      <div className="scheda">
        <h3>☁️ Backup nel cloud</h3>
        {!squadraConfigurata() ? (
          <p className="mini">
            Non disponibile su questo dispositivo: manca la configurazione della
            squadra.
          </p>
        ) : (
          <>
            <p className="mini">
              Salva online una copia completa dei tuoi dati. Con il codice di
              ripristino la ritrovi da un altro telefono. Resta un extra: il file
              di backup qui sotto continua a funzionare.
            </p>

            {cloud.attivo && cloud.codice && (
              <div className="codice-ripristino">
                <span className="mini">Codice di ripristino</span>
                <div className="codice-riga">
                  <code>{formattaCodice(cloud.codice)}</code>
                  <button className="bottone secondario piccolo" onClick={copiaCodice}>
                    {copiato ? "✓ Copiato" : "Copia"}
                  </button>
                </div>
                <p className="mini avviso-codice">
                  ⚠️ Annota questo codice in un posto sicuro: senza, non potrai
                  recuperare il backup da un altro dispositivo.
                </p>
              </div>
            )}

            <button className="bottone" onClick={backupOra} disabled={occupato}>
              {occupato
                ? "Attendi…"
                : cloud.attivo
                  ? "Backup ora"
                  : "Attiva backup nel cloud"}
            </button>
            <p className="mini">
              {cloud.attivo && cloud.ultimo > 0
                ? `Ultimo backup cloud: ${dataOra(cloud.ultimo)} · si aggiorna da solo.`
                : "Non attivo. Attivandolo salvi subito e poi in automatico."}
            </p>

            <details className="ripristino-dett">
              <summary>Ripristina da un altro dispositivo</summary>
              <p className="mini">
                Inserisci il codice di ripristino: i dati del backup
                sostituiranno quelli attuali.
              </p>
              <label className="campo">
                <span>Codice di ripristino</span>
                <input
                  value={codiceInput}
                  onChange={(e) => setCodiceInput(e.target.value)}
                  placeholder="ABCD-EFGH-JKLM"
                  autoCapitalize="characters"
                  spellCheck={false}
                />
              </label>
              <button
                className="bottone secondario"
                onClick={ripristina}
                disabled={occupato || codiceInput.trim().length < 8}
              >
                Ripristina da cloud
              </button>
            </details>

            {cloudOk && <p className="esito-ok">✅ {cloudOk}</p>}
            {cloudKo && <p className="esito-ko">⚠️ {cloudKo}</p>}
          </>
        )}
      </div>

      <div className="scheda">
        <h3>📤 Esporta su file</h3>
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
          I dati restano salvati su questo dispositivo (nel browser). Il backup
          nel cloud e l'esportazione su file servono a non perderli o a spostarli
          su un altro telefono/PC.
        </p>
      </div>
    </section>
  );
}
