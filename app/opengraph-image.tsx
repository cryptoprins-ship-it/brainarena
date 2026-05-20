import { ImageResponse } from "next/og";

// Site-wide social-share card. Applies to every route that doesn't
// declare its own opengraph-image. Without this, links shared to
// WhatsApp / Discord / Slack / X render with no preview image.
// Twitter reuses og:image as fallback (see `twitter` block in layout.tsx).

export const alt = "BrainArena — Free Daily Puzzles & Word Games";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 130, fontWeight: 800, letterSpacing: "-0.03em" }}>
          <span style={{ color: "#ffffff" }}>Brain</span>
          <span style={{ color: "#818cf8" }}>Arena</span>
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 40, color: "#9ca3af" }}>
          Free Daily Puzzles &amp; Word Games
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 28, color: "#6b7280" }}>
          Wordle · Sudoku · Connections · Minesweeper · 10 more
        </div>
      </div>
    ),
    { ...size },
  );
}
