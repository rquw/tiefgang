// Answer judge: instant list lookup first, then a small LLM running in the browser (WebLLM / WebGPU).
import { CreateWebWorkerMLCEngine, prebuiltAppConfig } from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.86/+esm";

export const MODELS = [
  { id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", size: "~1 GB", en: "Standard (recommended)", de: "Standard (empfohlen)" },
  { id: "Qwen2.5-3B-Instruct-q4f16_1-MLC", size: "~2 GB", en: "Smart (stricter, slower)", de: "Schlau (genauer, langsamer)" },
  { id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", size: "~0.4 GB", en: "Mini (fast, sloppy)", de: "Mini (schnell, ungenau)" },
];

let engine = null;
let readyPromise = null;
export const aiState = { status: "off", progress: 0, text: "" }; // off | loading | ready | error

export async function hasWebGPU() {
  if (!navigator.gpu) return false;
  try {
    return !!(await navigator.gpu.requestAdapter());
  } catch {
    return false;
  }
}

function createEngine(modelId, onProgress, useIndexedDB) {
  const worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
  return CreateWebWorkerMLCEngine(worker, modelId, {
    // IndexedDB is more reliable than the Cache API for the large weight shards.
    appConfig: { ...prebuiltAppConfig, cacheBackend: useIndexedDB ? "indexeddb" : "cache" },
    initProgressCallback: (r) => {
      aiState.progress = r.progress ?? 0;
      aiState.text = r.text ?? "";
      onProgress?.(aiState);
    },
  }).catch((err) => {
    worker.terminate();
    throw err;
  });
}

export function loadModel(modelId, onProgress) {
  aiState.status = "loading";
  aiState.progress = 0;
  readyPromise = createEngine(modelId, onProgress, true)
    .catch((err) => {
      console.warn("IndexedDB cache failed, retrying with Cache API", err);
      return createEngine(modelId, onProgress, false);
    })
    .then((e) => {
      engine = e;
      aiState.status = "ready";
      aiState.progress = 1;
      onProgress?.(aiState);
      return e;
    })
    .catch((err) => {
      console.error(err);
      aiState.status = "error";
      onProgress?.(aiState);
      return null;
    });
  return readyPromise;
}

// ---------- text matching ----------

const ARTICLES = /^(a|an|the|to|ein|eine|einen|einem|einer|der|die|das|den|dem|des)\s+/;

export function normalize(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(ARTICLES, "")
    .replace(/ /g, "");
}

function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

function similar(a, b) {
  if (a === b) return true;
  const L = Math.max(a.length, b.length);
  const tol = L <= 4 ? 0 : L <= 7 ? 1 : 2;
  if (lev(a, b) <= tol) return true;
  // plural / suffix tolerance: "eggs" vs "egg", "klatschen" vs "klatsch"
  const short = a.length < b.length ? a : b;
  const long = a.length < b.length ? b : a;
  return short.length >= 4 && long.startsWith(short) && long.length - short.length <= 2;
}

// Returns {index, total, label} if the answer is on the obvious-answers list.
export function listMatch(answer, common) {
  const n = normalize(answer);
  for (let i = 0; i < common.length; i++) {
    const aliases = common[i].split("/");
    for (const al of aliases) {
      if (similar(n, normalize(al))) return { index: i, total: common.length, label: aliases[0] };
    }
  }
  return null;
}

export function sameAnswer(a, b) {
  return similar(normalize(a), normalize(b));
}

// ---------- LLM judge ----------
// Small models are bad at writing calibrated JSON, but their token probabilities are useful.
// So we ask two one-token questions and read the probabilities instead of the text:
//   1. "Does it fit?"  -> P(Yes) vs P(No)
//   2. "How unusual?"  -> expected value over the digits 1..5

const FIT_SYSTEM = `You are the fair referee of a word game. A player names something for a category.
Say Yes if a reasonable person would agree the answer fits the category, even if it is unusual, rare or creative.
Say No if it is wrong, unrelated, nonsense, or does not really match the category.
Spelling mistakes are fine. Categories and answers may be in German.
Reply with exactly one word: Yes or No.`;

const FIT_SHOTS = [
  ['Category: "Name something you do with two hands"\nAnswer: "carry a big box"', "Yes"],
  ['Category: "Name something you do with two hands"\nAnswer: "doing homework"', "No"],
  ['Category: "Nenne etwas, das man im Bad findet"\nAnswer: "Zahnbürste"', "Yes"],
  ['Category: "Nenne etwas, das fliegen kann"\nAnswer: "Pinguin"', "No"],
  ['Category: "Nenne ein Tier, das im Meer lebt"\nAnswer: "Riesenassel"', "Yes"],
  ['Category: "Name something that is green"\nAnswer: "the Hulk"', "Yes"],
  ['Category: "Name something that is green"\nAnswer: "sdfkjh"', "No"],
  ['Category: "Nenne etwas, das man im Winter trägt"\nAnswer: "Ohrenschützer"', "Yes"],
  ['Category: "Nenne etwas, das man im Winter trägt"\nAnswer: "Fußball"', "No"],
];

const RARE_SYSTEM = `You estimate how unusual a correct answer in a word game is, compared to what most people would say.
1 = one of the first answers almost everyone says
2 = common, many people say it
3 = less obvious, some people say it
4 = rare, few people would think of it
5 = extremely rare and creative
Reply with exactly one digit.`;

const RARE_SHOTS = [
  ['Category: "Name something you do with two hands"\nTypical answers: clap, wash hands, type, drive\nAnswer: "jump-start a car"', "4"],
  ['Category: "Nenne etwas, das man im Kühlschrank findet"\nTypical answers: milch, butter, eier, käse\nAnswer: "Senf"', "2"],
  ['Category: "Nenne ein Tier, das im Meer lebt"\nTypical answers: hai, wal, delfin, fisch\nAnswer: "Riesenassel"', "5"],
  ['Category: "Name something that is yellow"\nTypical answers: banana, sun, lemon, cheese\nAnswer: "school bus"', "1"],
  ['Category: "Nenne etwas, das fliegen kann"\nTypical answers: vogel, flugzeug, hubschrauber, biene\nAnswer: "Zeppelin"', "3"],
];

function buildMessages(system, shots, user) {
  const m = [{ role: "system", content: system }];
  for (const [u, a] of shots) m.push({ role: "user", content: u }, { role: "assistant", content: a });
  m.push({ role: "user", content: user });
  return m;
}

// Returns {token -> probability} for the first generated token.
async function firstTokenProbs(e, messages) {
  const reply = await e.chat.completions.create({
    messages,
    temperature: 1, // keep the real distribution (temperature 0 collapses logprobs to one-hot)
    max_tokens: 1,
    logprobs: true,
    top_logprobs: 5,
  });
  const lp = reply.choices[0]?.logprobs?.content?.[0]?.top_logprobs ?? [];
  const out = {};
  for (const { token, logprob } of lp) {
    const k = token.trim().toLowerCase();
    out[k] = (out[k] ?? 0) + Math.exp(logprob);
  }
  if (!lp.length) {
    const txt = (reply.choices[0]?.message?.content ?? "").trim().toLowerCase();
    if (txt) out[txt] = 1;
  }
  return out;
}

const COMMENTS = {
  en: {
    no: ["That doesn't really fit.", "Nice try, but no.", "The sonar says: off-topic.", "Hmm, that's a stretch too far."],
    t1: ["The classic.", "Everyone says that one.", "Safe and shallow."],
    t2: ["Solid, not the first thing people say.", "Decent pick.", "A little off the beaten path."],
    t3: ["Ooh, clever.", "Not many people think of that.", "Now we're sinking."],
    t4: ["That's a deep cut!", "Very few would say that.", "The fish are impressed."],
    t5: ["Legendary answer!", "Almost nobody would think of that.", "Straight to the abyss!"],
  },
  de: {
    no: ["Das passt nicht wirklich.", "Netter Versuch, aber nein.", "Das Sonar sagt: Thema verfehlt.", "Hm, das ist zu weit hergeholt."],
    t1: ["Der Klassiker.", "Das sagt jeder.", "Sicher, aber flach."],
    t2: ["Solide, nicht das Erste, was man hört.", "Gute Wahl.", "Ein bisschen abseits vom Weg."],
    t3: ["Ooh, clever.", "Da kommen nicht viele drauf.", "Jetzt geht's abwärts."],
    t4: ["Das ist tief!", "Das sagt kaum jemand.", "Die Fische staunen."],
    t5: ["Legendäre Antwort!", "Darauf kommt fast niemand.", "Ab in die Tiefsee!"],
  },
};
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function commentFor(lang, valid, rarity) {
  const c = COMMENTS[lang] ?? COMMENTS.en;
  if (!valid) return pick(c.no);
  return pick(c["t" + Math.min(5, Math.max(1, Math.ceil(rarity / 2)))]);
}

// P(Yes) needed to count. Tuned on a small test set: 0.6 rejects "doing homework" for
// "with two hands" while still accepting "metal detector" for the beach.
const FIT_THRESHOLD = 0.6;

let queue = Promise.resolve();

export async function judgeWithAI(question, common, answer, lang) {
  if (!readyPromise) return null;
  const run = async () => {
    const e = await readyPromise;
    if (!e) return null;
    const a = answer.replace(/"/g, "'").slice(0, 60);

    const fit = await firstTokenProbs(e, buildMessages(FIT_SYSTEM, FIT_SHOTS, `Category: "${question}"\nAnswer: "${a}"`));
    const yes = (fit.yes ?? 0) + (fit.ja ?? 0);
    const no = (fit.no ?? 0) + (fit.nein ?? 0);
    const pFit = yes + no > 0 ? yes / (yes + no) : 0;
    if (pFit < FIT_THRESHOLD) return { valid: false, rarity: 0, pFit, comment: commentFor(lang, false) };

    const typical = common.slice(0, 6).map((c) => c.split("/")[0]).join(", ");
    const rare = await firstTokenProbs(
      e,
      buildMessages(RARE_SYSTEM, RARE_SHOTS, `Category: "${question}"\nTypical answers: ${typical}\nAnswer: "${a}"`)
    );
    let sum = 0, w = 0;
    for (let d = 1; d <= 5; d++) {
      const p = rare[String(d)] ?? 0;
      sum += d * p;
      w += p;
    }
    const expected = w > 0 ? sum / w : 3; // 1..5
    // Map 1..5 -> 2..10 on a convex curve: the model says "4" a lot, so only
    // confident 5s reach legendary. Anything not on the obvious list is at least 2.
    // A shaky "fits" verdict pulls the score down a little.
    let rarity = 2 + 8 * Math.pow(Math.max(0, expected - 1) / 4, 1.6);
    rarity *= 0.8 + 0.2 * Math.min(1, (pFit - FIT_THRESHOLD) / (1 - FIT_THRESHOLD));
    rarity = Math.max(2, Math.min(10, Math.round(rarity)));
    return { valid: true, rarity, pFit, expected, comment: commentFor(lang, true, rarity) };
  };
  const p = queue.then(run, run);
  queue = p.catch(() => {});
  return p;
}
