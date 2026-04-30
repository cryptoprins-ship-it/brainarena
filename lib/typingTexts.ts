import type { Locale } from "./i18n";

// Locales without bespoke pools fall back to EN via the consumer.
const TEXTS: Partial<Record<Locale, string[]>> = {
  en: [
    "The quick brown fox jumps over the lazy dog and lands softly in the meadow under a wide sky. Birds circle, the wind picks up, and the afternoon stretches into a calm and steady rhythm of small things finally happening at the right time.",
    "When you start typing, do not look at the keys. Trust your fingers and let your eyes follow the words on the screen. Speed comes from rhythm, accuracy comes from focus, and confidence comes from a hundred small repetitions that you barely notice over time.",
    "A good day rarely arrives by accident. It is built sentence by sentence, decision by decision, in the small choices we make before anyone is watching. The work that no one applauds is often the work that quietly changes everything that comes after it.",
  ],
  nl: [
    "De snelle bruine vos springt over de luie hond en landt zacht in het weiland onder een brede lucht. Vogels cirkelen, de wind trekt aan en de middag rekt uit tot een rustig en gestaag ritme van kleine dingen die eindelijk op het juiste moment gebeuren.",
    "Als je begint met typen, kijk dan niet naar de toetsen. Vertrouw je vingers en laat je ogen de woorden op het scherm volgen. Snelheid komt uit ritme, nauwkeurigheid uit focus en vertrouwen uit honderden kleine herhalingen die je nauwelijks opmerkt na een tijdje.",
  ],
  de: [
    "Der schnelle braune Fuchs springt über den faulen Hund und landet sanft auf der Wiese unter einem weiten Himmel. Vögel kreisen, der Wind frischt auf, und der Nachmittag dehnt sich zu einem ruhigen, gleichmäßigen Rhythmus aus kleinen Dingen, die endlich zur richtigen Zeit geschehen.",
    "Wenn du zu tippen beginnst, schau nicht auf die Tasten. Vertraue deinen Fingern und lass deine Augen den Wörtern auf dem Bildschirm folgen. Geschwindigkeit kommt aus dem Rhythmus, Genauigkeit aus dem Fokus und Selbstvertrauen aus hundert kleinen Wiederholungen, die du kaum bemerkst.",
  ],
  fr: [
    "Le rapide renard brun saute par-dessus le chien paresseux et atterrit doucement dans la prairie sous un ciel immense. Les oiseaux tournent, le vent se lève, et l'après-midi s'étire en un rythme calme et régulier de petites choses qui arrivent enfin au bon moment.",
    "Quand vous commencez à taper, ne regardez pas les touches. Faites confiance à vos doigts et laissez vos yeux suivre les mots sur l'écran. La vitesse vient du rythme, la précision de la concentration, et la confiance de cent petites répétitions que vous remarquez à peine.",
  ],
  es: [
    "El rápido zorro marrón salta sobre el perro perezoso y aterriza suavemente en el prado bajo un cielo amplio. Los pájaros giran, el viento aumenta y la tarde se extiende en un ritmo tranquilo y constante de pequeñas cosas que por fin suceden en el momento adecuado.",
    "Cuando empieces a escribir, no mires las teclas. Confía en tus dedos y deja que tus ojos sigan las palabras en la pantalla. La velocidad viene del ritmo, la precisión de la concentración y la confianza de cien pequeñas repeticiones que apenas notas con el tiempo.",
  ],
};

export function pickText(locale: Locale, seed = Date.now()): string {
  const list = TEXTS[locale] ?? TEXTS.en ?? [""];
  return list[Math.abs(seed) % list.length];
}
