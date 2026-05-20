// CSS-load recovery — loaded by app/layout.tsx.
//
// The host (Hostinger) sometimes serves HTML from a backend instance
// whose build differs from the instance that serves /_next/static, so a
// content-hashed stylesheet 404s and the page renders unstyled ("kaal").
// A failed same-origin <link rel=stylesheet> leaves link.sheet === null
// after window load; if so we reload once (sessionStorage sentinel) to
// re-roll onto a converged instance. ChunkErrorRecovery only covers JS
// chunk failures, not CSS — this fills that gap.
//
// This file lives in public/ on purpose: its path is stable (not
// content-hashed), so it loads regardless of the build skew it recovers
// from. Plain ES5, no bundler — keep it that way.
(function () {
  function brokenCss() {
    var links = document.querySelectorAll(
      'link[rel="stylesheet"][href^="/_next/"]'
    );
    if (!links.length) return false;
    for (var i = 0; i < links.length; i++) {
      // A stylesheet that loaded successfully has a non-null .sheet;
      // a 404'd same-origin one stays null after the load event.
      if (!links[i].sheet) return true;
    }
    return false;
  }

  function run() {
    var KEY = "ba-css-recover";
    if (brokenCss()) {
      // Sentinel: one reload per incident. If still broken after the
      // reload, stop — never loop. Cleared on a healthy load so a later
      // skew window in the same tab can recover again.
      if (sessionStorage.getItem(KEY)) return;
      try {
        sessionStorage.setItem(KEY, "1");
      } catch (e) {}
      location.reload();
    } else {
      try {
        sessionStorage.removeItem(KEY);
      } catch (e) {}
    }
  }

  if (document.readyState === "complete") run();
  else addEventListener("load", run);
})();
