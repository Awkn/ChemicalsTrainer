// Genera le icone PNG della PWA a partire da public/favicon.svg.
// Eseguire una volta (o dopo aver cambiato l'icona): npm run gen-icons
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = await readFile(join(root, "public", "favicon.svg"));

const target = [
  { file: "pwa-192.png", size: 192 },
  { file: "pwa-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const { file, size } of target) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(join(root, "public", file));
  console.log(`✓ public/${file} (${size}x${size})`);
}
