import type { UnitaMetrica } from "../types";

export interface PuntoGrafico {
  data: string; // "YYYY-MM-DD"
  valore: number;
}

interface GraficoProps {
  punti: PuntoGrafico[];
  obiettivo?: number;
  unita: UnitaMetrica;
}

const W = 320;
const H = 140;
const PAD_X = 34;
const PAD_TOP = 12;
const PAD_BOT = 22;

export function formattaValore(v: number, unita: UnitaMetrica): string {
  const n = Number.isInteger(v) ? v : Math.round(v * 10) / 10;
  return unita === "percentuale" ? `${n}%` : String(n);
}

function dataBreve(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/**
 * Grafico a linea minimale in SVG: andamento di una metrica nel tempo, con
 * eventuale linea dell'obiettivo. Scala in automatico e resta responsive.
 */
export function Grafico({ punti, obiettivo, unita }: GraficoProps) {
  if (punti.length === 0) {
    return <p className="mini">Nessun dato registrato.</p>;
  }

  const valori = punti.map((p) => p.valore);
  const candidati = obiettivo != null ? [...valori, obiettivo] : valori;
  let min = Math.min(...candidati);
  let max = Math.max(...candidati);
  if (min === max) {
    // evita divisione per zero con un solo valore o valori identici
    min -= 1;
    max += 1;
  }
  const range = max - min;

  const x = (i: number) =>
    punti.length === 1
      ? W / 2
      : PAD_X + (i / (punti.length - 1)) * (W - PAD_X - 8);
  const y = (v: number) =>
    PAD_TOP + (1 - (v - min) / range) * (H - PAD_TOP - PAD_BOT);

  const linea = punti.map((p, i) => `${x(i)},${y(p.valore)}`).join(" ");
  const yObiettivo = obiettivo != null ? y(obiettivo) : null;
  const ultimo = punti[punti.length - 1].valore;

  return (
    <svg
      className="grafico"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Andamento nel tempo"
    >
      {/* etichette asse Y (max in alto, min in basso) */}
      <text className="g-asse" x="4" y={PAD_TOP + 4}>
        {formattaValore(max, unita)}
      </text>
      <text className="g-asse" x="4" y={H - PAD_BOT}>
        {formattaValore(min, unita)}
      </text>

      {/* linea obiettivo */}
      {yObiettivo != null && (
        <>
          <line
            className="g-obiettivo"
            x1={PAD_X}
            x2={W - 8}
            y1={yObiettivo}
            y2={yObiettivo}
          />
          <text className="g-obiettivo-txt" x={W - 8} y={yObiettivo - 4}>
            obiettivo {formattaValore(obiettivo!, unita)}
          </text>
        </>
      )}

      {/* linea dati */}
      <polyline className="g-linea" points={linea} />

      {/* punti */}
      {punti.map((p, i) => (
        <circle key={i} className="g-punto" cx={x(i)} cy={y(p.valore)} r="3" />
      ))}

      {/* etichette prima e ultima data */}
      <text className="g-asse" x={PAD_X} y={H - 6}>
        {dataBreve(punti[0].data)}
      </text>
      {punti.length > 1 && (
        <text className="g-asse g-asse-fine" x={W - 8} y={H - 6}>
          {dataBreve(punti[punti.length - 1].data)}
        </text>
      )}

      {/* valore corrente evidenziato */}
      <text
        className="g-ultimo"
        x={x(punti.length - 1)}
        y={y(ultimo) - 8}
      >
        {formattaValore(ultimo, unita)}
      </text>
    </svg>
  );
}
