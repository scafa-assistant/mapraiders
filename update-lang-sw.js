/**
 * Updates all existing DE/EN/FR/ES/IT pages:
 * 1. Replaces old flat lang-sw tabs with 13-language dropdown
 * 2. Adds hreflang tags for PT/TR/RU/JA/KO/ZH/AR/HI
 * Run: node update-lang-sw.js
 */
const fs = require('fs');

// ── URL maps ────────────────────────────────────────────────────────────────
const LANDING = {
  de:'/',en:'/en/',fr:'/fr/',es:'/es/',it:'/it/',
  pt:'/pt/',tr:'/tr/',ru:'/ru/',ja:'/ja/',ko:'/ko/',zh:'/zh/',ar:'/ar/',hi:'/hi/'
};

const FEATURES = {
  territories:{
    de:'/features/territorien.html', en:'/en/features/territories.html',
    fr:'/fr/features/territoires.html', es:'/es/features/territorios.html',
    it:'/it/features/territori.html',
    pt:'/pt/features/territories.html', tr:'/tr/features/territories.html',
    ru:'/ru/features/territories.html', ja:'/ja/features/territories.html',
    ko:'/ko/features/territories.html', zh:'/zh/features/territories.html',
    ar:'/ar/features/territories.html', hi:'/hi/features/territories.html',
  },
  echos:{
    de:'/features/echos.html', en:'/en/features/echos.html',
    fr:'/fr/features/echos.html', es:'/es/features/ecos.html',
    it:'/it/features/echi.html',
    pt:'/pt/features/echos.html', tr:'/tr/features/echos.html',
    ru:'/ru/features/echos.html', ja:'/ja/features/echos.html',
    ko:'/ko/features/echos.html', zh:'/zh/features/echos.html',
    ar:'/ar/features/echos.html', hi:'/hi/features/echos.html',
  },
  events:{
    de:'/features/events.html', en:'/en/features/events.html',
    fr:'/fr/features/evenements.html', es:'/es/features/eventos.html',
    it:'/it/features/eventi.html',
    pt:'/pt/features/events.html', tr:'/tr/features/events.html',
    ru:'/ru/features/events.html', ja:'/ja/features/events.html',
    ko:'/ko/features/events.html', zh:'/zh/features/events.html',
    ar:'/ar/features/events.html', hi:'/hi/features/events.html',
  },
  defense:{
    de:'/features/defense.html', en:'/en/features/defense-games.html',
    fr:'/fr/features/jeux-defense.html', es:'/es/features/juegos-defensa.html',
    it:'/it/features/giochi-difesa.html',
    pt:'/pt/features/defense.html', tr:'/tr/features/defense.html',
    ru:'/ru/features/defense.html', ja:'/ja/features/defense.html',
    ko:'/ko/features/defense.html', zh:'/zh/features/defense.html',
    ar:'/ar/features/defense.html', hi:'/hi/features/defense.html',
  },
  clans:{
    de:'/features/social.html', en:'/en/features/clans.html',
    fr:'/fr/features/clans.html', es:'/es/features/clanes.html',
    it:'/it/features/clan.html',
    pt:'/pt/features/clans.html', tr:'/tr/features/clans.html',
    ru:'/ru/features/clans.html', ja:'/ja/features/clans.html',
    ko:'/ko/features/clans.html', zh:'/zh/features/clans.html',
    ar:'/ar/features/clans.html', hi:'/hi/features/clans.html',
  },
  quests:{
    de:'/features/quests.html', en:'/en/features/quests.html',
    fr:'/fr/features/quetes.html', es:'/es/features/misiones.html',
    it:'/it/features/missioni.html',
    pt:'/pt/features/quests.html', tr:'/tr/features/quests.html',
    ru:'/ru/features/quests.html', ja:'/ja/features/quests.html',
    ko:'/ko/features/quests.html', zh:'/zh/features/quests.html',
    ar:'/ar/features/quests.html', hi:'/hi/features/quests.html',
  },
};

const LABELS = {
  de:'Deutsch',en:'English',fr:'Français',es:'Español',it:'Italiano',
  pt:'Português',tr:'Türkçe',ru:'Русский',ja:'日本語',ko:'한국어',
  zh:'中文',ar:'العربية',hi:'हिन्दी'
};
const CODES = {
  de:'DE',en:'EN',fr:'FR',es:'ES',it:'IT',
  pt:'PT',tr:'TR',ru:'RU',ja:'JA',ko:'KO',zh:'ZH',ar:'AR',hi:'HI'
};
const ORDER = ['de','en','fr','es','it','pt','tr','ru','ja','ko','zh','ar','hi'];
const NEW_LANGS = ['pt','tr','ru','ja','ko','zh','ar','hi'];

// ── Files to process ────────────────────────────────────────────────────────
const FILES = [
  {p:'docs/index.html',                              lang:'de', feat:null},
  {p:'docs/en/index.html',                           lang:'en', feat:null},
  {p:'docs/fr/index.html',                           lang:'fr', feat:null},
  {p:'docs/es/index.html',                           lang:'es', feat:null},
  {p:'docs/it/index.html',                           lang:'it', feat:null},
  {p:'docs/features/territorien.html',               lang:'de', feat:'territories'},
  {p:'docs/features/echos.html',                     lang:'de', feat:'echos'},
  {p:'docs/features/events.html',                    lang:'de', feat:'events'},
  {p:'docs/features/defense.html',                   lang:'de', feat:'defense'},
  {p:'docs/features/social.html',                    lang:'de', feat:'clans'},
  {p:'docs/features/quests.html',                    lang:'de', feat:'quests'},
  {p:'docs/en/features/territories.html',            lang:'en', feat:'territories'},
  {p:'docs/en/features/echos.html',                  lang:'en', feat:'echos'},
  {p:'docs/en/features/events.html',                 lang:'en', feat:'events'},
  {p:'docs/en/features/defense-games.html',          lang:'en', feat:'defense'},
  {p:'docs/en/features/clans.html',                  lang:'en', feat:'clans'},
  {p:'docs/en/features/quests.html',                 lang:'en', feat:'quests'},
  {p:'docs/fr/features/territoires.html',            lang:'fr', feat:'territories'},
  {p:'docs/fr/features/echos.html',                  lang:'fr', feat:'echos'},
  {p:'docs/fr/features/evenements.html',             lang:'fr', feat:'events'},
  {p:'docs/fr/features/jeux-defense.html',           lang:'fr', feat:'defense'},
  {p:'docs/fr/features/clans.html',                  lang:'fr', feat:'clans'},
  {p:'docs/fr/features/quetes.html',                 lang:'fr', feat:'quests'},
  {p:'docs/es/features/territorios.html',            lang:'es', feat:'territories'},
  {p:'docs/es/features/ecos.html',                   lang:'es', feat:'echos'},
  {p:'docs/es/features/eventos.html',                lang:'es', feat:'events'},
  {p:'docs/es/features/juegos-defensa.html',         lang:'es', feat:'defense'},
  {p:'docs/es/features/clanes.html',                 lang:'es', feat:'clans'},
  {p:'docs/es/features/misiones.html',               lang:'es', feat:'quests'},
  {p:'docs/it/features/territori.html',              lang:'it', feat:'territories'},
  {p:'docs/it/features/echi.html',                   lang:'it', feat:'echos'},
  {p:'docs/it/features/eventi.html',                 lang:'it', feat:'events'},
  {p:'docs/it/features/giochi-difesa.html',          lang:'it', feat:'defense'},
  {p:'docs/it/features/clan.html',                   lang:'it', feat:'clans'},
  {p:'docs/it/features/missioni.html',               lang:'it', feat:'quests'},
];

// ── New dropdown CSS ─────────────────────────────────────────────────────────
const NEW_CSS =
`.lang-sw{position:relative}
.lsw-btn{font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--muted);padding:5px 10px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all .2s;background:none;border:none;font-family:inherit}
.lsw-btn:hover{color:var(--text);background:var(--surface)}
.lsw-btn .chev{width:9px;height:9px;opacity:.5;transition:transform .2s}
.lang-sw:hover .lsw-btn .chev,.lang-sw:focus-within .lsw-btn .chev{transform:rotate(180deg)}
.lsw-drop{position:absolute;top:calc(100% + 6px);right:0;background:var(--bg);border:1px solid var(--border,rgba(0,0,0,.08));border-radius:12px;padding:6px;min-width:148px;display:none;z-index:200;box-shadow:0 12px 40px rgba(0,0,0,.10);flex-direction:column;gap:1px}
.lang-sw:hover .lsw-drop,.lang-sw:focus-within .lsw-drop{display:flex}
.lswi{font-size:13px;font-weight:500;color:var(--muted);padding:7px 12px;border-radius:7px;text-decoration:none;white-space:nowrap;transition:all .15s;display:block}
.lswi:hover{color:var(--text);background:var(--surface)}
.lswi.on{color:var(--accent);background:var(--accent-m);font-weight:700;pointer-events:none}
@media(max-width:900px){.lang-sw{display:none}}`;

const CHEV = `<svg class="chev" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function buildDrop(activeLang, urls) {
  const items = ORDER.map(l => {
    if (l === activeLang) return `      <span class="lswi on">${LABELS[l]}</span>`;
    return `      <a href="${urls[l]}" class="lswi">${LABELS[l]}</a>`;
  }).join('\n');
  return `<div class="lang-sw">\n      <button class="lsw-btn">${CODES[activeLang]} ${CHEV}</button>\n      <div class="lsw-drop">\n${items}\n      </div>\n    </div>`;
}

function buildNewHreflang(urls) {
  return NEW_LANGS.map(l => `<link rel="alternate" hreflang="${l}" href="https://mapraiders.com${urls[l]}">`).join('\n');
}

// ── Process each file ────────────────────────────────────────────────────────
let ok = 0, warn = 0;

for (const {p, lang, feat} of FILES) {
  if (!fs.existsSync(p)) { console.log(`SKIP  ${p}`); continue; }
  let c = fs.readFileSync(p, 'utf8');
  const urls = feat ? FEATURES[feat] : LANDING;

  // 1. Replace CSS
  const cssRx = /\.lang-sw\{display:flex[\s\S]*?@media\(max-width:900px\)\{\.lang-sw\{display:none\}\}/;
  if (cssRx.test(c)) {
    c = c.replace(cssRx, NEW_CSS);
  } else { console.log(`WARN  CSS not matched: ${p}`); warn++; }

  // 2. Replace HTML lang-sw block (lazy — stops at first </div>)
  const htmlRx = /<div class="lang-sw">[\s\S]*?<\/div>/;
  if (htmlRx.test(c)) {
    c = c.replace(htmlRx, buildDrop(lang, urls));
  } else { console.log(`WARN  HTML not matched: ${p}`); warn++; }

  // 3. Add new hreflang after last existing hreflang (x-default or it)
  const newHref = buildNewHreflang(urls);
  const xdefRx = /(<link rel="alternate" hreflang="x-default"[^>]*>)/;
  const itRx   = /(<link rel="alternate" hreflang="it"[^>]*>)/;
  if (xdefRx.test(c))      c = c.replace(xdefRx, `$1\n${newHref}`);
  else if (itRx.test(c))   c = c.replace(itRx,   `$1\n${newHref}`);
  else { console.log(`WARN  hreflang not matched: ${p}`); warn++; }

  fs.writeFileSync(p, c, 'utf8');
  console.log(`  ok  ${p}`); ok++;
}

console.log(`\nDone: ${ok} updated, ${warn} warnings.`);
