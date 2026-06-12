/* Dev harness for Grid Runner — NOT served in production, never linked from app.
 * Generates a hardcoded sample level and drives the iframe via the host protocol.
 */
(function () {
  'use strict';

  var frame = document.getElementById('frame');
  var entries = document.getElementById('entries');
  var statusEl = document.getElementById('status');

  /* ----------------------------------------------------------------
   * Hardcoded sample level.
   * Layout: 14 platforms, gaps 2..4 (all jumpable: flat jump dist ~5.2),
   * varied surface heights 0..3, 8 spikes, 24 orbs, exitX 216.
   *
   * Each platform: { x, w, h }. A gap exists BETWEEN platform N end
   * (x+w) and platform N+1 start.
   * ---------------------------------------------------------------- */
  var platforms = [
    { x: 0,   w: 12, h: 0 },   // start runway
    { x: 16,  w: 10, h: 0 },   // gap 4
    { x: 29,  w: 8,  h: 1 },   // gap 3, step up
    { x: 40,  w: 9,  h: 1 },   // gap 3
    { x: 52,  w: 8,  h: 2 },   // gap 3, step up
    { x: 63,  w: 7,  h: 2 },   // gap 3
    { x: 73,  w: 9,  h: 1 },   // gap 3, step down
    { x: 85,  w: 8,  h: 0 },   // gap 3, down to baseline
    { x: 96,  w: 10, h: 0 },   // gap 3
    { x: 110, w: 8,  h: 2 },   // gap 4, step up
    { x: 121, w: 9,  h: 3 },   // gap 3, highest
    { x: 133, w: 10, h: 1 },   // gap 3, drop
    { x: 146, w: 14, h: 0 },   // gap 3, long stretch
    { x: 163, w: 53, h: 0 }    // gap 3, final approach -> reaches exitX 216
  ];

  // 8 spikes — each sits on a platform surface at tile x (avoid spawn/landing edges)
  var obstacles = [
    { x: 21 },   // on platform 1 (h0)
    { x: 34 },   // platform 2 (h1)
    { x: 45 },   // platform 3 (h1)
    { x: 78 },   // platform 6 (h1)
    { x: 101 },  // platform 8 (h0)
    { x: 138 },  // platform 11 (h1)
    { x: 152 },  // platform 12 (h0)
    { x: 180 }   // final stretch (h0)
  ];

  // 24 orbs — y = tiles ABOVE local platform surface (arcs over gaps too).
  // Over-gap orbs use y measured above baseline 0 (renderer treats pit base as 0).
  var orbs = [
    { x: 6,   y: 1 },
    { x: 14,  y: 2 },   // over gap arc
    { x: 19,  y: 1 },
    { x: 27,  y: 2 },   // over gap
    { x: 32,  y: 1 },
    { x: 38,  y: 3 },   // over gap arc
    { x: 44,  y: 2 },
    { x: 50,  y: 3 },   // over gap
    { x: 56,  y: 1 },
    { x: 67,  y: 1 },
    { x: 71,  y: 3 },   // over gap
    { x: 77,  y: 1 },
    { x: 89,  y: 1 },
    { x: 94,  y: 2 },   // over gap
    { x: 100, y: 1 },
    { x: 108, y: 3 },   // over gap, rising
    { x: 114, y: 1 },
    { x: 119, y: 3 },   // over gap
    { x: 125, y: 1 },
    { x: 131, y: 3 },   // over gap
    { x: 150, y: 1 },
    { x: 158, y: 2 },
    { x: 170, y: 1 },
    { x: 200, y: 1 }
  ];

  var sampleLevel = {
    version: 1,
    seed: 'dev-sample-001',
    worldLength: 220,
    tileSize: 32,
    playerSpeed: 6,
    gravity: 30,
    jumpVelocity: 13,
    platforms: platforms,
    obstacles: obstacles,
    orbs: orbs,
    exitX: 216,
    par: { orbCount: 24, maxScore: 390, minDurationMs: 29333 }
  };

  /* ----------------------------------------------------------------
   * Logging
   * ---------------------------------------------------------------- */
  function log(label, obj) {
    var div = document.createElement('div');
    div.className = 'entry';
    var head = document.createElement('span');
    head.className = 'ty';
    head.textContent = label + ' ';
    div.appendChild(head);
    div.appendChild(document.createTextNode(
      typeof obj === 'string' ? obj : JSON.stringify(obj, null, 1)
    ));
    entries.insertBefore(div, entries.firstChild);
  }

  /* ----------------------------------------------------------------
   * Send init
   * ---------------------------------------------------------------- */
  function sendInit() {
    var msg = { type: 'runner:init', level: sampleLevel };
    try {
      frame.contentWindow.postMessage(JSON.stringify(msg), '*');
      log('SENT', 'runner:init (' + orbs.length + ' orbs, ' +
        platforms.length + ' platforms, ' + obstacles.length + ' spikes)');
    } catch (e) {
      log('ERROR', String(e));
    }
  }

  /* ----------------------------------------------------------------
   * Receive messages from iframe
   * ---------------------------------------------------------------- */
  window.addEventListener('message', function (e) {
    if (e.source !== frame.contentWindow) return;
    var data = e.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch (err) { return; }
    }
    if (!data || !data.type) return;

    if (data.type === 'runner:ready') {
      statusEl.textContent = 'iframe ready — sending init';
      log('RECV', 'runner:ready');
      // auto-init shortly after ready
      setTimeout(sendInit, 150);
    } else if (data.type === 'runner:complete') {
      statusEl.textContent = 'run complete';
      log('RECV complete', data);
    } else if (data.type === 'runner:quit') {
      log('RECV', 'runner:quit');
    } else {
      log('RECV', data);
    }
  });

  document.getElementById('initBtn').addEventListener('click', sendInit);
  document.getElementById('reloadBtn').addEventListener('click', function () {
    statusEl.textContent = 'reloading…';
    frame.src = 'index.html?ts=' + Date.now();
  });
  document.getElementById('phoneBtn').addEventListener('click', function () {
    frame.classList.toggle('frame-phone');
  });

})();
