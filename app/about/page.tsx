"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n";

// About page — written by Marcel, the person who actually runs the site.
// Two locales for now (EN + NL), since these are the audiences most likely
// to read it. Other locales fall back to English. AdSense reviewers prefer
// real, specific content over auto-translated boilerplate, so we don't
// machine-translate this page.

const COPY = {
  en: {
    h1: "About BrainArena",
    intro:
      "BrainArena is a small, ad-supported puzzle site built and run by one person — me, Marcel, in Hillegom, the Netherlands. It started in 2026 as a side project, and it has stayed exactly that: a place to play, not a venture pitch.",
    why_h: "Why I built it",
    why:
      "I love two things: solving puzzles and building things on the web. Most puzzle sites I tried felt like ad-tech experiments first and games second — full screen interstitials, modal pop-ups, the whole circus. I wanted one place where the puzzles are the point. I build the games I want to play, and if other people enjoy them too, even better.",
    me_h: "How I use it",
    me:
      "I play when I'm bored. Sudoku is the one I keep coming back to, but Crowns has also become a daily habit. Keeping the brain trained matters — five minutes of a logic grid is a small thing that adds up over years.",
    what_h: "What's here",
    what:
      "Daily puzzles spanning word games (Wordle, Boggle, LetterStack), logic grids (Sudoku, Patches, Connect, Sun & Moon, Crowns), and arcade-style brain teasers (TileDrop, ColorMatch, Typing). Each game has Easy / Medium / Hard, a daily seed everyone shares, and a global leaderboard. Your progress lives in your browser — no account required.",
    free_h: "Free, and how that works",
    free:
      "BrainArena is free for everyone. Hosting, domains, and email cost real money, so I run Google AdSense to cover those bills. You opt in to advertising cookies via the banner — if you say no, the site still works, you just don't see ads. I don't sell your data and there's no premium tier dangling features behind a paywall.",
    open_h: "Open about the tech",
    open:
      "Each puzzle is generated with a real solver that checks for unique solutions before publishing — no broken or unsolvable boards. The site is built with Next.js, runs on Hostinger, and uses Upstash for rate limiting. Source-of-truth choices and security policy live at /privacy and /security.",
    contact_h: "Get in touch",
    contact:
      "Bug reports, suggestions, leaderboard removal — drop a line via the contact page. I read every email; replies sometimes take a couple of days because this is a side project, not a full-time job.",
    contactBtn: "Visit /contact",
    homeBtn: "Back to the puzzles",
  },
  nl: {
    h1: "Over BrainArena",
    intro:
      "BrainArena is een kleine, gratis puzzelsite die ik (Marcel, uit Hillegom) in 2026 ben gestart. Eén persoon, geen team, geen investeerders — gewoon een plek om te spelen.",
    why_h: "Waarom ik het bouwde",
    why:
      "Ik hou van twee dingen: puzzels oplossen en sites bouwen. De meeste puzzelsites die ik probeerde voelden als ad-tech-experimenten waar puzzels bijzaak waren — fullscreen interstitials, pop-ups, het hele circus. Ik wilde één plek waar de puzzel zelf centraal staat. Ik bouw de games die ik zelf wil spelen; als anderen er ook van genieten, des te beter.",
    me_h: "Hoe ik het zelf gebruik",
    me:
      "Ik speel als ik me verveel. Sudoku blijft mijn favoriet, maar Kronen is ook een dagelijkse gewoonte geworden. Hersenen trainen is belangrijk — vijf minuten met een logica-puzzel is iets kleins dat over jaren optelt.",
    what_h: "Wat hier staat",
    what:
      "Elf dagelijkse puzzels: woordgames (Wordle, Boggle, LetterStack), logica (Sudoku, Patches, Verbind, Zon & Maan, Kronen) en arcade-breinkrakers (TileDrop, ColorMatch, Typing). Elke game heeft Makkelijk / Gemiddeld / Moeilijk, een dagelijkse seed die voor iedereen hetzelfde is, en een wereldwijd leaderboard. Je voortgang blijft in je browser — geen account nodig.",
    free_h: "Gratis, en hoe dat kan",
    free:
      "BrainArena is gratis voor iedereen. Hosting, domeinen en mail kosten geld, dus draai ik Google AdSense om die rekeningen te dekken. Via de cookie-banner kies jij of je advertentie-cookies accepteert — zeg je nee, dan werkt de site nog steeds, alleen zonder ads. Ik verkoop geen data en er is geen 'premium' versie waar features achter een paywall hangen.",
    open_h: "Open over de techniek",
    open:
      "Elke puzzel wordt gegenereerd door een solver die controleert dat er één unieke oplossing is — geen kapotte of onoplosbare borden. De site draait op Next.js, gehost bij Hostinger, met Upstash voor rate limiting. Privacy- en security-policy staan op /privacy en in SECURITY.md.",
    contact_h: "Contact",
    contact:
      "Bug, suggestie, leaderboard-verwijdering — stuur een mail via de contactpagina. Ik lees alles; antwoord duurt soms een paar dagen omdat dit een hobbyproject is naast m'n gewone werk.",
    contactBtn: "Naar /contact",
    homeBtn: "Terug naar de puzzels",
  },
};

function pickLocale(l: string): "en" | "nl" {
  return l === "nl" ? "nl" : "en";
}

export default function AboutPage() {
  const { locale } = useLocale();
  const t = COPY[pickLocale(locale)];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-black md:text-4xl">{t.h1}</h1>
      <p className="mt-1 text-xs text-gray-500">Hillegom · NL · Online sinds 2026</p>

      <p className="mt-6 leading-relaxed text-gray-200">{t.intro}</p>

      <div className="mt-8 space-y-6">
        <Section title={t.why_h}>{t.why}</Section>
        <Section title={t.me_h}>{t.me}</Section>
        <Section title={t.what_h}>{t.what}</Section>
        <Section title={t.free_h}>{t.free}</Section>
        <Section title={t.open_h}>{t.open}</Section>
        <Section title={t.contact_h}>{t.contact}</Section>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/contact"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold hover:bg-indigo-500"
        >
          {t.contactBtn}
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-2 text-sm hover:bg-[#222]"
        >
          {t.homeBtn}
        </Link>
      </div>

      <p className="mt-12 text-xs text-gray-600">
        — Marcel · BrainArena · brainarena.fun
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-300">{children}</p>
    </section>
  );
}
