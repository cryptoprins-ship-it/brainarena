import type { GameKey } from "./scores";
import type { Locale } from "./i18n";

export type HowToPlayEntry = {
  label: string;
  href: string;
  summary: string;
  rules: string[];
};

const EN: Record<GameKey, HowToPlayEntry> = {
  wordle: {
    label: "Wordle",
    href: "/wordle",
    summary: "Guess the 5-letter word in 6 tries.",
    rules: [
      "Type any 5-letter word and press Enter to submit.",
      "Green = right letter, right spot. Yellow = right letter, wrong spot. Grey = not in the word.",
      "You get 6 guesses per puzzle.",
      "One daily word per language — same for everyone. Toggle Unlimited for endless play.",
      "Solving the daily keeps your streak alive.",
    ],
  },
  boggle: {
    label: "Boggle",
    href: "/boggle",
    summary: "Find as many words as you can on a 4×4 grid in 3 minutes.",
    rules: [
      "Tap adjacent letters (including diagonals) to build a word.",
      "The current tile turns green; tap it again to backtrack one step.",
      "Words must be 3+ letters; each tile can be used only once per word.",
      "Press Enter or tap Submit to score the word. Esc clears the path.",
      "Scoring: 3 letters = 1 pt, 4 = 2, 5 = 4, 6 = 7, 7+ = 11.",
    ],
  },
  sudoku: {
    label: "Sudoku",
    href: "/sudoku",
    summary: "Fill the 9×9 grid so every row, column and 3×3 box has 1–9 exactly once.",
    rules: [
      "Tap a cell, then tap a number 1–9 (or use the keyboard).",
      "Wrong entries are highlighted red.",
      "3 hints per game reveal a correct cell.",
      "Easy / Medium / Hard each have a unique daily puzzle.",
      "Faster solves rank higher — time is the score.",
    ],
  },
  typing: {
    label: "Typing",
    href: "/typing",
    summary: "Type the paragraph as fast and accurately as you can in 60 seconds.",
    rules: [
      "Tap the input and start typing — the timer starts on your first keystroke.",
      "Correct letters are white, mistakes are red and underlined.",
      "WPM = correct characters ÷ 5 ÷ minutes elapsed.",
      "Each language has its own pool of texts.",
      "Tap Restart for a new text any time.",
    ],
  },
  tiledrop: {
    label: "TileDrop",
    href: "/tiledrop",
    summary: "Stack falling tiles, clear lines, don't top out.",
    rules: [
      "Desktop: ← / → to move, ↑ to rotate, ↓ to soft-drop, Space to hard-drop.",
      "Mobile: swipe left/right to move, tap to rotate, swipe down to drop.",
      "C holds the current piece for later. P pauses.",
      "Clear 1/2/3/4 lines for 100/300/500/800 × level.",
      "Speed increases every 10 cleared lines.",
    ],
  },
  colormatch: {
    label: "ColorMatch",
    href: "/colormatch",
    summary: "Identify the RAL colour code from a swatch in 5 seconds.",
    rules: [
      "Pick the matching code from 4 options before time runs out.",
      "100 pts per correct answer + a speed bonus of up to +50.",
      "10 rounds total.",
      "10/10 unlocks the Color Expert medal.",
    ],
  },
  letterstack: {
    label: "LetterStack",
    href: "/letterstack",
    summary: "Catch falling letters, spell words, don't overflow.",
    rules: [
      "Press the matching letter key — or tap the on-screen letter buttons on mobile.",
      "Type a word using stacked letters and press Enter to score.",
      "3 letters = 10, 4 = 25, 5 = 50, 6+ = 100 pts.",
      "Letters fall faster over time — stack of 10 ends the run.",
      "Power-ups every 500 pts: 💣 bomb, ⏸️ slow, ⭐ wildcard.",
    ],
  },
  vlakken: {
    label: "Vlakken",
    href: "/vlakken",
    summary: "Fill the grid by completing the shape around each numbered anchor.",
    rules: [
      "Each anchor has a number = the size of the shape it belongs to.",
      "Shapes are rectangles: square, tall, or wide. Dashed anchors accept any shape of that size.",
      "Every cell must belong to exactly one shape; shapes cannot overlap.",
      "Drag a rectangle that contains exactly one numbered seed. Wrong size or shape shows a message; correct locks the shape.",
      "Solved when every shape is locked.",
    ],
  },
  verbind: {
    label: "Verbind",
    href: "/verbind",
    summary: "Connect the numbers in order with one path that passes through every cell.",
    rules: [
      "Start at the cell marked 1 and trace through orthogonally adjacent cells.",
      "Pass through 2, 3, 4, … in numerical order without skipping.",
      "The path must visit every cell exactly once.",
      "Tap or drag to extend; tap a cell already on the path to truncate back to it.",
      "Solved when every cell is on the path in the correct order.",
    ],
  },
  zonmaan: {
    label: "Zon & Maan",
    href: "/zonmaan",
    summary: "Fill every cell with ☀ or 🌙, following the row/column and edge rules.",
    rules: [
      "Fill the grid so each cell contains either a ☀ or a 🌙.",
      "No more than 2 ☀ or 🌙 may be next to each other, vertically or horizontally.",
      "Each row and each column must contain the same number of ☀ and 🌙.",
      "Cells separated by an = sign must be of the same type.",
      "Cells separated by a × sign must be of the opposite type.",
      "Each puzzle has one right answer and can be solved via deduction — you should never have to guess.",
    ],
  },
  kronen: {
    label: "Kronen",
    href: "/kronen",
    summary: "Place exactly one crown in each row, column, and color region.",
    rules: [
      "Tap a cell once for an X (cannot place), again for a crown, again to clear.",
      "Each row and each column must have exactly one crown.",
      "Each colored region must have exactly one crown.",
      "Crowns may not touch — not even diagonally.",
      "Solved when all crowns are placed correctly.",
    ],
  },
};

const NL: Record<GameKey, HowToPlayEntry> = {
  wordle: {
    label: "Wordle",
    href: "/wordle",
    summary: "Raad het woord van 5 letters in 6 pogingen.",
    rules: [
      "Typ een woord van 5 letters en druk op Enter om te bevestigen.",
      "Groen = juiste letter, juiste plek. Geel = juiste letter, verkeerde plek. Grijs = komt niet voor in het woord.",
      "Je hebt 6 pogingen per puzzel.",
      "Eén dagelijks woord per taal — voor iedereen hetzelfde. Schakel Onbeperkt in voor eindeloos spelen.",
      "De dagelijkse oplossen houdt je reeks in leven.",
    ],
  },
  boggle: {
    label: "Boggle",
    href: "/boggle",
    summary: "Vind zoveel mogelijk woorden in een 4×4 raster in 3 minuten.",
    rules: [
      "Tik op aangrenzende letters (ook diagonaal) om een woord te vormen.",
      "De actieve letter wordt groen; tik er nogmaals op om één stap terug te gaan.",
      "Woorden moeten minstens 3 letters hebben; elke tegel mag maar één keer per woord gebruikt worden.",
      "Druk op Enter of tik op Submit om het woord in te dienen. Esc wist het pad.",
      "Score: 3 letters = 1 punt, 4 = 2, 5 = 4, 6 = 7, 7+ = 11.",
    ],
  },
  sudoku: {
    label: "Sudoku",
    href: "/sudoku",
    summary: "Vul het 9×9 raster zodat elke rij, kolom en 3×3 vak precies de cijfers 1–9 bevat.",
    rules: [
      "Tik op een vakje en kies een cijfer 1–9 (of gebruik het toetsenbord).",
      "Foute invoer wordt rood gemarkeerd.",
      "3 hints per spel onthullen een juist vakje.",
      "Easy / Medium / Hard hebben elk hun eigen dagelijkse puzzel.",
      "Snellere oplossingen ranken hoger — tijd is je score.",
    ],
  },
  typing: {
    label: "Typing",
    href: "/typing",
    summary: "Typ de tekst zo snel en accuraat mogelijk in 60 seconden.",
    rules: [
      "Tik op het invoerveld en begin te typen — de timer start bij de eerste toetsaanslag.",
      "Juiste letters zijn wit, fouten rood en onderstreept.",
      "WPM = juiste tekens ÷ 5 ÷ verstreken minuten.",
      "Elke taal heeft zijn eigen verzameling teksten.",
      "Tik op Herstart voor een nieuwe tekst.",
    ],
  },
  tiledrop: {
    label: "TileDrop",
    href: "/tiledrop",
    summary: "Stapel vallende blokken, wis regels, raak niet bovenin vast.",
    rules: [
      "Desktop: ← / → om te verplaatsen, ↑ om te draaien, ↓ voor zachte val, spatie voor harde val.",
      "Mobiel: veeg links/rechts om te bewegen, tik om te draaien, veeg omlaag om te laten vallen.",
      "C bewaart het huidige stuk voor later. P pauzeert.",
      "1/2/3/4 regels wissen levert 100/300/500/800 × level op.",
      "De snelheid stijgt elke 10 gewiste regels.",
    ],
  },
  colormatch: {
    label: "ColorMatch",
    href: "/colormatch",
    summary: "Herken de RAL-kleurcode van een staal binnen 5 seconden.",
    rules: [
      "Kies de juiste code uit 4 opties voor de tijd op is.",
      "100 punten per goed antwoord + snelheidsbonus tot +50.",
      "10 rondes in totaal.",
      "10/10 ontgrendelt de Color Expert medaille.",
    ],
  },
  letterstack: {
    label: "LetterStack",
    href: "/letterstack",
    summary: "Vang vallende letters, vorm woorden, raak niet vol.",
    rules: [
      "Druk op de bijbehorende lettertoets — of tik op de letterknoppen op mobiel.",
      "Vorm een woord met de gestapelde letters en druk op Enter om te scoren.",
      "3 letters = 10, 4 = 25, 5 = 50, 6+ = 100 punten.",
      "Letters vallen sneller na verloop van tijd — een stapel van 10 betekent game over.",
      "Power-ups elke 500 punten: 💣 bom, ⏸️ vertraging, ⭐ joker.",
    ],
  },
  vlakken: {
    label: "Vlakken",
    href: "/vlakken",
    summary: "Vul het rooster door de vorm rond elke genummerde anker te voltooien.",
    rules: [
      "Elk anker bevat een getal = het aantal cellen van de vorm waar het bij hoort.",
      "Vormen zijn rechthoeken: vierkant, hoog of breed. Stippellijn-ankers accepteren elke vorm van die grootte.",
      "Elke cel hoort bij precies één vorm; vormen mogen elkaar niet overlappen.",
      "Sleep een rechthoek met precies één genummerde zaadcel. Verkeerde maat of vorm? Je krijgt een melding. Klopt het? De vorm klikt vast.",
      "Opgelost wanneer elke vorm vastgeklikt is.",
    ],
  },
  verbind: {
    label: "Verbind",
    href: "/verbind",
    summary: "Verbind de getallen op volgorde via één pad dat door elke cel loopt.",
    rules: [
      "Begin bij cel 1 en loop door horizontaal of verticaal aangrenzende cellen.",
      "Loop in volgorde door 2, 3, 4, … zonder over te slaan.",
      "Het pad moet elke cel precies één keer bezoeken.",
      "Tik of sleep om te verlengen; tik een cel op het pad aan om tot daar terug te keren.",
      "Opgelost wanneer alle cellen in de juiste volgorde op het pad liggen.",
    ],
  },
  zonmaan: {
    label: "Zon & Maan",
    href: "/zonmaan",
    summary: "Vul elke cel met ☀ of 🌙 volgens de rij-, kolom- en randregels.",
    rules: [
      "Vul het raster zodat elke cel een ☀ of een 🌙 bevat.",
      "Niet meer dan 2 ☀ of 🌙 mogen naast elkaar staan, horizontaal of verticaal.",
      "Elke rij en elke kolom moet evenveel ☀ als 🌙 bevatten.",
      "Cellen gescheiden door een = teken zijn van hetzelfde type.",
      "Cellen gescheiden door een × teken zijn van het tegengestelde type.",
      "Elk raadsel heeft één oplossing en is volledig door redenering op te lossen — gokken hoeft nooit.",
    ],
  },
  kronen: {
    label: "Kronen",
    href: "/kronen",
    summary: "Plaats precies één kroon in elke rij, kolom én kleurgebied.",
    rules: [
      "Tik op een cel: één keer voor een X (mag niet), twee keer voor een kroon, drie keer om te wissen.",
      "Elke rij en elke kolom heeft precies één kroon.",
      "Elk gekleurd gebied bevat precies één kroon.",
      "Kronen mogen elkaar niet raken — ook niet diagonaal.",
      "Opgelost wanneer alle kronen correct staan.",
    ],
  },
};

const DE: Record<GameKey, HowToPlayEntry> = {
  wordle: {
    label: "Wordle",
    href: "/wordle",
    summary: "Errate das 5-Buchstaben-Wort in 6 Versuchen.",
    rules: [
      "Tippe ein 5-Buchstaben-Wort und drücke Enter zum Bestätigen.",
      "Grün = richtiger Buchstabe an richtiger Stelle. Gelb = richtiger Buchstabe, falsche Stelle. Grau = kommt nicht vor.",
      "Du hast 6 Versuche pro Rätsel.",
      "Ein tägliches Wort pro Sprache — für alle gleich. Schalte Unbegrenzt ein für endloses Spielen.",
      "Wer das Tagesrätsel löst, hält seine Serie am Leben.",
    ],
  },
  boggle: {
    label: "Boggle",
    href: "/boggle",
    summary: "Finde so viele Wörter wie möglich auf einem 4×4-Gitter in 3 Minuten.",
    rules: [
      "Tippe benachbarte Buchstaben (auch diagonal), um ein Wort zu bilden.",
      "Das aktuelle Feld wird grün; tippe nochmals darauf, um einen Schritt zurückzugehen.",
      "Wörter müssen mindestens 3 Buchstaben haben; jedes Feld nur einmal pro Wort.",
      "Enter oder Submit reicht das Wort ein. Esc löscht den Pfad.",
      "Punkte: 3 Buchstaben = 1, 4 = 2, 5 = 4, 6 = 7, 7+ = 11.",
    ],
  },
  sudoku: {
    label: "Sudoku",
    href: "/sudoku",
    summary: "Fülle das 9×9-Gitter so, dass jede Zeile, Spalte und 3×3-Box genau 1–9 enthält.",
    rules: [
      "Tippe ein Feld an, dann eine Zahl 1–9 (oder benutze die Tastatur).",
      "Falsche Eingaben werden rot markiert.",
      "3 Hinweise pro Spiel decken ein korrektes Feld auf.",
      "Easy / Medium / Hard haben jeweils ein eigenes Tagesrätsel.",
      "Schnellere Lösungen ranken höher — Zeit ist die Punktzahl.",
    ],
  },
  typing: {
    label: "Typing",
    href: "/typing",
    summary: "Tippe den Absatz so schnell und genau wie möglich in 60 Sekunden.",
    rules: [
      "Tippe in das Eingabefeld — der Timer startet beim ersten Anschlag.",
      "Korrekte Buchstaben sind weiß, Fehler rot und unterstrichen.",
      "WPM = korrekte Zeichen ÷ 5 ÷ verstrichene Minuten.",
      "Jede Sprache hat ihren eigenen Textpool.",
      "Tippe auf Neustart für einen neuen Text.",
    ],
  },
  tiledrop: {
    label: "TileDrop",
    href: "/tiledrop",
    summary: "Stapel fallende Steine, lösche Reihen, lass nicht überlaufen.",
    rules: [
      "Desktop: ← / → bewegen, ↑ drehen, ↓ Soft-Drop, Leertaste Hard-Drop.",
      "Mobil: nach links/rechts wischen zum Bewegen, tippen zum Drehen, nach unten wischen zum Fallen.",
      "C hält das aktuelle Teil. P pausiert.",
      "1/2/3/4 Reihen löschen = 100/300/500/800 × Level.",
      "Geschwindigkeit steigt alle 10 gelöschten Reihen.",
    ],
  },
  colormatch: {
    label: "ColorMatch",
    href: "/colormatch",
    summary: "Identifiziere den RAL-Farbcode anhand einer Probe in 5 Sekunden.",
    rules: [
      "Wähle den passenden Code aus 4 Optionen, bevor die Zeit abläuft.",
      "100 Punkte pro richtige Antwort + bis zu +50 Geschwindigkeitsbonus.",
      "10 Runden insgesamt.",
      "10/10 schaltet die Color-Expert-Medaille frei.",
    ],
  },
  letterstack: {
    label: "LetterStack",
    href: "/letterstack",
    summary: "Fang fallende Buchstaben, bilde Wörter, lass nicht überlaufen.",
    rules: [
      "Drücke die passende Buchstabentaste — oder tippe auf die Buchstaben-Buttons am Handy.",
      "Bilde ein Wort aus den gestapelten Buchstaben und drücke Enter zum Werten.",
      "3 Buchstaben = 10, 4 = 25, 5 = 50, 6+ = 100 Punkte.",
      "Buchstaben fallen mit der Zeit schneller — bei 10 ist Schluss.",
      "Power-ups alle 500 Punkte: 💣 Bombe, ⏸️ Verlangsamen, ⭐ Joker.",
    ],
  },
  vlakken: {
    label: "Flächen",
    href: "/vlakken",
    summary: "Fülle das Raster, indem du die Form um jeden nummerierten Anker vervollständigst.",
    rules: [
      "Jeder Anker enthält eine Zahl = die Zellanzahl der Form, zu der er gehört.",
      "Formen sind Rechtecke: quadratisch, hoch oder breit. Gestrichelte Anker akzeptieren jede Form dieser Größe.",
      "Jede Zelle gehört zu genau einer Form; Formen dürfen sich nicht überlappen.",
      "Ziehe ein Rechteck um genau einen nummerierten Anker. Falsche Größe oder Form: Hinweis. Richtig: die Form rastet ein.",
      "Gelöst, wenn jede Form eingerastet ist.",
    ],
  },
  verbind: {
    label: "Verbinden",
    href: "/verbind",
    summary: "Verbinde die Zahlen der Reihe nach mit einem Pfad durch jede Zelle.",
    rules: [
      "Starte bei Zelle 1 und führe den Pfad durch orthogonal angrenzende Zellen.",
      "Durchlaufe 2, 3, 4, … in numerischer Reihenfolge ohne Auslassung.",
      "Der Pfad muss jede Zelle genau einmal besuchen.",
      "Tippe oder ziehe zum Verlängern; tippe eine Zelle auf dem Pfad an, um bis dorthin zurückzugehen.",
      "Gelöst, wenn alle Zellen in der richtigen Reihenfolge auf dem Pfad liegen.",
    ],
  },
  zonmaan: {
    label: "Sonne & Mond",
    href: "/zonmaan",
    summary: "Fülle jede Zelle mit ☀ oder 🌙 gemäß den Reihen-, Spalten- und Kantenregeln.",
    rules: [
      "Fülle das Gitter so, dass jede Zelle ☀ oder 🌙 enthält.",
      "Höchstens 2 ☀ oder 🌙 dürfen waagerecht oder senkrecht nebeneinander stehen.",
      "Jede Zeile und jede Spalte muss gleich viele ☀ und 🌙 enthalten.",
      "Zellen, die durch ein = getrennt sind, haben dasselbe Symbol.",
      "Zellen, die durch ein × getrennt sind, haben entgegengesetzte Symbole.",
      "Jedes Rätsel hat genau eine Lösung und ist rein durch Logik lösbar — Raten ist nie nötig.",
    ],
  },
  kronen: {
    label: "Kronen",
    href: "/kronen",
    summary: "Platziere genau eine Krone in jeder Reihe, Spalte und Farbregion.",
    rules: [
      "Tippe eine Zelle: einmal für X (gesperrt), zweimal für Krone, dreimal zum Leeren.",
      "Jede Zeile und Spalte enthält genau eine Krone.",
      "Jede Farbregion enthält genau eine Krone.",
      "Kronen dürfen sich nicht berühren — auch nicht diagonal.",
      "Gelöst, wenn alle Kronen korrekt platziert sind.",
    ],
  },
};

const FR: Record<GameKey, HowToPlayEntry> = {
  wordle: {
    label: "Wordle",
    href: "/wordle",
    summary: "Devine le mot de 5 lettres en 6 essais.",
    rules: [
      "Tape un mot de 5 lettres et appuie sur Entrée pour valider.",
      "Vert = bonne lettre, bonne place. Jaune = bonne lettre, mauvaise place. Gris = lettre absente.",
      "Tu as 6 essais par grille.",
      "Un mot du jour par langue — le même pour tout le monde. Active Illimité pour jouer sans fin.",
      "Résoudre le mot du jour conserve ta série.",
    ],
  },
  boggle: {
    label: "Boggle",
    href: "/boggle",
    summary: "Trouve un maximum de mots dans une grille 4×4 en 3 minutes.",
    rules: [
      "Touche des lettres adjacentes (diagonales comprises) pour former un mot.",
      "La case courante devient verte ; touche-la à nouveau pour reculer d'un pas.",
      "Au moins 3 lettres par mot ; chaque case ne sert qu'une fois par mot.",
      "Entrée ou Soumettre valide le mot. Échap efface le tracé.",
      "Score : 3 lettres = 1 pt, 4 = 2, 5 = 4, 6 = 7, 7+ = 11.",
    ],
  },
  sudoku: {
    label: "Sudoku",
    href: "/sudoku",
    summary: "Remplis la grille 9×9 pour que chaque ligne, colonne et bloc 3×3 contienne les chiffres 1–9.",
    rules: [
      "Touche une case puis un chiffre 1–9 (ou utilise le clavier).",
      "Les saisies erronées sont en rouge.",
      "3 indices par partie révèlent une case correcte.",
      "Easy / Medium / Hard ont chacun leur grille du jour.",
      "Plus tu vas vite, plus tu montes — le temps est le score.",
    ],
  },
  typing: {
    label: "Typing",
    href: "/typing",
    summary: "Tape le paragraphe le plus vite et précisément possible en 60 secondes.",
    rules: [
      "Touche le champ et commence à taper — le chrono démarre à la première touche.",
      "Lettres correctes en blanc, erreurs en rouge soulignées.",
      "WPM = caractères corrects ÷ 5 ÷ minutes écoulées.",
      "Chaque langue a son propre pool de textes.",
      "Touche Recommencer pour un nouveau texte.",
    ],
  },
  tiledrop: {
    label: "TileDrop",
    href: "/tiledrop",
    summary: "Empile les pièces, fais des lignes, ne sature pas le haut.",
    rules: [
      "Bureau : ← / → déplacer, ↑ tourner, ↓ chute douce, Espace chute rapide.",
      "Mobile : glisse à gauche/droite pour bouger, tape pour tourner, glisse vers le bas pour faire chuter.",
      "C garde la pièce en réserve. P met en pause.",
      "Effacer 1/2/3/4 lignes = 100/300/500/800 × niveau.",
      "La vitesse augmente toutes les 10 lignes.",
    ],
  },
  colormatch: {
    label: "ColorMatch",
    href: "/colormatch",
    summary: "Identifie le code RAL à partir d'un échantillon en 5 secondes.",
    rules: [
      "Choisis le bon code parmi 4 options avant la fin du temps.",
      "100 pts par bonne réponse + bonus de vitesse jusqu'à +50.",
      "10 manches au total.",
      "10/10 débloque la médaille Color Expert.",
    ],
  },
  letterstack: {
    label: "LetterStack",
    href: "/letterstack",
    summary: "Attrape les lettres qui tombent, forme des mots, n'empile pas trop.",
    rules: [
      "Appuie sur la touche correspondante — ou touche les boutons lettres sur mobile.",
      "Forme un mot avec la pile et appuie sur Entrée pour marquer.",
      "3 lettres = 10, 4 = 25, 5 = 50, 6+ = 100 pts.",
      "Les lettres tombent de plus en plus vite — pile de 10 = fin.",
      "Power-ups tous les 500 pts : 💣 bombe, ⏸️ ralenti, ⭐ joker.",
    ],
  },
  vlakken: {
    label: "Pièces",
    href: "/vlakken",
    summary: "Remplissez la grille en complétant la forme autour de chaque ancre numérotée.",
    rules: [
      "Chaque ancre porte un nombre = la taille de la forme à laquelle elle appartient.",
      "Les formes sont des rectangles : carré, haut ou large. Les ancres en pointillés acceptent toute forme de cette taille.",
      "Chaque cellule appartient à exactement une forme ; les formes ne peuvent pas se chevaucher.",
      "Trace un rectangle autour d'un seul point numéroté. Mauvaise taille ou forme : message ; correcte : la forme se verrouille.",
      "Résolu lorsque chaque forme est verrouillée.",
    ],
  },
  verbind: {
    label: "Relier",
    href: "/verbind",
    summary: "Reliez les nombres dans l'ordre par un chemin passant par chaque cellule.",
    rules: [
      "Pars de la cellule 1 et avance par cellules orthogonalement adjacentes.",
      "Passe par 2, 3, 4, … dans l'ordre numérique sans en sauter.",
      "Le chemin doit visiter chaque cellule exactement une fois.",
      "Touche ou glisse pour prolonger ; touche une cellule du chemin pour revenir jusqu'à elle.",
      "Résolu quand toutes les cellules sont sur le chemin dans le bon ordre.",
    ],
  },
  zonmaan: {
    label: "Soleil & Lune",
    href: "/zonmaan",
    summary: "Remplis chaque case d'un ☀ ou d'une 🌙 selon les règles de ligne, colonne et arête.",
    rules: [
      "Remplis la grille pour que chaque case contienne soit un ☀, soit une 🌙.",
      "Pas plus de 2 ☀ ou 🌙 côte à côte, à l'horizontale ou à la verticale.",
      "Chaque ligne et chaque colonne doit contenir autant de ☀ que de 🌙.",
      "Les cases séparées par un signe = sont du même type.",
      "Les cases séparées par un signe × sont de types opposés.",
      "Chaque grille a une seule solution et se résout par déduction — jamais en devinant.",
    ],
  },
  kronen: {
    label: "Couronnes",
    href: "/kronen",
    summary: "Place exactement une couronne dans chaque ligne, colonne et région colorée.",
    rules: [
      "Touche une case : une fois pour X (interdit), deux fois pour couronne, trois fois pour effacer.",
      "Chaque ligne et chaque colonne contient exactement une couronne.",
      "Chaque région colorée contient exactement une couronne.",
      "Les couronnes ne peuvent pas se toucher — même en diagonale.",
      "Résolu quand toutes les couronnes sont bien placées.",
    ],
  },
};

const ES: Record<GameKey, HowToPlayEntry> = {
  wordle: {
    label: "Wordle",
    href: "/wordle",
    summary: "Adivina la palabra de 5 letras en 6 intentos.",
    rules: [
      "Escribe una palabra de 5 letras y pulsa Enter para enviar.",
      "Verde = letra correcta en su sitio. Amarillo = letra correcta, posición errónea. Gris = no está en la palabra.",
      "Tienes 6 intentos por puzzle.",
      "Una palabra diaria por idioma — la misma para todos. Activa Ilimitado para jugar sin fin.",
      "Resolver la diaria mantiene viva tu racha.",
    ],
  },
  boggle: {
    label: "Boggle",
    href: "/boggle",
    summary: "Encuentra el máximo de palabras en una cuadrícula 4×4 en 3 minutos.",
    rules: [
      "Toca letras adyacentes (incluso en diagonal) para formar una palabra.",
      "La casilla actual se vuelve verde; tócala otra vez para retroceder un paso.",
      "Mínimo 3 letras; cada casilla solo se usa una vez por palabra.",
      "Enter o Enviar valida la palabra. Esc borra el camino.",
      "Puntos: 3 letras = 1, 4 = 2, 5 = 4, 6 = 7, 7+ = 11.",
    ],
  },
  sudoku: {
    label: "Sudoku",
    href: "/sudoku",
    summary: "Rellena la cuadrícula 9×9 para que cada fila, columna y bloque 3×3 tenga 1–9 una vez.",
    rules: [
      "Toca una casilla y luego un número 1–9 (o usa el teclado).",
      "Las entradas erróneas se marcan en rojo.",
      "3 pistas por partida revelan una casilla correcta.",
      "Easy / Medium / Hard tienen cada uno su puzzle diario.",
      "Cuanto más rápido, mejor — el tiempo es la puntuación.",
    ],
  },
  typing: {
    label: "Typing",
    href: "/typing",
    summary: "Escribe el párrafo lo más rápido y preciso posible en 60 segundos.",
    rules: [
      "Toca el campo y empieza a escribir — el cronómetro arranca en la primera tecla.",
      "Letras correctas en blanco, errores en rojo y subrayados.",
      "PPM = caracteres correctos ÷ 5 ÷ minutos transcurridos.",
      "Cada idioma tiene su propio conjunto de textos.",
      "Toca Reiniciar para un texto nuevo.",
    ],
  },
  tiledrop: {
    label: "TileDrop",
    href: "/tiledrop",
    summary: "Apila piezas, completa líneas, no llegues arriba.",
    rules: [
      "Escritorio: ← / → mover, ↑ rotar, ↓ caída suave, Espacio caída rápida.",
      "Móvil: desliza izquierda/derecha para mover, toca para rotar, desliza hacia abajo para soltar.",
      "C guarda la pieza actual. P pausa.",
      "Limpiar 1/2/3/4 líneas = 100/300/500/800 × nivel.",
      "La velocidad sube cada 10 líneas eliminadas.",
    ],
  },
  colormatch: {
    label: "ColorMatch",
    href: "/colormatch",
    summary: "Identifica el código RAL de una muestra en 5 segundos.",
    rules: [
      "Elige el código correcto de 4 opciones antes de que se acabe el tiempo.",
      "100 pts por respuesta correcta + bonus de velocidad hasta +50.",
      "10 rondas en total.",
      "10/10 desbloquea la medalla Color Expert.",
    ],
  },
  letterstack: {
    label: "LetterStack",
    href: "/letterstack",
    summary: "Atrapa letras que caen, forma palabras, no rebases la pila.",
    rules: [
      "Pulsa la letra correspondiente — o toca los botones de letras en móvil.",
      "Forma una palabra con la pila y pulsa Enter para puntuar.",
      "3 letras = 10, 4 = 25, 5 = 50, 6+ = 100 pts.",
      "Las letras caen más rápido con el tiempo — pila de 10 termina la partida.",
      "Power-ups cada 500 pts: 💣 bomba, ⏸️ ralentizar, ⭐ comodín.",
    ],
  },
  vlakken: {
    label: "Parches",
    href: "/vlakken",
    summary: "Rellena la cuadrícula completando la forma alrededor de cada ancla numerada.",
    rules: [
      "Cada ancla tiene un número = el tamaño de la forma a la que pertenece.",
      "Las formas son rectángulos: cuadrado, alto o ancho. Las anclas con borde discontinuo aceptan cualquier forma de ese tamaño.",
      "Cada celda pertenece a exactamente una forma; las formas no pueden solaparse.",
      "Arrastra un rectángulo alrededor de un único número. Si está mal, verás un mensaje; si es correcto, la forma se bloquea.",
      "Resuelto cuando cada forma está bloqueada.",
    ],
  },
  verbind: {
    label: "Conecta",
    href: "/verbind",
    summary: "Conecta los números en orden con un camino que pase por cada celda.",
    rules: [
      "Empieza en la celda 1 y avanza por celdas adyacentes ortogonalmente.",
      "Pasa por 2, 3, 4, … en orden numérico sin saltarte ninguno.",
      "El camino debe visitar cada celda exactamente una vez.",
      "Toca o arrastra para extender; toca una celda del camino para retroceder hasta ella.",
      "Resuelto cuando todas las celdas están en el camino en el orden correcto.",
    ],
  },
  zonmaan: {
    label: "Sol y Luna",
    href: "/zonmaan",
    summary: "Llena cada celda con ☀ o 🌙 siguiendo las reglas de fila, columna y arista.",
    rules: [
      "Llena la cuadrícula con un ☀ o una 🌙 en cada celda.",
      "No más de 2 ☀ o 🌙 seguidos, en horizontal o vertical.",
      "Cada fila y cada columna debe contener el mismo número de ☀ y 🌙.",
      "Las celdas separadas por un signo = son del mismo tipo.",
      "Las celdas separadas por un signo × son de tipos opuestos.",
      "Cada puzzle tiene una única solución y se resuelve por deducción — nunca adivinando.",
    ],
  },
  kronen: {
    label: "Coronas",
    href: "/kronen",
    summary: "Coloca exactamente una corona en cada fila, columna y región de color.",
    rules: [
      "Toca una celda: una vez para X (prohibido), dos para corona, tres para borrar.",
      "Cada fila y columna contiene exactamente una corona.",
      "Cada región de color contiene exactamente una corona.",
      "Las coronas no pueden tocarse — ni siquiera en diagonal.",
      "Resuelto cuando todas las coronas están bien colocadas.",
    ],
  },
};

// TBD: native review (machine-translated, Brazilian Portuguese pass).
const PT_BR: Record<GameKey, HowToPlayEntry> = {
  wordle: {
    label: "Wordle",
    href: "/wordle",
    summary: "Adivinha a palavra de 5 letras em 6 tentativas.",
    rules: [
      "Escreve uma palavra de 5 letras e prime Enter para confirmar.",
      "Verde = letra certa, sítio certo. Amarelo = letra certa, sítio errado. Cinzento = não está na palavra.",
      "Tens 6 tentativas por puzzle.",
      "Uma palavra diária por idioma — igual para todos. Ativa Ilimitado para jogar sem fim.",
      "Resolver a diária mantém a tua sequência viva.",
    ],
  },
  boggle: {
    label: "Boggle",
    href: "/boggle",
    summary: "Encontra o máximo de palavras numa grelha 4×4 em 3 minutos.",
    rules: [
      "Toca em letras adjacentes (incluindo diagonais) para formar uma palavra.",
      "A célula atual fica verde; toca outra vez para recuar um passo.",
      "Mínimo de 3 letras; cada célula só se usa uma vez por palavra.",
      "Enter ou Submeter valida a palavra. Esc limpa o trajeto.",
      "Pontos: 3 letras = 1, 4 = 2, 5 = 4, 6 = 7, 7+ = 11.",
    ],
  },
  sudoku: {
    label: "Sudoku",
    href: "/sudoku",
    summary: "Preenche a grelha 9×9 para que cada linha, coluna e bloco 3×3 tenha 1–9 uma vez.",
    rules: [
      "Toca numa célula e depois num número 1–9 (ou usa o teclado).",
      "Entradas erradas ficam destacadas a vermelho.",
      "3 dicas por jogo revelam uma célula correta.",
      "Easy / Medium / Hard têm cada um o seu puzzle diário.",
      "Quanto mais rápido, melhor — o tempo é a pontuação.",
    ],
  },
  typing: {
    label: "Typing",
    href: "/typing",
    summary: "Escreve o parágrafo o mais rápido e preciso possível em 60 segundos.",
    rules: [
      "Toca no campo e começa a escrever — o cronómetro arranca na primeira tecla.",
      "Letras corretas a branco, erros a vermelho e sublinhados.",
      "PPM = caracteres corretos ÷ 5 ÷ minutos passados.",
      "Cada idioma tem o seu conjunto de textos.",
      "Toca em Reiniciar para um texto novo.",
    ],
  },
  tiledrop: {
    label: "TileDrop",
    href: "/tiledrop",
    summary: "Empilha peças, completa linhas, não enchas o topo.",
    rules: [
      "Desktop: ← / → mover, ↑ rodar, ↓ queda suave, Espaço queda rápida.",
      "Móvel: desliza esquerda/direita para mover, toca para rodar, desliza para baixo para soltar.",
      "C guarda a peça atual. P pausa.",
      "Limpar 1/2/3/4 linhas = 100/300/500/800 × nível.",
      "A velocidade aumenta a cada 10 linhas eliminadas.",
    ],
  },
  colormatch: {
    label: "ColorMatch",
    href: "/colormatch",
    summary: "Identifica o código RAL de uma amostra em 5 segundos.",
    rules: [
      "Escolhe o código certo entre 4 opções antes do tempo acabar.",
      "100 pts por resposta certa + bónus de velocidade até +50.",
      "10 rondas no total.",
      "10/10 desbloqueia a medalha Color Expert.",
    ],
  },
  letterstack: {
    label: "LetterStack",
    href: "/letterstack",
    summary: "Apanha letras que caem, forma palavras, não transbordes.",
    rules: [
      "Prime a tecla correspondente — ou toca nos botões de letras no telemóvel.",
      "Forma uma palavra com a pilha e prime Enter para pontuar.",
      "3 letras = 10, 4 = 25, 5 = 50, 6+ = 100 pts.",
      "As letras caem cada vez mais rápido — pilha de 10 = fim.",
      "Power-ups a cada 500 pts: 💣 bomba, ⏸️ abrandar, ⭐ joker.",
    ],
  },
  vlakken: {
    label: "Retalhos",
    href: "/vlakken",
    summary: "Preenche a grelha completando a forma à volta de cada âncora numerada.",
    rules: [
      "Cada âncora tem um número = o tamanho da forma a que pertence.",
      "Formas são retângulos: quadrado, alto ou largo. Âncoras tracejadas aceitam qualquer forma desse tamanho.",
      "Cada célula pertence a exatamente uma forma; formas não podem sobrepor-se.",
      "Arraste um retângulo em volta de uma única semente numerada. Errado: mensagem. Certo: a forma trava.",
      "Resolvido quando cada forma está travada.",
    ],
  },
  verbind: {
    label: "Liga",
    href: "/verbind",
    summary: "Liga os números por ordem com um caminho que passe por cada célula.",
    rules: [
      "Começa na célula 1 e avança por células ortogonalmente adjacentes.",
      "Passa por 2, 3, 4, … por ordem numérica sem saltar.",
      "O caminho tem de visitar cada célula exatamente uma vez.",
      "Toca ou arrasta para estender; toca numa célula do caminho para recuar até ela.",
      "Resolvido quando todas as células estão no caminho na ordem certa.",
    ],
  },
  zonmaan: {
    label: "Sol e Lua",
    href: "/zonmaan",
    summary: "Preencha cada célula com ☀ ou 🌙 seguindo as regras de linha, coluna e aresta.",
    rules: [
      "Preencha a grade para que cada célula contenha um ☀ ou uma 🌙.",
      "No máximo 2 ☀ ou 🌙 lado a lado, na horizontal ou vertical.",
      "Cada linha e cada coluna deve conter o mesmo número de ☀ e 🌙.",
      "Células separadas por um sinal = são do mesmo tipo.",
      "Células separadas por um sinal × são de tipos opostos.",
      "Cada quebra-cabeça tem uma única solução e resolve-se por dedução — nunca por chute.",
    ],
  },
  kronen: {
    label: "Coroas",
    href: "/kronen",
    summary: "Coloca exatamente uma coroa em cada linha, coluna e região colorida.",
    rules: [
      "Toca numa célula: uma vez para X (proibido), duas para coroa, três para limpar.",
      "Cada linha e cada coluna contém exatamente uma coroa.",
      "Cada região colorida contém exatamente uma coroa.",
      "Coroas não podem tocar-se — nem mesmo na diagonal.",
      "Resolvido quando todas as coroas estão bem colocadas.",
    ],
  },
};

// High-risk machine translation — gated behind REVIEW_PENDING in i18n.ts.
const HI: Record<GameKey, HowToPlayEntry> = {
  wordle: {
    label: "Wordle",
    href: "/wordle",
    summary: "5 अक्षर का शब्द 6 प्रयासों में पता करें।",
    rules: [
      "कोई भी 5 अक्षर का शब्द लिखें और सबमिट करने के लिए Enter दबाएँ।",
      "हरा = सही अक्षर, सही जगह। पीला = सही अक्षर, गलत जगह। ग्रे = शब्द में नहीं है।",
      "हर पहेली के लिए 6 प्रयास मिलते हैं।",
      "हर भाषा में एक दैनिक शब्द — सभी के लिए समान। असीमित खेल के लिए Unlimited चालू करें।",
      "दैनिक हल करने से आपकी श्रृंखला बनी रहती है।",
    ],
  },
  boggle: {
    label: "Boggle",
    href: "/boggle",
    summary: "3 मिनट में 4×4 ग्रिड पर अधिकतम शब्द खोजें।",
    rules: [
      "शब्द बनाने के लिए आसपास के अक्षरों (तिरछे सहित) पर टैप करें।",
      "वर्तमान सेल हरा हो जाता है; एक कदम पीछे जाने के लिए फिर से टैप करें।",
      "शब्द कम से कम 3 अक्षर के हों; प्रत्येक टाइल प्रति शब्द एक बार।",
      "Enter या Submit शब्द जमा करता है। Esc रास्ता साफ़ करता है।",
      "अंक: 3 अक्षर = 1, 4 = 2, 5 = 4, 6 = 7, 7+ = 11।",
    ],
  },
  sudoku: {
    label: "Sudoku",
    href: "/sudoku",
    summary: "9×9 ग्रिड भरें ताकि हर पंक्ति, स्तंभ और 3×3 खंड में 1–9 ठीक एक बार आए।",
    rules: [
      "एक सेल पर टैप करें, फिर 1–9 कोई संख्या (या कीबोर्ड का उपयोग करें)।",
      "गलत प्रविष्टियाँ लाल रंग में दिखती हैं।",
      "प्रति खेल 3 संकेत एक सही सेल दिखाते हैं।",
      "Easy / Medium / Hard में अलग-अलग दैनिक पहेली है।",
      "जितना तेज़ हल — उतना बेहतर। समय ही आपका स्कोर है।",
    ],
  },
  typing: {
    label: "Typing",
    href: "/typing",
    summary: "60 सेकंड में पैराग्राफ को जितना तेज़ और सटीक हो सके टाइप करें।",
    rules: [
      "इनपुट पर टैप करके टाइप करना शुरू करें — पहली कुंजी पर टाइमर शुरू।",
      "सही अक्षर सफेद, गलतियाँ लाल और रेखांकित।",
      "WPM = सही अक्षर ÷ 5 ÷ बीते मिनट।",
      "हर भाषा का अपना पाठ संग्रह है।",
      "नया पाठ पाने के लिए Restart पर टैप करें।",
    ],
  },
  tiledrop: {
    label: "TileDrop",
    href: "/tiledrop",
    summary: "गिरते टुकड़े जमाएँ, पंक्तियाँ साफ़ करें, ऊपर तक भरने न दें।",
    rules: [
      "डेस्कटॉप: ← / → हिलाना, ↑ घुमाना, ↓ नीचे, Space तेज़ नीचे।",
      "मोबाइल: बाएँ/दाएँ स्वाइप, टैप घुमाने को, नीचे स्वाइप गिराने को।",
      "C वर्तमान टुकड़ा रोकता है। P रुकाता है।",
      "1/2/3/4 पंक्तियाँ साफ़ करना = 100/300/500/800 × स्तर।",
      "हर 10 साफ़ पंक्तियों पर गति बढ़ती है।",
    ],
  },
  colormatch: {
    label: "ColorMatch",
    href: "/colormatch",
    summary: "5 सेकंड में रंग नमूने से RAL कोड पहचानें।",
    rules: [
      "समय खत्म होने से पहले 4 विकल्पों में से सही कोड चुनें।",
      "हर सही उत्तर पर 100 अंक + +50 तक गति बोनस।",
      "कुल 10 राउंड।",
      "10/10 पर Color Expert मेडल खुलता है।",
    ],
  },
  letterstack: {
    label: "LetterStack",
    href: "/letterstack",
    summary: "गिरते अक्षर पकड़ें, शब्द बनाएँ, ढेर भरने न दें।",
    rules: [
      "मिलती हुई कुंजी दबाएँ — या मोबाइल पर अक्षर बटन टैप करें।",
      "जमा अक्षरों से शब्द बनाएँ और स्कोर के लिए Enter दबाएँ।",
      "3 अक्षर = 10, 4 = 25, 5 = 50, 6+ = 100 अंक।",
      "अक्षर समय के साथ तेज़ गिरते हैं — 10 का ढेर अंत है।",
      "हर 500 अंकों पर पावर-अप: 💣 बम, ⏸️ धीमा, ⭐ जोकर।",
    ],
  },
  vlakken: {
    label: "टुकड़े",
    href: "/vlakken",
    summary: "हर संख्या के चारों ओर आकृति पूरी करके ग्रिड भरें।",
    rules: [
      "हर एंकर की संख्या = उसके आकार का सेल काउंट।",
      "आकार आयत हैं: वर्ग, ऊँचा या चौड़ा। डैश एंकर उस आकार की कोई भी आकृति स्वीकारते हैं।",
      "हर सेल ठीक एक आकृति का हिस्सा हो; आकृतियाँ नहीं ढक सकतीं।",
      "ठीक एक संख्या के चारों ओर आयत खींचें। गलत आकार/आकृति पर संदेश; सही पर आकृति लॉक हो जाती है।",
      "जब हर आकृति लॉक हो जाए — हल हो गया।",
    ],
  },
  verbind: {
    label: "जोड़ें",
    href: "/verbind",
    summary: "हर सेल से होकर एक रास्ते से क्रम में संख्याएँ जोड़ें।",
    rules: [
      "सेल 1 से शुरू करें और लंबवत/क्षैतिज सटे सेलों से बढ़ें।",
      "2, 3, 4, … क्रम में बिना छोड़े गुज़रें।",
      "रास्ता हर सेल को ठीक एक बार छुए।",
      "बढ़ाने के लिए टैप या ड्रैग; रास्ते के सेल पर टैप करके वहाँ तक लौटें।",
      "जब सब सेल सही क्रम में रास्ते पर हों — हल हो गया।",
    ],
  },
  zonmaan: {
    label: "सूर्य और चंद्र",
    href: "/zonmaan",
    summary: "पंक्ति, स्तंभ और किनारों के नियमों का पालन करते हुए हर सेल को ☀ या 🌙 से भरें।",
    rules: [
      "ग्रिड भरें ताकि हर सेल में या तो ☀ हो या 🌙।",
      "एक पंक्ति में 2 से अधिक ☀ या 🌙 साथ-साथ नहीं हो सकते (क्षैतिज या लंबवत)।",
      "हर पंक्ति और हर स्तंभ में ☀ और 🌙 की संख्या बराबर हो।",
      "= चिह्न से जुड़ी सेल एक ही प्रकार की होंगी।",
      "× चिह्न से जुड़ी सेल विपरीत प्रकार की होंगी।",
      "हर पहेली का एक ही उत्तर है और तर्क से हल होती है — अंदाज़ा लगाने की कभी ज़रूरत नहीं।",
    ],
  },
  kronen: {
    label: "मुकुट",
    href: "/kronen",
    summary: "हर पंक्ति, स्तंभ और रंगीन क्षेत्र में ठीक एक मुकुट रखें।",
    rules: [
      "सेल पर टैप करें: एक बार X (निषेध), दो बार मुकुट, तीन बार साफ़।",
      "हर पंक्ति और स्तंभ में ठीक एक मुकुट।",
      "हर रंगीन क्षेत्र में ठीक एक मुकुट।",
      "मुकुट एक-दूसरे को नहीं छू सकते — तिरछे भी नहीं।",
      "जब सब मुकुट सही जगह हों — हल हो गया।",
    ],
  },
};

// High-risk machine translation — gated behind REVIEW_PENDING in i18n.ts.
const JA: Record<GameKey, HowToPlayEntry> = {
  wordle: {
    label: "Wordle",
    href: "/wordle",
    summary: "5 文字の単語を 6 回以内で当てよう。",
    rules: [
      "5 文字の単語を入力して Enter で送信。",
      "緑 = 文字も位置も正解。黄 = 文字は合っているが位置が違う。灰 = その文字は使われていない。",
      "1 つのパズルにつき 6 回まで挑戦。",
      "言語ごとに 1 日 1 単語 — 全員共通。Unlimited で無制限プレイも可能。",
      "毎日のパズルを解くと連続記録が続く。",
    ],
  },
  boggle: {
    label: "Boggle",
    href: "/boggle",
    summary: "4×4 のグリッドから 3 分間でできるだけ多くの単語を見つけよう。",
    rules: [
      "隣接(斜めも可)するマスをタップして単語を作る。",
      "現在のマスが緑になる。もう一度タップで 1 つ戻れる。",
      "単語は 3 文字以上。1 単語につき各マスは 1 回のみ使用可。",
      "Enter または Submit で確定。Esc でクリア。",
      "得点: 3 文字 = 1, 4 = 2, 5 = 4, 6 = 7, 7+ = 11。",
    ],
  },
  sudoku: {
    label: "Sudoku",
    href: "/sudoku",
    summary: "9×9 のグリッドの各行・列・3×3 ブロックに 1–9 をちょうど 1 回ずつ。",
    rules: [
      "マスをタップしてから 1–9 をタップ(キーボードも可)。",
      "誤入力は赤くハイライトされる。",
      "1 ゲーム 3 ヒントまで使用可能(正解マスを表示)。",
      "Easy / Medium / Hard それぞれ独立した日替わりパズル。",
      "速いほど上位 — タイムがスコアになる。",
    ],
  },
  typing: {
    label: "Typing",
    href: "/typing",
    summary: "60 秒間でできるだけ速く正確にパラグラフを入力しよう。",
    rules: [
      "入力欄をタップして打ち始めるとタイマー開始。",
      "正しい文字は白、誤りは赤の下線付き。",
      "WPM = 正しい文字数 ÷ 5 ÷ 経過分。",
      "言語ごとに専用の文章プールあり。",
      "Restart でいつでも別の文章へ。",
    ],
  },
  tiledrop: {
    label: "TileDrop",
    href: "/tiledrop",
    summary: "落ちてくるブロックを積み、ラインを消し、上まで詰まらせない。",
    rules: [
      "デスクトップ: ←/→ 移動、↑ 回転、↓ ソフトドロップ、Space ハードドロップ。",
      "モバイル: 左右スワイプで移動、タップで回転、下スワイプで落下。",
      "C で現在のピースをホールド。P でポーズ。",
      "1/2/3/4 ライン消去 = 100/300/500/800 × レベル。",
      "10 ライン消すごとに速度上昇。",
    ],
  },
  colormatch: {
    label: "ColorMatch",
    href: "/colormatch",
    summary: "5 秒以内にカラーサンプルから RAL コードを当てよう。",
    rules: [
      "時間切れ前に 4 択から正しいコードを選ぶ。",
      "正解 100 点 + スピードボーナス最大 +50。",
      "全 10 ラウンド。",
      "10/10 で Color Expert メダル獲得。",
    ],
  },
  letterstack: {
    label: "LetterStack",
    href: "/letterstack",
    summary: "落ちてくる文字を取り、単語を作り、スタックを溢れさせない。",
    rules: [
      "対応するキーを押す — モバイルでは文字ボタンをタップ。",
      "スタックの文字で単語を作り Enter でスコア。",
      "3 文字 = 10、4 = 25、5 = 50、6+ = 100 点。",
      "時間とともに落下が速くなる — スタック 10 でゲームオーバー。",
      "500 点ごとにパワーアップ: 💣 ボム、⏸️ 減速、⭐ ジョーカー。",
    ],
  },
  vlakken: {
    label: "パッチ",
    href: "/vlakken",
    summary: "番号付きアンカーの周りの形を完成させてグリッドを埋めよう。",
    rules: [
      "各アンカーの数字 = その形のマス数。",
      "形は長方形: 正方形・縦長・横長。点線アンカーはそのサイズの任意の形を許容。",
      "各マスはちょうど 1 つの形に属する。形は重ならない。",
      "番号付きの種を 1 つだけ含む長方形をドラッグ。サイズ・形が違うと通知、正しいと形がロックされます。",
      "すべての形がロックされたらクリア。",
    ],
  },
  verbind: {
    label: "つなぐ",
    href: "/verbind",
    summary: "全マスを通る一本道で数字を順番につなごう。",
    rules: [
      "マス 1 から始めて、上下左右に隣接するマスへ進む。",
      "2, 3, 4, … の順番で、飛ばさずに通過する。",
      "経路は各マスをちょうど 1 回ずつ訪れる。",
      "タップまたはドラッグで延長。経路上のマスをタップしてそこまで戻れる。",
      "全マスが正しい順序で経路上にあればクリア。",
    ],
  },
  zonmaan: {
    label: "太陽と月",
    href: "/zonmaan",
    summary: "行・列・辺のルールに従って各マスに ☀ または 🌙 を配置しよう。",
    rules: [
      "盤面の各マスに ☀ か 🌙 のどちらかを入れる。",
      "同じ ☀ または 🌙 を縦にも横にも 3 つ以上並べてはいけない。",
      "各行・各列で ☀ と 🌙 の数を等しくする。",
      "= で区切られたマスは同じ種類になる。",
      "× で区切られたマスは反対の種類になる。",
      "各パズルには唯一の解があり、論理だけで解ける — 推測は不要。",
    ],
  },
  kronen: {
    label: "クラウン",
    href: "/kronen",
    summary: "各行・列・カラー領域にちょうど 1 つのクラウンを置こう。",
    rules: [
      "マスをタップ: 1 回で X(置けない)、2 回でクラウン、3 回でクリア。",
      "各行・列にちょうど 1 つのクラウン。",
      "各カラー領域にちょうど 1 つのクラウン。",
      "クラウン同士は接してはいけない — 斜めも不可。",
      "全クラウンが正しい位置になればクリア。",
    ],
  },
};

const ALL: Record<Locale, Record<GameKey, HowToPlayEntry>> = {
  en: EN,
  nl: NL,
  de: DE,
  fr: FR,
  es: ES,
  hi: HI,
  "pt-BR": PT_BR,
  ja: JA,
};

export function getHowToPlay(locale: Locale): Record<GameKey, HowToPlayEntry> {
  return ALL[locale] ?? EN;
}

export const UI_STRINGS: Record<Locale, {
  howToPlayHeading: string;
  howToPlaySubtitle: string;
  howToPlayPrefix: string;
  seeFullGuide: string;
  wantAllGames: string;
  play: string;
}> = {
  en: {
    howToPlayHeading: "How to play",
    howToPlaySubtitle: "Quick rules for each of the twelve BrainArena games. Pick one and dive in.",
    howToPlayPrefix: "How to play",
    seeFullGuide: "See full guide →",
    wantAllGames: "Want all the games?",
    play: "Play →",
  },
  nl: {
    howToPlayHeading: "Hoe te spelen",
    howToPlaySubtitle: "Snelle regels voor elk van de twaalf BrainArena-games. Kies er een en duik erin.",
    howToPlayPrefix: "Hoe speel je",
    seeFullGuide: "Volledige gids →",
    wantAllGames: "Alle games zien?",
    play: "Speel →",
  },
  de: {
    howToPlayHeading: "Spielanleitung",
    howToPlaySubtitle: "Schnelle Regeln für alle zwölf BrainArena-Spiele. Such dir eines aus und leg los.",
    howToPlayPrefix: "So spielst du",
    seeFullGuide: "Vollständige Anleitung →",
    wantAllGames: "Alle Spiele sehen?",
    play: "Spielen →",
  },
  fr: {
    howToPlayHeading: "Comment jouer",
    howToPlaySubtitle: "Les règles rapides des douze jeux BrainArena. Choisis-en un et lance-toi.",
    howToPlayPrefix: "Comment jouer à",
    seeFullGuide: "Voir le guide complet →",
    wantAllGames: "Voir tous les jeux ?",
    play: "Jouer →",
  },
  es: {
    howToPlayHeading: "Cómo jugar",
    howToPlaySubtitle: "Reglas rápidas para los doce juegos de BrainArena. Elige uno y empieza.",
    howToPlayPrefix: "Cómo jugar a",
    seeFullGuide: "Ver guía completa →",
    wantAllGames: "¿Ver todos los juegos?",
    play: "Jugar →",
  },
  hi: {
    howToPlayHeading: "कैसे खेलें",
    howToPlaySubtitle: "BrainArena के बारह खेलों के त्वरित नियम। एक चुनें और शुरू करें।",
    howToPlayPrefix: "कैसे खेलें",
    seeFullGuide: "पूरी गाइड देखें →",
    wantAllGames: "सभी खेल देखें?",
    play: "खेलें →",
  },
  "pt-BR": {
    howToPlayHeading: "Como jogar",
    howToPlaySubtitle: "Regras rápidas para os doze jogos do BrainArena. Escolha um e comece.",
    howToPlayPrefix: "Como jogar",
    seeFullGuide: "Ver guia completo →",
    wantAllGames: "Ver todos os jogos?",
    play: "Jogar →",
  },
  ja: {
    howToPlayHeading: "遊び方",
    howToPlaySubtitle: "BrainArena の 12 種類のゲームのクイックルール。1 つ選んで始めよう。",
    howToPlayPrefix: "遊び方",
    seeFullGuide: "ガイドを全部見る →",
    wantAllGames: "全ゲームを見る?",
    play: "プレイ →",
  },
};

export const HOW_TO_PLAY_ORDER: GameKey[] = [
  "wordle",
  "boggle",
  "sudoku",
  "typing",
  "tiledrop",
  "colormatch",
  "letterstack",
  "vlakken",
  "verbind",
  "zonmaan",
  "kronen",
];

// Backwards-compat: existing imports of HOW_TO_PLAY default to English.
export const HOW_TO_PLAY = EN;
