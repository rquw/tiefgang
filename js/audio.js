// Tiny synthesized sound kit (WebAudio, no files needed).
export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
    try { this.muted = localStorage.getItem("tg-muted") === "1"; } catch {}
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.6;
    this.master.connect(this.ctx.destination);

    // echo bus for sonar
    this.echo = this.ctx.createDelay(1);
    this.echo.delayTime.value = 0.32;
    const fb = this.ctx.createGain();
    fb.gain.value = 0.38;
    this.echo.connect(fb).connect(this.echo);
    this.echo.connect(this.master);

    // ambient drone
    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = "lowpass";
    this.droneFilter.frequency.value = 600;
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.value = 0.05;
    this.droneFilter.connect(this.droneGain).connect(this.master);
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuf(2);
    noise.loop = true;
    noise.connect(this.droneFilter);
    noise.start();
    for (const f of [55, 55.6, 82.4]) {
      const o = this.ctx.createOscillator();
      o.frequency.value = f;
      const gg = this.ctx.createGain();
      gg.gain.value = 0.25;
      o.connect(gg).connect(this.droneFilter);
      o.start();
    }
  }

  noiseBuf(sec) {
    const b = this.ctx.createBuffer(1, this.ctx.sampleRate * sec, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      last = last * 0.97 + (Math.random() * 2 - 1) * 0.03; // brown-ish
      d[i] = last * 6;
    }
    return b;
  }

  setMuted(m) {
    this.muted = m;
    try { localStorage.setItem("tg-muted", m ? "1" : "0"); } catch {}
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.6, this.ctx.currentTime, 0.05);
  }

  setDepth(d) {
    if (!this.ctx) return;
    const f = Math.max(120, 700 - d * 0.06);
    this.droneFilter.frequency.setTargetAtTime(f, this.ctx.currentTime, 0.5);
  }

  env(node, t, a, peak, dec) {
    node.gain.setValueAtTime(0.0001, t);
    node.gain.exponentialRampToValueAtTime(peak, t + a);
    node.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }

  ping() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(1320, t);
    o.frequency.exponentialRampToValueAtTime(1180, t + 0.6);
    const g = this.ctx.createGain();
    this.env(g, t, 0.005, 0.18, 0.7);
    o.connect(g);
    g.connect(this.master);
    g.connect(this.echo);
    o.start(t);
    o.stop(t + 1);
  }

  bubble() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const base = 300 + Math.random() * 400;
    o.frequency.setValueAtTime(base, t);
    o.frequency.exponentialRampToValueAtTime(base * 3, t + 0.07);
    const g = this.ctx.createGain();
    this.env(g, t, 0.005, 0.05, 0.08);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.15);
  }

  dive(sec) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf(Math.ceil(sec) + 1);
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(150, t);
    f.frequency.exponentialRampToValueAtTime(1100, t + sec * 0.45);
    f.frequency.exponentialRampToValueAtTime(120, t + sec);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + sec * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + sec);
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + sec + 0.1);
    for (let i = 0; i < Math.min(14, sec * 4); i++) setTimeout(() => this.bubble(), Math.random() * sec * 1000);
  }

  success(tier) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    const n = 2 + tier;
    for (let i = 0; i < n; i++) {
      const o = this.ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = notes[i % notes.length];
      const g = this.ctx.createGain();
      this.env(g, t + i * 0.07, 0.01, 0.12, 0.5);
      o.connect(g);
      g.connect(this.master);
      if (tier >= 3) g.connect(this.echo);
      o.start(t + i * 0.07);
      o.stop(t + i * 0.07 + 0.6);
    }
  }

  fail() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = "square";
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.4);
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 700;
    const g = this.ctx.createGain();
    this.env(g, t, 0.01, 0.2, 0.4);
    o.connect(f).connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.5);
  }

  tick() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.frequency.value = 1800;
    const g = this.ctx.createGain();
    this.env(g, t, 0.002, 0.06, 0.04);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.06);
  }
}
