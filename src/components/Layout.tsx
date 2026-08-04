import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import { PromemoriaBackup } from "../features/backup/PromemoriaBackup";
import { usaSchermoAcceso } from "../lib/schermoAcceso";

/**
 * Rotte durante le quali lo schermo non deve spegnersi. Sta qui, e non nelle
 * singole pagine, perche' cosi' vale anche per i giochi che arriveranno.
 */
function inPartita(percorso: string): boolean {
  return (
    percorso === "/501" ||
    percorso === "/cricket" ||
    percorso === "/drill-doppio" ||
    percorso.startsWith("/gioco/")
  );
}

/** Voci principali, sempre visibili nella barra in basso. */
const principali = [
  { to: "/", label: "Oggi", icona: "🎯", end: true },
  { to: "/programma", label: "Programma", icona: "📅", end: false },
  { to: "/giochi", label: "Giochi", icona: "🎮", end: false },
  { to: "/progressi", label: "Progressi", icona: "📈", end: false },
  { to: "/squadra", label: "Squadra", icona: "👥", end: false },
];

/** Voci secondarie, raccolte nel menu in alto. */
const secondarie = [
  { to: "/partite", label: "Partite", icona: "🗂️" },
  { to: "/esercizi", label: "Esercizi", icona: "📋" },
  { to: "/impostazioni", label: "Impostazioni", icona: "⚙️" },
];

export function Layout() {
  const [menuAperto, setMenuAperto] = useState(false);
  const posizione = useLocation();

  // Cambiando pagina il menu si richiude da solo.
  useEffect(() => setMenuAperto(false), [posizione.pathname]);

  usaSchermoAcceso(inPartita(posizione.pathname));

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <img className="logo" src={logo} alt="" /> Chemicals Darts
        </h1>
        <button
          className="icona-btn"
          aria-label="Altre sezioni"
          aria-expanded={menuAperto}
          onClick={() => setMenuAperto((a) => !a)}
        >
          ☰
        </button>
      </header>

      {menuAperto && (
        <>
          <div className="menu-sfondo" onClick={() => setMenuAperto(false)} />
          <nav className="menu-alto">
            {secondarie.map((v) => (
              <NavLink key={v.to} to={v.to} className="menu-voce">
                <span>{v.icona}</span> {v.label}
              </NavLink>
            ))}
          </nav>
        </>
      )}

      <main className="app-main">
        <PromemoriaBackup />
        <Outlet />
      </main>

      <nav className="app-nav">
        {principali.map((v) => (
          <NavLink
            key={v.to}
            to={v.to}
            end={v.end}
            className={({ isActive }) => (isActive ? "nav-link attivo" : "nav-link")}
          >
            <span className="nav-icona">{v.icona}</span>
            <span className="nav-label">{v.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
