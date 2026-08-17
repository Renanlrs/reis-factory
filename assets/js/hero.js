/* ══════════════════════════════════════════════════════════════
   hero.js — "skyline de dados": barras 3D em canvas 2D puro,
   sem biblioteca, sem asset externo. É o mesmo gesto do logotipo
   (barras crescendo) virando cenário.
   ══════════════════════════════════════════════════════════════ */
(() => {
  const canvas = document.getElementById('skyline');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LIME = [171, 255, 2];
  const STEEL = [216, 228, 226];

  let W = 0, H = 0, dpr = 1, cx = 0, cy = 0, focal = 0;

  /* ── malha de barras ── */
  const GRID = 23;          // GRID x GRID barras
  const SPACING = 2.05;     // distância entre centros
  const BAR = 0.58;         // meia-largura da barra
  const bars = [];

  const rnd = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(20260817);

  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const x = (i - (GRID - 1) / 2) * SPACING;
      const z = (j - (GRID - 1) / 2) * SPACING;
      const dist = Math.hypot(x, z);
      // quadras: abre um "corredor" no meio pra câmera respirar
      if (dist < 3.2) continue;
      const base = 0.7 + rnd() * 3.2;
      const falloff = Math.max(0.2, 1 - dist / (GRID * SPACING * 0.7));
      bars.push({
        x, z,
        h: base * (0.5 + falloff * 1.4),
        h0: base * (0.5 + falloff * 1.4),
        spd: 0.35 + rnd() * 0.9,
        ph: rnd() * Math.PI * 2,
        lime: rnd() < 0.13,
        pulse: rnd() < 0.2 ? rnd() : -1, // 0..1 = posição do pulso subindo
        pspd: 0.25 + rnd() * 0.5,
      });
    }
  }

  /* ── câmera ── */
  const cam = { yaw: 0.5, pitch: 0.40, dist: 34, height: 13 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2;
    cy = H * 0.58;
    focal = Math.max(760, Math.min(W, H * 1.6) * 1.05);
  }

  /* projeta ponto do mundo → tela; devolve null se atrás da câmera */
  function project(x, y, z) {
    const cyw = Math.cos(cam.yaw), syw = Math.sin(cam.yaw);
    const rx = x * cyw - z * syw;
    const rz = x * syw + z * cyw;

    // espaço da câmera: ela está a `dist` atrás da origem, `height` acima do chão
    const vy = y - cam.height;
    const vz = rz + cam.dist;

    // inclina o olhar para baixo (pitch)
    const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const y2 = vy * cp + vz * sp;
    const z2 = -vy * sp + vz * cp;

    if (z2 < 0.6) return null;
    const k = focal / z2;
    return { sx: cx + rx * k, sy: cy - y2 * k, d: z2 };
  }

  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const mix = (a, b, t) => [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];

  function poly(pts, fill) {
    ctx.beginPath();
    ctx.moveTo(pts[0].sx, pts[0].sy);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].sx, pts[i].sy);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  function drawFloor() {
    const half = (GRID * SPACING) / 2 + 2;
    const step = SPACING;
    ctx.lineWidth = 1;
    for (let g = -half; g <= half + 0.001; g += step) {
      for (const axis of [0, 1]) {
        const a = axis === 0 ? project(g, 0, -half) : project(-half, 0, g);
        const b = axis === 0 ? project(g, 0, half) : project(half, 0, g);
        if (!a || !b) continue;
        const fade = Math.max(0, 1 - ((a.d + b.d) / 2) / 62);
        ctx.strokeStyle = `rgba(170,220,200,${0.05 + fade * 0.11})`;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
      }
    }
  }

  function drawBar(b, t) {
    const x0 = b.x - BAR, x1 = b.x + BAR;
    const z0 = b.z - BAR, z1 = b.z + BAR;
    const h = b.h;

    // 4 cantos do topo e da base
    const top = [project(x0, h, z0), project(x1, h, z0), project(x1, h, z1), project(x0, h, z1)];
    const bot = [project(x0, 0, z0), project(x1, 0, z0), project(x1, 0, z1), project(x0, 0, z1)];
    if (top.some(p => !p) || bot.some(p => !p)) return;

    const depth = (top[0].d + top[2].d) / 2;
    const fog = Math.max(0, Math.min(1, 1 - (depth - 18) / 46));   // 1 = perto
    if (fog <= 0.02) return;

    const baseCol = b.lime ? LIME : STEEL;
    const tint = b.lime ? 1 : 0.55 + 0.45 * fog;

    // faces laterais: desenha as 4 ordenadas por profundidade (pintor)
    const sides = [[0, 1], [1, 2], [2, 3], [3, 0]].map(([a, c]) => ({
      pts: [top[a], top[c], bot[c], bot[a]],
      d: (top[a].d + top[c].d) / 2,
      shade: a % 2 === 0 ? 0.42 : 0.24,
    })).sort((p, q) => q.d - p.d);

    for (const s of sides) {
      const g = ctx.createLinearGradient(s.pts[0].sx, s.pts[0].sy, s.pts[2].sx, s.pts[2].sy);
      const c = mix([6, 26, 26], baseCol, s.shade * tint);
      g.addColorStop(0, rgba(c, 0.92 * fog));
      g.addColorStop(1, rgba([4, 16, 16], 0.16 * fog));
      poly(s.pts, g);
    }

    // topo (mais claro — é o que dá a leitura de metal/gráfico)
    const gt = ctx.createLinearGradient(top[0].sx, top[0].sy, top[2].sx, top[2].sy);
    const ct = mix(baseCol, [255, 255, 255], b.lime ? 0.08 : 0.22);
    gt.addColorStop(0, rgba(ct, (b.lime ? 0.95 : 0.8) * fog));
    gt.addColorStop(1, rgba(mix(ct, [10, 40, 38], 0.45), 0.7 * fog));
    poly(top, gt);

    // aresta superior — sem isso a barra vira mancha
    ctx.strokeStyle = rgba(b.lime ? [230, 255, 120] : [255, 255, 255], 0.22 * fog);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(top[0].sx, top[0].sy);
    for (let i = 1; i < 4; i++) ctx.lineTo(top[i].sx, top[i].sy);
    ctx.closePath();
    ctx.stroke();

    // pulso de dado subindo pela barra
    if (b.pulse >= 0) {
      const y = b.pulse * h;
      const a = project(b.x, y, b.z);
      if (a) {
        const r = Math.max(1.1, 90 / a.d);
        const grd = ctx.createRadialGradient(a.sx, a.sy, 0, a.sx, a.sy, r * 4);
        grd.addColorStop(0, rgba(LIME, 0.85 * fog));
        grd.addColorStop(1, rgba(LIME, 0));
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(a.sx, a.sy, r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function frame(ts) {
    const t = ts / 1000;

    ctx.clearRect(0, 0, W, H);

    if (!reduced) {
      cam.yaw = 0.45 + Math.sin(t * 0.045) * 0.34;
      cam.pitch = 0.40 + Math.sin(t * 0.03) * 0.03;
      cam.dist = 34 + Math.sin(t * 0.035) * 2.6;
    }

    for (const b of bars) {
      if (!reduced) {
        b.h = b.h0 * (0.86 + 0.2 * Math.sin(t * b.spd * 0.55 + b.ph));
        if (b.pulse >= 0) {
          b.pulse += b.pspd * 0.006;
          if (b.pulse > 1.05) b.pulse = 0;
        }
      }
    }

    drawFloor();

    // painter's algorithm: mais longe primeiro
    const cyw = Math.cos(cam.yaw), syw = Math.sin(cam.yaw);
    bars.sort((a, b) => {
      const da = a.x * syw + a.z * cyw;
      const db = b.x * syw + b.z * cyw;
      return db - da;
    });

    for (const b of bars) drawBar(b, t);

    if (running) raf = requestAnimationFrame(frame);
  }

  let raf = 0, running = false;
  function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }

  resize();
  window.addEventListener('resize', () => { resize(); if (!running) requestAnimationFrame(frame); });

  if (reduced) {
    requestAnimationFrame(frame);
  } else {
    // só anima enquanto o hero está na tela
    const io = new IntersectionObserver(es => { es[0].isIntersecting ? start() : stop(); }, { threshold: 0.02 });
    io.observe(canvas);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
  }
})();
