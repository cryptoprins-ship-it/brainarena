// Converts a 2-letter ISO country code (e.g. "NL", "DE", "BR") into the
// matching flag emoji by adding the regional-indicator-symbol offset to
// each letter. Falls back to a globe for missing or malformed codes —
// the leaderboard renders one row per score and we want every row to
// have *some* glyph even when the player's browser didn't report a
// country.
export function flagOf(country?: string): string {
  if (!country) return "\u{1F30D}";
  const cc = country.trim().toUpperCase();
  if (cc.length !== 2) return "\u{1F30D}";
  const A = 0x1f1e6;
  return String.fromCodePoint(
    A + cc.charCodeAt(0) - 65,
    A + cc.charCodeAt(1) - 65,
  );
}
