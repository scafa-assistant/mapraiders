/**
 * MapRaiders Icon Generator
 * Converts SVG icon design to required PNG sizes for Expo/Android
 * Run: node generate-icons.js
 */
const sharp = require('sharp');
const path = require('path');

const OUT = path.join(__dirname, 'assets');

// ─── 1. FULL ICON (Electric Blue bg + white pin + territory grid) ────────────
// Used for: icon.png, favicon.png
const fullIconSvg = `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision">
  <defs>
    <clipPath id="c">
      <rect width="64" height="64" rx="14"/>
    </clipPath>
    <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,1)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.93)"/>
    </linearGradient>
  </defs>

  <!-- Background: Electric Blue rounded square -->
  <rect width="64" height="64" rx="14" fill="#1558F0"/>

  <!-- Liquid-glass inner border -->
  <rect x="1" y="1" width="62" height="62" rx="13" fill="none"
        stroke="rgba(255,255,255,0.18)" stroke-width="1"/>

  <!-- Ambient territory grid (background, barely visible) -->
  <g clip-path="url(#c)" opacity="0.08">
    <rect x="32" y="32" width="14" height="14" fill="white"/>
    <rect x="48" y="32" width="14" height="14" fill="white"/>
    <rect x="32" y="48" width="14" height="14" fill="white"/>
  </g>

  <!-- Map pin body (white) -->
  <path d="M32 8 C21.51 8 13 16.51 13 27 C13 40.5 32 56 32 56 C32 56 51 40.5 51 27 C51 16.51 42.49 8 32 8Z"
        fill="url(#pg)"/>

  <!-- 2x2 territory grid — diagonal claimed/unclaimed pattern -->
  <rect x="22" y="17" width="9" height="9" rx="1.5" fill="#1558F0"/>
  <rect x="33" y="17" width="9" height="9" rx="1.5" fill="#1558F0" opacity="0.22"/>
  <rect x="22" y="28" width="9" height="9" rx="1.5" fill="#1558F0" opacity="0.22"/>
  <rect x="33" y="28" width="9" height="9" rx="1.5" fill="#1558F0"/>
</svg>`;

// ─── 2. ADAPTIVE ICON FOREGROUND (transparent bg, white pin only) ────────────
// For Android adaptive icons: OS applies its own bg shape + color from app.json
// Safe zone: content must fit within ~62% of canvas to avoid cropping
const adaptiveSvg = `
<svg viewBox="0 0 108 108" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision">
  <!-- Transparent background — color comes from app.json adaptiveIcon.backgroundColor -->

  <!-- Map pin body (white, centered in safe zone 66dp/108dp ≈ 61%) -->
  <path d="M54 18 C40.75 18 30 28.75 30 42 C30 58.8 54 90 54 90 C54 90 78 58.8 78 42 C78 28.75 67.25 18 54 18Z"
        fill="white"/>

  <!-- 2x2 territory grid — diagonal claimed/unclaimed, Electric Blue on white -->
  <rect x="41" y="30" width="11" height="11" rx="2" fill="#1558F0"/>
  <rect x="56" y="30" width="11" height="11" rx="2" fill="#1558F0" opacity="0.25"/>
  <rect x="41" y="43" width="11" height="11" rx="2" fill="#1558F0" opacity="0.25"/>
  <rect x="56" y="43" width="11" height="11" rx="2" fill="#1558F0"/>
</svg>`;

// ─── 3. NOTIFICATION ICON (white silhouette, transparent bg) ─────────────────
// Android notifications: only white channel visible — must be pure white shape
const notificationSvg = `
<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision">
  <!-- Pure white pin silhouette — no colors, transparent background -->
  <path d="M48 10 C33.64 10 22 21.64 22 36 C22 53.6 48 86 48 86 C48 86 74 53.6 74 36 C74 21.64 62.36 10 48 10Z"
        fill="white"/>
  <!-- Simple circle cutout for GPS dot — keeps silhouette readable at small sizes -->
  <circle cx="48" cy="36" r="9" fill="rgba(0,0,0,0.35)"/>
</svg>`;

// ─── GENERATE ALL FILES ───────────────────────────────────────────────────────
async function generate() {
  const tasks = [
    { svg: fullIconSvg,     size: 1024, file: 'icon.png',              label: 'icon.png (1024×1024)' },
    { svg: adaptiveSvg,     size: 1024, file: 'adaptive-icon.png',     label: 'adaptive-icon.png (1024×1024)' },
    { svg: fullIconSvg,     size: 48,   file: 'favicon.png',           label: 'favicon.png (48×48)' },
    { svg: notificationSvg, size: 96,   file: 'notification-icon.png', label: 'notification-icon.png (96×96)' },
  ];

  for (const { svg, size, file, label } of tasks) {
    await sharp(Buffer.from(svg.trim()))
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT, file));
    console.log(`  ✓  ${label}`);
  }

  console.log('\nAll icons generated.');
}

generate().catch(err => {
  console.error('Generation failed:', err.message);
  process.exit(1);
});
