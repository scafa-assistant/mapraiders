/**
 * MapRaiders og:image Generator
 * Produces 1200x630px social sharing card for all language variants
 * Run: node generate-og-image.js
 */
const sharp = require('sharp');
const path = require('path');

const OUT = path.join(__dirname, '..', 'docs');

// 1200x630 Social Card — Dark bg, Electric Blue accent, territory pin hero
function buildSvg(lang) {
  const content = {
    de: { title: 'MapRaiders', sub: 'Echtzeit GPS-Territorienkampf', tag1: 'Gebiete beanspruchen', tag2: 'Quests abschließen', tag3: 'Clans gründen', cta: 'mapraiders.com' },
    en: { title: 'MapRaiders', sub: 'Real-World GPS Territory Warfare', tag1: 'Claim Territories', tag2: 'Complete Quests', tag3: 'Build Clans', cta: 'mapraiders.com/en' },
    fr: { title: 'MapRaiders', sub: 'Guerre de Territoire GPS en Temps Réel', tag1: 'Revendiquer des Zones', tag2: 'Accomplir des Quêtes', tag3: 'Créer des Clans', cta: 'mapraiders.com/fr' },
    es: { title: 'MapRaiders', sub: 'Guerra de Territorio GPS en Tiempo Real', tag1: 'Reclamar Territorios', tag2: 'Completar Misiones', tag3: 'Crear Clanes', cta: 'mapraiders.com/es' },
    it: { title: 'MapRaiders', sub: 'Guerra Territoriale GPS in Tempo Reale', tag1: 'Conquistare Territori', tag2: 'Completare Missioni', tag3: 'Fondare Clan', cta: 'mapraiders.com/it' },
    pt: { title: 'MapRaiders', sub: 'Guerra de Território GPS em Tempo Real', tag1: 'Conquistar Territórios', tag2: 'Completar Missões', tag3: 'Criar Clãs', cta: 'mapraiders.com/pt' },
    tr: { title: 'MapRaiders', sub: 'Gerçek Zamanlı GPS Toprak Savaşı', tag1: 'Toprak Fethet', tag2: 'Görevleri Tamamla', tag3: 'Klan Kur', cta: 'mapraiders.com/tr' },
    ru: { title: 'MapRaiders', sub: 'Реальные GPS-битвы за территории', tag1: 'Завоевать территории', tag2: 'Выполнить задания', tag3: 'Создать клан', cta: 'mapraiders.com/ru' },
    ja: { title: 'MapRaiders', sub: 'リアルタイムGPSテリトリーゲーム', tag1: 'テリトリー征服', tag2: 'クエスト達成', tag3: 'クラン結成', cta: 'mapraiders.com/ja' },
    ko: { title: 'MapRaiders', sub: '실시간 GPS 영역 전쟁 게임', tag1: '영역 정복', tag2: '퀘스트 완료', tag3: '클랜 구성', cta: 'mapraiders.com/ko' },
    zh: { title: 'MapRaiders', sub: '实时GPS领土战争游戏', tag1: '征服领土', tag2: '完成任务', tag3: '建立家族', cta: 'mapraiders.com/zh' },
    ar: { title: 'MapRaiders', sub: 'حرب أراضٍ GPS في الوقت الفعلي', tag1: 'غزو الأراضي', tag2: 'إتمام المهام', tag3: 'بناء العشائر', cta: 'mapraiders.com/ar' },
    hi: { title: 'MapRaiders', sub: 'रियल-टाइम GPS क्षेत्र युद्ध', tag1: 'क्षेत्र जीतें', tag2: 'मिशन पूरे करें', tag3: 'कबीले बनाएं', cta: 'mapraiders.com/hi' },
  };

  const c = content[lang];
  const font = "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif";

  return `
<svg viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision">
  <defs>
    <!-- Blue radial glow top-right -->
    <radialGradient id="glow" cx="80%" cy="20%" r="55%">
      <stop offset="0%" stop-color="#1558F0" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#1558F0" stop-opacity="0"/>
    </radialGradient>
    <!-- Pin gradient -->
    <linearGradient id="ping" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,1)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.88)"/>
    </linearGradient>
  </defs>

  <!-- ── Background ── -->
  <rect width="1200" height="630" fill="#0C0B09"/>

  <!-- Subtle territory grid (background texture) -->
  <g opacity="0.045" stroke="white" stroke-width="1" fill="none">
    <!-- Vertical lines every 60px -->
    <line x1="660" y1="0" x2="660" y2="630"/><line x1="720" y1="0" x2="720" y2="630"/>
    <line x1="780" y1="0" x2="780" y2="630"/><line x1="840" y1="0" x2="840" y2="630"/>
    <line x1="900" y1="0" x2="900" y2="630"/><line x1="960" y1="0" x2="960" y2="630"/>
    <line x1="1020" y1="0" x2="1020" y2="630"/><line x1="1080" y1="0" x2="1080" y2="630"/>
    <line x1="1140" y1="0" x2="1140" y2="630"/>
    <!-- Horizontal lines every 60px -->
    <line x1="600" y1="60" x2="1200" y2="60"/><line x1="600" y1="120" x2="1200" y2="120"/>
    <line x1="600" y1="180" x2="1200" y2="180"/><line x1="600" y1="240" x2="1200" y2="240"/>
    <line x1="600" y1="300" x2="1200" y2="300"/><line x1="600" y1="360" x2="1200" y2="360"/>
    <line x1="600" y1="420" x2="1200" y2="420"/><line x1="600" y1="480" x2="1200" y2="480"/>
    <line x1="600" y1="540" x2="1200" y2="540"/>
  </g>

  <!-- Claimed territory cells (Electric Blue tiles) -->
  <rect x="661" y="61"  width="58" height="58" fill="#1558F0" opacity="0.55"/>
  <rect x="781" y="121" width="58" height="58" fill="#1558F0" opacity="0.40"/>
  <rect x="841" y="61"  width="58" height="58" fill="#1558F0" opacity="0.35"/>
  <rect x="721" y="181" width="58" height="58" fill="#1558F0" opacity="0.50"/>
  <rect x="901" y="121" width="58" height="58" fill="#1558F0" opacity="0.28"/>
  <rect x="961" y="241" width="58" height="58" fill="#1558F0" opacity="0.45"/>
  <rect x="841" y="301" width="58" height="58" fill="#1558F0" opacity="0.32"/>
  <rect x="1081" y="181" width="58" height="58" fill="#1558F0" opacity="0.38"/>
  <rect x="1021" y="361" width="58" height="58" fill="#1558F0" opacity="0.30"/>
  <rect x="721" y="421" width="58" height="58" fill="#1558F0" opacity="0.42"/>
  <rect x="901" y="481" width="58" height="58" fill="#1558F0" opacity="0.36"/>
  <rect x="1141" y="421" width="58" height="58" fill="#1558F0" opacity="0.25"/>
  <rect x="661" y="481" width="58" height="58" fill="#1558F0" opacity="0.48"/>

  <!-- Blue radial glow -->
  <rect width="1200" height="630" fill="url(#glow)"/>

  <!-- Left vertical divider line -->
  <line x1="600" y1="0" x2="600" y2="630" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>

  <!-- ── Left content panel ── -->

  <!-- Brand name -->
  <text x="72" y="230"
    font-family="${font}" font-weight="800" font-size="96"
    letter-spacing="-3" fill="white">MapRaiders</text>

  <!-- Blue accent underline -->
  <rect x="72" y="248" width="240" height="5" rx="2.5" fill="#1558F0"/>

  <!-- Subtitle -->
  <text x="72" y="310"
    font-family="${font}" font-weight="400" font-size="26"
    fill="rgba(255,255,255,0.60)" letter-spacing="0">${c.sub}</text>

  <!-- Feature tags -->
  <g font-family="${font}" font-weight="600" font-size="17" fill="white">
    <!-- Tag 1 -->
    <rect x="72" y="360" width="18" height="18" rx="3" fill="#1558F0"/>
    <text x="100" y="374" fill="rgba(255,255,255,0.80)">${c.tag1}</text>
    <!-- Tag 2 -->
    <rect x="72" y="396" width="18" height="18" rx="3" fill="#1558F0" opacity="0.6"/>
    <text x="100" y="410" fill="rgba(255,255,255,0.60)">${c.tag2}</text>
    <!-- Tag 3 -->
    <rect x="72" y="432" width="18" height="18" rx="3" fill="#1558F0" opacity="0.4"/>
    <text x="100" y="446" fill="rgba(255,255,255,0.45)">${c.tag3}</text>
  </g>

  <!-- CTA URL -->
  <text x="72" y="560"
    font-family="${font}" font-weight="700" font-size="20"
    fill="#1558F0" letter-spacing="1">${c.cta}</text>

  <!-- ── Right panel: Large Territory Pin ── -->

  <!-- Pin shadow/glow -->
  <ellipse cx="870" cy="530" rx="90" ry="18" fill="#1558F0" opacity="0.18"/>

  <!-- Map pin body (white) -->
  <path d="M870 130 C809 130 760 179 760 240 C760 316 870 430 870 430 C870 430 980 316 980 240 C980 179 931 130 870 130Z"
        fill="url(#ping)"/>

  <!-- 2x2 territory grid inside pin -->
  <rect x="832" y="185" width="30" height="30" rx="4" fill="#1558F0"/>
  <rect x="872" y="185" width="30" height="30" rx="4" fill="#1558F0" opacity="0.22"/>
  <rect x="832" y="225" width="30" height="30" rx="4" fill="#1558F0" opacity="0.22"/>
  <rect x="872" y="225" width="30" height="30" rx="4" fill="#1558F0"/>
</svg>`.trim();
}

async function generate() {
  const tasks = [
    { lang: 'de', file: 'og-image.png' },
    { lang: 'en', file: 'en/og-image.png' },
    { lang: 'fr', file: 'fr/og-image.png' },
    { lang: 'es', file: 'es/og-image.png' },
    { lang: 'it', file: 'it/og-image.png' },
    { lang: 'pt', file: 'pt/og-image.png' },
    { lang: 'tr', file: 'tr/og-image.png' },
    { lang: 'ru', file: 'ru/og-image.png' },
    { lang: 'ja', file: 'ja/og-image.png' },
    { lang: 'ko', file: 'ko/og-image.png' },
    { lang: 'zh', file: 'zh/og-image.png' },
    { lang: 'ar', file: 'ar/og-image.png' },
    { lang: 'hi', file: 'hi/og-image.png' },
  ];

  for (const { lang, file } of tasks) {
    const svg = buildSvg(lang);
    const outPath = path.join(OUT, file);
    await sharp(Buffer.from(svg))
      .resize(1200, 630)
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    console.log(`  ok  ${file}`);
  }

  console.log('\nAll og:images generated (1200x630px)');
}

generate().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
