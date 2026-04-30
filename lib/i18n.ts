"use client";

import { useEffect, useState, useCallback } from "react";

export type Locale = "en" | "nl" | "de" | "fr" | "es";

const STORAGE_KEY = "brainarena-locale";
export const SUPPORTED: Locale[] = ["en", "nl", "de", "fr", "es"];

export const FLAG: Record<Locale, string> = {
  en: "🇬🇧",
  nl: "🇳🇱",
  de: "🇩🇪",
  fr: "🇫🇷",
  es: "🇪🇸",
};

export const LABEL: Record<Locale, string> = {
  en: "English",
  nl: "Nederlands",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
};

// ---------------------------------------------------------------------------
// Translation table — central place for shared UI strings used by the new
// logic-puzzle games (Vlakken, Verbind, Zon & Maan, Kronen). Per-game heavy
// content (rules, summaries) still lives in lib/howToPlay.ts.
// ---------------------------------------------------------------------------

type TranslationKey =
  | "game_vlakken" | "game_vlakken_desc"
  | "game_verbind" | "game_verbind_desc"
  | "game_zonmaan" | "game_zonmaan_desc"
  | "game_kronen"  | "game_kronen_desc"
  | "how_to_play" | "undo" | "hint" | "reset" | "new_game"
  | "easy" | "medium" | "hard"
  | "completed" | "best_time" | "your_time"
  | "solved" | "solve_to_win" | "no_more_undo" | "no_more_hints"
  | "active" | "active_anchor" | "tap_to_select" | "clear" | "submit"
  | "current" | "path_length" | "next_number"
  | "constraint_equal" | "constraint_opposite";

const T: Record<Locale, Record<TranslationKey, string>> = {
  en: {
    game_vlakken: "Patches",
    game_vlakken_desc: "Fill the grid by completing the shapes around the numbers",
    game_verbind: "Connect",
    game_verbind_desc: "Connect the numbers in order with one path through every cell",
    game_zonmaan: "Sun & Moon",
    game_zonmaan_desc: "Fill the grid with suns and moons following the rules",
    game_kronen: "Crowns",
    game_kronen_desc: "Place one crown in each row, column, and color region",
    how_to_play: "How to play",
    undo: "Undo",
    hint: "Hint",
    reset: "Reset",
    new_game: "New game",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    completed: "Completed",
    best_time: "Best time",
    your_time: "Your time",
    solved: "Solved!",
    solve_to_win: "Solve the puzzle to win.",
    no_more_undo: "Nothing to undo.",
    no_more_hints: "No more hints.",
    active: "Active",
    active_anchor: "Active anchor",
    tap_to_select: "Tap an anchor to start.",
    clear: "Clear",
    submit: "Submit",
    current: "Current",
    path_length: "Length",
    next_number: "Next",
    constraint_equal: "Same symbol",
    constraint_opposite: "Opposite symbol",
  },
  nl: {
    game_vlakken: "Vlakken",
    game_vlakken_desc: "Vul het rooster door de vormen rond de getallen te voltooien",
    game_verbind: "Verbind",
    game_verbind_desc: "Verbind de getallen op volgorde via één pad door alle cellen",
    game_zonmaan: "Zon & Maan",
    game_zonmaan_desc: "Vul het rooster met zonnen en manen volgens de regels",
    game_kronen: "Kronen",
    game_kronen_desc: "Plaats één kroon in elke rij, kolom en kleurgebied",
    how_to_play: "Hoe te spelen",
    undo: "Ongedaan",
    hint: "Hint",
    reset: "Reset",
    new_game: "Nieuw spel",
    easy: "Makkelijk",
    medium: "Gemiddeld",
    hard: "Moeilijk",
    completed: "Voltooid",
    best_time: "Beste tijd",
    your_time: "Jouw tijd",
    solved: "Opgelost!",
    solve_to_win: "Los de puzzel op om te winnen.",
    no_more_undo: "Niets meer om ongedaan te maken.",
    no_more_hints: "Geen hints meer.",
    active: "Actief",
    active_anchor: "Actief anker",
    tap_to_select: "Tik op een anker om te beginnen.",
    clear: "Wis",
    submit: "OK",
    current: "Huidig",
    path_length: "Lengte",
    next_number: "Volgend",
    constraint_equal: "Zelfde symbool",
    constraint_opposite: "Tegengesteld symbool",
  },
  de: {
    game_vlakken: "Flächen",
    game_vlakken_desc: "Fülle das Raster, indem du die Formen um die Zahlen vervollständigst",
    game_verbind: "Verbinden",
    game_verbind_desc: "Verbinde die Zahlen der Reihe nach mit einem Pfad durch jede Zelle",
    game_zonmaan: "Sonne & Mond",
    game_zonmaan_desc: "Fülle das Raster mit Sonnen und Monden nach den Regeln",
    game_kronen: "Kronen",
    game_kronen_desc: "Platziere eine Krone in jeder Reihe, Spalte und Farbregion",
    how_to_play: "Spielanleitung",
    undo: "Rückgängig",
    hint: "Hinweis",
    reset: "Zurücksetzen",
    new_game: "Neues Spiel",
    easy: "Einfach",
    medium: "Mittel",
    hard: "Schwer",
    completed: "Abgeschlossen",
    best_time: "Bestzeit",
    your_time: "Deine Zeit",
    solved: "Gelöst!",
    solve_to_win: "Löse das Rätsel, um zu gewinnen.",
    no_more_undo: "Nichts rückgängig zu machen.",
    no_more_hints: "Keine Hinweise mehr.",
    active: "Aktiv",
    active_anchor: "Aktiver Anker",
    tap_to_select: "Tippe einen Anker an, um zu starten.",
    clear: "Löschen",
    submit: "OK",
    current: "Aktuell",
    path_length: "Länge",
    next_number: "Nächste",
    constraint_equal: "Gleiches Symbol",
    constraint_opposite: "Gegenteiliges Symbol",
  },
  fr: {
    game_vlakken: "Pièces",
    game_vlakken_desc: "Remplissez la grille en complétant les formes autour des nombres",
    game_verbind: "Relier",
    game_verbind_desc: "Reliez les nombres dans l'ordre par un chemin passant par chaque cellule",
    game_zonmaan: "Soleil & Lune",
    game_zonmaan_desc: "Remplissez la grille avec soleils et lunes selon les règles",
    game_kronen: "Couronnes",
    game_kronen_desc: "Placez une couronne dans chaque ligne, colonne et région colorée",
    how_to_play: "Comment jouer",
    undo: "Annuler",
    hint: "Indice",
    reset: "Réinitialiser",
    new_game: "Nouvelle partie",
    easy: "Facile",
    medium: "Moyen",
    hard: "Difficile",
    completed: "Terminé",
    best_time: "Meilleur temps",
    your_time: "Votre temps",
    solved: "Résolu !",
    solve_to_win: "Résous la grille pour gagner.",
    no_more_undo: "Rien à annuler.",
    no_more_hints: "Plus d'indices.",
    active: "Actif",
    active_anchor: "Ancre active",
    tap_to_select: "Touche une ancre pour commencer.",
    clear: "Effacer",
    submit: "OK",
    current: "Actuel",
    path_length: "Longueur",
    next_number: "Suivant",
    constraint_equal: "Même symbole",
    constraint_opposite: "Symbole opposé",
  },
  es: {
    game_vlakken: "Parches",
    game_vlakken_desc: "Rellena la cuadrícula completando las formas alrededor de los números",
    game_verbind: "Conecta",
    game_verbind_desc: "Conecta los números en orden con un camino por cada celda",
    game_zonmaan: "Sol y Luna",
    game_zonmaan_desc: "Rellena la cuadrícula con soles y lunas según las reglas",
    game_kronen: "Coronas",
    game_kronen_desc: "Coloca una corona en cada fila, columna y región de color",
    how_to_play: "Cómo jugar",
    undo: "Deshacer",
    hint: "Pista",
    reset: "Reiniciar",
    new_game: "Nueva partida",
    easy: "Fácil",
    medium: "Medio",
    hard: "Difícil",
    completed: "Completado",
    best_time: "Mejor tiempo",
    your_time: "Tu tiempo",
    solved: "¡Resuelto!",
    solve_to_win: "Resuelve el puzle para ganar.",
    no_more_undo: "Nada que deshacer.",
    no_more_hints: "Sin más pistas.",
    active: "Activo",
    active_anchor: "Ancla activa",
    tap_to_select: "Toca un ancla para empezar.",
    clear: "Borrar",
    submit: "OK",
    current: "Actual",
    path_length: "Longitud",
    next_number: "Siguiente",
    constraint_equal: "Mismo símbolo",
    constraint_opposite: "Símbolo opuesto",
  },
};

export function translate(locale: Locale, key: TranslationKey): string {
  return T[locale]?.[key] ?? T.en[key] ?? key;
}

let current: Locale = "en";
const subs = new Set<(l: Locale) => void>();

function detectFromBrowser(): Locale {
  if (typeof navigator === "undefined") return "en";
  const lang = (navigator.language || "en").slice(0, 2).toLowerCase();
  return (SUPPORTED as string[]).includes(lang) ? (lang as Locale) : "en";
}

function setLocale(l: Locale) {
  current = l;
  if (typeof window !== "undefined") {
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
    document.documentElement.setAttribute("lang", l);
  }
  subs.forEach((fn) => fn(l));
}

export function useLocale() {
  const [locale, set] = useState<Locale>(current);

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Locale | null;
    const initial: Locale =
      stored && (SUPPORTED as string[]).includes(stored)
        ? stored
        : detectFromBrowser();
    if (initial !== current) {
      current = initial;
      document.documentElement.setAttribute("lang", initial);
      set(initial);
    } else {
      document.documentElement.setAttribute("lang", current);
    }
    const fn = (l: Locale) => set(l);
    subs.add(fn);
    return () => { subs.delete(fn); };
  }, []);

  const change = useCallback((l: Locale) => setLocale(l), []);
  const t = useCallback((key: TranslationKey) => translate(locale, key), [locale]);
  return { locale, setLocale: change, t };
}
