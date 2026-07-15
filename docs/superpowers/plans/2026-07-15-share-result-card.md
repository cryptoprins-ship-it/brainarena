# Shareable Result Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a visual PNG result-card (one shared canvas template for all 13 games) to the existing share flow, so players share an image instead of plain text to WhatsApp status / Instagram stories / X.

**Architecture:** A new pure function `buildShareCardBlob()` in `lib/shareCard.ts` draws a 1200×630 canvas (dark background, grid pattern, logo, game label, big headline value, Wordle tile row when applicable) and resolves it as a PNG `Blob`. `ShareButton.tsx` builds this blob on click and passes it into `lib/share.ts`'s `nativeShare()`, which attaches it to the OS share sheet when the platform supports file attachments (`navigator.canShare({ files })`), falling back to text-only share or — in the explicit menu — a new "Download image" option. No server changes, no new dependencies.

**Tech Stack:** Next.js 16 client components, browser Canvas 2D API, existing `lib/share.ts` share layer, Web Share API.

## Global Constraints

- One shared visual template for all 13 games — no per-game custom designs (spec: Scope).
- No server-side rendering of the card, no new API routes, no new npm dependencies.
- Reuse existing `SharePayload`, `dayNumber()`, `GAME_NAMES`, `hasNativeShare()` — do not duplicate game-specific data extraction outside `lib/share.ts`.
- Existing platform-link menu (X, WhatsApp, Telegram, Facebook, Reddit, Email) and `copyShareText()` stay text-only and unchanged — URL-intent links cannot carry a file.
- One new i18n key (`share_download_image`) across all 8 locales (en, nl, de, fr, es, hi, pt-BR, ja) in `lib/i18n.ts`.
- Node 24 runs `.ts` files directly via `node scripts/*.mjs` (native TS support) — match the existing `scripts/test-*.mjs` convention, no test framework/loader needed.

---

### Task 1: Share-card headline values (`lib/share.ts`)

**Files:**
- Modify: `lib/share.ts:22` (export `GAME_NAMES`), insert new block after `lib/share.ts:145` (after the `timePuzzle` function, before the `buildShareText` comment at line 147)
- Test: `scripts/test-shareCard.mjs` (new)

**Interfaces:**
- Consumes: existing `GameKey` (from `@/lib/scores`), existing `SharePayload`, `num()`/`str()`/`bool()`/`formatTime()` helpers already defined in `lib/share.ts` (no changes to their signatures).
- Produces: `export const SHARE_HEADLINES: Record<GameKey, (p: SharePayload) => string>` — one big headline value per game, e.g. `"4/6"`, `"2:34"`, `"1246"`, `"💥"`. `export const GAME_NAMES` (was module-private). Task 4 (`lib/shareCard.ts`) imports both.

- [ ] **Step 1: Write the failing test**

Create `scripts/test-shareCard.mjs`:

```js
// Smoke test for the share-card headline values (pure functions, no
// browser/canvas needed) and the native-share file-attachment fallback
// logic (Task 2 appends to this file).
//
// Run with: node scripts/test-shareCard.mjs

import { SHARE_HEADLINES } from "../lib/share.ts";

let pass = 0;
let fail = 0;

function check(label, actual, expected) {
  if (actual === expected) {
    pass++;
  } else {
    fail++;
    console.error(`[FAIL] ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

check("wordle win", SHARE_HEADLINES.wordle({ score: 0, meta: { won: true, guesses: 4 } }), "4/6");
check("wordle loss", SHARE_HEADLINES.wordle({ score: 0, meta: { won: false } }), "X/6");
check("boggle", SHARE_HEADLINES.boggle({ score: 87, meta: { found: 12 } }), "87");
check("sudoku", SHARE_HEADLINES.sudoku({ score: 0, time: 154 }), "2:34");
check("typing", SHARE_HEADLINES.typing({ score: 62, meta: { accuracy: 97 } }), "62 WPM");
check("tiledrop", SHARE_HEADLINES.tiledrop({ score: 4200 }), "4200");
check("colormatch", SHARE_HEADLINES.colormatch({ score: 1246 }), "1246");
check("letterstack", SHARE_HEADLINES.letterstack({ score: 340 }), "340");
check("vlakken", SHARE_HEADLINES.vlakken({ score: 0, time: 95 }), "1:35");
check("verbind", SHARE_HEADLINES.verbind({ score: 0, time: 42 }), "0:42");
check("zonmaan", SHARE_HEADLINES.zonmaan({ score: 0, time: 200 }), "3:20");
check("kronen", SHARE_HEADLINES.kronen({ score: 0, time: 88 }), "1:28");
check("minesweeper win", SHARE_HEADLINES.minesweeper({ score: 0, time: 61, meta: { won: true } }), "1:01");
check("minesweeper loss", SHARE_HEADLINES.minesweeper({ score: 0, meta: { won: false } }), "💥");
check("connections win", SHARE_HEADLINES.connections({ score: 4 }), "4/4");
check("connections partial", SHARE_HEADLINES.connections({ score: 2 }), "2/4");

console.log(`\nShare-card headline tests: PASS ${pass} · FAIL ${fail}`);
if (fail > 0) process.exit(1);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-shareCard.mjs`
Expected: throws `SyntaxError: The requested module '../lib/share.ts' does not provide an export named 'SHARE_HEADLINES'`

- [ ] **Step 3: Export `GAME_NAMES` and add `SHARE_HEADLINES`**

In `lib/share.ts:22`, change:
```ts
const GAME_NAMES: Record<GameKey, string> = {
```
to:
```ts
export const GAME_NAMES: Record<GameKey, string> = {
```

After the `timePuzzle` function (`lib/share.ts:141-145`), insert:

```ts
// One big headline value per game for the visual result-card — no full
// sentence, no "BrainArena" prefix (the card's logo already carries
// that). Reuses the same num()/str()/bool()/formatTime() helpers as
// FORMATTERS above so there is exactly one place per game that reads
// its meta shape.
export const SHARE_HEADLINES: Record<GameKey, (p: SharePayload) => string> = {
  wordle: (p) => {
    const won = bool(p.meta, "won");
    const guesses = num(p.meta, "guesses") ?? 0;
    return won ? `${guesses}/6` : "X/6";
  },
  boggle: (p) => `${p.score}`,
  sudoku: (p) => formatTime(p.time ?? 0),
  typing: (p) => `${p.score} WPM`,
  tiledrop: (p) => `${p.score}`,
  colormatch: (p) => `${p.score}`,
  letterstack: (p) => `${p.score}`,
  vlakken: (p) => formatTime(p.time ?? 0),
  verbind: (p) => formatTime(p.time ?? 0),
  zonmaan: (p) => formatTime(p.time ?? 0),
  kronen: (p) => formatTime(p.time ?? 0),
  minesweeper: (p) => (bool(p.meta, "won") === false ? "💥" : formatTime(p.time ?? 0)),
  connections: (p) => `${p.score}/4`,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test-shareCard.mjs`
Expected: `Share-card headline tests: PASS 16 · FAIL 0`

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add lib/share.ts scripts/test-shareCard.mjs
git commit -m "feat(share): add per-game headline values for the result-card"
```

---

### Task 2: `nativeShare()` file attachment (`lib/share.ts`)

**Files:**
- Modify: `lib/share.ts:218-237` (the `nativeShare` function)
- Test: `scripts/test-shareCard.mjs` (append)

**Interfaces:**
- Consumes: existing `hasNativeShare()`, `buildShareText()`, `gameUrl()` (all unchanged) from the same file.
- Produces: `nativeShare(game: GameKey, payload: SharePayload, file?: File | null): Promise<NativeShareOutcome>` — third parameter is new and optional, so the one existing call site keeps compiling until Task 5 updates it. Task 5 (`ShareButton.tsx`) passes the card `File` here.

- [ ] **Step 1: Write the failing test**

Append to `scripts/test-shareCard.mjs` (before the final `console.log`/`process.exit` lines — move those two lines to the very end of the file after this block):

```js
// --- nativeShare() file-attachment branching (mocked navigator) ---

let lastShareCall = null;
let canShareResult = true;

Object.defineProperty(globalThis, "navigator", {
  value: {
    share: async (data) => { lastShareCall = data; },
    canShare: () => canShareResult,
  },
  configurable: true,
});

const { nativeShare } = await import("../lib/share.ts");
const testFile = new File([], "card.png", { type: "image/png" });

canShareResult = true;
await nativeShare("wordle", { score: 0, meta: { won: true, guesses: 3 } }, testFile);
check("nativeShare attaches file when canShare allows it", Array.isArray(lastShareCall?.files), true);

canShareResult = false;
lastShareCall = null;
await nativeShare("wordle", { score: 0, meta: { won: true, guesses: 3 } }, testFile);
check("nativeShare omits file when canShare rejects it", lastShareCall?.files, undefined);

lastShareCall = null;
await nativeShare("wordle", { score: 0, meta: { won: true, guesses: 3 } });
check("nativeShare omits file when none passed", lastShareCall?.files, undefined);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-shareCard.mjs`
Expected: the 3 new checks report `[FAIL]` with `expected true, got undefined` / similar — `nativeShare` currently ignores the third argument entirely, so `files` never appears on `lastShareCall`.

- [ ] **Step 3: Implement the file-attachment branch**

In `lib/share.ts:218-237`, replace:

```ts
export type NativeShareOutcome = "shared" | "dismissed" | "unavailable" | "failed";

// Invoke the OS share sheet. "dismissed" if the user cancels (so the
// caller doesn't fall through to a misleading "copied" toast),
// "unavailable" if there's no Web Share API, "failed" on anything else.
export async function nativeShare(
  game: GameKey,
  payload: SharePayload,
): Promise<NativeShareOutcome> {
  if (!hasNativeShare()) return "unavailable";
  const text = buildShareText(game, payload);
  const url = gameUrl(game);
  try {
    await navigator.share({ text, url });
    return "shared";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "dismissed";
    return "failed";
  }
}
```

with:

```ts
export type NativeShareOutcome = "shared" | "dismissed" | "unavailable" | "failed";

// Invoke the OS share sheet. "dismissed" if the user cancels (so the
// caller doesn't fall through to a misleading "copied" toast),
// "unavailable" if there's no Web Share API, "failed" on anything else.
// `file` (the rendered share-card PNG) rides along when the platform
// supports file attachments — navigator.canShare must be re-checked
// with the concrete File, since the capability can't be tested
// abstractly (canShareResult can differ per file type/size).
export async function nativeShare(
  game: GameKey,
  payload: SharePayload,
  file?: File | null,
): Promise<NativeShareOutcome> {
  if (!hasNativeShare()) return "unavailable";
  const text = buildShareText(game, payload);
  const url = gameUrl(game);
  const shareData: ShareData =
    file && navigator.canShare?.({ files: [file] })
      ? { text, url, files: [file] }
      : { text, url };
  try {
    await navigator.share(shareData);
    return "shared";
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "dismissed";
    return "failed";
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test-shareCard.mjs`
Expected: `Share-card headline tests: PASS 19 · FAIL 0`

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add lib/share.ts scripts/test-shareCard.mjs
git commit -m "feat(share): attach the result-card image to native share when supported"
```

---

### Task 3: i18n — `share_download_image` (`lib/i18n.ts`)

**Files:**
- Modify: `lib/i18n.ts:89-90` (add key to `TranslationKey` union), and one line after each of `lib/i18n.ts:296`, `577`, `859`, `1141`, `1423`, `1705`, `1989`, `2271` (one per locale block, immediately after the existing `share_to_aria:` entry in that block)

**Interfaces:**
- Consumes: nothing new.
- Produces: `t("share_download_image")` valid in all 8 locales. Task 5 (`ShareButton.tsx`) calls this.

- [ ] **Step 1: Add the key to the `TranslationKey` union**

In `lib/i18n.ts:89-90`, change:
```ts
  | "share_copied" | "share_copy_dialog" | "share_copy_failed"
  | "share_copy_text" | "share_to_aria"
```
to:
```ts
  | "share_copied" | "share_copy_dialog" | "share_copy_failed"
  | "share_copy_text" | "share_to_aria" | "share_download_image"
```

- [ ] **Step 2: Run typecheck to see the exhaustiveness errors**

Run: `npx tsc --noEmit`
Expected: 8 errors, one per locale block, each reading roughly `Property 'share_download_image' is missing in type '{ ... }'`

- [ ] **Step 3: Add the translated string to each locale block**

In `lib/i18n.ts`, after each line below, insert the corresponding new line:

After line 296 (`share_to_aria: "Share to",`):
```ts
    share_download_image: "Download image",
```

After line 577 (`share_to_aria: "Delen via",`):
```ts
    share_download_image: "Download afbeelding",
```

After line 859 (`share_to_aria: "Teilen mit",`):
```ts
    share_download_image: "Bild herunterladen",
```

After line 1141 (`share_to_aria: "Partager sur",`):
```ts
    share_download_image: "Télécharger l'image",
```

After line 1423 (`share_to_aria: "Compartir en",`):
```ts
    share_download_image: "Descargar imagen",
```

After line 1705 (`share_to_aria: "इसमें शेयर करें",`):
```ts
    share_download_image: "छवि डाउनलोड करें",
```

After line 1989 (`share_to_aria: "Compartilhar em",`):
```ts
    share_download_image: "Baixar imagem",
```

After line 2271 (`share_to_aria: "シェア先",`):
```ts
    share_download_image: "画像をダウンロード",
```

(Line numbers shift downward by one after each insertion if you're editing top-to-bottom in a single pass — insert bottom-to-top, or re-locate each `share_to_aria:` line by text search rather than by number, to avoid drift.)

- [ ] **Step 4: Run typecheck to verify it passes**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add lib/i18n.ts
git commit -m "feat(i18n): add share_download_image across all 8 locales"
```

---

### Task 4: Canvas card renderer (`lib/shareCard.ts`)

**Files:**
- Create: `lib/shareCard.ts`

**Interfaces:**
- Consumes: `GAME_NAMES`, `SHARE_HEADLINES`, `dayNumber()`, `SharePayload` from `lib/share.ts` (Task 1); `GameKey` from `@/lib/scores`.
- Produces: `export function buildShareCardBlob(game: GameKey, payload: SharePayload): Promise<Blob | null>`. Task 5 (`ShareButton.tsx`) calls this.

This task has no automated test — canvas pixel output isn't meaningfully unit-testable, and the spec calls this out explicitly (manual verification only). Verification is a concrete manual check in Step 3.

- [ ] **Step 1: Create `lib/shareCard.ts`**

```ts
"use client";

// Renders the shareable result-card: one 1200×630 PNG template reused
// by every game. Draws on an in-memory canvas (never mounted in the
// DOM) and resolves the PNG as a Blob for ShareButton to attach to the
// native share sheet or offer as a download.

import type { GameKey } from "@/lib/scores";
import { GAME_NAMES, SHARE_HEADLINES, dayNumber, type SharePayload } from "@/lib/share";

const WIDTH = 1200;
const HEIGHT = 630;
const BG = "#0a0a0a";
const GRID_LINE = "rgba(255,255,255,0.04)";
const TEXT_MUTED = "#9ca3af";
const TEXT_FAINT = "#6b7280";
const ACCENT_FROM = "#6366f1";
const ACCENT_TO = "#818cf8";

const TILE_COLORS: Record<string, string> = {
  correct: "#538d4e",
  present: "#b59f3b",
};
const TILE_DEFAULT = "#3a3a3c";

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = GRID_LINE;
  ctx.lineWidth = 2;
  for (let x = 0; x <= WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
}

function drawHeader(ctx: CanvasRenderingContext2D) {
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#818cf8";
  ctx.font = "900 32px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("🧠 BrainArena", 48, 72);

  ctx.fillStyle = TEXT_FAINT;
  ctx.font = "400 20px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("brainarena.fun", WIDTH - 48, 68);
}

function drawLabel(ctx: CanvasRenderingContext2D, game: GameKey, payload: SharePayload) {
  const loc = payload.locale ? ` ${payload.locale.toUpperCase()}` : "";
  const label = `${GAME_NAMES[game]}${loc} #${dayNumber()}`;
  ctx.fillStyle = TEXT_MUTED;
  ctx.font = "600 26px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label.toUpperCase(), WIDTH / 2, 240);
}

// Draws the last guess row as colored tiles (Wordle only). Returns the
// extra vertical space consumed so the headline can shift down to
// avoid overlapping it — 0 when there's nothing to draw.
function drawWordleTiles(ctx: CanvasRenderingContext2D, meta: Record<string, unknown> | undefined): number {
  const states = meta?.states;
  if (!Array.isArray(states) || states.length === 0) return 0;
  const lastRow = states[states.length - 1];
  if (!Array.isArray(lastRow) || lastRow.length === 0) return 0;

  const size = 56;
  const gap = 8;
  const totalWidth = lastRow.length * size + (lastRow.length - 1) * gap;
  let x = (WIDTH - totalWidth) / 2;
  const y = 280;
  for (const s of lastRow) {
    ctx.fillStyle = TILE_COLORS[String(s)] ?? TILE_DEFAULT;
    ctx.fillRect(x, y, size, size);
    x += size + gap;
  }
  return size + 40;
}

function drawHeadline(ctx: CanvasRenderingContext2D, game: GameKey, payload: SharePayload, offsetY: number) {
  const headline = SHARE_HEADLINES[game](payload);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 108px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(headline, WIDTH / 2, 400 + offsetY);
}

function drawAccentBar(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(48, 0, WIDTH - 48, 0);
  gradient.addColorStop(0, ACCENT_FROM);
  gradient.addColorStop(1, ACCENT_TO);
  ctx.fillStyle = gradient;
  ctx.fillRect(48, HEIGHT - 56, WIDTH - 96, 6);
}

// Renders the card and resolves the PNG as a Blob. Resolves `null` if
// the canvas can't produce a blob (extremely rare) — the caller falls
// back to text-only sharing rather than blocking the whole flow.
export function buildShareCardBlob(game: GameKey, payload: SharePayload): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);

  drawBackground(ctx);
  drawHeader(ctx);
  drawLabel(ctx, game, payload);
  const tileOffset = game === "wordle" ? drawWordleTiles(ctx, payload.meta) : 0;
  drawHeadline(ctx, game, payload, tileOffset);
  drawAccentBar(ctx);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Manual smoke check in the browser console**

Run: `npm run dev`, open `http://localhost:3000/wordle` in a browser, finish (or lose) today's puzzle to reach the end screen, then open the browser DevTools console on that page and run:

```js
const mod = await import("/lib/shareCard.ts");
const blob = await mod.buildShareCardBlob("wordle", { score: 0, time: 60, meta: { won: true, guesses: 4, states: [["correct","present","absent","correct","correct"]] } });
console.log(blob.size, blob.type);
const url = URL.createObjectURL(blob);
window.open(url);
```

Expected: a new tab opens showing a dark 1200×630 image with "🧠 BrainArena" top-left, "brainarena.fun" top-right, "WORDLE #<N>" label, a row of 5 colored tiles, and "4/6" in large white text near the bottom, with an indigo gradient bar at the very bottom. (Dev-server module path may need adjusting to however Next.js serves `lib/` — if the dynamic `import()` 404s, instead temporarily call `buildShareCardBlob` from a `console.log` added inside `ShareButton`'s `onShareClick` in Task 5 and inspect there; this step is a visual gate, not a scripted one.)

- [ ] **Step 4: Commit**

```bash
git add lib/shareCard.ts
git commit -m "feat(share): render the result-card as a canvas PNG"
```

---

### Task 5: Wire the card into `ShareButton.tsx`

**Files:**
- Modify: `components/ShareButton.tsx`

**Interfaces:**
- Consumes: `buildShareCardBlob` (Task 4), `nativeShare(game, payload, file?)` (Task 2), `t("share_download_image")` (Task 3). All other existing imports/behavior in this file are unchanged.
- Produces: nothing new consumed elsewhere — this is the leaf that wires everything together.

- [ ] **Step 1: Add the import**

In `components/ShareButton.tsx`, after the existing `import { ... } from "@/lib/share";` block, add:

```ts
import { buildShareCardBlob } from "@/lib/shareCard";
```

- [ ] **Step 2: Add a card-file builder and use it in `onShareClick`**

Replace the existing `onShareClick` function:

```ts
  async function onShareClick() {
    // Web Share-capable browser: the OS sheet already covers every
    // installed app, so use it directly and skip the menu.
    if (hasNativeShare()) {
      const outcome = await nativeShare(game, payload);
      if (outcome === "shared" || outcome === "dismissed") return;
      // unavailable / failed → fall through to the explicit menu
    }
    if (menu) setMenu(null);
    else openMenu();
  }
```

with:

```ts
  async function buildCardFile(): Promise<File | null> {
    const blob = await buildShareCardBlob(game, payload);
    if (!blob) return null;
    return new File([blob], `brainarena-${game}.png`, { type: "image/png" });
  }

  async function onShareClick() {
    // Web Share-capable browser: the OS sheet already covers every
    // installed app, so use it directly and skip the menu. The
    // share-card image rides along when the platform supports file
    // attachments (nativeShare re-checks navigator.canShare with the
    // concrete File — capability can't be tested without one).
    if (hasNativeShare()) {
      const file = await buildCardFile();
      const outcome = await nativeShare(game, payload, file);
      if (outcome === "shared" || outcome === "dismissed") return;
      // unavailable / failed → fall through to the explicit menu
    }
    if (menu) setMenu(null);
    else openMenu();
  }
```

- [ ] **Step 3: Add the download handler**

After the existing `onCopy` function, add:

```ts
  // Platform-intent links (X/WhatsApp/...) are URL-based and can only
  // carry text, never a file — downloading is the only way a desktop
  // visitor without Web Share gets the actual image.
  async function onDownload() {
    setMenu(null);
    const file = await buildCardFile();
    if (!file) {
      flashToast(t("share_copy_failed"));
      return;
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }
```

- [ ] **Step 4: Add the menu item**

In the menu JSX, after the existing "Copy text" `<button>` (the one calling `onCopy`), add:

```tsx
          <button
            type="button"
            role="menuitem"
            onClick={onDownload}
            className="block w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-[#1a1a1a]"
          >
            {t("share_download_image")}
          </button>
```

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, open `http://localhost:3000/wordle`, finish today's puzzle.
- On a device/browser with Web Share file support (e.g. Android Chrome, or iOS Safari over your LAN IP): tap Share → the OS sheet should appear with an image attachment, not just text.
- On desktop Chrome/Firefox (no file-capable Web Share): click Share → the menu opens → click "Download image" → a PNG file downloads named `brainarena-wordle.png` → open it and confirm it matches the Task 4 Step 3 rendering, with today's actual Wordle result.
- Repeat the desktop download check on one non-Wordle game (e.g. `/sudoku`) and confirm no stray tile row appears and the headline shows a formatted time.

- [ ] **Step 7: Commit**

```bash
git add components/ShareButton.tsx
git commit -m "feat(share): wire the result-card image into ShareButton"
```

---

### Task 6: CI wiring and full verification

**Files:**
- Modify: `.github/workflows/ci.yml` (add a step)

**Interfaces:**
- Consumes: `scripts/test-shareCard.mjs` (Tasks 1–2).
- Produces: nothing consumed by later tasks — this is the last task.

- [ ] **Step 1: Add a CI step**

In `.github/workflows/ci.yml`, after the existing `Puzzle smoke tests` step:

```yaml
      - name: Puzzle smoke tests
        run: npm run test:puzzles
```

add:

```yaml
      - name: Share-card tests
        run: node scripts/test-shareCard.mjs
```

- [ ] **Step 2: Run the full local verification suite**

Run:
```bash
npx tsc --noEmit
npm run lint
node scripts/test-shareCard.mjs
npm run test:puzzles
npm run build
```
Expected: all five commands exit 0. `npm run build` in particular confirms `lib/shareCard.ts`'s browser-only Canvas APIs don't get invoked during the server/static build (they're only called from `ShareButton`'s click handlers, never at render/import time).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: run share-card tests"
```

- [ ] **Step 4: Push and confirm CI is green**

```bash
git push
```

Then check the GitHub Actions run for this push (`gh run list --branch main --limit 1`) and confirm `conclusion` is `"success"`.
