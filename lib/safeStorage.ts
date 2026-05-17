// localStorage access that never throws.
//
// A bare localStorage.getItem/setItem can throw — Brave's aggressive
// Shields, Safari private mode, and quota-exceeded all do it — and
// several games persist their best time inside React state-update
// paths (setState updaters, win handlers). A throw there crashes the
// render and visibly freezes the screen. These wrappers swallow the
// failure: the value just isn't persisted, the game keeps running.

export function safeGetItem(key: string): string | null {
  try {
    return typeof window !== "undefined" ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== "undefined") localStorage.setItem(key, value);
  } catch {
    // Storage blocked or full — best-effort only.
  }
}
