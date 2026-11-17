# Tiefgang

A word-association dive game. 7 prompts, 25 seconds each: obvious answers sink the sub a little, rare-but-correct answers send it plunging toward the Challenger Deep (10,935 m). English and German.

## How judging works (free, no server)

1. **Obvious-answer list** (`js/data.js`): each prompt has ~15 common answers, ordered from most to least common. A typo-tolerant match scores instantly (shallow dive).
2. **AI in the browser** (`js/judge.js`): anything else goes to a small language model that runs on the player's GPU via [WebLLM](https://github.com/mlc-ai/web-llm) / WebGPU. No API key, no server, no cost.
   - Two one-token questions: "Does it fit? Yes/No" and "How unusual? 1–5". The game reads the model's probabilities instead of its text, which is much more stable with small models.
   - Default model: Qwen2.5 1.5B (~1 GB, downloaded once, then cached in IndexedDB). 3B (~2 GB) is stricter but about 3× slower.
   - Needs WebGPU: Chrome / Edge on desktop, recent Safari. Without it, the game falls back to list-only mode.

## Run locally

Any static server works, for example:

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173. (Opening `index.html` directly via `file://` won't work because of ES modules.)

## Host for free

It's 100 % static, so GitHub Pages, Cloudflare Pages or Netlify work. For GitHub Pages: push this folder to a repo, then Settings → Pages → deploy from branch `main`, folder `/`.

## Files

- `js/data.js`: prompts (EN/DE), rarity tiers, zones, UI texts
- `js/judge.js`: list matching + WebLLM judge
- `js/worker.js`: runs the model in a Web Worker so the animation stays smooth
- `js/render.js`: canvas ocean, sub, creatures, effects
- `js/audio.js`: synthesized sound effects (no audio files)
- `js/game.js`: game flow, timer, HUD, end screen

Adding prompts: append an entry to `PROMPTS` in `js/data.js` with `en` and `de` versions.
