import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { OggiPage } from "./features/oggi/OggiPage";
import { Gioco501Page } from "./features/gioco501/Gioco501Page";
import { lazy, Suspense } from "react";
import { ProgressiPage } from "./features/progressi/ProgressiPage";
import { useSincronizzaSquadra } from "./lib/squadra/useSincronizza";

// La bacheca porta con se' la libreria Firebase, pesante: si carica solo
// quando si apre davvero la sezione Squadra.
const SquadraPage = lazy(() => import("./features/squadra/SquadraPage"));
import { ProgrammaPage } from "./features/programma/ProgrammaPage";
import { EserciziPage } from "./features/esercizi/EserciziPage";
import { ImpostazioniPage } from "./features/impostazioni/ImpostazioniPage";

export function App() {
  // tiene aggiornata la bacheca di squadra quando cambiano i risultati
  useSincronizzaSquadra();

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<OggiPage />} />
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
        <Route path="programma" element={<ProgrammaPage />} />
        <Route path="esercizi" element={<EserciziPage />} />
        <Route path="impostazioni" element={<ImpostazioniPage />} />
      </Route>
    </Routes>
  );
}
