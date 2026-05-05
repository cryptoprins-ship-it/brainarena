"use client";

import { useEffect, useState, useCallback } from "react";

// 8 locales as of 2026-04-30: NL/EN are native quality, DE/FR/ES/PT-BR are
// machine-translated and flagged for native review (TBD: Fiverr proofread),
// HI/JA carry the highest machine-translation risk and are gated behind a
// "Coming soon" UX in the language switcher until they receive a native
// review.
export type Locale =
  | "en" | "nl" | "de" | "fr" | "es"
  | "hi" | "pt-BR" | "ja";

const STORAGE_KEY = "brainarena-locale";
export const SUPPORTED: Locale[] = ["en", "nl", "de", "fr", "es", "hi", "pt-BR", "ja"];

// Locales gated by the "review pending" UX. Selectable in dev / preview
// builds; in production the LanguageSwitcher decorates them with a badge
// and (configurably) blocks selection. Toggle here once a native review is
// signed off.
export const REVIEW_PENDING: ReadonlySet<Locale> = new Set<Locale>(["hi", "ja"]);

// Native names — what speakers of that language actually call it. Used in
// the dropdown switcher.
export const LABEL: Record<Locale, string> = {
  en: "English",
  nl: "Nederlands",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  hi: "हिन्दी",
  "pt-BR": "Português",
  ja: "日本語",
};

// Legacy emoji table — left for any places that still import FLAG by name.
// Inline SVGs in components/Flag.tsx are preferred (Windows renders most
// regional-indicator emoji as letter codes).
export const FLAG: Record<Locale, string> = {
  en: "🇬🇧",
  nl: "🇳🇱",
  de: "🇩🇪",
  fr: "🇫🇷",
  es: "🇪🇸",
  hi: "🇮🇳",
  "pt-BR": "🇧🇷",
  ja: "🇯🇵",
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
  | "constraint_equal" | "constraint_opposite"
  | "streak_active" | "streak_lost" | "streak_start_best" | "streak_start"
  | "win_title" | "win_your_time" | "win_hints_used" | "win_best_time"
  | "win_new_record" | "win_play_again" | "win_new_puzzle" | "win_share"
  | "zonmaan_three_in_row"
  | "vlakken_drag_hint" | "vlakken_err_no_seed" | "vlakken_err_multi_seed"
  | "vlakken_err_overlap" | "vlakken_err_size"
  | "vlakken_err_must_square" | "vlakken_err_must_tall" | "vlakken_err_must_wide"
  | "vlakken_err_hidden_wrong"
  | "boggle_loading_dict" | "boggle_invalid_word"
  | "boggle_unsupported_title" | "boggle_unsupported_body";

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
    streak_active: "🔥 {n} day streak — keep it going!",
    streak_lost: "Play today to keep your {n} day streak alive!",
    streak_start_best: "Start a new streak today! Your best was {n} days.",
    streak_start: "Play any game today to start a daily streak!",
    win_title: "Congratulations!",
    win_your_time: "Your time",
    win_hints_used: "Hints used",
    win_best_time: "Best time",
    win_new_record: "New best!",
    win_play_again: "Play again",
    win_new_puzzle: "New puzzle",
    win_share: "Share",
    zonmaan_three_in_row: "⚠ Three of the same symbol in a row or column.",
    vlakken_drag_hint: "Drag a rectangle that contains exactly one numbered seed.",
    vlakken_err_no_seed: "No numbered seed in that selection.",
    vlakken_err_multi_seed: "More than one seed in that selection.",
    vlakken_err_overlap: "Overlaps a solved shape.",
    vlakken_err_size: "Wrong size:",
    vlakken_err_must_square: "Must be a square.",
    vlakken_err_must_tall: "Must be a tall rectangle.",
    vlakken_err_must_wide: "Must be a wide rectangle.",
    vlakken_err_hidden_wrong: "Not the right shape — the seed has no number, deduce it from the rest of the board.",
    boggle_loading_dict: "Loading dictionary…",
    boggle_invalid_word: "Not a valid word.",
    boggle_unsupported_title: "Boggle is Latin alphabet only",
    boggle_unsupported_body: "Boggle's letter grid uses A–Z, so it isn't available for this language. Switch to a Latin-script language to play.",
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
    streak_active: "🔥 {n} dagen streak — hou hem vast!",
    streak_lost: "Speel vandaag om je streak van {n} dagen levend te houden!",
    streak_start_best: "Start vandaag een nieuwe streak! Je beste was {n} dagen.",
    streak_start: "Speel vandaag een spel om een dagelijkse streak te starten!",
    win_title: "Gefeliciteerd!",
    win_your_time: "Jouw tijd",
    win_hints_used: "Hints gebruikt",
    win_best_time: "Beste tijd",
    win_new_record: "Nieuw record!",
    win_play_again: "Speel opnieuw",
    win_new_puzzle: "Nieuwe puzzel",
    win_share: "Deel",
    zonmaan_three_in_row: "⚠ Drie dezelfde symbolen op een rij of kolom.",
    vlakken_drag_hint: "Sleep een rechthoek met precies één genummerde zaadcel.",
    vlakken_err_no_seed: "Geen zaadcel in deze selectie.",
    vlakken_err_multi_seed: "Meer dan één zaadcel in deze selectie.",
    vlakken_err_overlap: "Overlapt een opgeloste vorm.",
    vlakken_err_size: "Afmeting klopt niet:",
    vlakken_err_must_square: "Moet een vierkant zijn.",
    vlakken_err_must_tall: "Moet een hoge rechthoek zijn.",
    vlakken_err_must_wide: "Moet een brede rechthoek zijn.",
    vlakken_err_hidden_wrong: "Niet de juiste vorm — deze zaadcel heeft geen getal, leid 'm af uit de rest.",
    boggle_loading_dict: "Woordenboek laden…",
    boggle_invalid_word: "Geen geldig woord.",
    boggle_unsupported_title: "Boggle alleen in Latijns alfabet",
    boggle_unsupported_body: "Het Boggle-bord gebruikt A–Z, dus het is niet beschikbaar voor deze taal. Wissel naar een taal met Latijns schrift om te spelen.",
  },
  // TBD: native review (machine-translated starting point).
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
    streak_active: "🔥 {n} Tage Serie — weitermachen!",
    streak_lost: "Spiele heute, um deine {n}-Tage-Serie am Leben zu halten!",
    streak_start_best: "Starte heute eine neue Serie! Deine beste war {n} Tage.",
    streak_start: "Spiele heute ein Spiel, um eine tägliche Serie zu starten!",
    win_title: "Glückwunsch!",
    win_your_time: "Deine Zeit",
    win_hints_used: "Hinweise",
    win_best_time: "Bestzeit",
    win_new_record: "Neue Bestzeit!",
    win_play_again: "Nochmal",
    win_new_puzzle: "Neues Rätsel",
    win_share: "Teilen",
    zonmaan_three_in_row: "⚠ Drei gleiche Symbole in einer Zeile oder Spalte.",
    vlakken_drag_hint: "Ziehe ein Rechteck, das genau einen nummerierten Anker enthält.",
    vlakken_err_no_seed: "Kein Anker in der Auswahl.",
    vlakken_err_multi_seed: "Mehr als ein Anker in der Auswahl.",
    vlakken_err_overlap: "Überlappt eine gelöste Form.",
    vlakken_err_size: "Falsche Größe:",
    vlakken_err_must_square: "Muss ein Quadrat sein.",
    vlakken_err_must_tall: "Muss ein hohes Rechteck sein.",
    vlakken_err_must_wide: "Muss ein breites Rechteck sein.",
    vlakken_err_hidden_wrong: "Nicht die richtige Form — dieser Anker hat keine Zahl, leite sie aus dem Rest ab.",
    boggle_loading_dict: "Wörterbuch wird geladen…",
    boggle_invalid_word: "Kein gültiges Wort.",
    boggle_unsupported_title: "Boggle nur im lateinischen Alphabet",
    boggle_unsupported_body: "Das Boggle-Raster verwendet A–Z, daher ist es für diese Sprache nicht verfügbar. Wechsle zu einer Sprache mit lateinischer Schrift, um zu spielen.",
  },
  // TBD: native review.
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
    streak_active: "🔥 série de {n} jours — continue !",
    streak_lost: "Joue aujourd'hui pour garder ta série de {n} jours en vie !",
    streak_start_best: "Commence une nouvelle série aujourd'hui ! Ton record était de {n} jours.",
    streak_start: "Joue à un jeu aujourd'hui pour commencer une série quotidienne !",
    win_title: "Bravo !",
    win_your_time: "Votre temps",
    win_hints_used: "Indices",
    win_best_time: "Meilleur temps",
    win_new_record: "Nouveau record !",
    win_play_again: "Rejouer",
    win_new_puzzle: "Nouveau puzzle",
    win_share: "Partager",
    zonmaan_three_in_row: "⚠ Trois mêmes symboles sur une ligne ou colonne.",
    vlakken_drag_hint: "Trace un rectangle contenant exactement un point numéroté.",
    vlakken_err_no_seed: "Aucun point numéroté dans la sélection.",
    vlakken_err_multi_seed: "Plus d'un point dans la sélection.",
    vlakken_err_overlap: "Chevauche une forme déjà résolue.",
    vlakken_err_size: "Taille incorrecte :",
    vlakken_err_must_square: "Doit être un carré.",
    vlakken_err_must_tall: "Doit être un rectangle vertical.",
    vlakken_err_must_wide: "Doit être un rectangle horizontal.",
    vlakken_err_hidden_wrong: "Pas la bonne forme — cette ancre n'a pas de chiffre, déduis-la du reste.",
    boggle_loading_dict: "Chargement du dictionnaire…",
    boggle_invalid_word: "Mot invalide.",
    boggle_unsupported_title: "Boggle uniquement en alphabet latin",
    boggle_unsupported_body: "La grille Boggle utilise A–Z, donc elle n'est pas disponible pour cette langue. Passe à une langue à alphabet latin pour jouer.",
  },
  // TBD: native review.
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
    streak_active: "🔥 racha de {n} días — ¡sigue así!",
    streak_lost: "¡Juega hoy para mantener tu racha de {n} días!",
    streak_start_best: "¡Empieza una nueva racha hoy! Tu mejor fue de {n} días.",
    streak_start: "¡Juega cualquier juego hoy para empezar una racha diaria!",
    win_title: "¡Felicidades!",
    win_your_time: "Tu tiempo",
    win_hints_used: "Pistas",
    win_best_time: "Mejor tiempo",
    win_new_record: "¡Nuevo récord!",
    win_play_again: "Jugar otra vez",
    win_new_puzzle: "Nuevo puzzle",
    win_share: "Compartir",
    zonmaan_three_in_row: "⚠ Tres símbolos iguales en una fila o columna.",
    vlakken_drag_hint: "Arrastra un rectángulo que contenga exactamente un número.",
    vlakken_err_no_seed: "Ningún número en la selección.",
    vlakken_err_multi_seed: "Más de un número en la selección.",
    vlakken_err_overlap: "Se superpone con una forma ya resuelta.",
    vlakken_err_size: "Tamaño incorrecto:",
    vlakken_err_must_square: "Debe ser un cuadrado.",
    vlakken_err_must_tall: "Debe ser un rectángulo alto.",
    vlakken_err_must_wide: "Debe ser un rectángulo ancho.",
    vlakken_err_hidden_wrong: "No es la forma correcta — este ancla no tiene número, dedúcelo del resto.",
    boggle_loading_dict: "Cargando diccionario…",
    boggle_invalid_word: "Palabra no válida.",
    boggle_unsupported_title: "Boggle solo en alfabeto latino",
    boggle_unsupported_body: "La cuadrícula Boggle usa A–Z, por eso no está disponible para este idioma. Cambia a un idioma con alfabeto latino para jugar.",
  },
  // High-risk machine translation — gated behind REVIEW_PENDING.
  hi: {
    game_vlakken: "टुकड़े",
    game_vlakken_desc: "संख्याओं के चारों ओर आकृतियाँ पूरी करके ग्रिड भरें",
    game_verbind: "जोड़ें",
    game_verbind_desc: "हर सेल से होकर एक रास्ते से क्रम में संख्याएँ जोड़ें",
    game_zonmaan: "सूर्य और चंद्र",
    game_zonmaan_desc: "नियमों के अनुसार ग्रिड को सूर्यों और चंद्रमाओं से भरें",
    game_kronen: "मुकुट",
    game_kronen_desc: "हर पंक्ति, स्तंभ और रंग क्षेत्र में एक मुकुट रखें",
    how_to_play: "कैसे खेलें",
    undo: "पूर्ववत्",
    hint: "संकेत",
    reset: "रीसेट",
    new_game: "नया खेल",
    easy: "आसान",
    medium: "मध्यम",
    hard: "कठिन",
    completed: "पूर्ण",
    best_time: "सर्वश्रेष्ठ समय",
    your_time: "आपका समय",
    solved: "हल हो गया!",
    solve_to_win: "जीतने के लिए पहेली हल करें।",
    no_more_undo: "पूर्ववत् करने के लिए कुछ नहीं।",
    no_more_hints: "कोई और संकेत नहीं।",
    active: "सक्रिय",
    active_anchor: "सक्रिय एंकर",
    tap_to_select: "शुरू करने के लिए एक एंकर पर टैप करें।",
    clear: "साफ़",
    submit: "ठीक",
    current: "वर्तमान",
    path_length: "लंबाई",
    next_number: "अगला",
    constraint_equal: "समान चिह्न",
    constraint_opposite: "विपरीत चिह्न",
    streak_active: "🔥 {n} दिन की श्रृंखला — जारी रखें!",
    streak_lost: "अपनी {n} दिन की श्रृंखला जिंदा रखने के लिए आज खेलें!",
    streak_start_best: "आज नई श्रृंखला शुरू करें! आपकी सर्वश्रेष्ठ {n} दिन की थी।",
    streak_start: "दैनिक श्रृंखला शुरू करने के लिए आज कोई खेल खेलें!",
    win_title: "बधाई हो!",
    win_your_time: "आपका समय",
    win_hints_used: "संकेत उपयोग",
    win_best_time: "बेस्ट टाइम",
    win_new_record: "नया रिकॉर्ड!",
    win_play_again: "फिर खेलें",
    win_new_puzzle: "नई पहेली",
    win_share: "शेयर",
    zonmaan_three_in_row: "⚠ एक पंक्ति या स्तंभ में तीन समान चिह्न।",
    vlakken_drag_hint: "ऐसा आयत खींचें जिसमें ठीक एक संख्या हो।",
    vlakken_err_no_seed: "चयन में कोई संख्या नहीं।",
    vlakken_err_multi_seed: "चयन में एक से अधिक संख्या।",
    vlakken_err_overlap: "हल की गई आकृति से ओवरलैप।",
    vlakken_err_size: "गलत आकार:",
    vlakken_err_must_square: "वर्ग होना चाहिए।",
    vlakken_err_must_tall: "लंबा आयत होना चाहिए।",
    vlakken_err_must_wide: "चौड़ा आयत होना चाहिए।",
    vlakken_err_hidden_wrong: "सही आकार नहीं — इस एंकर पर कोई संख्या नहीं, बाकी से अनुमान लगाएँ।",
    boggle_loading_dict: "शब्दकोश लोड हो रहा है…",
    boggle_invalid_word: "मान्य शब्द नहीं।",
    boggle_unsupported_title: "Boggle केवल लैटिन वर्णमाला में",
    boggle_unsupported_body: "Boggle ग्रिड A–Z का उपयोग करता है, इसलिए यह इस भाषा में उपलब्ध नहीं है। खेलने के लिए लैटिन लिपि वाली भाषा पर जाएँ।",
  },
  // TBD: native review (Brazilian Portuguese — pt-BR not pt-PT). Many
  // strings carried over from the prior pt-PT seed; ensure Brazilian
  // spelling/colloquialisms in the proofread pass.
  "pt-BR": {
    game_vlakken: "Retalhos",
    game_vlakken_desc: "Preencha a grade completando as formas ao redor dos números",
    game_verbind: "Conectar",
    game_verbind_desc: "Conecte os números em ordem com um caminho que passe por cada célula",
    game_zonmaan: "Sol e Lua",
    game_zonmaan_desc: "Preencha a grade com sóis e luas seguindo as regras",
    game_kronen: "Coroas",
    game_kronen_desc: "Coloque uma coroa em cada linha, coluna e região colorida",
    how_to_play: "Como jogar",
    undo: "Desfazer",
    hint: "Dica",
    reset: "Reiniciar",
    new_game: "Novo jogo",
    easy: "Fácil",
    medium: "Médio",
    hard: "Difícil",
    completed: "Concluído",
    best_time: "Melhor tempo",
    your_time: "Seu tempo",
    solved: "Resolvido!",
    solve_to_win: "Resolva o quebra-cabeça para vencer.",
    no_more_undo: "Nada para desfazer.",
    no_more_hints: "Sem mais dicas.",
    active: "Ativo",
    active_anchor: "Âncora ativa",
    tap_to_select: "Toque numa âncora para começar.",
    clear: "Limpar",
    submit: "OK",
    current: "Atual",
    path_length: "Comprimento",
    next_number: "Próximo",
    constraint_equal: "Mesmo símbolo",
    constraint_opposite: "Símbolo oposto",
    streak_active: "🔥 sequência de {n} dias — continue!",
    streak_lost: "Jogue hoje para manter sua sequência de {n} dias!",
    streak_start_best: "Comece uma nova sequência hoje! Seu recorde foi {n} dias.",
    streak_start: "Jogue qualquer jogo hoje para começar uma sequência diária!",
    win_title: "Parabéns!",
    win_your_time: "Seu tempo",
    win_hints_used: "Dicas usadas",
    win_best_time: "Melhor tempo",
    win_new_record: "Novo recorde!",
    win_play_again: "Jogar de novo",
    win_new_puzzle: "Novo puzzle",
    win_share: "Compartilhar",
    zonmaan_three_in_row: "⚠ Três símbolos iguais em uma linha ou coluna.",
    vlakken_drag_hint: "Arraste um retângulo com exatamente uma semente numerada.",
    vlakken_err_no_seed: "Nenhuma semente na seleção.",
    vlakken_err_multi_seed: "Mais de uma semente na seleção.",
    vlakken_err_overlap: "Sobrepõe uma forma já resolvida.",
    vlakken_err_size: "Tamanho incorreto:",
    vlakken_err_must_square: "Deve ser um quadrado.",
    vlakken_err_must_tall: "Deve ser um retângulo alto.",
    vlakken_err_must_wide: "Deve ser um retângulo largo.",
    vlakken_err_hidden_wrong: "Forma incorreta — esta semente não tem número, deduza pelo resto.",
    boggle_loading_dict: "Carregando dicionário…",
    boggle_invalid_word: "Palavra inválida.",
    boggle_unsupported_title: "Boggle apenas no alfabeto latino",
    boggle_unsupported_body: "A grade do Boggle usa A–Z, então não está disponível neste idioma. Mude para um idioma de alfabeto latino para jogar.",
  },
  // High-risk machine translation — gated behind REVIEW_PENDING.
  ja: {
    game_vlakken: "パッチ",
    game_vlakken_desc: "数字の周りの形を完成させてグリッドを埋めよう",
    game_verbind: "つなぐ",
    game_verbind_desc: "全マスを通る一本道で数字を順番につなごう",
    game_zonmaan: "太陽と月",
    game_zonmaan_desc: "ルールに従って太陽と月をグリッドに配置しよう",
    game_kronen: "クラウン",
    game_kronen_desc: "各行・列・カラー領域にクラウンを 1 つずつ置こう",
    how_to_play: "遊び方",
    undo: "元に戻す",
    hint: "ヒント",
    reset: "リセット",
    new_game: "新しいゲーム",
    easy: "やさしい",
    medium: "ふつう",
    hard: "むずかしい",
    completed: "完了",
    best_time: "ベストタイム",
    your_time: "あなたのタイム",
    solved: "クリア!",
    solve_to_win: "パズルを解いてクリアしよう。",
    no_more_undo: "戻す操作はありません。",
    no_more_hints: "ヒントはもうありません。",
    active: "アクティブ",
    active_anchor: "アクティブなアンカー",
    tap_to_select: "アンカーをタップして開始。",
    clear: "クリア",
    submit: "OK",
    current: "現在",
    path_length: "長さ",
    next_number: "次",
    constraint_equal: "同じ記号",
    constraint_opposite: "反対の記号",
    streak_active: "🔥 {n} 日連続記録 — 続けよう!",
    streak_lost: "{n} 日連続記録を維持するため今日もプレイ!",
    streak_start_best: "今日から新しい連続記録を始めよう!最高記録は {n} 日。",
    streak_start: "今日ゲームをプレイして連続記録を始めよう!",
    win_title: "おめでとう!",
    win_your_time: "あなたのタイム",
    win_hints_used: "ヒント",
    win_best_time: "ベストタイム",
    win_new_record: "新記録!",
    win_play_again: "もう一度",
    win_new_puzzle: "新しいパズル",
    win_share: "シェア",
    zonmaan_three_in_row: "⚠ 同じ記号が縦・横に3つ並んでいます。",
    vlakken_drag_hint: "番号付きの種を 1 つだけ含む長方形をドラッグしてください。",
    vlakken_err_no_seed: "選択範囲に番号がありません。",
    vlakken_err_multi_seed: "選択範囲に複数の番号があります。",
    vlakken_err_overlap: "解決済みの形と重なっています。",
    vlakken_err_size: "サイズが違います:",
    vlakken_err_must_square: "正方形でなければなりません。",
    vlakken_err_must_tall: "縦長の長方形でなければなりません。",
    vlakken_err_must_wide: "横長の長方形でなければなりません。",
    vlakken_err_hidden_wrong: "形が違います — この種には数字がないため、他から推測してください。",
    boggle_loading_dict: "辞書を読み込み中…",
    boggle_invalid_word: "無効な単語です。",
    boggle_unsupported_title: "Boggle はラテン文字のみ",
    boggle_unsupported_body: "Boggle のグリッドは A–Z を使うため、この言語ではプレイできません。ラテン文字の言語に切り替えてください。",
  },
};

export function translate(locale: Locale, key: TranslationKey): string {
  return T[locale]?.[key] ?? T.en[key] ?? key;
}

let current: Locale = "en";
const subs = new Set<(l: Locale) => void>();

// Migrate a stored locale from the legacy "pt" tag to "pt-BR" — production
// users who picked Portuguese before the rename should not silently fall
// back to English.
function normalizeStored(raw: string | null | undefined): Locale | null {
  if (!raw) return null;
  if (raw === "pt") return "pt-BR";
  return (SUPPORTED as string[]).includes(raw) ? (raw as Locale) : null;
}

function detectFromBrowser(): Locale {
  if (typeof navigator === "undefined") return "en";
  const raw = (navigator.language || "en").toLowerCase();
  // Match the most-specific tag we ship first, then fall back to the
  // primary subtag.
  if (raw.startsWith("pt")) return "pt-BR";
  if (raw.startsWith("ja")) return "ja";
  if (raw.startsWith("hi")) return "hi";
  const primary = raw.slice(0, 2);
  return (SUPPORTED as string[]).includes(primary) ? (primary as Locale) : "en";
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
    const stored = typeof window !== "undefined"
      ? normalizeStored(localStorage.getItem(STORAGE_KEY))
      : null;
    const initial: Locale = stored ?? detectFromBrowser();
    if (initial !== current) {
      current = initial;
      document.documentElement.setAttribute("lang", initial);
      // Persist normalised value so the legacy "pt" entry is rewritten.
      if (typeof window !== "undefined") {
        try { localStorage.setItem(STORAGE_KEY, initial); } catch {}
      }
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
