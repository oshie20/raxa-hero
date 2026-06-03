/**
 * Resize + WebP-compress hero card assets for production.
 * Run: node scripts/optimize-images.mjs
 */
import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(__dirname, '..', 'src', 'Hero', 'assets');

/** Max edge length — ~2× largest on-screen card size. */
const FRONT_MAX = 400;
const BACK_MAX = 600;
const NOISE_MAX = 340;

const FRONT_RE = /^card[1-7]\.png$/;
const BACK_RE = /^card\d.*-back.*\.png$/;
const NOISE_RE = /^noise\.png$/;

async function optimizeFile(file, maxEdge, quality) {
  const input = join(ASSETS, file);
  const output = input.replace(/\.png$/i, '.webp');
  const meta = await sharp(input).metadata();
  const w = meta.width ?? maxEdge;
  const h = meta.height ?? maxEdge;
  const scale = Math.min(1, maxEdge / Math.max(w, h));

  await sharp(input)
    .resize({
      width: scale < 1 ? Math.round(w * scale) : undefined,
      height: scale < 1 ? Math.round(h * scale) : undefined,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 6 })
    .toFile(output);

  const [before, after] = await Promise.all([
    stat(input).then((s) => s.size),
    stat(output).then((s) => s.size),
  ]);
  console.log(
    `${file} → ${file.replace(/\.png$/i, '.webp')}  ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB`,
  );
}

const files = await readdir(ASSETS);
const pngs = files.filter((f) => f.endsWith('.png'));

for (const file of pngs) {
  if (FRONT_RE.test(file)) {
    await optimizeFile(file, FRONT_MAX, 86);
  } else if (BACK_RE.test(file)) {
    await optimizeFile(file, BACK_MAX, 82);
  } else if (NOISE_RE.test(file)) {
    await optimizeFile(file, NOISE_MAX, 72);
  }
}

console.log('Done.');
