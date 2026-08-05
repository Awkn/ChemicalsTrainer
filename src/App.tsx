import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { OggiPage } from "./features/oggi/OggiPage";
import { GiochiPage } from "./features/giochi/GiochiPage";
import { Gioco501Page } from "./features/gioco501/Gioco501Page";
import { lazy, Suspense } from "react";
import { ProgressiPage } from "./features/progressi/ProgressiPage";
import { useSincronizzaSquadra } from "./lib/squadra/useSincronizza";
import { useBackupAutomatico } from "./lib/squadra/useBackupAutomatico";

// La bacheca porta con se' la libreria Firebase, pesante: si carica solo
// quando si apre davvero la sezione Squadra.
const SquadraPage = lazy(() => import("./features/squadra/SquadraPage"));
// I giochi si caricano solo quando si avvia un esercizio giocabile.
const Bob27Page = lazy(() => import("./features/giochi/bob27/Bob27Page"));
const Co121Page = lazy(() => import("./features/giochi/co121/Co121Page"));
const AtcPage = lazy(() => import("./features/giochi/atc/AtcPage"));
const LadderPage = lazy(() => import("./features/giochi/ladder/LadderPage"));
const PressureDoublesPage = lazy(
  () => import("./features/giochi/pressuredoubles/PressureDoublesPage"),
);
const Co61100Page = lazy(() => import("./features/giochi/co61100/Co61100Page"));
const DrillDoppioPage = lazy(
  () => import("./features/giochi/drilldoppio/DrillDoppioPage"),
);
const CricketPage = lazy(() => import("./features/giochi/cricket/CricketPage"));
const SerieCheckoutPage = lazy(
  () => import("./features/giochi/seriecheckout/SerieCheckoutPage"),
);
const Shanghai20Page = lazy(
  () => import("./features/giochi/shanghai20/Shanghai20Page"),
);
const DpGamePage = lazy(() => import("./features/giochi/dpgame/DpGamePage"));
// L'archivio si apre di rado: non deve pesare sull'avvio.
const PartitePage = lazy(() => import("./features/partite/PartitePage"));
const RecapPartitaPage = lazy(
  () => import("./features/partite/RecapPartitaPage"),
);
import { ProgrammaPage } from "./features/programma/ProgrammaPage";
import { EserciziPage } from "./features/esercizi/EserciziPage";
import { ImpostazioniPage } from "./features/impostazioni/ImpostazioniPage";
import { SogliePage } from "./features/obiettivi/SogliePage";
import { LeaguePage } from "./features/league/LeaguePage";

export function App() {
  // tiene aggiornata la bacheca di squadra quando cambiano i risultati
  useSincronizzaSquadra();
  // se attivo, tiene aggiornato il backup completo nel cloud
  useBackupAutomatico();

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<OggiPage />} />
        <Route path="giochi" element={<GiochiPage />} />
        {/* Le due rotte montano lo stesso componente: senza `key` React ne
            riuserebbe l'istanza passando dall'una all'altra, e la partita
            partirebbe con la configurazione della rotta precedente. */}
        <Route path="501" element={<Gioco501Page key="501-libero" />} />
        {/* Stessa pagina, ma legata a un esercizio: formato gia' deciso e
            risultato scritto su quell'esercizio a fine partita. */}
        <Route
          path="gioco/g501/:esercizioId"
          element={<Gioco501Page key="501-programma" />}
        />
        <Route path="progressi" element={<ProgressiPage />} />
        <Route path="obiettivi" element={<SogliePage />} />
        <Route path="league" element={<LeaguePage />} />
        <Route
          path="squadra"
          element={
            <Suspense fallback={<p className="mini">Carico…</p>}>
              <SquadraPage />
            </Suspense>
          }
        />
        <Route
          path="gioco/bob27/:esercizioId"
          element={
            <Suspense fallback={<p className="mini">Carico…</p>}>
              <Bob27Page />
            </Suspense>
          }
        />
        <Route
          path="gioco/co121/:esercizioId"
          element={
            <Suspense fallback={<p className="mini">Carico…</p>}>
              <Co121Page />
            </Suspense>
          }
        />
        <Route
          path="gioco/atc/:esercizioId"
          element={
            <Suspense fallback={<p className="mini">Carico…</p>}>
              <AtcPage />
            </Suspense>
          }
        />
        <Route
          path="gioco/ladder/:esercizioId"
          element={
            <Suspense fallback={<p className="mini">Carico…</p>}>
              <LadderPage />
            </Suspense>
          }
        />
        <Route
          path="gioco/pressuredoubles/:esercizioId"
          element={
            <Suspense fallback={<p className="mini">Carico…</p>}>
              <PressureDoublesPage />
            </Suspense>
          }
        />
        <Route
          path="gioco/co61100/:esercizioId"
          element={
            <Suspense fallback={<p className="mini">Carico…</p>}>
              <Co61100Page />
            </Suspense>
          }
        />
        {/* Due esercizi diversi sulla stessa pagina: la `key` evita che React
            ne riusi l'istanza passando dall'uno all'altro, che si porterebbe
            dietro la serie di bersagli gia' estratta. */}
        <Route
          path="gioco/co60170/:esercizioId"
          element={
            <Suspense fallback={<p className="mini">Carico…</p>}>
              <SerieCheckoutPage key="co60170" gioco="co60170" />
            </Suspense>
          }
        />
        <Route
          path="gioco/gameshot/:esercizioId"
          element={
            <Suspense fallback={<p className="mini">Carico…</p>}>
              <SerieCheckoutPage key="gameshot" gioco="gameshot" />
            </Suspense>
          }
        />
        <Route
          path="gioco/shanghai20/:esercizioId"
          element={
            <Suspense fallback={<p className="mini">Carico…</p>}>
              <Shanghai20Page />
            </Suspense>
          }
        />
        <Route
          path="gioco/dpgame/:esercizioId"
          element={
            <Suspense fallback={<p className="mini">Carico…</p>}>
              <DpGamePage />
            </Suspense>
          }
        />
        {/* Il drill non nasce da un esercizio: si sceglie il bersaglio, o lo
            passa la scheda dei doppi col punto debole gia' selezionato. */}
        <Route
          path="drill-doppio"
          element={
            <Suspense fallback={<p className="mini">Carico…</p>}>
              <DrillDoppioPage />
            </Suspense>
          }
        />
        {/* Come il drill: partita a se', non nasce da un esercizio. */}
        <Route
          path="cricket"
          element={
            <Suspense fallback={<p className="mini">Carico…</p>}>
              <CricketPage />
            </Suspense>
          }
        />
        <Route
          path="partite"
          element={
            <Suspense fallback={<p className="mini">Carico…</p>}>
              <PartitePage />
            </Suspense>
          }
        />
        <Route
          path="partite/:id"
          element={
            <Suspense fallback={<p className="mini">Carico…</p>}>
              <RecapPartitaPage />
            </Suspense>
          }
        />
        <Route path="programma" element={<ProgrammaPage />} />
        <Route path="esercizi" element={<EserciziPage />} />
        <Route path="impostazioni" element={<ImpostazioniPage />} />
      </Route>
    </Routes>
  );
}
