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
