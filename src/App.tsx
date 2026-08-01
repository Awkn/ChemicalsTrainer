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
import { ProgrammaPage } from "./features/programma/ProgrammaPage";
import { EserciziPage } from "./features/esercizi/EserciziPage";
import { ImpostazioniPage } from "./features/impostazioni/ImpostazioniPage";

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
        <Route path="501" element={<Gioco501Page />} />
        <Route path="progressi" element={<ProgressiPage />} />
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
        <Route path="programma" element={<ProgrammaPage />} />
        <Route path="esercizi" element={<EserciziPage />} />
        <Route path="impostazioni" element={<ImpostazioniPage />} />
      </Route>
    </Routes>
  );
}
