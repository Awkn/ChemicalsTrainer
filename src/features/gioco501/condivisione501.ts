import {
  aSet,
  checkoutPerc,
  distribuzione,
  etichettaChiusura,
  media3,
  mediaFirst9,
  migliorLeg,
  nomeFormato,
  nomiVisualizzati,
  type StatoPartita,
  type StatsGiocatore,
} from "./logica501";

/**
 * Il risultato di una partita in testo, per il gruppo della squadra.
 *
 * Niente immagini: un messaggio si legge nell'anteprima della chat, si cita e
 * si cerca. Poche righe, quelle che si commentano davvero — media, chiusure e
 * i tiri grossi — e non tutta la tabella del recap.
 */
export function testoPartita(stato: StatoPartita): string {
  const { config } = stato;
  const nomi = nomiVisualizzati(config);
  const conSet = aSet(config);
  const uno = conSet ? stato.setUno : stato.legUno;
  const due = conSet ? stato.setDue : stato.legDue;
  const avversario =
    config.avversario === "bot" ? `Bot ${config.livello.nome}` : nomi[1];

  const righe = [
    `🎯 501 · ${nomi[0]} ${uno} — ${due} ${avversario}`,
    `${nomeFormato(config)} · ${config.puntiIniziali} · ${etichettaChiusura(config.chiusura)}`,
    "",
    rigaGiocatore(nomi[0], stato.statsUno),
    rigaGiocatore(avversario, stato.statsDue),
  ];

  const grossi = rigaTiriGrossi(stato.statsUno);
  if (grossi) righe.push(grossi);

  return righe.join("\n");
}

/** Le statistiche di un giocatore su una riga sola. */
function rigaGiocatore(nome: string, s: StatsGiocatore): string {
  const parti = [
    `media ${media3(s)}`,
    `first 9 ${mediaFirst9(s)}`,
    `checkout ${checkoutPerc(s)}%`,
  ];
  const leg = migliorLeg(s);
  if (leg != null) parti.push(`miglior leg ${leg} frecce`);
  if (s.highFinish > 0) parti.push(`chiusura più alta ${s.highFinish}`);
  return `${nome}: ${parti.join(" · ")}`;
}

/** Le fasce che vale la pena raccontare: sotto i 100 non fa notizia. */
const FASCE_DA_VANTO = ["f180", "f140", "f100"];

/** I tiri grossi. Torna "" quando non ce n'e' stato nemmeno uno. */
function rigaTiriGrossi(s: StatsGiocatore): string {
  const notevoli = distribuzione(s.fasce)
    .filter((f) => f.visite > 0 && FASCE_DA_VANTO.includes(f.id))
    .map((f) => `${f.etichetta}: ${f.visite}`);
  return notevoli.length > 0 ? `\n${notevoli.join(" · ")}` : "";
}
