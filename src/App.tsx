import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { OggiPage } from "./features/oggi/OggiPage";
import { ProgressiPage } from "./features/progressi/ProgressiPage";
import { ProgrammaPage } from "./features/programma/ProgrammaPage";
import { EserciziPage } from "./features/esercizi/EserciziPage";
import { ImpostazioniPage } from "./features/impostazioni/ImpostazioniPage";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<OggiPage />} />
        <Route path="progressi" element={<ProgressiPage />} />
        <Route path="programma" element={<ProgrammaPage />} />
        <Route path="esercizi" element={<EserciziPage />} />
        <Route path="impostazioni" element={<ImpostazioniPage />} />
      </Route>
    </Routes>
  );
}
