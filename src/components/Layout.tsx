import { NavLink, Outlet } from "react-router-dom";

const voci = [
  { to: "/", label: "Oggi", icona: "🎯", end: true },
  { to: "/501", label: "501", icona: "🎮", end: false },
  { to: "/progressi", label: "Progressi", icona: "📈", end: false },
  { to: "/programma", label: "Programma", icona: "📅", end: false },
  { to: "/esercizi", label: "Esercizi", icona: "📋", end: false },
  { to: "/impostazioni", label: "Dati", icona: "⚙️", end: false },
];

export function Layout() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span className="logo">🎯</span> Darts Trainer
        </h1>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="app-nav">
        {voci.map((v) => (
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
