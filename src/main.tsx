import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import { applicaMigrazioni } from "./lib/migrazioni";
import { seedSePrimoAvvio } from "./lib/seed";
import { applicaTema } from "./lib/tema";
import "./styles.css";

// Il tema si applica subito, prima di montare l'app: dopo si vedrebbe un
// lampo del tema sbagliato.
applicaTema();

// Prepara i dati (libreria al primo avvio + aggiornamenti), poi monta l'app.
// Un errore qui non deve impedire l'avvio: si registra e si prosegue.
seedSePrimoAvvio()
  .then(applicaMigrazioni)
  .catch((e) => console.error("Preparazione dati fallita:", e))
  .finally(() => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        {/* HashRouter: funziona anche aperto da file:// o hosting statico senza config server */}
        <HashRouter>
          <App />
        </HashRouter>
      </StrictMode>,
    );
  });
