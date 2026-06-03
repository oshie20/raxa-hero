/**
 * generate-assets.mjs
 * Pure Node.js script — no npm dependencies required.
 * Generates 7 placeholder card images (400×600) and a noise texture (340×340).
 *
 * Run: node generate-assets.mjs
 *
 * Replace the card images in src/Hero/assets/ with your real licensed photos
 * once you have them. The noise.png should be kept as-is unless you have a
 * custom grain texture.
 */

import { deflateSync }    from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname }  from 'path';
import { fileURLToPath }  from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS    = join(__dirname, 'src', 'Hero', 'assets');
mkdirSync(ASSETS, { recursive: true });

// ─── Minimal PNG encoder ──────────────────────────────────────────────────────

/** Build the CRC-32 lookup table once. */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    }
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const dataBuf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const lenBuf  = Buffer.allocUnsafe(4);
  lenBuf.writeUInt32BE(dataBuf.length, 0);
  const crcInput = Buffer.concat([typeBuf, dataBuf]);
  const crcBuf   = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, dataBuf, crcBuf]);
}

/**
 * Create a PNG file buffer from a pixel function.
 * @param {number} w
 * @param {number} h
 * @param {(x:number, y:number) => [number,number,number]} getPixel
 */
function makePNG(w, h, getPixel) {
  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8]  = 8; // bit-depth
  ihdr[9]  = 2; // colour type: RGB
  ihdr[10] = 0; // compression: deflate
  ihdr[11] = 0; // filter: adaptive
  ihdr[12] = 0; // interlace: none

  // Raw scanline data: 1 filter byte + w×3 RGB bytes per row
  const stride = 1 + w * 3;
  const raw    = Buffer.allocUnsafe(h * stride);
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0; // filter type None
    for (let x = 0; x < w; x++) {
      const [r, g, b] = getPixel(x, y);
      const off = y * stride + 1 + x * 3;
      raw[off]     = Math.max(0, Math.min(255, r | 0));
      raw[off + 1] = Math.max(0, Math.min(255, g | 0));
      raw[off + 2] = Math.max(0, Math.min(255, b | 0));
    }
  }

  const idat = deflateSync(raw, { level: 6 });

  return Buffer.concat([
    PNG_SIG,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── Card colour schemes (dark, cinematic palettes) ───────────────────────────

/**
 * Each scheme: { top, bot, accent }
 * top/bot are the vertical gradient endpoints (dark → slightly lighter).
 * accent is an additive highlight for the upper portion.
 */
const SCHEMES = [
  { top: [18,  6, 28], bot: [42, 14, 60], accent: [160,  60, 240] }, // violet
  { top: [ 4, 18, 28], bot: [ 8, 52, 72], accent: [ 30, 180, 240] }, // teal
  { top: [24,  4,  8], bot: [70, 12, 20], accent: [240,  60,  80] }, // crimson
  { top: [ 8, 18,  4], bot: [20, 52, 12], accent: [ 80, 210,  60] }, // forest
  { top: [18, 14,  4], bot: [52, 40,  8], accent: [240, 190,  40] }, // amber
  { top: [ 4,  8, 22], bot: [10, 24, 62], accent: [ 60, 100, 240] }, // cobalt
  { top: [14,  8, 14], bot: [40, 22, 40], accent: [200, 120, 240] }, // rose
];

function makeCardPixel(scheme, w, h) {
  return function(x, y) {
    const fy  = y / h;
    const fx  = x / w;

    // Vertical base gradient
    const r = scheme.top[0] + (scheme.bot[0] - scheme.top[0]) * fy;
    const g = scheme.top[1] + (scheme.bot[1] - scheme.top[1]) * fy;
    const b = scheme.top[2] + (scheme.bot[2] - scheme.top[2]) * fy;

    // Accent radial light from top-centre
    const dx    = fx - 0.5;
    const dy    = fy;
    const dist2 = dx * dx + dy * dy * 0.5;
    const glow  = Math.max(0, 1 - dist2 * 4) * 0.45;

    // Vignette (darken corners)
    const cx  = Math.abs(fx - 0.5) * 2;
    const cy  = Math.abs(fy - 0.5) * 2;
    const vig = 1 - Math.min(1, (cx * cx + cy * cy) * 0.35);

    // Subtle film-grain-like lines
    const lineH = (y % 48 === 0) ? 12 : 0;
    const lineV = (x % 48 === 0) ? 12 : 0;

    return [
      (r + scheme.accent[0] * glow) * vig + lineH + lineV,
      (g + scheme.accent[1] * glow) * vig + lineH + lineV,
      (b + scheme.accent[2] * glow) * vig + lineH + lineV,
    ];
  };
}

for (let i = 0; i < SCHEMES.length; i++) {
  const png  = makePNG(400, 600, makeCardPixel(SCHEMES[i], 400, 600));
  const path = join(ASSETS, `card${i + 1}.jpg`);
  writeFileSync(path, png);
  console.log(`✓  card${i + 1}.jpg`);
}

// ─── Noise texture (340×340 greyscale noise) ──────────────────────────────────

// Seeded pseudo-random for reproducible output
let seed = 0xDEADBEEF;
function rand() {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return (seed >>> 0) / 0xFFFFFFFF;
}

const noisePNG = makePNG(340, 340, () => {
  const n = Math.round(rand() * 255);
  return [n, n, n];
});
writeFileSync(join(ASSETS, 'noise.png'), noisePNG);
console.log('✓  noise.png');

console.log('\nAssets written to src/Hero/assets/');
console.log('Replace card*.jpg with your licensed photography when available.');
console.log('Place VCNudgeTrial-ExtraBold.woff2 in the same directory.');
