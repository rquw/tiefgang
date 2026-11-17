// Underwater world renderer (Canvas 2D). World unit = metres of depth.
import { SEAFLOOR, ZONES } from "./data.js";

const STOPS = [
  [0, [52, 196, 224]],
  [60, [26, 150, 200]],
  [200, [12, 96, 156]],
  [600, [8, 58, 108]],
  [1500, [5, 34, 66]],
  [4000, [3, 18, 38]],
  [7000, [1, 8, 18]],
  [11000, [0, 2, 6]],
];

function colorAt(d) {
  if (d <= 0) return STOPS[0][1];
  for (let i = 1; i < STOPS.length; i++) {
    if (d <= STOPS[i][0]) {
      const [d0, c0] = STOPS[i - 1];
      const [d1, c1] = STOPS[i];
      const k = (d - d0) / (d1 - d0);
      return c0.map((v, j) => v + (c1[j] - v) * k);
    }
  }
  return STOPS[STOPS.length - 1][1];
}
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

// Landmarks: creatures and facts placed at fixed depths.
const LANDMARKS = [
  { d: 45, kind: "school", x: 0.22, n: 14 },
  { d: 130, kind: "school", x: 0.72, n: 9 },
  { d: 260, kind: "jelly", x: 0.18, hue: 320 },
  { d: 380, kind: "jelly", x: 0.8, hue: 280 },
  { d: 560, kind: "lantern", x: 0.25 },
  { d: 760, kind: "jelly", x: 0.7, hue: 190 },
  { d: 1150, kind: "whale", x: 0.3 },
  { d: 1500, kind: "jelly", x: 0.82, hue: 340 },
  { d: 1900, kind: "angler", x: 0.75 },
  { d: 2500, kind: "squid", x: 0.2 },
  { d: 3200, kind: "angler", x: 0.18 },
  { d: 3800, kind: "wreck", x: 0.78 },
  { d: 4600, kind: "vampire", x: 0.25 },
  { d: 5500, kind: "dumbo", x: 0.75 },
  { d: 6800, kind: "jelly", x: 0.22, hue: 160 },
  { d: 7300, kind: "dumbo", x: 0.3 },
  { d: 8100, kind: "snail", x: 0.72 },
  { d: 9400, kind: "snail", x: 0.25 },
];

export const CREATURE_NAMES = {
  school: { en: "a school of mackerel", de: "ein Makrelenschwarm" },
  jelly: { en: "a glowing jellyfish", de: "eine leuchtende Qualle" },
  lantern: { en: "lanternfish", de: "Laternenfische" },
  whale: { en: "a sperm whale", de: "ein Pottwal" },
  angler: { en: "an anglerfish", de: "ein Anglerfisch" },
  squid: { en: "a giant squid", de: "ein Riesenkalmar" },
  wreck: { en: "a shipwreck", de: "ein Schiffswrack" },
  vampire: { en: "a vampire squid", de: "ein Vampirtintenfisch" },
  dumbo: { en: "a dumbo octopus", de: "ein Dumbo-Oktopus" },
  snail: { en: "a hadal snailfish", de: "ein Scheibenbauch" },
  floor: { en: "the bottom of the ocean", de: "der Meeresgrund" },
};

export function deepestSighting(depth) {
  if (depth >= SEAFLOOR - 5) return "floor";
  let k = null;
  for (const l of LANDMARKS) if (l.d <= depth + 60) k = l.kind;
  return k;
}

const FACTS = [
  { d: 200, en: "sunlight ends here", de: "hier endet das Sonnenlicht" },
  { d: 1000, en: "total darkness from here", de: "ab hier: völlige Dunkelheit" },
  { d: 2250, en: "sperm whales dive this deep", de: "so tief tauchen Pottwale" },
  { d: 4000, en: "average ocean depth: ~3,700 m", de: "mittlere Meerestiefe: ~3.700 m" },
  { d: 6000, en: "hadal trenches begin", de: "hier beginnen die Tiefseegräben" },
  { d: 8849, en: "Mount Everest would fit below you", de: "der Mount Everest passt unter dich" },
];

export class Ocean {
  constructor(canvas) {
    this.c = canvas;
    this.g = canvas.getContext("2d");
    this.lang = "en";
    this.subD = 0;
    this.camD = 0;
    this.prevCam = 0;
    this.vel = 0; // m/s
    this.dive = null;
    this.bubbles = [];
    this.parts = [];
    this.popups = [];
    this.rings = [];
    this.sonar = false;
    this.sonarT = 0;
    this.shakeAmt = 0;
    this.flashC = null;
    this.flashA = 0;
    this.bubbleT = 0;
    this.t = 0;
    this.last = performance.now();
    this.onBubble = null;
    this.resize();
    addEventListener("resize", () => this.resize());
    requestAnimationFrame((t) => this.frame(t));
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.W = innerWidth;
    this.H = innerHeight;
    this.c.width = this.W * dpr;
    this.c.height = this.H * dpr;
    this.c.style.width = this.W + "px";
    this.c.style.height = this.H + "px";
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.s = clamp(Math.min(this.W / 1100, this.H / 850), 0.45, 1.2);
    this.PX = 2.4 * Math.max(this.s, 0.7); // pixels per metre
    this.subX = this.W * 0.5;
    this.subY = this.H * (this.W < 700 ? 0.5 : 0.52);
  }

  reset() {
    this.subD = 0;
    this.camD = 0;
    this.dive = null;
    this.bubbles = [];
  }

  // screen y of a world depth
  sy(d) {
    return (d - this.camD) * this.PX + this.subY;
  }

  diveTo(target, durMs) {
    target = Math.min(target, SEAFLOOR);
    const from = this.subD;
    const dur = durMs ?? 1400 + Math.min(2800, (target - from) * 1.8);
    return new Promise((res) => {
      this.dive = { from, to: target, start: performance.now(), dur, res };
    });
  }

  shake(a = 14) { this.shakeAmt = a; }
  flash(color, a = 0.35) { this.flashC = color; this.flashA = a; }

  burst(color, n = 46) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = (80 + Math.random() * 320) * this.s;
      this.parts.push({ x: this.subX, y: this.subY, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, color, r: 2 + Math.random() * 3 });
    }
  }

  popup(text, color) {
    this.popups.push({ text, color, life: 1 });
  }

  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;
    this.update(dt, now);
    this.draw();
    requestAnimationFrame((t) => this.frame(t));
  }

  update(dt, now) {
    if (this.dive) {
      const k = clamp((now - this.dive.start) / this.dive.dur, 0, 1);
      this.subD = this.dive.from + (this.dive.to - this.dive.from) * easeInOut(k);
      if (k >= 1) {
        const r = this.dive.res;
        this.dive = null;
        setTimeout(r, 250);
      }
    }
    this.prevCam = this.camD;
    this.camD += (this.subD - this.camD) * Math.min(1, dt * 4);
    const v = (this.camD - this.prevCam) / Math.max(dt, 1e-4);
    this.vel += (v - this.vel) * Math.min(1, dt * 8);

    // bubbles from propeller
    this.bubbleT -= dt;
    const moving = Math.abs(this.vel) > 5;
    if (this.bubbleT <= 0 && this.subD > 2) {
      this.bubbleT = moving ? 0.03 : 0.35 + Math.random() * 0.5;
      const n = moving ? 2 : 1 + (Math.random() < 0.3 ? 2 : 0);
      for (let i = 0; i < n; i++) {
        const local = this.subLocal(-132, 0);
        this.bubbles.push({
          x: local.x + (Math.random() - 0.5) * 10,
          d: this.camD + (local.y - this.subY) / this.PX,
          r: (1.5 + Math.random() * 4) * this.s,
          ph: Math.random() * 6,
          life: 1,
        });
      }
      if (!moving && Math.random() < 0.3) this.onBubble?.();
    }
    for (const b of this.bubbles) {
      b.d -= ((30 + b.r * 12) * dt) / this.PX;
      b.x += Math.sin(this.t * 3 + b.ph) * 0.4 - (moving ? 60 * dt : 8 * dt);
      b.life -= dt * 0.35;
    }
    this.bubbles = this.bubbles.filter((b) => b.life > 0 && b.d > 0);

    for (const p of this.parts) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.life -= dt * 0.9;
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const p of this.popups) p.life -= dt * 0.45;
    this.popups = this.popups.filter((p) => p.life > 0);

    if (this.sonar) {
      this.sonarT -= dt;
      if (this.sonarT <= 0) {
        this.sonarT = 1.1;
        this.rings.push({ r: 0, life: 1 });
        this.onPing?.();
      }
    }
    for (const r of this.rings) {
      r.r += 420 * this.s * dt;
      r.life -= dt * 0.7;
    }
    this.rings = this.rings.filter((r) => r.life > 0);

    this.shakeAmt *= Math.pow(0.02, dt);
    this.flashA *= Math.pow(0.05, dt);
  }

  // Sub transform helpers
  subTilt() {
    return clamp(this.vel / 900, -0.05, 0.22) + Math.sin(this.t * 1.3) * 0.02;
  }
  subPos() {
    const bob = Math.sin(this.t * 1.6) * 5 * this.s;
    const lag = clamp((this.subD - this.camD) * this.PX * 0.5, -80, 120);
    return { x: this.subX, y: this.subY + bob + lag };
  }
  subLocal(lx, ly) {
    const p = this.subPos();
    const a = this.subTilt();
    const sc = this.s * 0.85;
    return {
      x: p.x + (lx * Math.cos(a) - ly * Math.sin(a)) * sc,
      y: p.y + (lx * Math.sin(a) + ly * Math.cos(a)) * sc,
    };
  }

  draw() {
    const { g, W, H } = this;
    g.save();
    if (this.shakeAmt > 0.3) g.translate((Math.random() - 0.5) * this.shakeAmt, (Math.random() - 0.5) * this.shakeAmt);

    this.drawBackground();
    this.drawRays();
    this.drawZoneLines();
    this.drawSnow();
    this.drawGlowSpecks();
    this.drawLandmarks();
    this.drawSeafloor();
    this.drawLight();
    this.drawBubbles();
    this.drawSub();
    this.drawSurface();
    this.drawRings();
    this.drawParts();
    this.drawRuler();
    this.drawVignette();
    g.restore();

    if (this.flashA > 0.01) {
      g.fillStyle = this.flashC;
      g.globalAlpha = this.flashA;
      g.fillRect(0, 0, W, H);
      g.globalAlpha = 1;
    }
    this.drawPopups();
  }

  drawBackground() {
    const { g, W, H } = this;
    const surf = this.sy(0);
    if (surf > 0) {
      const sky = g.createLinearGradient(0, 0, 0, surf);
      sky.addColorStop(0, "#5bb8e8");
      sky.addColorStop(1, "#cfeeff");
      g.fillStyle = sky;
      g.fillRect(0, 0, W, surf);
      // sun
      const sx = W * 0.8, syy = Math.min(surf - 120 * this.s, H * 0.18);
      const sg = g.createRadialGradient(sx, syy, 0, sx, syy, 160 * this.s);
      sg.addColorStop(0, "rgba(255,250,220,1)");
      sg.addColorStop(0.2, "rgba(255,240,180,0.8)");
      sg.addColorStop(1, "rgba(255,240,180,0)");
      g.fillStyle = sg;
      g.fillRect(0, 0, W, surf);
      // clouds
      g.fillStyle = "rgba(255,255,255,0.85)";
      for (let i = 0; i < 5; i++) {
        const cx = ((i * 337 + this.t * (6 + i * 2)) % (W + 400)) - 200;
        const cy = surf * (0.15 + 0.12 * (i % 3)) - (surf - H * 0.5) * 0.2;
        this.cloud(cx, cy, (40 + (i % 3) * 18) * this.s);
      }
    }
    const top = Math.max(0, surf);
    if (top < H) {
      const d0 = this.camD + (top - this.subY) / this.PX;
      const d1 = this.camD + (H - this.subY) / this.PX;
      const gr = g.createLinearGradient(0, top, 0, H);
      for (let i = 0; i <= 4; i++) gr.addColorStop(i / 4, rgb(colorAt(d0 + ((d1 - d0) * i) / 4)));
      g.fillStyle = gr;
      g.fillRect(0, top, W, H - top);
    }
  }

  cloud(x, y, r) {
    const g = this.g;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.arc(x + r * 0.9, y + r * 0.2, r * 0.75, 0, Math.PI * 2);
    g.arc(x - r * 0.9, y + r * 0.25, r * 0.65, 0, Math.PI * 2);
    g.arc(x + r * 0.3, y - r * 0.45, r * 0.7, 0, Math.PI * 2);
    g.fill();
  }

  drawSurface() {
    const { g, W } = this;
    const surf = this.sy(0);
    if (surf < -40 || surf > this.H + 40) return;
    const wave = (x) => surf + Math.sin(x * 0.012 + this.t * 1.6) * 4 + Math.sin(x * 0.031 - this.t * 2.2) * 2.5;
    // translucent water in front of the sub's lower half while it floats
    g.beginPath();
    g.moveTo(0, wave(0));
    for (let x = 8; x <= W + 8; x += 8) g.lineTo(x, wave(x));
    g.lineTo(W, surf + 90 * this.s);
    g.lineTo(0, surf + 90 * this.s);
    g.closePath();
    const wg = g.createLinearGradient(0, surf, 0, surf + 90 * this.s);
    wg.addColorStop(0, "rgba(40,170,215,0.55)");
    wg.addColorStop(1, "rgba(40,170,215,0)");
    g.fillStyle = wg;
    g.fill();
    g.beginPath();
    g.moveTo(0, wave(0));
    for (let x = 8; x <= W + 8; x += 8) g.lineTo(x, wave(x));
    g.strokeStyle = "rgba(255,255,255,0.8)";
    g.lineWidth = 2.5;
    g.stroke();
  }

  drawRays() {
    const { g, W, H } = this;
    const a = 0.16 * (1 - smooth(0, 450, this.camD));
    if (a <= 0.005) return;
    const top = Math.max(0, this.sy(0));
    g.save();
    g.globalCompositeOperation = "lighter";
    for (let i = 0; i < 7; i++) {
      const x = W * (0.05 + i * 0.15) + Math.sin(this.t * 0.25 + i * 1.7) * 60;
      const w = (30 + (i % 3) * 25) * this.s;
      const len = H * 1.1;
      const gr = g.createLinearGradient(0, top, 0, top + len);
      gr.addColorStop(0, `rgba(200,245,255,${a})`);
      gr.addColorStop(1, "rgba(200,245,255,0)");
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(x - w * 0.5, top);
      g.lineTo(x + w * 0.5, top);
      g.lineTo(x + w * 2.2 + 120, top + len);
      g.lineTo(x - w * 0.6 + 120, top + len);
      g.closePath();
      g.fill();
    }
    g.restore();
  }

  drawSnow() {
    const { g, W, H } = this;
    const surf = this.sy(0);
    const layers = [
      { f: 0.55, r: 0.9, a: 0.25 },
      { f: 1.0, r: 1.4, a: 0.4 },
      { f: 1.6, r: 2.2, a: 0.5 },
    ];
    const deep = 0.5 + 0.5 * smooth(100, 1500, this.camD);
    const T = 360;
    layers.forEach((L, li) => {
      const oy = this.camD * this.PX * L.f;
      const streak = clamp(this.vel * this.PX * L.f * 0.03, 0, 90);
      const fade = streak > 3 ? 0.55 : 1;
      g.strokeStyle = g.fillStyle = `rgba(220,240,255,${L.a * deep * fade})`;
      g.lineWidth = L.r * 1.4;
      const k0 = Math.floor((oy - 160) / T), k1 = Math.floor((oy + H + 160) / T);
      for (let k = k0; k <= k1; k++) {
        const R = rng(k * 7919 + li * 104729 + 13);
        for (let i = 0; i < 16; i++) {
          if (streak > 3 && i % 2) { R(); R(); continue; }
          const x = ((R() * (W + 100) + Math.sin(this.t * 0.4 + i) * 12 * L.f) % (W + 100)) - 50;
          const y = k * T + R() * T - oy + this.subY * 0;
          if (y < surf + 10) continue;
          if (streak > 3) {
            g.beginPath();
            g.moveTo(x, y);
            g.lineTo(x, y - streak);
            g.stroke();
          } else {
            g.beginPath();
            g.arc(x, y, L.r, 0, Math.PI * 2);
            g.fill();
          }
        }
      }
    });
  }

  drawGlowSpecks() {
    const k = smooth(500, 2000, this.camD);
    if (k <= 0) return;
    const { g, W, H } = this;
    const T = 420, f = 0.8;
    const oy = this.camD * this.PX * f;
    g.save();
    g.globalCompositeOperation = "lighter";
    const k0 = Math.floor((oy - 50) / T), k1 = Math.floor((oy + H + 50) / T);
    for (let kk = k0; kk <= k1; kk++) {
      const R = rng(kk * 4241 + 99);
      for (let i = 0; i < 7; i++) {
        const x = R() * W, y = kk * T + R() * T - oy;
        const tw = 0.5 + 0.5 * Math.sin(this.t * (1 + R() * 2) + R() * 6);
        const hue = R() < 0.6 ? 175 : R() < 0.5 ? 140 : 260;
        const rr = (3 + R() * 5) * this.s;
        const gr = g.createRadialGradient(x, y, 0, x, y, rr * 3);
        gr.addColorStop(0, `hsla(${hue},100%,75%,${0.8 * tw * k})`);
        gr.addColorStop(1, `hsla(${hue},100%,60%,0)`);
        g.fillStyle = gr;
        g.fillRect(x - rr * 3, y - rr * 3, rr * 6, rr * 6);
      }
    }
    g.restore();
  }

  drawZoneLines() {
    const { g, W } = this;
    g.save();
    g.font = `${Math.round(12 * Math.max(this.s, 0.8))}px "JetBrains Mono", ui-monospace, monospace`;
    g.textBaseline = "bottom";
    for (const z of ZONES.slice(1)) {
      const y = this.sy(z.from);
      if (y < -20 || y > this.H + 20) continue;
      g.strokeStyle = "rgba(160,220,255,0.18)";
      g.setLineDash([6, 8]);
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(W, y);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = "rgba(170,225,255,0.55)";
      g.textAlign = "left";
      g.fillText(`▼ ${z[this.lang].toUpperCase()}`, 18, y - 6);
    }
    for (const f of FACTS) {
      const y = this.sy(f.d);
      if (y < -20 || y > this.H + 20) continue;
      g.fillStyle = "rgba(170,225,255,0.45)";
      g.textAlign = "right";
      g.fillText(`${f[this.lang]} — ${f.d.toLocaleString(this.lang)} m`, W - 70, y - 6);
    }
    g.restore();
  }

  drawRuler() {
    const { g, W, H } = this;
    const x = W - 26;
    g.save();
    g.strokeStyle = "rgba(180,230,255,0.35)";
    g.fillStyle = "rgba(180,230,255,0.55)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x, Math.max(0, this.sy(0)));
    g.lineTo(x, H);
    g.stroke();
    g.font = `10px "JetBrains Mono", ui-monospace, monospace`;
    g.textAlign = "right";
    g.textBaseline = "middle";
    const dTop = this.camD - this.subY / this.PX;
    const dBot = this.camD + (H - this.subY) / this.PX;
    const step = 25;
    for (let d = Math.max(0, Math.ceil(dTop / step) * step); d <= dBot; d += step) {
      const y = this.sy(d);
      const big = d % 100 === 0;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x - (big ? 10 : 5), y);
      g.stroke();
      if (big) g.fillText(`${d}`, x - 14, y);
    }
    // sub marker
    const p = this.subPos();
    g.fillStyle = "#ffd24a";
    g.beginPath();
    g.moveTo(x + 2, p.y);
    g.lineTo(x + 12, p.y - 6);
    g.lineTo(x + 12, p.y + 6);
    g.closePath();
    g.fill();
    g.restore();
  }

  drawVignette() {
    const { g, W, H } = this;
    const k = 0.25 + 0.55 * smooth(0, 3000, this.camD);
    const gr = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    gr.addColorStop(0, "rgba(0,0,0,0)");
    gr.addColorStop(1, `rgba(0,0,8,${k})`);
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
  }

  // ---------- creatures ----------
  drawLandmarks() {
    const { g, W, H } = this;
    for (const L of LANDMARKS) {
      const y = this.sy(L.d);
      if (y < -400 || y > H + 400) continue;
      const drift = Math.sin(this.t * 0.15 + L.d) * 40;
      const x = L.x * W + drift;
      g.save();
      g.translate(x, y);
      g.scale(this.s, this.s);
      this["draw_" + L.kind]?.(L);
      g.restore();
    }
  }

  fishShape(len, h, col, dir = 1) {
    const g = this.g;
    g.save();
    g.scale(dir, 1);
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(0, 0, len / 2, h / 2, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(-len / 2 + 2, 0);
    g.lineTo(-len / 2 - len * 0.3, -h * 0.55);
    g.lineTo(-len / 2 - len * 0.3, h * 0.55);
    g.closePath();
    g.fill();
    g.restore();
  }

  draw_school(L) {
    const g = this.g;
    const R = rng(L.d * 31);
    const span = this.W / this.s + 400;
    for (let i = 0; i < L.n; i++) {
      const ox = R() * 220 - 110, oy = R() * 110 - 55;
      const sp = 40 + R() * 15;
      const x = (((ox + this.t * sp) % span) + span) % span - span / 2;
      const y = oy + Math.sin(this.t * 2 + i) * 6;
      g.save();
      g.translate(x * 0.25 + ox, y);
      this.fishShape(26, 9, "rgba(190,225,240,0.75)", 1);
      g.fillStyle = "rgba(40,80,110,0.5)";
      g.fillRect(-8, -2, 16, 1.5);
      g.restore();
    }
  }

  draw_jelly(L) {
    const g = this.g;
    const pulse = 1 + Math.sin(this.t * 2.2 + L.d) * 0.08;
    const bob = Math.sin(this.t * 0.9 + L.d) * 18;
    g.translate(0, bob);
    g.save();
    g.globalCompositeOperation = "lighter";
    const halo = g.createRadialGradient(0, 0, 0, 0, 0, 110);
    halo.addColorStop(0, `hsla(${L.hue},90%,70%,0.35)`);
    halo.addColorStop(1, `hsla(${L.hue},90%,60%,0)`);
    g.fillStyle = halo;
    g.fillRect(-110, -110, 220, 220);
    g.restore();
    g.strokeStyle = `hsla(${L.hue},90%,80%,0.55)`;
    g.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const tx = -22 + i * 9;
      g.beginPath();
      g.moveTo(tx, 4);
      for (let k = 1; k <= 10; k++) g.lineTo(tx + Math.sin(this.t * 2 + k * 0.6 + i) * 6, 4 + k * 10);
      g.stroke();
    }
    const bell = g.createRadialGradient(0, -10, 2, 0, -5, 40);
    bell.addColorStop(0, `hsla(${L.hue},100%,92%,0.95)`);
    bell.addColorStop(1, `hsla(${L.hue},90%,60%,0.5)`);
    g.fillStyle = bell;
    g.beginPath();
    g.ellipse(0, 0, 32 * pulse, 30 / pulse, 0, Math.PI, 0);
    g.quadraticCurveTo(0, 12, -32 * pulse, 0);
    g.fill();
  }

  draw_lantern(L) {
    const g = this.g;
    const R = rng(L.d);
    for (let i = 0; i < 9; i++) {
      const ox = R() * 260 - 130, oy = R() * 120 - 60;
      const x = ox + Math.sin(this.t * 0.6 + i) * 30;
      g.save();
      g.translate(x, oy);
      this.fishShape(30, 11, "rgba(30,45,70,0.9)", i % 2 ? 1 : -1);
      g.globalCompositeOperation = "lighter";
      for (let k = 0; k < 4; k++) {
        g.fillStyle = `rgba(120,230,255,${0.6 + 0.4 * Math.sin(this.t * 3 + k + i)})`;
        g.beginPath();
        g.arc(-9 + k * 6, 3, 1.6, 0, Math.PI * 2);
        g.fill();
      }
      g.restore();
    }
  }

  draw_whale() {
    const g = this.g;
    const x = Math.sin(this.t * 0.08) * 60;
    g.translate(x, 0);
    g.fillStyle = "rgba(22,40,62,0.85)";
    g.beginPath();
    g.moveTo(170, -40);
    g.bezierCurveTo(185, -40, 190, 30, 160, 42);
    g.bezierCurveTo(60, 60, -80, 40, -170, 10);
    g.lineTo(-215, 22 + Math.sin(this.t) * 10);
    g.lineTo(-225, -18 + Math.sin(this.t) * 10);
    g.lineTo(-175, -6);
    g.bezierCurveTo(-80, -40, 60, -48, 170, -40);
    g.fill();
    g.fillStyle = "rgba(10,22,36,0.9)";
    g.beginPath();
    g.moveTo(40, 30);
    g.lineTo(10, 70);
    g.lineTo(-10, 35);
    g.fill();
    g.fillStyle = "rgba(200,230,255,0.6)";
    g.beginPath();
    g.arc(120, 6, 3, 0, Math.PI * 2);
    g.fill();
  }

  glowBulb(x, y, r, hue, a = 1) {
    const g = this.g;
    g.save();
    g.globalCompositeOperation = "lighter";
    const gr = g.createRadialGradient(x, y, 0, x, y, r * 6);
    gr.addColorStop(0, `hsla(${hue},100%,85%,${a})`);
    gr.addColorStop(0.25, `hsla(${hue},100%,65%,${a * 0.5})`);
    gr.addColorStop(1, `hsla(${hue},100%,50%,0)`);
    g.fillStyle = gr;
    g.fillRect(x - r * 6, y - r * 6, r * 12, r * 12);
    g.restore();
  }

  draw_angler(L) {
    const g = this.g;
    const dir = L.x > 0.5 ? -1 : 1;
    g.scale(dir, 1);
    g.translate(Math.sin(this.t * 0.4) * 20, Math.sin(this.t * 0.7) * 8);
    const lureX = 70 + Math.sin(this.t * 1.5) * 4, lureY = -70 + Math.cos(this.t * 1.5) * 3;
    g.strokeStyle = "rgba(70,60,60,0.95)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(10, -38);
    g.quadraticCurveTo(40, -100, lureX, lureY);
    g.stroke();
    g.fillStyle = "#2a2020";
    g.beginPath();
    g.ellipse(0, 0, 55, 42, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(-50, 0);
    g.lineTo(-85, -25);
    g.lineTo(-85, 25);
    g.fill();
    // mouth
    g.fillStyle = "#0a0505";
    g.beginPath();
    g.moveTo(55, -5);
    g.lineTo(15, 12);
    g.lineTo(58, 22);
    g.fill();
    g.fillStyle = "#e8e2d0";
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.moveTo(22 + i * 7, 10 + i * 0.5);
      g.lineTo(25 + i * 7, 18);
      g.lineTo(28 + i * 7, 10 + i * 0.8);
      g.fill();
    }
    g.fillStyle = "rgba(220,240,255,0.8)";
    g.beginPath();
    g.arc(25, -12, 4, 0, Math.PI * 2);
    g.fill();
    this.glowBulb(lureX, lureY, 5, 170, 0.8 + 0.2 * Math.sin(this.t * 4));
    g.fillStyle = "#eaffff";
    g.beginPath();
    g.arc(lureX, lureY, 4, 0, Math.PI * 2);
    g.fill();
  }

  draw_squid() {
    const g = this.g;
    g.rotate(-0.3 + Math.sin(this.t * 0.3) * 0.1);
    g.strokeStyle = "rgba(150,50,60,0.75)";
    g.lineCap = "round";
    for (let i = 0; i < 10; i++) {
      const long = i >= 8;
      g.lineWidth = long ? 3 : 6;
      g.beginPath();
      g.moveTo(-10 + i * 2.5, 60);
      const n = long ? 18 : 10;
      for (let k = 1; k <= n; k++) {
        g.lineTo(-10 + i * 2.5 + Math.sin(this.t * 1.4 + k * 0.5 + i) * (k * 1.6) + (i - 5) * k * 1.2, 60 + k * 12);
      }
      g.stroke();
    }
    g.fillStyle = "rgba(140,40,50,0.85)";
    g.beginPath();
    g.moveTo(0, -120);
    g.bezierCurveTo(40, -60, 30, 40, 18, 62);
    g.lineTo(-18, 62);
    g.bezierCurveTo(-30, 40, -40, -60, 0, -120);
    g.fill();
    g.beginPath();
    g.moveTo(0, -125);
    g.lineTo(32, -85);
    g.lineTo(-32, -85);
    g.fill();
    g.fillStyle = "rgba(230,240,255,0.85)";
    g.beginPath();
    g.arc(-12, 40, 7, 0, Math.PI * 2);
    g.arc(12, 40, 7, 0, Math.PI * 2);
    g.fill();
  }

  draw_wreck() {
    const g = this.g;
    g.rotate(0.12);
    g.fillStyle = "rgba(30,36,44,0.9)";
    g.beginPath();
    g.moveTo(-200, -20);
    g.lineTo(210, -30);
    g.lineTo(170, 50);
    g.lineTo(-170, 50);
    g.closePath();
    g.fill();
    g.fillRect(-60, -60, 110, 40);
    g.fillRect(-20, -100, 22, 42);
    g.strokeStyle = "rgba(30,36,44,0.9)";
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(120, -30);
    g.lineTo(150, -140);
    g.stroke();
    g.fillStyle = "rgba(90,110,120,0.5)";
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.arc(-140 + i * 50, 10, 6, 0, Math.PI * 2);
      g.fill();
    }
  }

  draw_vampire() {
    const g = this.g;
    g.translate(0, Math.sin(this.t * 0.8) * 15);
    const open = 0.8 + Math.sin(this.t * 1.2) * 0.25;
    g.fillStyle = "rgba(90,15,30,0.9)";
    g.beginPath();
    g.ellipse(0, -30, 26, 38, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(-24, -10);
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI * (0.1 + 0.8 * (i / 8));
      g.lineTo(Math.cos(a) * -80 * open * (i % 2 ? 0.7 : 1), 20 + Math.sin(a) * 70 * open);
    }
    g.lineTo(24, -10);
    g.fill();
    this.glowBulb(-10, -24, 4, 200, 0.9);
    this.glowBulb(10, -24, 4, 200, 0.9);
  }

  draw_dumbo() {
    const g = this.g;
    g.translate(Math.sin(this.t * 0.5) * 30, Math.sin(this.t * 1.1) * 14);
    const flap = Math.sin(this.t * 4) * 0.4;
    g.fillStyle = "rgba(240,150,170,0.85)";
    for (const s of [-1, 1]) {
      g.save();
      g.translate(26 * s, -28);
      g.rotate(flap * s);
      g.beginPath();
      g.ellipse(14 * s, 0, 18, 10, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    g.beginPath();
    g.ellipse(0, -20, 32, 34, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(-32, -10);
    for (let i = 0; i <= 6; i++) g.lineTo(-32 + i * 10.6, 30 + (i % 2) * 8 + Math.sin(this.t * 3 + i) * 3);
    g.lineTo(32, -10);
    g.fill();
    g.fillStyle = "#1a0a12";
    g.beginPath();
    g.arc(-11, -22, 4, 0, Math.PI * 2);
    g.arc(11, -22, 4, 0, Math.PI * 2);
    g.fill();
  }

  draw_snail() {
    const g = this.g;
    g.translate(Math.sin(this.t * 0.4) * 50, 0);
    const wag = Math.sin(this.t * 3) * 10;
    const gr = g.createLinearGradient(-60, 0, 50, 0);
    gr.addColorStop(0, "rgba(230,215,230,0.15)");
    gr.addColorStop(1, "rgba(245,225,235,0.75)");
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(50, 0);
    g.bezierCurveTo(50, -26, 10, -24, -10, -12);
    g.quadraticCurveTo(-50, -2 + wag * 0.3, -75, wag);
    g.quadraticCurveTo(-50, 6 + wag * 0.3, -10, 14);
    g.bezierCurveTo(10, 24, 50, 22, 50, 0);
    g.fill();
    g.fillStyle = "rgba(20,10,20,0.8)";
    g.beginPath();
    g.arc(36, -6, 3, 0, Math.PI * 2);
    g.fill();
  }

  drawSeafloor() {
    const { g, W, H } = this;
    const y0 = this.sy(SEAFLOOR + 48);
    if (y0 > H + 50) return;
    g.save();
    const gr = g.createLinearGradient(0, y0 - 40, 0, y0 + 200);
    gr.addColorStop(0, "#1b1d24");
    gr.addColorStop(1, "#050507");
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(0, H + 50);
    for (let x = 0; x <= W; x += 20) {
      g.lineTo(x, y0 + Math.sin(x * 0.01) * 18 + Math.sin(x * 0.037) * 8);
    }
    g.lineTo(W, H + 50);
    g.closePath();
    g.fill();
    // glowing tube worms
    const R = rng(77);
    for (let i = 0; i < 14; i++) {
      const x = R() * W;
      const by = y0 + Math.sin(x * 0.01) * 18 + Math.sin(x * 0.037) * 8 + 4;
      const h = (20 + R() * 40) * this.s;
      g.strokeStyle = "rgba(230,230,220,0.6)";
      g.lineWidth = 4 * this.s;
      g.beginPath();
      g.moveTo(x, by);
      g.quadraticCurveTo(x + Math.sin(this.t + i) * 6, by - h / 2, x + Math.sin(this.t * 1.3 + i) * 8, by - h);
      g.stroke();
      this.glowBulb(x + Math.sin(this.t * 1.3 + i) * 8, by - h, 3 * this.s, R() < 0.5 ? 0 : 330, 0.7);
    }
    g.restore();
  }

  // ---------- sub ----------
  drawLight() {
    const k = smooth(60, 500, this.camD);
    const { g } = this;
    if (k <= 0.01) return;
    const a = this.subTilt();
    const n = this.subLocal(118, 6);
    const len = 560 * this.s;
    const dir = 0.18 + a;
    g.save();
    g.globalCompositeOperation = "lighter";
    const gr = g.createRadialGradient(n.x, n.y, 0, n.x, n.y, len);
    gr.addColorStop(0, `rgba(255,240,200,${0.38 * k})`);
    gr.addColorStop(0.5, `rgba(255,235,190,${0.12 * k})`);
    gr.addColorStop(1, "rgba(255,235,190,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(n.x, n.y);
    g.arc(n.x, n.y, len, dir - 0.34, dir + 0.34);
    g.closePath();
    g.fill();
    // soft halo around the sub
    const p = this.subPos();
    const h = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, 220 * this.s);
    h.addColorStop(0, `rgba(255,220,140,${0.12 * k})`);
    h.addColorStop(1, "rgba(255,220,140,0)");
    g.fillStyle = h;
    g.fillRect(p.x - 220 * this.s, p.y - 220 * this.s, 440 * this.s, 440 * this.s);
    g.restore();
  }

  drawSub() {
    const g = this.g;
    const p = this.subPos();
    const deep = smooth(60, 600, this.camD);
    g.save();
    g.translate(p.x, p.y);
    g.rotate(this.subTilt());
    g.scale(this.s * 0.85, this.s * 0.85);

    // fins
    g.fillStyle = "#d98f00";
    g.strokeStyle = "#3b2600";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(-95, -22);
    g.lineTo(-128, -46);
    g.lineTo(-120, -10);
    g.closePath();
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(-95, 22);
    g.lineTo(-128, 46);
    g.lineTo(-120, 10);
    g.closePath();
    g.fill();
    g.stroke();

    // propeller
    const spin = this.t * (8 + Math.abs(this.vel) * 0.08);
    g.fillStyle = "#6b5a3a";
    for (const off of [0, Math.PI / 2]) {
      const h = Math.abs(Math.cos(spin + off)) * 22 + 2;
      g.beginPath();
      g.ellipse(-134, 0, 5, h, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#3b2600";
    g.fillRect(-132, -4, 14, 8);

    // tower
    const body = g.createLinearGradient(0, -70, 0, 42);
    body.addColorStop(0, "#ffe680");
    body.addColorStop(0.45, "#ffc21a");
    body.addColorStop(1, "#c77d00");
    g.fillStyle = body;
    g.beginPath();
    g.roundRect(-42, -68, 74, 44, 12);
    g.fill();
    g.stroke();
    g.strokeStyle = "#3b2600";
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(12, -68);
    g.lineTo(12, -92);
    g.lineTo(26, -92);
    g.stroke();
    g.lineWidth = 3;

    // hull
    g.fillStyle = body;
    g.beginPath();
    g.moveTo(-100, -32);
    g.bezierCurveTo(-30, -44, 60, -44, 98, -30);
    g.bezierCurveTo(134, -16, 134, 22, 98, 33);
    g.bezierCurveTo(50, 44, -40, 44, -100, 32);
    g.bezierCurveTo(-126, 22, -126, -22, -100, -32);
    g.closePath();
    g.fill();
    g.stroke();

    // stripe + shine
    g.fillStyle = "rgba(190,90,0,0.55)";
    g.fillRect(-108, 14, 222, 7);
    g.fillStyle = "rgba(255,255,255,0.35)";
    g.beginPath();
    g.ellipse(10, -26, 70, 6, -0.02, 0, Math.PI * 2);
    g.fill();

    // portholes
    for (const x of [-56, -4, 48]) {
      g.fillStyle = "#7a5a10";
      g.beginPath();
      g.arc(x, -4, 14, 0, Math.PI * 2);
      g.fill();
      const gl = g.createRadialGradient(x - 3, -7, 1, x, -4, 11);
      gl.addColorStop(0, deep > 0.3 ? "#fff6c8" : "#d9f4ff");
      gl.addColorStop(1, deep > 0.3 ? "#e09a20" : "#3e8db0");
      g.fillStyle = gl;
      g.beginPath();
      g.arc(x, -4, 10, 0, Math.PI * 2);
      g.fill();
    }
    // rivets
    g.fillStyle = "rgba(90,55,0,0.6)";
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      g.arc(-84 + i * 22, 26, 1.8, 0, Math.PI * 2);
      g.fill();
    }
    // nose lamp
    g.fillStyle = deep > 0.1 ? "#fffbe6" : "#fff2b0";
    g.beginPath();
    g.arc(118, 4, 6, 0, Math.PI * 2);
    g.fill();
    g.restore();
    if (deep > 0.1) {
      const n = this.subLocal(118, 4);
      this.glowBulb(n.x, n.y, 4 * this.s, 45, deep * 0.9);
    }
  }

  drawBubbles() {
    const g = this.g;
    g.save();
    g.lineWidth = 1.2;
    for (const b of this.bubbles) {
      const y = this.sy(b.d);
      g.strokeStyle = `rgba(220,245,255,${0.7 * b.life})`;
      g.beginPath();
      g.arc(b.x, y, b.r, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = `rgba(255,255,255,${0.5 * b.life})`;
      g.beginPath();
      g.arc(b.x - b.r * 0.35, y - b.r * 0.35, b.r * 0.3, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  drawRings() {
    const g = this.g;
    const p = this.subPos();
    for (const r of this.rings) {
      g.strokeStyle = `rgba(120,255,220,${0.5 * r.life})`;
      g.lineWidth = 2;
      g.beginPath();
      g.arc(p.x, p.y, r.r, 0, Math.PI * 2);
      g.stroke();
    }
  }

  drawParts() {
    const g = this.g;
    g.save();
    g.globalCompositeOperation = "lighter";
    for (const q of this.parts) {
      g.fillStyle = q.color;
      g.globalAlpha = q.life;
      g.beginPath();
      g.arc(q.x, q.y, q.r * (0.5 + q.life), 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  drawPopups() {
    const g = this.g;
    const p = this.subPos();
    for (const q of this.popups) {
      const k = 1 - q.life;
      g.save();
      g.globalAlpha = Math.min(1, q.life * 2.2);
      g.font = `800 ${Math.round(46 * Math.max(this.s, 0.7))}px "Space Grotesk", system-ui, sans-serif`;
      g.textAlign = "center";
      g.fillStyle = q.color;
      g.shadowColor = q.color;
      g.shadowBlur = 24;
      g.fillText(q.text, p.x, p.y - 90 * this.s - k * 70);
      g.restore();
    }
  }
}
