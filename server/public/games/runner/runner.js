/* Grid Runner — MapRaiders minigame
 * Vanilla ES2017, single classic script, no modules, no external resources.
 * Fixed-timestep physics (dt = 1/60), camera follow w/ look-ahead, DPR-aware canvas.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Palette / constants
   * ------------------------------------------------------------------ */
  var COL = {
    bg:     '#0C0914',
    panel:  '#161022',
    accent: '#9D4EDD',
    text:   '#ECE6F5',
    amber:  '#FFB300'
  };

  var TILE = 32;                 // reference px per tile
  var VISIBLE_TILES_Y = 12;      // visible world height in tiles
  var DT = 1 / 60;               // fixed physics timestep (seconds)
  var MAX_DT = 0.25;             // clamp huge frame gaps (tab switch)
  var COYOTE_TIME = 0.080;       // 80 ms
  var JUMP_BUFFER = 0.100;       // 100 ms
  var INVULN_TIME = 1.0;         // 1 s after respawn
  var HITBOX_SHRINK = 0.20;      // shrink AABB by 20%
  var MAX_PARTICLES = 80;
  var START_LIVES = 3;

  // Player dimensions in tiles
  var P_W = 1.0;
  var P_H = 1.5;

  /* ------------------------------------------------------------------ *
   * State machine
   * ------------------------------------------------------------------ */
  var STATE = { IDLE: 0, READY: 1, PLAYING: 2, END: 3 };

  /* ------------------------------------------------------------------ *
   * Canvas / DPR
   * ------------------------------------------------------------------ */
  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d', { alpha: false });
  var quitBtn = document.getElementById('quit-btn');

  var viewW = 0, viewH = 0;      // CSS pixels
  var dpr = 1;
  var scale = TILE;              // px per tile (recomputed on resize)

  function computeScale() {
    // visible height = 12 tiles, fit to screen height
    scale = viewH / VISIBLE_TILES_Y;
  }

  function resize() {
    viewW = window.innerWidth || document.documentElement.clientWidth;
    viewH = window.innerHeight || document.documentElement.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(viewW * dpr));
    canvas.height = Math.max(1, Math.round(viewH * dpr));
    canvas.style.width = viewW + 'px';
    canvas.style.height = viewH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    computeScale();
    buildGlowSprites();
  }

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', function () {
    // orientationchange fires before metrics settle on some Androids
    setTimeout(resize, 120);
  });

  /* ------------------------------------------------------------------ *
   * Host communication
   * ------------------------------------------------------------------ */
  function postToHost(msg) {
    var s;
    try { s = JSON.stringify(msg); } catch (e) { return; }
    try {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(s);
      }
    } catch (e) {}
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(s, '*');
      }
    } catch (e) {}
  }

  function handleHostMessage(raw) {
    var data = raw;
    if (typeof raw === 'string') {
      try { data = JSON.parse(raw); } catch (e) { return; }
    }
    if (!data || typeof data !== 'object') return;
    if (data.type === 'runner:init' && data.level) {
      loadLevel(data.level);
    }
  }

  window.addEventListener('message', function (e) { handleHostMessage(e.data); });
  // Android WebView also delivers postMessage to document
  document.addEventListener('message', function (e) { handleHostMessage(e.data); });

  /* ------------------------------------------------------------------ *
   * Game model
   * ------------------------------------------------------------------ */
  var game = {
    state: STATE.IDLE,
    level: null,

    // physics units: tiles, tiles/sec
    speed: 6,
    gravity: 30,
    jumpVel: 13,

    player: null,
    camX: 0,                 // camera left edge in tiles
    camLookAhead: 0,

    lives: START_LIVES,
    orbsCollected: 0,
    score: 0,

    // collected orb ids persist across deaths
    collected: null,         // boolean[]

    // input
    jumpHeld: false,
    jumpBufferTimer: 0,      // counts down while a recent press is queued

    // timing
    runStartMs: 0,
    runEndMs: 0,
    durationMs: 0,
    sampleTimer: 0,          // accumulates seconds for 1Hz sampling

    // trace
    trace: { jumps: 0, deaths: 0, samples: [] },

    finished: false,

    // fx
    shakeFrames: 0,
    shakeMag: 0,
    particles: [],
    parallax1: 0,
    parallax2: 0,
    bgTime: 0,

    // results breakdown for end screen
    breakdown: null
  };

  function newPlayer(x, surfaceY) {
    return {
      x: x,
      y: surfaceY,           // feet position (tiles, world up = +y)
      vy: 0,
      grounded: true,
      coyote: 0,             // remaining coyote time
      invuln: 0,
      scaleX: 1,             // squash/stretch
      scaleY: 1,
      respawnX: x,           // start of last platform passed
      respawnSurface: surfaceY
    };
  }

  /* ------------------------------------------------------------------ *
   * Level loading & helpers
   * ------------------------------------------------------------------ */
  function loadLevel(level) {
    game.level = level;
    game.speed = level.playerSpeed || 6;
    game.gravity = level.gravity || 30;
    game.jumpVel = level.jumpVelocity || 13;

    game.lives = START_LIVES;
    game.orbsCollected = 0;
    game.score = 0;
    game.collected = new Array((level.orbs || []).length);
    for (var i = 0; i < game.collected.length; i++) game.collected[i] = false;

    game.trace = { jumps: 0, deaths: 0, samples: [] };
    game.finished = false;
    game.particles.length = 0;
    game.shakeFrames = 0;
    game.breakdown = null;

    // build a quick lookup of platforms sorted by x
    game._platforms = (level.platforms || []).slice().sort(function (a, b) { return a.x - b.x; });

    // spawn at start of first platform
    var first = game._platforms.length ? game._platforms[0] : { x: 0, w: 4, h: 0 };
    var startSurface = first.h || 0;
    game.player = newPlayer(first.x + 0.5, startSurface);
    game.player.respawnX = game.player.x;
    game.player.respawnSurface = startSurface;
    game.camX = game.player.x - 4;

    game.state = STATE.READY;
    updateQuitBtn();
  }

  // Return the platform whose horizontal span contains tile-x (foot x), or null (over a pit).
  function platformAt(x) {
    var ps = game._platforms;
    if (!ps) return null;
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      if (x >= p.x && x < p.x + p.w) return p;
    }
    return null;
  }

  // Surface height at x (tiles), or null over a pit.
  function surfaceAt(x) {
    var p = platformAt(x);
    return p ? p.h : null;
  }

  // Start x of the platform the player is currently over/just passed (for respawn).
  function platformStartAt(x) {
    var p = platformAt(x);
    return p ? p : null;
  }

  /* ------------------------------------------------------------------ *
   * Input
   * ------------------------------------------------------------------ */
  function pressJump() {
    ensureAudio();
    if (game.state === STATE.READY) {
      startRun();
      return;
    }
    if (game.state === STATE.PLAYING) {
      game.jumpHeld = true;
      game.jumpBufferTimer = JUMP_BUFFER;
    }
  }

  function releaseJump() {
    game.jumpHeld = false;
  }

  // Pointer / touch on canvas
  function onPointerDown(e) {
    // ignore the quit button (handled separately)
    if (e.target === quitBtn) return;
    if (game.state === STATE.END) {
      handleEndScreenTap(e);
      return;
    }
    pressJump();
  }

  canvas.addEventListener('pointerdown', onPointerDown, { passive: true });
  canvas.addEventListener('pointerup', releaseJump, { passive: true });
  canvas.addEventListener('pointercancel', releaseJump, { passive: true });

  // Fallback touch (older WebViews without Pointer Events)
  if (!window.PointerEvent) {
    canvas.addEventListener('touchstart', function (e) {
      if (game.state === STATE.END) { handleEndScreenTap(e.changedTouches[0]); }
      else { pressJump(); }
    }, { passive: true });
    canvas.addEventListener('touchend', releaseJump, { passive: true });
  }

  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!e.repeat) {
        if (game.state === STATE.END) { confirmDone(); }
        else { pressJump(); }
      }
    }
  });
  window.addEventListener('keyup', function (e) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === ' ' || e.key === 'ArrowUp') {
      releaseJump();
    }
  });

  // End-screen DONE button hit area (computed during render)
  var doneBtnRect = null;

  function handleEndScreenTap(pt) {
    if (!doneBtnRect || !pt) { confirmDone(); return; }
    var rect = canvas.getBoundingClientRect();
    var px = pt.clientX - rect.left;
    var py = pt.clientY - rect.top;
    if (px >= doneBtnRect.x && px <= doneBtnRect.x + doneBtnRect.w &&
        py >= doneBtnRect.y && py <= doneBtnRect.y + doneBtnRect.h) {
      confirmDone();
    }
  }

  // Quit button
  quitBtn.addEventListener('click', function () {
    postToHost({ type: 'runner:quit' });
  });

  function updateQuitBtn() {
    if (game.state === STATE.READY || game.state === STATE.END) {
      quitBtn.classList.add('visible');
    } else {
      quitBtn.classList.remove('visible');
    }
  }

  /* ------------------------------------------------------------------ *
   * Run lifecycle
   * ------------------------------------------------------------------ */
  function startRun() {
    game.state = STATE.PLAYING;
    game.runStartMs = now();
    game.sampleTimer = 0;
    // immediate first sample at t=0
    pushSample(0);
    updateQuitBtn();
  }

  function pushSample(tMs) {
    if (game.trace.samples.length >= 120) return;
    game.trace.samples.push({ t: Math.round(tMs), x: Math.round(game.player.x) });
  }

  function endRun(finished) {
    game.finished = finished;
    game.runEndMs = now();
    game.durationMs = Math.max(0, Math.round(game.runEndMs - game.runStartMs));
    game.state = STATE.END;
    computeBreakdown();
    bleep(finished ? 'finish' : 'death');
    updateQuitBtn();
  }

  function computeBreakdown() {
    var orbScore = game.orbsCollected * 10;
    var finishBonus = game.finished ? 100 : 0;
    var timeBonus = 0;
    if (game.finished && game.level && game.level.par) {
      var minDur = game.level.par.minDurationMs || 0;
      var over = Math.max(0, Math.floor((game.durationMs - minDur) / 1000));
      timeBonus = Math.max(0, 50 - over);
    }
    var total = orbScore + finishBonus + timeBonus;
    game.score = total;
    game.breakdown = {
      orbs: orbScore,
      finish: finishBonus,
      time: timeBonus,
      total: total
    };
  }

  function confirmDone() {
    if (game.state !== STATE.END) return;
    postToHost({
      type: 'runner:complete',
      score: game.score,
      durationMs: game.durationMs,
      orbsCollected: game.orbsCollected,
      finished: game.finished,
      trace: {
        jumps: game.trace.jumps,
        deaths: game.trace.deaths,
        samples: game.trace.samples
      }
    });
    // lock to prevent double-post
    game.state = STATE.IDLE;
    updateQuitBtn();
  }

  /* ------------------------------------------------------------------ *
   * Death & respawn
   * ------------------------------------------------------------------ */
  function killPlayer() {
    if (game.player.invuln > 0) return;
    game.trace.deaths++;
    game.lives--;
    game.shakeFrames = 3;
    game.shakeMag = 0.55;     // in tiles
    burst(game.player.x, game.player.y + P_H * 0.5, COL.amber, 18);
    bleep('death');

    if (game.lives <= 0) {
      // out of lives -> run complete, not finished
      // score = orbs only (computeBreakdown handles finished=false)
      endRun(false);
      return;
    }
    respawn();
  }

  function respawn() {
    var p = game.player;
    p.x = p.respawnX;
    p.y = p.respawnSurface;
    p.vy = 0;
    p.grounded = true;
    p.coyote = 0;
    p.invuln = INVULN_TIME;
    p.scaleX = 1;
    p.scaleY = 1;
    game.jumpHeld = false;
    game.jumpBufferTimer = 0;
  }

  /* ------------------------------------------------------------------ *
   * Fixed-timestep physics step
   * ------------------------------------------------------------------ */
  function step(dt) {
    var p = game.player;
    var lvl = game.level;

    // advance world fx clocks even when not playing handled in render; here only play
    // horizontal auto-run
    p.x += game.speed * dt;

    // timers
    if (p.invuln > 0) p.invuln = Math.max(0, p.invuln - dt);
    if (game.jumpBufferTimer > 0) game.jumpBufferTimer -= dt;

    // determine surface under feet
    var surf = surfaceAt(p.x);
    var overPit = (surf === null);

    // coyote time bookkeeping
    if (p.grounded) {
      p.coyote = COYOTE_TIME;
    } else if (p.coyote > 0) {
      p.coyote -= dt;
    }

    // try jump (buffered press + grounded/coyote)
    if (game.jumpBufferTimer > 0 && (p.grounded || p.coyote > 0)) {
      p.vy = game.jumpVel;
      p.grounded = false;
      p.coyote = 0;
      game.jumpBufferTimer = 0;
      game.trace.jumps++;
      // squash -> stretch on jump
      p.scaleX = 0.78;
      p.scaleY = 1.28;
      bleep('jump');
    }

    // variable jump: releasing early cuts upward velocity in half (cap)
    if (!game.jumpHeld && p.vy > 0) {
      var cut = game.jumpVel * 0.5;
      if (p.vy > cut) p.vy = cut;
    }

    // gravity
    p.vy -= game.gravity * dt;
    p.y += p.vy * dt;

    // landing / ground collision
    if (!overPit) {
      if (p.y <= surf) {
        if (!p.grounded && p.vy <= 0) {
          // land
          p.y = surf;
          p.vy = 0;
          p.grounded = true;
          p.scaleX = 1.25;     // squash on land
          p.scaleY = 0.74;
          dustBurst(p.x, surf);
          bleep('land');
        } else {
          p.y = surf;
          if (p.vy < 0) p.vy = 0;
          p.grounded = true;
        }
      } else {
        p.grounded = false;
      }
    } else {
      p.grounded = false;
    }

    // ease squash/stretch back toward 1
    p.scaleX += (1 - p.scaleX) * Math.min(1, dt * 12);
    p.scaleY += (1 - p.scaleY) * Math.min(1, dt * 12);

    // update respawn anchor: start of platform currently standing on
    if (p.grounded) {
      var pl = platformStartAt(p.x);
      if (pl) {
        p.respawnX = pl.x + 0.5;
        p.respawnSurface = pl.h;
      }
    }

    // pit death: fell below baseline-1 while over a gap
    if (overPit && p.y < -1) {
      killPlayer();
      return;
    }
    // also guard: deep fall anywhere
    if (p.y < -3) {
      killPlayer();
      return;
    }

    // spike collisions (AABB w/ 20% shrink). Spike = 1x1 standing on platform surface at tile x.
    if (p.invuln <= 0 && lvl.obstacles) {
      var pHalfW = (P_W * (1 - HITBOX_SHRINK)) * 0.5;
      var pCx = p.x;
      var pBottom = p.y;
      var pTop = p.y + P_H * (1 - HITBOX_SHRINK);
      for (var i = 0; i < lvl.obstacles.length; i++) {
        var ox = lvl.obstacles[i].x;
        var oSurf = surfaceAt(ox + 0.5);
        if (oSurf === null) continue;
        // spike AABB shrunk 20%
        var sShrink = 1 - HITBOX_SHRINK;
        var sHalf = 0.5 * sShrink;
        var sCx = ox + 0.5;
        var sBottom = oSurf + (1 - sShrink) * 0.5;
        var sTop = oSurf + sShrink + (1 - sShrink) * 0.5;
        // horizontal overlap
        if (Math.abs(pCx - sCx) < (pHalfW + sHalf) &&
            pBottom < sTop && pTop > sBottom) {
          killPlayer();
          return;
        }
      }
    }

    // orb pickups (AABB)
    if (lvl.orbs) {
      var oHalfW = 0.5 * (1 - HITBOX_SHRINK) + 0.35; // a bit forgiving
      for (var k = 0; k < lvl.orbs.length; k++) {
        if (game.collected[k]) continue;
        var orb = lvl.orbs[k];
        var localSurf = surfaceAt(orb.x + 0.5);
        var baseSurf = (localSurf === null) ? 0 : localSurf;
        var oy = baseSurf + orb.y + 0.5; // center height
        var ocx = orb.x + 0.5;
        if (Math.abs(p.x - ocx) < oHalfW &&
            Math.abs((p.y + P_H * 0.5) - oy) < (P_H * 0.5 + 0.6)) {
          game.collected[k] = true;
          game.orbsCollected++;
          game.score += 10;
          orbBurst(ocx, oy);
          bleep('orb');
        }
      }
    }

    // finish check: reached exit with feet on ground
    if (p.x >= lvl.exitX && p.grounded) {
      endRun(true);
      return;
    }
    // safety: if somehow past worldLength, finish
    if (p.x >= lvl.worldLength) {
      endRun(true);
      return;
    }
  }

  /* ------------------------------------------------------------------ *
   * Particles
   * ------------------------------------------------------------------ */
  function spawnParticle(px, py, vx, vy, life, color, size, additive) {
    if (game.particles.length >= MAX_PARTICLES) {
      // drop oldest
      game.particles.shift();
    }
    game.particles.push({
      x: px, y: py, vx: vx, vy: vy,
      life: life, max: life, color: color, size: size, add: !!additive
    });
  }

  function trailParticle() {
    var p = game.player;
    spawnParticle(
      p.x - 0.35, p.y + P_H * 0.55,
      -0.6 - Math.random() * 0.4, 0.2 + Math.random() * 0.3,
      0.45, COL.accent, 0.16 + Math.random() * 0.1, true
    );
  }

  function dustBurst(x, surf) {
    for (var i = 0; i < 5; i++) {
      spawnParticle(
        x + (Math.random() - 0.5) * 0.4, surf + 0.05,
        (Math.random() - 0.5) * 2.2, 0.8 + Math.random() * 1.4,
        0.4, '#5a4b73', 0.14, false
      );
    }
  }

  function burst(x, y, color, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 2 + Math.random() * 5;
      spawnParticle(x, y, Math.cos(a) * sp, Math.sin(a) * sp,
        0.5 + Math.random() * 0.3, color, 0.16 + Math.random() * 0.12, true);
    }
  }

  function orbBurst(x, y) {
    for (var i = 0; i < 10; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = 1.5 + Math.random() * 3.5;
      spawnParticle(x, y, Math.cos(a) * sp, Math.sin(a) * sp,
        0.45, i % 2 ? COL.amber : COL.accent, 0.14 + Math.random() * 0.1, true);
    }
  }

  function updateParticles(dt) {
    var ps = game.particles;
    for (var i = ps.length - 1; i >= 0; i--) {
      var pt = ps[i];
      pt.life -= dt;
      if (pt.life <= 0) { ps.splice(i, 1); continue; }
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy -= 8 * dt;          // gravity-ish drift downward (world up = +y)
      pt.vx *= 0.96;
    }
  }

  /* ------------------------------------------------------------------ *
   * Precomputed glow sprites (offscreen canvases) for perf
   * ------------------------------------------------------------------ */
  var glowOrbViolet = null, glowOrbAmber = null, glowDrone = null;

  function makeGlowSprite(radiusPx, color) {
    var s = Math.ceil(radiusPx * 2);
    var c = document.createElement('canvas');
    c.width = s; c.height = s;
    var g = c.getContext('2d');
    var grd = g.createRadialGradient(radiusPx, radiusPx, 0, radiusPx, radiusPx, radiusPx);
    grd.addColorStop(0, color);
    grd.addColorStop(0.35, color);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.globalAlpha = 1;
    g.beginPath();
    g.arc(radiusPx, radiusPx, radiusPx, 0, Math.PI * 2);
    g.fill();
    return c;
  }

  function buildGlowSprites() {
    var r = scale * 0.9;
    glowOrbViolet = makeGlowSprite(r, 'rgba(157,78,221,0.55)');
    glowOrbAmber = makeGlowSprite(r, 'rgba(255,179,0,0.55)');
    glowDrone = makeGlowSprite(scale * 1.6, 'rgba(157,78,221,0.35)');
  }

  /* ------------------------------------------------------------------ *
   * Coordinate transform: world tiles -> screen px
   * world y up = +y ; baseline (y=0) sits near bottom.
   * ------------------------------------------------------------------ */
  var BASELINE_FROM_BOTTOM = 2.5;  // tiles of pit visible below baseline

  function worldToScreenX(tx, camX) {
    return (tx - camX) * scale;
  }
  function worldToScreenY(ty) {
    // baseline placed BASELINE_FROM_BOTTOM tiles above bottom
    var baselineScreen = viewH - BASELINE_FROM_BOTTOM * scale;
    return baselineScreen - ty * scale;
  }

  /* ------------------------------------------------------------------ *
   * Rendering
   * ------------------------------------------------------------------ */
  function render() {
    // background
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, viewW, viewH);

    if (game.state === STATE.IDLE && !game.level) {
      drawParallax(0);
      drawIdleScreen();
      return;
    }

    // camera with shake
    var shakeX = 0, shakeY = 0;
    if (game.shakeFrames > 0) {
      shakeX = (Math.random() - 0.5) * game.shakeMag * scale;
      shakeY = (Math.random() - 0.5) * game.shakeMag * scale;
    }
    var camX = game.camX;

    drawParallax(camX);

    ctx.save();
    ctx.translate(shakeX, shakeY);

    drawWorld(camX);
    drawParticles(camX);
    if (game.state === STATE.PLAYING || game.state === STATE.END) {
      drawPlayer(camX);
    }

    ctx.restore();

    if (game.state === STATE.PLAYING) {
      drawHUD();
    } else if (game.state === STATE.READY) {
      drawHUD();
      drawReadyScreen();
    } else if (game.state === STATE.END) {
      drawEndScreen();
    }
  }

  function drawParallax(camX) {
    var t = game.bgTime;
    // Layer 1 (far): dim grid lines drifting slow
    var baselineScreen = viewH - BASELINE_FROM_BOTTOM * scale;
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = 'rgba(60,42,92,0.35)';
    ctx.lineWidth = 1;
    var spacing1 = scale * 3;
    var off1 = (-(camX * scale * 0.2) - t * 6) % spacing1;
    ctx.beginPath();
    for (var x = off1; x < viewW + spacing1; x += spacing1) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, baselineScreen);
    }
    // a few faint horizontal lines
    for (var hy = scale * 1.5; hy < baselineScreen; hy += scale * 2.5) {
      ctx.moveTo(0, hy);
      ctx.lineTo(viewW, hy);
    }
    ctx.stroke();
    ctx.restore();

    // Layer 2 (near): dim geometric ruins (rectangular silhouettes) drifting faster
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = 'rgba(22,16,34,0.85)';
    var spacing2 = scale * 7;
    var off2 = (-(camX * scale * 0.45) - t * 14) % spacing2;
    for (var rx = off2; rx < viewW + spacing2; rx += spacing2) {
      var h = scale * (2.2 + ((Math.floor((rx - off2) / spacing2) * 53) % 7) * 0.35);
      var w = scale * 1.6;
      ctx.fillRect(rx, baselineScreen - h, w, h);
      // thin violet top accent
      ctx.fillStyle = 'rgba(157,78,221,0.12)';
      ctx.fillRect(rx, baselineScreen - h, w, 2);
      ctx.fillStyle = 'rgba(22,16,34,0.85)';
    }
    ctx.restore();
  }

  function drawWorld(camX) {
    var lvl = game.level;
    if (!lvl) return;

    var baselineScreen = viewH - BASELINE_FROM_BOTTOM * scale;
    var leftTile = camX - 1;
    var rightTile = camX + viewW / scale + 1;

    // pit glow band below baseline (drawn first as backdrop chasm)
    var pitGrad = ctx.createLinearGradient(0, baselineScreen, 0, viewH);
    pitGrad.addColorStop(0, 'rgba(157,78,221,0.10)');
    pitGrad.addColorStop(0.4, 'rgba(80,30,140,0.05)');
    pitGrad.addColorStop(1, 'rgba(12,9,20,0)');
    ctx.fillStyle = pitGrad;
    ctx.fillRect(0, baselineScreen, viewW, viewH - baselineScreen);

    // platforms
    var ps = game._platforms;
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      if (p.x + p.w < leftTile || p.x > rightTile) continue;
      var sx = worldToScreenX(p.x, camX);
      var topY = worldToScreenY(p.h);
      var w = p.w * scale;
      var slabH = (p.h + BASELINE_FROM_BOTTOM) * scale + scale; // extends below to bottom
      // slab body
      ctx.fillStyle = COL.panel;
      ctx.fillRect(sx, topY, w, slabH);
      // darker base shade
      ctx.fillStyle = 'rgba(8,6,14,0.55)';
      ctx.fillRect(sx, topY + scale * 0.5, w, slabH - scale * 0.5);
      // thin violet top edge glow
      ctx.fillStyle = COL.accent;
      ctx.fillRect(sx, topY - 2, w, 3);
      ctx.fillStyle = 'rgba(157,78,221,0.25)';
      ctx.fillRect(sx, topY + 1, w, 2);
    }

    // spikes (amber warning triangles)
    if (lvl.obstacles) {
      ctx.fillStyle = COL.amber;
      for (var s = 0; s < lvl.obstacles.length; s++) {
        var ox = lvl.obstacles[s].x;
        if (ox + 1 < leftTile || ox > rightTile) continue;
        var oSurf = surfaceAt(ox + 0.5);
        if (oSurf === null) continue;
        var bx = worldToScreenX(ox, camX);
        var by = worldToScreenY(oSurf);
        ctx.beginPath();
        ctx.moveTo(bx + scale * 0.1, by);
        ctx.lineTo(bx + scale * 0.5, by - scale * 0.95);
        ctx.lineTo(bx + scale * 0.9, by);
        ctx.closePath();
        ctx.fill();
        // inner dark notch
        ctx.fillStyle = 'rgba(60,30,0,0.55)';
        ctx.beginPath();
        ctx.moveTo(bx + scale * 0.35, by - scale * 0.06);
        ctx.lineTo(bx + scale * 0.5, by - scale * 0.55);
        ctx.lineTo(bx + scale * 0.65, by - scale * 0.06);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = COL.amber;
      }
    }

    // orbs (precomputed glow sprite + core)
    if (lvl.orbs) {
      var pulse = 0.5 + 0.5 * Math.sin(game.bgTime * 4);
      for (var o = 0; o < lvl.orbs.length; o++) {
        if (game.collected[o]) continue;
        var orb = lvl.orbs[o];
        if (orb.x + 1 < leftTile || orb.x > rightTile) continue;
        var localSurf = surfaceAt(orb.x + 0.5);
        var baseSurf = (localSurf === null) ? 0 : localSurf;
        var oy = baseSurf + orb.y + 0.5;
        var cx = worldToScreenX(orb.x + 0.5, camX);
        var cy = worldToScreenY(oy);
        var glow = (o % 2) ? glowOrbAmber : glowOrbViolet;
        if (glow) {
          var gs = glow.width * (0.85 + pulse * 0.3);
          ctx.globalAlpha = 0.85;
          ctx.drawImage(glow, cx - gs / 2, cy - gs / 2, gs, gs);
          ctx.globalAlpha = 1;
        }
        // core
        ctx.fillStyle = (o % 2) ? COL.amber : COL.accent;
        ctx.beginPath();
        ctx.arc(cx, cy, scale * (0.22 + pulse * 0.05), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(cx, cy, scale * 0.09, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // exit: tall vertical light beam
    var ex = worldToScreenX(lvl.exitX, camX);
    if (ex > -scale * 2 && ex < viewW + scale * 2) {
      var beamGrad = ctx.createLinearGradient(ex, 0, ex, baselineScreen);
      beamGrad.addColorStop(0, 'rgba(157,78,221,0.0)');
      beamGrad.addColorStop(0.5, 'rgba(157,78,221,0.30)');
      beamGrad.addColorStop(1, 'rgba(255,179,0,0.35)');
      ctx.fillStyle = beamGrad;
      var beamW = scale * 0.7;
      ctx.fillRect(ex - beamW / 2, 0, beamW, baselineScreen);
      // bright core line
      ctx.fillStyle = 'rgba(236,230,245,0.55)';
      ctx.fillRect(ex - 1.5, baselineScreen * 0.15, 3, baselineScreen * 0.85);
      // pulsing top node
      var ip = 0.5 + 0.5 * Math.sin(game.bgTime * 3);
      ctx.fillStyle = COL.amber;
      ctx.beginPath();
      ctx.arc(ex, baselineScreen * 0.12, scale * (0.18 + ip * 0.08), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawParticles(camX) {
    var ps = game.particles;
    for (var i = 0; i < ps.length; i++) {
      var pt = ps[i];
      var sx = worldToScreenX(pt.x, camX);
      var sy = worldToScreenY(pt.y);
      var a = Math.max(0, pt.life / pt.max);
      if (pt.add) ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = a;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(sx, sy, pt.size * scale * (0.6 + a * 0.6), 0, Math.PI * 2);
      ctx.fill();
      if (pt.add) ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
  }

  function drawPlayer(camX) {
    var p = game.player;
    var cx = worldToScreenX(p.x, camX);
    // feet at p.y; body extends up P_H tiles
    var feetY = worldToScreenY(p.y);
    var bodyH = P_H * scale * p.scaleY;
    var bodyW = P_W * scale * p.scaleX;

    // invuln blink
    if (p.invuln > 0) {
      var blink = Math.floor(game.bgTime * 20) % 2;
      if (blink === 0) {
        // skip drawing this frame for blink effect, but still draw glow faintly
      }
    }
    var blinkHide = (p.invuln > 0) && (Math.floor(game.bgTime * 20) % 2 === 0);

    // soft glow under drone
    if (glowDrone) {
      var gs = glowDrone.width;
      ctx.globalAlpha = blinkHide ? 0.15 : 0.6;
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(glowDrone, cx - gs / 2, feetY - bodyH * 0.6 - gs / 2, gs, gs);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    if (blinkHide) return;

    // Drone body: a geometric hovering raider — hexagonal core + wing fins + eye.
    var centerY = feetY - bodyH * 0.55;
    ctx.save();
    ctx.translate(cx, centerY);

    var w = bodyW * 0.5;
    var h = bodyH * 0.5;

    // outer hull (violet) — angular diamond/hex
    ctx.fillStyle = '#2a1d44';
    ctx.strokeStyle = COL.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -h);            // top
    ctx.lineTo(w, -h * 0.25);     // upper right
    ctx.lineTo(w * 0.7, h);       // lower right
    ctx.lineTo(-w * 0.7, h);      // lower left
    ctx.lineTo(-w, -h * 0.25);    // upper left
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // wing fins
    ctx.fillStyle = COL.accent;
    ctx.beginPath();
    ctx.moveTo(-w, -h * 0.25);
    ctx.lineTo(-w * 1.5, h * 0.1);
    ctx.lineTo(-w * 0.85, h * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w, -h * 0.25);
    ctx.lineTo(w * 1.5, h * 0.1);
    ctx.lineTo(w * 0.85, h * 0.35);
    ctx.closePath();
    ctx.fill();

    // glowing eye core (amber)
    ctx.fillStyle = COL.amber;
    ctx.beginPath();
    ctx.arc(0, -h * 0.1, w * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(0, -h * 0.1, w * 0.16, 0, Math.PI * 2);
    ctx.fill();

    // thruster glow at bottom
    ctx.fillStyle = 'rgba(157,78,221,0.7)';
    ctx.beginPath();
    ctx.moveTo(-w * 0.35, h);
    ctx.lineTo(0, h + h * 0.5);
    ctx.lineTo(w * 0.35, h);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /* ------------------------------------------------------------------ *
   * HUD
   * ------------------------------------------------------------------ */
  function drawHUD() {
    var pad = 16;
    var topInset = 8;

    // lives: 3 diamonds top-left
    var dSize = 14;
    for (var i = 0; i < START_LIVES; i++) {
      var x = pad + i * (dSize + 8) + dSize / 2;
      var y = pad + topInset + dSize / 2;
      var filled = i < game.lives;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      if (filled) {
        ctx.fillStyle = COL.accent;
        ctx.fillRect(-dSize / 2, -dSize / 2, dSize, dSize);
        ctx.fillStyle = 'rgba(236,230,245,0.6)';
        ctx.fillRect(-dSize / 2, -dSize / 2, dSize / 2, dSize / 2);
      } else {
        ctx.strokeStyle = 'rgba(157,78,221,0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-dSize / 2, -dSize / 2, dSize, dSize);
      }
      ctx.restore();
    }

    // score top-right
    ctx.fillStyle = COL.text;
    ctx.font = '700 22px ' + sysFont();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(String(game.score), viewW - pad - 50, pad + topInset);
    ctx.fillStyle = COL.amber;
    ctx.font = '600 12px ' + sysFont();
    ctx.fillText('SCORE', viewW - pad - 50, pad + topInset + 26);

    // orb counter (small, under score)
    if (game.level) {
      ctx.fillStyle = 'rgba(255,179,0,0.9)';
      ctx.font = '600 13px ' + sysFont();
      ctx.textAlign = 'right';
      ctx.fillText('◈ ' + game.orbsCollected + '/' + game.level.orbs.length,
        viewW - pad, pad + topInset);
    }

    ctx.textAlign = 'left';

    // progress bar (thin, top center)
    if (game.level) {
      var barW = Math.min(viewW * 0.5, 280);
      var barX = (viewW - barW) / 2;
      var barY = pad + topInset + 4;
      var prog = Math.max(0, Math.min(1, game.player.x / game.level.worldLength));
      ctx.fillStyle = 'rgba(157,78,221,0.18)';
      ctx.fillRect(barX, barY, barW, 4);
      ctx.fillStyle = COL.accent;
      ctx.fillRect(barX, barY, barW * prog, 4);
      // exit marker
      var exitProg = Math.max(0, Math.min(1, game.level.exitX / game.level.worldLength));
      ctx.fillStyle = COL.amber;
      ctx.fillRect(barX + barW * exitProg - 1, barY - 2, 2, 8);
    }
  }

  /* ------------------------------------------------------------------ *
   * Screens (overlays)
   * ------------------------------------------------------------------ */
  function dimOverlay(alpha) {
    ctx.fillStyle = 'rgba(12,9,20,' + alpha + ')';
    ctx.fillRect(0, 0, viewW, viewH);
  }

  function drawIdleScreen() {
    dimOverlay(0.55);
    ctx.fillStyle = COL.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 20px ' + sysFont();
    var dots = '.'.repeat(1 + (Math.floor(game.bgTime * 2) % 3));
    ctx.fillText('INITIALISIERE' + dots, viewW / 2, viewH / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  function drawReadyScreen() {
    dimOverlay(0.62);
    var cx = viewW / 2;
    var cy = viewH / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Title
    ctx.fillStyle = COL.text;
    ctx.font = '800 ' + Math.round(Math.min(viewW * 0.11, 56)) + 'px ' + sysFont();
    ctx.fillText('GRID RUNNER', cx, cy - 70);

    // accent underline
    ctx.fillStyle = COL.accent;
    ctx.fillRect(cx - 110, cy - 42, 220, 3);

    // subtitle
    ctx.fillStyle = 'rgba(236,230,245,0.8)';
    ctx.font = '500 15px ' + sysFont();
    ctx.fillText('Tap to jump  ·  Collect the data orbs  ·  Reach the uplink', cx, cy - 8);

    // big START button
    var bw = 200, bh = 56;
    var bx = cx - bw / 2, by = cy + 30;
    var pulse = 0.5 + 0.5 * Math.sin(game.bgTime * 3);
    ctx.fillStyle = COL.panel;
    roundRect(bx, by, bw, bh, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(157,78,221,' + (0.6 + pulse * 0.4) + ')';
    ctx.lineWidth = 2;
    roundRect(bx, by, bw, bh, 12);
    ctx.stroke();
    ctx.fillStyle = COL.accent;
    ctx.font = '800 24px ' + sysFont();
    ctx.fillText('START', cx, by + bh / 2 + 1);

    ctx.fillStyle = 'rgba(236,230,245,0.4)';
    ctx.font = '500 12px ' + sysFont();
    ctx.fillText('tap anywhere', cx, by + bh + 22);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  function drawEndScreen() {
    dimOverlay(0.72);
    var b = game.breakdown || { orbs: 0, finish: 0, time: 0, total: game.score };
    var cx = viewW / 2;
    var top = viewH / 2 - 130;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // header
    ctx.fillStyle = game.finished ? COL.amber : 'rgba(236,230,245,0.85)';
    ctx.font = '800 30px ' + sysFont();
    ctx.fillText(game.finished ? 'UPLINK REACHED' : 'RUN ENDED', cx, top);

    ctx.fillStyle = COL.accent;
    ctx.fillRect(cx - 90, top + 24, 180, 2);

    // breakdown lines
    var lineY = top + 60;
    var lh = 30;
    var lw = Math.min(viewW * 0.7, 300);
    var lx = cx - lw / 2;

    function line(label, val, color) {
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(236,230,245,0.8)';
      ctx.font = '500 16px ' + sysFont();
      ctx.fillText(label, lx, lineY);
      ctx.textAlign = 'right';
      ctx.fillStyle = color || COL.text;
      ctx.font = '700 16px ' + sysFont();
      ctx.fillText(val, lx + lw, lineY);
      lineY += lh;
    }

    line('Orbs (' + game.orbsCollected + '×10)', '+' + b.orbs, COL.amber);
    line('Uplink Bonus', '+' + b.finish, game.finished ? COL.accent : 'rgba(236,230,245,0.35)');
    line('Time Bonus', '+' + b.time, COL.accent);

    // divider
    ctx.fillStyle = 'rgba(157,78,221,0.3)';
    ctx.fillRect(lx, lineY - 4, lw, 1);
    lineY += 12;

    // total
    ctx.textAlign = 'left';
    ctx.fillStyle = COL.text;
    ctx.font = '800 22px ' + sysFont();
    ctx.fillText('TOTAL', lx, lineY);
    ctx.textAlign = 'right';
    ctx.fillStyle = COL.amber;
    ctx.font = '800 24px ' + sysFont();
    ctx.fillText(String(b.total), lx + lw, lineY);
    lineY += lh + 12;

    // DONE button
    var bw = 180, bh = 52;
    var bx = cx - bw / 2, by = lineY;
    ctx.fillStyle = COL.accent;
    roundRect(bx, by, bw, bh, 12);
    ctx.fill();
    ctx.fillStyle = COL.bg;
    ctx.font = '800 22px ' + sysFont();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DONE', cx, by + bh / 2 + 1);

    doneBtnRect = { x: bx, y: by, w: bw, h: bh };

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  /* ------------------------------------------------------------------ *
   * Canvas helpers
   * ------------------------------------------------------------------ */
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function sysFont() {
    return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  }

  /* ------------------------------------------------------------------ *
   * WebAudio bleeps (lazy, fail-silent)
   * ------------------------------------------------------------------ */
  var audioCtx = null;
  var audioReady = false;

  function ensureAudio() {
    if (audioReady) return;
    audioReady = true;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = new AC();
    } catch (e) { audioCtx = null; }
  }

  function bleep(kind) {
    if (!audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var t = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      var f0 = 440, f1 = 440, dur = 0.1, type = 'square', vol = 0.08;
      if (kind === 'jump') { f0 = 320; f1 = 620; dur = 0.12; type = 'square'; }
      else if (kind === 'orb') { f0 = 880; f1 = 1320; dur = 0.10; type = 'triangle'; vol = 0.07; }
      else if (kind === 'land') { f0 = 220; f1 = 140; dur = 0.07; type = 'sine'; vol = 0.05; }
      else if (kind === 'death') { f0 = 300; f1 = 70; dur = 0.35; type = 'sawtooth'; vol = 0.10; }
      else if (kind === 'finish') { f0 = 520; f1 = 1040; dur = 0.4; type = 'triangle'; vol = 0.09; }
      osc.type = type;
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch (e) {}
  }

  /* ------------------------------------------------------------------ *
   * Main loop (fixed timestep accumulator)
   * ------------------------------------------------------------------ */
  function now() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  var lastTime = now();
  var accumulator = 0;

  function frame() {
    var t = now();
    var elapsed = (t - lastTime) / 1000;
    lastTime = t;
    if (elapsed > MAX_DT) elapsed = MAX_DT;

    // always advance background time for animated screens
    game.bgTime += elapsed;
    game.parallax1 += elapsed;
    game.parallax2 += elapsed;

    if (game.state === STATE.PLAYING) {
      accumulator += elapsed;
      var steps = 0;
      while (accumulator >= DT && steps < 6) {
        step(DT);
        accumulator -= DT;
        steps++;
        if (game.state !== STATE.PLAYING) break; // ended mid-substep
      }

      // particles + trail run on render dt (visual only)
      if (game.state === STATE.PLAYING) {
        if (Math.random() < 0.7) trailParticle();

        // camera follow with look-ahead
        var p = game.player;
        var targetCam = p.x - viewW / scale * 0.35 + game.speed * 0.45; // look-ahead
        game.camX += (targetCam - game.camX) * Math.min(1, elapsed * 8);

        // 1Hz position sampling
        game.sampleTimer += elapsed;
        if (game.sampleTimer >= 1.0) {
          game.sampleTimer -= 1.0;
          pushSample(now() - game.runStartMs);
        }
      }
    }

    updateParticles(elapsed);

    if (game.shakeFrames > 0) game.shakeFrames--;

    render();
    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */
  resize();
  game.state = STATE.IDLE;
  postToHost({ type: 'runner:ready' });
  requestAnimationFrame(frame);

})();
