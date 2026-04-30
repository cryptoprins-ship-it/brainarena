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
  wordbuild: {
    label: "WordBuild",
    href: "/wordbuild",
    summary: "Type words from today's category to build a house piece by piece.",
    rules: [
      "Every word must belong to the day's category.",
      "3 letters = brick, 4 = wall, 5 = window, 6 = roof tile, 7+ = chimney.",
      "Longer words score more points.",
      "10 rounds — your finished house is shown on the leaderboard.",
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
  cityplanner: {
    label: "CityPlanner",
    href: "/cityplanner",
    summary: "Place 20 buildings on an 8×8 grid to score the highest city.",
    rules: [
      "Tap a square to place the next piece in the queue.",
      "🏠 next to 🌳 = +3 per neighbour.",
      "🏪 next to 🛣️ = +2 per neighbour.",
      "🏭 with no 🏠 neighbour = +2; 🏠 next to 🏭 = −2.",
      "Connected 🛣️ network = bonus equal to the longest road chain.",
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
  wordbuild: {
    label: "WordBuild",
    href: "/wordbuild",
    summary: "Typ woorden uit de categorie van vandaag om stuk voor stuk een huis te bouwen.",
    rules: [
      "Elk woord moet binnen de categorie van vandaag passen.",
      "3 letters = baksteen, 4 = muur, 5 = raam, 6 = dakpan, 7+ = schoorsteen.",
      "Langere woorden leveren meer punten op.",
      "10 rondes — je voltooide huis verschijnt op het scorebord.",
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
  cityplanner: {
    label: "CityPlanner",
    href: "/cityplanner",
    summary: "Plaats 20 gebouwen op een 8×8 raster en bouw de stad met de hoogste score.",
    rules: [
      "Tik op een vakje om het volgende stuk uit de wachtrij neer te zetten.",
      "🏠 naast 🌳 = +3 per buur.",
      "🏪 naast 🛣️ = +2 per buur.",
      "🏭 zonder 🏠 buur = +2; 🏠 naast 🏭 = −2.",
      "Verbonden 🛣️ netwerk = bonus gelijk aan de langste wegketen.",
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
  wordbuild: {
    label: "WordBuild",
    href: "/wordbuild",
    summary: "Tippe Wörter aus der heutigen Kategorie, um Stück für Stück ein Haus zu bauen.",
    rules: [
      "Jedes Wort muss zur heutigen Kategorie gehören.",
      "3 Buchstaben = Ziegel, 4 = Wand, 5 = Fenster, 6 = Dachziegel, 7+ = Schornstein.",
      "Längere Wörter geben mehr Punkte.",
      "10 Runden — dein fertiges Haus erscheint in der Bestenliste.",
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
  cityplanner: {
    label: "CityPlanner",
    href: "/cityplanner",
    summary: "Platziere 20 Gebäude auf einem 8×8-Raster und baue die Stadt mit der höchsten Punktzahl.",
    rules: [
      "Tippe ein Feld an, um das nächste Stück aus der Warteschlange zu setzen.",
      "🏠 neben 🌳 = +3 pro Nachbar.",
      "🏪 neben 🛣️ = +2 pro Nachbar.",
      "🏭 ohne 🏠-Nachbar = +2; 🏠 neben 🏭 = −2.",
      "Verbundenes 🛣️-Netz = Bonus gleich der längsten Straßenkette.",
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
  wordbuild: {
    label: "WordBuild",
    href: "/wordbuild",
    summary: "Tape des mots de la catégorie du jour pour construire une maison pièce par pièce.",
    rules: [
      "Chaque mot doit appartenir à la catégorie du jour.",
      "3 lettres = brique, 4 = mur, 5 = fenêtre, 6 = tuile, 7+ = cheminée.",
      "Plus le mot est long, plus tu marques.",
      "10 manches — ta maison terminée apparaît au classement.",
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
  cityplanner: {
    label: "CityPlanner",
    href: "/cityplanner",
    summary: "Place 20 bâtiments sur une grille 8×8 pour obtenir le score le plus élevé.",
    rules: [
      "Touche une case pour poser la prochaine pièce de la file.",
      "🏠 à côté de 🌳 = +3 par voisin.",
      "🏪 à côté de 🛣️ = +2 par voisin.",
      "🏭 sans voisin 🏠 = +2 ; 🏠 à côté de 🏭 = −2.",
      "Réseau 🛣️ connecté = bonus égal à la plus longue chaîne de routes.",
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
  wordbuild: {
    label: "WordBuild",
    href: "/wordbuild",
    summary: "Escribe palabras de la categoría del día para construir una casa pieza a pieza.",
    rules: [
      "Cada palabra debe pertenecer a la categoría del día.",
      "3 letras = ladrillo, 4 = pared, 5 = ventana, 6 = teja, 7+ = chimenea.",
      "Las palabras más largas dan más puntos.",
      "10 rondas — tu casa terminada aparece en el ranking.",
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
  cityplanner: {
    label: "CityPlanner",
    href: "/cityplanner",
    summary: "Coloca 20 edificios en una cuadrícula 8×8 para obtener la mayor puntuación.",
    rules: [
      "Toca una casilla para colocar la siguiente pieza de la cola.",
      "🏠 junto a 🌳 = +3 por vecino.",
      "🏪 junto a 🛣️ = +2 por vecino.",
      "🏭 sin vecino 🏠 = +2; 🏠 junto a 🏭 = −2.",
      "Red 🛣️ conectada = bonus igual a la cadena de carretera más larga.",
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
};

const ALL: Record<Locale, Record<GameKey, HowToPlayEntry>> = {
  en: EN,
  nl: NL,
  de: DE,
  fr: FR,
  es: ES,
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
    howToPlaySubtitle: "Quick rules for each of the nine BrainArena games. Pick one and dive in.",
    howToPlayPrefix: "How to play",
    seeFullGuide: "See full guide →",
    wantAllGames: "Want all the games?",
    play: "Play →",
  },
  nl: {
    howToPlayHeading: "Hoe te spelen",
    howToPlaySubtitle: "Snelle regels voor elk van de negen BrainArena-games. Kies er een en duik erin.",
    howToPlayPrefix: "Hoe speel je",
    seeFullGuide: "Volledige gids →",
    wantAllGames: "Alle games zien?",
    play: "Speel →",
  },
  de: {
    howToPlayHeading: "Spielanleitung",
    howToPlaySubtitle: "Schnelle Regeln für alle neun BrainArena-Spiele. Such dir eines aus und leg los.",
    howToPlayPrefix: "So spielst du",
    seeFullGuide: "Vollständige Anleitung →",
    wantAllGames: "Alle Spiele sehen?",
    play: "Spielen →",
  },
  fr: {
    howToPlayHeading: "Comment jouer",
    howToPlaySubtitle: "Les règles rapides des neuf jeux BrainArena. Choisis-en un et lance-toi.",
    howToPlayPrefix: "Comment jouer à",
    seeFullGuide: "Voir le guide complet →",
    wantAllGames: "Voir tous les jeux ?",
    play: "Jouer →",
  },
  es: {
    howToPlayHeading: "Cómo jugar",
    howToPlaySubtitle: "Reglas rápidas para los nueve juegos de BrainArena. Elige uno y empieza.",
    howToPlayPrefix: "Cómo jugar a",
    seeFullGuide: "Ver guía completa →",
    wantAllGames: "¿Ver todos los juegos?",
    play: "Jugar →",
  },
};

export const HOW_TO_PLAY_ORDER: GameKey[] = [
  "wordle",
  "boggle",
  "sudoku",
  "typing",
  "tiledrop",
  "wordbuild",
  "colormatch",
  "cityplanner",
  "letterstack",
];

// Backwards-compat: existing imports of HOW_TO_PLAY default to English.
export const HOW_TO_PLAY = EN;
