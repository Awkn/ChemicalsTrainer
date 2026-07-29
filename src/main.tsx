import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import { seedSePrimoAvvio } from "./lib/seed";
import "./styles.css";

// Popola i dati d'esempio al primo avvio, poi monta l'app.
seedSePrimoAvvio().finally(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      {/* HashRouter: funziona anche aperto da file:// o hosting statico senza config server */}
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>,
  );
});
