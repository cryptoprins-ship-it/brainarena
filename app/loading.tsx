// Global Suspense fallback for route segments under app/. Rendered as
// server-side HTML during navigation so the user never sees a blank /
// unstyled flash before the destination page finishes loading. The
// background color and min-height match the body in app/layout.tsx so
// there's no visual jump when the real page swaps in.
export default function Loading() {
  return (
    <div
      className="min-h-[60dvh] flex items-center justify-center bg-[#0a0a0a] text-gray-500"
      style={{ background: "#0a0a0a" }}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
        Loading…
      </div>
    </div>
  );
}
