// Genera le icone della PWA a partire dallo stemma della squadra.
// Eseguire dopo aver cambiato il logo: npm run gen-icons
import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// Sta in src/assets perche' lo stemma e' usato anche dall'intestazione dell'app.
const sorgente = join(root, "src", "assets", "logo.png");

// public/ contiene solo file generati (sono nel .gitignore), quindi al checkout
// pulito della CI la cartella non esiste: la creiamo prima di scriverci dentro.
const destinazione = join(root, "public");
await mkdir(destinazione, { recursive: true });

let logo;
try {
  logo = await readFile(sorgente);
} catch {
  console.error(
    "Manca src/assets/logo.png: salva li' lo stemma della squadra (PNG quadrato, meglio se 512px o piu').",
  );
  process.exit(1);
}

// Sfondo delle icone: lo stesso nero del tema, cosi' l'icona non ha bordi chiari.
const SFONDO = { r: 10, g: 8, b: 16, alpha: 1 };

// Icone normali: lo stemma occupa tutta l'icona.
const piene = [
  { file: "pwa-192.png", size: 192 },
  { file: "pwa-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
  { file: "favicon.png", size: 96 },
];

for (const { file, size } of piene) {
  await sharp(logo)
    .resize(size, size, { fit: "contain", background: SFONDO })
    .flatten({ background: SFONDO })
    .png()
    .toFile(join(root, "public", file));
  console.log(`✓ public/${file} (${size}x${size})`);
}

// Icona "maskable": Android ritaglia l'icona a cerchio o a goccia secondo il
// telefono. Senza margine i vertici dell'esagono verrebbero tagliati, quindi
// lo stemma viene rimpicciolito dentro un riquadro nero.
const LATO = 512;
const INTERNO = Math.round(LATO * 0.72);
const margine = Math.round((LATO - INTERNO) / 2);

await sharp({
  create: {
    width: LATO,
    height: LATO,
    channels: 4,
    background: SFONDO,
  },
})
  .composite([
    {
      input: await sharp(logo)
        .resize(INTERNO, INTERNO, { fit: "contain", background: SFONDO })
        .png()
        .toBuffer(),
      top: margine,
      left: margine,
    },
  ])
  .png()
  .toFile(join(root, "public", "pwa-maskable-512.png"));
console.log(`✓ public/pwa-maskable-512.png (${LATO}x${LATO}, stemma al 72%)`);
