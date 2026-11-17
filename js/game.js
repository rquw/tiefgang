import { PROMPTS, ROUNDS, SEAFLOOR, UI, zoneAt, rarityTier, metresFor, RARITY } from "./data.js";
import { Ocean, deepestSighting, CREATURE_NAMES } from "./render.js";
import { Sound } from "./audio.js";

const ROUND_TIME = 25;
const $ = (id) => document.getElementById(id);

const ocean = new Ocean($("ocean"));
window.tiefgang = { ocean }; // handy for debugging in the console
const sound = new Sound();
ocean.onPing = () => sound.ping();
ocean.onBubble = () => sound.bubble();

// Judge module is loaded lazily so the page works even if the CDN is unreachable.
let judge = null;
async function getJudge() {
  if (!judge) {
    try { judge = await import("./judge.js"); } catch (e) { console.error(e); judge = null; }
  }
  return judge;
}

const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

const S = {
  lang: store.get("tg-lang", navigator.language?.startsWith("de") ? "de" : "en"),
  model: store.get("tg-model", "Qwen2.5-1.5B-Instruct-q4f16_1-MLC"),
  useAI: true,
  gpu: null,
  round: 0,
  prompts: [],
  results: [],
  depth: 0,
  tries: 0,
  busy: false,
  timeLeft: ROUND_TIME,
  timerOn: false,
};

const t = (k) => UI[S.lang][k];

// ---------- i18n ----------
function applyLang() {
  document.documentElement.lang = S.lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document.querySelectorAll(".lang-switch button").forEach((b) => b.classList.toggle("on", b.dataset.lang === S.lang));
  $("answerInput").placeholder = t("placeholder");
  $("diveBtn").textContent = t("dive");
  ocean.lang = S.lang;
  renderModels();
}
document.querySelectorAll(".lang-switch button").forEach((b) =>
  b.addEventListener("click", () => {
    S.lang = b.dataset.lang;
    store.set("tg-lang", S.lang);
    applyLang();
  })
);

// ---------- model picker ----------
const MODEL_FALLBACK = [
  { id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", size: "~1 GB", en: "Standard (recommended)", de: "Standard (empfohlen)" },
  { id: "Qwen2.5-3B-Instruct-q4f16_1-MLC", size: "~2 GB", en: "Smart (stricter, slower)", de: "Schlau (genauer, langsamer)" },
  { id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", size: "~0.4 GB", en: "Mini (fast, sloppy)", de: "Mini (schnell, ungenau)" },
];
function renderModels() {
  const list = judge?.MODELS ?? MODEL_FALLBACK;
  const box = $("modelList");
  box.innerHTML = "";
  for (const m of list) {
    const b = document.createElement("button");
    b.className = "model-opt" + (m.id === S.model ? " on" : "");
    b.innerHTML = `<span>${m[S.lang]}</span><small>${m.size}</small>`;
    b.disabled = S.gpu === false;
    b.onclick = () => {
      S.model = m.id;
      store.set("tg-model", m.id);
      renderModels();
    };
    box.appendChild(b);
  }
}

// ---------- mute ----------
function renderMute() { $("muteBtn").textContent = sound.muted ? "🔇" : "🔊"; }
$("muteBtn").onclick = () => { sound.init(); sound.setMuted(!sound.muted); renderMute(); };
renderMute();

// ---------- AI status chip ----------
function updateChip() {
  const chip = $("aiChip");
  if (!S.useAI || !judge) { chip.textContent = ""; return; }
  const st = judge.aiState;
  chip.classList.toggle("ready", st.status === "ready");
  if (st.status === "loading") chip.textContent = `${t("loading")} ${Math.round(st.progress * 100)}%`;
  else if (st.status === "ready") chip.textContent = `● ${t("aiReady")}`;
  else if (st.status === "error") chip.textContent = t("aiFail");
  else chip.textContent = "";
}

// ---------- game flow ----------
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function show(id) {
  for (const s of ["title", "play", "end"]) $(s).classList.toggle("hidden", s !== id);
  $("hud").classList.toggle("hidden", id === "title");
}

async function startGame(withAI) {
  sound.init();
  S.useAI = withAI && S.gpu !== false;
  if (S.useAI) {
    const j = await getJudge();
    if (!j) S.useAI = false;
    else if (j.aiState.status === "off" || j.aiState.status === "error") j.loadModel(S.model, updateChip);
  }
  S.prompts = shuffle([...PROMPTS]).slice(0, ROUNDS);
  S.results = [];
  S.round = 0;
  S.depth = 0;
  ocean.reset();
  show("play");
  updateChip();
  setDepthHUD(0);
  nextRound();
}

function setDepthHUD(d) {
  $("depthNum").textContent = Math.round(d).toLocaleString(S.lang === "de" ? "de-DE" : "en-US");
  $("depthZone").textContent = zoneAt(d)[S.lang];
  sound.setDepth(d);
}

function renderDots() {
  const box = $("roundDots");
  box.innerHTML = "";
  for (let i = 0; i < ROUNDS; i++) {
    const el = document.createElement("i");
    const r = S.results[i];
    if (r) {
      const c = r.valid ? rarityTier(r.rarity).color : "#ff5c6c";
      el.style.background = c;
      el.style.borderColor = c;
    } else if (i === S.round) el.className = "cur";
    box.appendChild(el);
  }
}

function nextRound() {
  if (S.round >= ROUNDS) return endGame();
  const p = S.prompts[S.round][S.lang];
  S.tries = 0;
  S.lastTry = null;
  $("roundLabel").textContent = `${t("round")} ${S.round + 1} ${t("of")} ${ROUNDS}`;
  $("promptText").textContent = p.q;
  const card = $("promptCard");
  card.classList.remove("enter");
  void card.offsetWidth;
  card.classList.add("enter");
  $("result").classList.add("hidden");
  $("answerForm").classList.remove("hidden");
  hideStatus();
  $("answerInput").value = "";
  $("answerInput").disabled = false;
  $("diveBtn").disabled = false;
  $("answerInput").focus();
  renderDots();
  startTimer(ROUND_TIME);
}

// ---------- timer ----------
let timerRAF = 0, timerLast = 0;
function startTimer(sec) {
  S.timeLeft = sec;
  S.timerOn = true;
  timerLast = performance.now();
  cancelAnimationFrame(timerRAF);
  const step = (now) => {
    if (S.timerOn) {
      const before = Math.ceil(S.timeLeft);
      S.timeLeft -= (now - timerLast) / 1000;
      const after = Math.ceil(S.timeLeft);
      if (after !== before && after <= 5 && after > 0) sound.tick();
      if (S.timeLeft <= 0) {
        S.timeLeft = 0;
        S.timerOn = false;
        renderTimer();
        onTimeout();
        return;
      }
    }
    timerLast = now;
    renderTimer();
    timerRAF = requestAnimationFrame(step);
  };
  timerRAF = requestAnimationFrame(step);
}
function renderTimer() {
  $("timerFill").style.transform = `scaleX(${S.timeLeft / ROUND_TIME})`;
  $("timerNum").textContent = `${Math.ceil(S.timeLeft)}s`;
  $("timerNum").classList.toggle("low", S.timeLeft <= 5);
}
function stopTimer() { S.timerOn = false; cancelAnimationFrame(timerRAF); }

function onTimeout() {
  const v = $("answerInput").value.trim();
  if (v && !S.busy) return submit(v, true);
  if (S.busy) return;
  recordFail("⏱", S.lang === "de" ? "Zeit abgelaufen." : "Time's up.");
}

// ---------- status ----------
function setStatus(msg, bad = false) {
  const el = $("status");
  el.textContent = msg;
  el.classList.toggle("bad", bad);
  el.classList.remove("hidden");
}
function hideStatus() { $("status").classList.add("hidden"); }

// ---------- answering ----------
$("answerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = $("answerInput").value.trim();
  if (v && !S.busy) submit(v, false);
});

async function submit(answer, fromTimeout) {
  S.busy = true;
  S.timerOn = false; // pause while judging
  $("answerInput").disabled = true;
  $("diveBtn").disabled = true;
  hideStatus();
  const prompt = S.prompts[S.round][S.lang];
  const j = await getJudge();

  let verdict;
  const norm = j ? j.normalize(answer) : answer.toLowerCase();
  if (norm.length < 2) {
    verdict = { valid: false, comment: t("tooShort") };
  } else if (j && S.lastTry && j.sameAnswer(S.lastTry, answer)) {
    // same rejected answer twice in one round
    verdict = { valid: false, comment: t("duplicate") };
  } else {
    const hit = j ? j.listMatch(answer, prompt.common) : null;
    ocean.sonar = true;
    if (hit) {
      setStatus(t("thinking"));
      await wait(900);
      const r = 1 + Math.round((2 * hit.index) / Math.max(1, hit.total - 1));
      verdict = { valid: true, rarity: r, comment: j.commentFor(S.lang, true, r) };
    } else if (S.useAI && j && j.aiState.status !== "error") {
      const waitTick = setInterval(() => {
        setStatus(j.aiState.status === "ready" ? t("thinking") : `${t("waitingAI")} ${Math.round(j.aiState.progress * 100)}%`);
      }, 200);
      setStatus(t("thinking"));
      let ai = null;
      try { ai = await j.judgeWithAI(prompt.q, prompt.common, answer, S.lang); } catch (e) { console.error(e); }
      clearInterval(waitTick);
      verdict = ai ?? { valid: false, comment: t("aiFail") };
      updateChip();
    } else {
      await wait(600);
      verdict = { valid: false, comment: t("unknownNoAI") };
    }
    ocean.sonar = false;
  }
  hideStatus();

  if (verdict.valid) await onValid(answer, verdict);
  else await onInvalid(answer, verdict, fromTimeout);
  S.busy = false;
}

async function onValid(answer, v) {
  stopTimer();
  const metres = Math.min(metresFor(v.rarity), SEAFLOOR - S.depth);
  const tier = rarityTier(v.rarity);
  const tierIdx = RARITY.indexOf(tier);
  const from = S.depth;
  S.depth += metres;
  S.results[S.round] = { q: S.prompts[S.round][S.lang].q, answer, valid: true, rarity: v.rarity, metres };
  renderDots();
  $("answerForm").classList.add("hidden");

  ocean.popup(`+${metres.toLocaleString(S.lang === "de" ? "de-DE" : "en-US")} m`, tier.color);
  ocean.burst(tier.color, 24 + tierIdx * 18);
  if (tierIdx >= 3) ocean.flash(tier.color, 0.18 + tierIdx * 0.04);
  sound.success(tierIdx);
  const dur = 1400 + Math.min(2800, metres * 1.8);
  sound.dive(dur / 1000);
  // animate the depth counter alongside the dive
  const t0 = performance.now();
  const count = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    setDepthHUD(from + metres * e);
    if (k < 1) requestAnimationFrame(count);
  };
  requestAnimationFrame(count);
  const dived = ocean.diveTo(S.depth, dur);

  showResult({
    tier: tier[S.lang],
    color: tier.color,
    answer,
    metres: `+${metres.toLocaleString(S.lang === "de" ? "de-DE" : "en-US")} m  ·  ${v.rarity}/10`,
    comment: v.comment || "",
  });
  $("nextBtn").disabled = true;
  await dived;
  $("nextBtn").disabled = false;
  $("nextBtn").focus();
}

async function onInvalid(answer, v, fromTimeout) {
  ocean.shake(16);
  ocean.flash("#ff3040", 0.22);
  sound.fail();
  const row = $("answerForm");
  row.classList.remove("shake");
  void row.offsetWidth;
  row.classList.add("shake");
  S.tries++;
  S.lastTry = answer;
  if (S.tries < 2 && !fromTimeout && S.timeLeft > 0.5) {
    setStatus(`${t("invalid")}: ${v.comment || ""} — ${t("retry")}`, true);
    $("answerInput").disabled = false;
    $("diveBtn").disabled = false;
    $("answerInput").select();
    $("answerInput").focus();
    S.timerOn = true;
    timerLast = performance.now();
    return;
  }
  recordFail(answer, v.comment);
}

function recordFail(answer, comment) {
  stopTimer();
  S.results[S.round] = { q: S.prompts[S.round][S.lang].q, answer, valid: false, rarity: 0, metres: 0 };
  renderDots();
  $("answerForm").classList.add("hidden");
  showResult({ tier: t("invalid"), color: "#ff5c6c", answer, metres: "+0 m", comment: comment || "" });
}

function showResult({ tier, color, answer, metres, comment }) {
  $("resTier").textContent = tier;
  $("resTier").style.color = color;
  $("resAnswer").textContent = S.lang === "de" ? `„${answer}“` : `“${answer}”`;
  $("resMetres").textContent = metres;
  $("resComment").textContent = comment;
  $("nextBtn").textContent = S.round + 1 >= ROUNDS ? t("finish") : t("next");
  $("result").classList.remove("hidden");
  $("result").style.borderColor = color + "66";
  setTimeout(() => $("nextBtn").focus(), 50);
}

$("nextBtn").onclick = () => {
  if ($("nextBtn").disabled) return;
  S.round++;
  nextRound();
};

// ---------- end ----------
function endGame() {
  stopTimer();
  show("end");
  const loc = S.lang === "de" ? "de-DE" : "en-US";
  $("endDepth").textContent = Math.round(S.depth).toLocaleString(loc);
  const zone = zoneAt(S.depth)[S.lang];
  const seen = deepestSighting(S.depth);
  $("endZone").textContent = zone + (seen ? ` · ${t("deepest")}: ${CREATURE_NAMES[seen][S.lang]}` : "");
  const key = "tg-best-" + S.lang;
  const best = +store.get(key, "0");
  if (S.depth > best) {
    store.set(key, String(Math.round(S.depth)));
    $("endBest").textContent = S.depth > 0 ? `★ ${t("newBest")}` : "";
  } else {
    $("endBest").textContent = `${t("best")}: ${best.toLocaleString(loc)} m`;
  }
  const list = $("endList");
  list.innerHTML = "";
  for (const r of S.results) {
    const li = document.createElement("li");
    const c = r.valid ? rarityTier(r.rarity).color : "#ff5c6c";
    li.innerHTML = `<span class="dot" style="background:${c}"></span><span><span class="q"></span><span class="a"></span></span><span class="m">${r.valid ? "+" + r.metres.toLocaleString(loc) + " m" : "✕"}</span>`;
    li.querySelector(".q").textContent = r.q;
    li.querySelector(".a").textContent = r.answer;
    list.appendChild(li);
  }
}

$("againBtn").onclick = () => startGame(S.useAI);
$("shareBtn").onclick = async () => {
  const loc = S.lang === "de" ? "de-DE" : "en-US";
  const squares = S.results.map((r) => (r.valid ? rarityTier(r.rarity).emoji : "❌")).join("");
  const text = `TIEFGANG 🌊 ${Math.round(S.depth).toLocaleString(loc)} m\n${squares}`;
  try {
    await navigator.clipboard.writeText(text);
    $("shareBtn").textContent = t("copied");
    setTimeout(() => ($("shareBtn").textContent = t("share")), 1500);
  } catch {
    prompt("", text);
  }
};

// ---------- keyboard ----------
addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !$("result").classList.contains("hidden") && document.activeElement !== $("nextBtn")) {
    $("nextBtn").click();
  }
});

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- boot ----------
$("startBtn").onclick = () => startGame(true);
$("noAIBtn").onclick = () => startGame(false);

(async () => {
  applyLang();
  const j = await getJudge();
  S.gpu = j ? await j.hasWebGPU() : false;
  if (!S.gpu) {
    $("gpuNote").classList.remove("hidden");
    $("startBtn").classList.add("hidden");
  }
  renderModels();
})();
