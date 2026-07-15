# Deelbare resultaat-kaart — design

Status: approved, ready for implementation plan.

## Doel

Meer gratis, virale distributie via spelers zelf: na een spel deelt de speler
een visuele afbeelding van zijn resultaat (in plaats van alleen platte tekst)
naar WhatsApp-status, Instagram Stories, X, etc. Alternatief voor een
geld-incentive (maandprijs) — geen juridisch risico, geen server-kosten, geen
persoonlijke data.

## Bestaande infrastructuur (hergebruikt, niet vervangen)

BrainArena heeft al een volwaardige deel-laag:

- `lib/share.ts` — `SharePayload`-type, per-spel `FORMATTERS` (tekst-regel per
  spel), `dayNumber()`, `hasNativeShare()`, `nativeShare()`,
  `copyShareText()`, `SHARE_TARGETS` (X, WhatsApp, Telegram, Facebook, Reddit,
  Email — platform-intent-links, tekst-only).
- `components/ShareButton.tsx` — enige deel-ingang voor alle 13 spellen,
  gebruikt door `components/EndScreenAddon.tsx` na elk spel. Native
  share-sheet waar beschikbaar, anders een menu met platform-links + kopiëren.

Deze structuur blijft het skelet. De kaart is een **toevoeging** aan het
bestaande deel-pad, geen nieuw systeem.

## Scope

**Wel:**
- Eén gedeeld visueel sjabloon (canvas, 1200×630) voor alle 13 spellen —
  geen 13 custom ontwerpen.
- Stijl: donkere achtergrond (`#0a0a0a`, past bij site-thema), subtiel
  rasterpatroon, logo + URL, spelnaam + daggetal klein, resultaat-kernwaarde
  groot in beeld, indigo accentbalk. Bij Wordle: kleine rij gekleurde
  tegeltjes (echte rechthoeken, geen emoji — consistente weergave op elk OS).
- Delen: native OS-deelsheet met de afbeelding erbij wanneer het apparaat dat
  ondersteunt (`navigator.canShare({ files })`). Anders: afbeelding
  downloaden als PNG via een nieuwe menu-optie, bestaande platform-links
  blijven tekst-only (kunnen technisch geen bestand dragen).
- Eén nieuwe i18n-string (`share_download_image`) × 8 locales.

**Niet (bewust buiten scope):**
- Server-side OG-image-generatie (voor link-previews) — apart project, ander
  doel (crawler-preview vs. speler-gedeelde afbeelding).
- Per-spel custom visuele ontwerpen.
- Geld-incentive / maandprijs — apart traject, wacht op juridische check
  (kansspelautoriteit.nl).

## Componenten

### `lib/share.ts` (uitbreiding)

Nieuwe `SHARE_HEADLINES: Record<GameKey, (p: SharePayload) => string>` naast
de bestaande `FORMATTERS`. Geeft per spel **alleen** de grote kernwaarde
terug die op de kaart komt te staan (bv. `"4/6"`, `"2:34"`, `"1.240"`,
`"💥"`) — geen volzin, geen "BrainArena"-prefix (die staat al op het logo).
Hergebruikt de bestaande `num()/str()/bool()`-helpers en `formatTime()`.

`hasNativeShare()` blijft ongewijzigd. De file-capability-check
(`navigator.canShare?.({ files: [...] })`) komt **in** `nativeShare()` zelf
te zitten (zie onder) in plaats van als losse geëxporteerde functie — die
check heeft altijd een concreet `File`-object nodig om zinvol te zijn, dus
een losstaande `canShareFiles()` zonder argument zou toch alleen maar
opnieuw aangeroepen worden met het bestand erbij.

### `lib/shareCard.ts` (nieuw)

- `buildShareCardBlob(game: GameKey, payload: SharePayload): Promise<Blob | null>`
  — maakt een in-memory `<canvas>` (nooit in de DOM gemount), tekent het
  sjabloon, geeft de PNG als `Blob` terug via `toBlob()`. `null` als
  `toBlob()` faalt (zeldzaam) — aanroeper valt dan terug op tekst-only delen.
- Tekenlogica: achtergrond + rasterpatroon (statisch, geen data nodig) →
  logo/URL → spelnaam (`GAME_NAMES`, al bestaand) + `dayNumber()` (al
  bestaand) — bij Wordle/Boggle/Typing/Letter Stack met `payload.locale`
  gezet wordt die als suffix op deze regel getoond (bv. "Wordle #423 NL"),
  zelfde gedrag als de bestaande tekst-`FORMATTERS` — → headline uit
  `SHARE_HEADLINES` groot gecentreerd → bij Wordle (`meta.states` aanwezig
  én niet-leeg) een rij gekleurde rechthoeken boven de headline, kleur
  direct uit `states` (`correct`→groen, `present`→geel, anders→grijs, zelfde
  mapping als de bestaande `wordleGrid()`-tekstfunctie, maar nu als
  canvas-rechthoeken i.p.v. emoji).

### `components/ShareButton.tsx` (uitbreiding)

`onShareClick()`:
1. `hasNativeShare()` → bouw blob → `File` (of `null` bij zeldzame `toBlob()`-fout) → geef mee aan de (uitgebreide) `nativeShare(game, payload, file)`. Die functie beslist zelf, met het concrete bestand, of `navigator.canShare({ files: [file] })` het toestaat — zo ja, bestand gaat mee de deelsheet in; zo nee (of geen bestand), tekst-only zoals nu.
2. Geen native share → huidig menu, met één nieuwe regel **"Download afbeelding"** die de blob bouwt en via een tijdelijke `Blob`-URL + onzichtbare `<a download>` een PNG-download triggert (URL direct daarna `revokeObjectURL`).

Geen wijziging aan de bestaande platform-link-regels (X/WhatsApp/Telegram/Facebook/Reddit/Email) of aan `copyShareText()` — die blijven exact zoals ze zijn.

## Foutafhandeling

- Canvas-tekenen is synchroon en puur — geen netwerk, geen state, kan
  feitelijk niet falen behalve een extreem zeldzame `toBlob()`-`null`.
- `null`-blob → stil terugvallen op tekst-only share (speler krijgt nog
  steeds iets bruikbaars, geen foutmelding voor zo'n randgeval).
- `navigator.share({ files })` kan weigeren/afbreken net als de bestaande
  tekst-only variant — zelfde `dismissed`/`failed`-afhandeling die er al is,
  geen nieuw pad nodig.
- Download-fallback (Blob-URL + tijdelijke link) is een standaardpatroon
  zonder betekenisvolle faalmodus.

## Testen

- Nieuw testscript (stijl van bestaande `scripts/test-*.mjs`) voor
  `SHARE_HEADLINES`: 13 spellen × voorbeeld-payload → verwachte string. Pure
  functie, cheap, vangt typo's in meta-veldnamen.
- Canvas-tekenwerk zelf is visueel — niet zinvol unit te testen. Handmatige
  verificatie na implementatie: een paar spellen spelen, delen/downloaden,
  PNG bekijken (donker thema klopt, tegel-rij alleen bij Wordle, tekst leesbaar op klein formaat zoals een WhatsApp-status).

## i18n

Eén nieuwe key, `share_download_image`, toegevoegd aan alle 8 locale-blokken
in `lib/i18n.ts`, zelfde patroon als de bestaande `share_*`-strings.
