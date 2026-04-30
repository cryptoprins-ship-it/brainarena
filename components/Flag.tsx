import type { Locale } from "@/lib/i18n";

// Inline SVG flags so they render consistently on every platform —
// Windows in particular falls back to letter codes for emoji flags.
// The Union Jack is simplified (no St Patrick's saltire) and the Spanish
// crest, Brazilian celestial sphere and Indian Ashoka Chakra are simplified
// so the icons stay crisp at 16-20px.

type Props = { locale: Locale; className?: string };

export default function Flag({ locale, className = "h-3.5 w-5" }: Props) {
  switch (locale) {
    case "nl":
      return (
        <svg viewBox="0 0 6 4" className={className} aria-hidden>
          <rect width="6" height="4" fill="#21468B" />
          <rect width="6" height="2.667" fill="#FFF" />
          <rect width="6" height="1.333" fill="#AE1C28" />
        </svg>
      );
    case "de":
      return (
        <svg viewBox="0 0 6 4" className={className} aria-hidden>
          <rect width="6" height="4" fill="#000" />
          <rect y="1.333" width="6" height="1.333" fill="#DD0000" />
          <rect y="2.667" width="6" height="1.333" fill="#FFCE00" />
        </svg>
      );
    case "fr":
      return (
        <svg viewBox="0 0 6 4" className={className} aria-hidden>
          <rect width="2" height="4" fill="#0055A4" />
          <rect x="2" width="2" height="4" fill="#FFF" />
          <rect x="4" width="2" height="4" fill="#EF4135" />
        </svg>
      );
    case "es":
      return (
        <svg viewBox="0 0 6 4" className={className} aria-hidden>
          <rect width="6" height="4" fill="#AA151B" />
          <rect y="1" width="6" height="2" fill="#F1BF00" />
        </svg>
      );
    case "pt-BR":
      return (
        <svg viewBox="0 0 6 4" className={className} aria-hidden>
          <rect width="6" height="4" fill="#009C3B" />
          <polygon points="3,0.4 5.5,2 3,3.6 0.5,2" fill="#FFDF00" />
          <circle cx="3" cy="2" r="0.7" fill="#002776" />
        </svg>
      );
    case "hi":
      return (
        <svg viewBox="0 0 6 4" className={className} aria-hidden>
          <rect width="6" height="4" fill="#FF9933" />
          <rect y="1.333" width="6" height="1.333" fill="#FFF" />
          <rect y="2.667" width="6" height="1.333" fill="#138808" />
          <circle cx="3" cy="2" r="0.42" fill="none" stroke="#000080" strokeWidth="0.08" />
        </svg>
      );
    case "ja":
      return (
        <svg viewBox="0 0 6 4" className={className} aria-hidden>
          <rect width="6" height="4" fill="#FFF" />
          <circle cx="3" cy="2" r="1.2" fill="#BC002D" />
        </svg>
      );
    case "en":
    default:
      return (
        <svg viewBox="0 0 60 40" className={className} aria-hidden>
          <rect width="60" height="40" fill="#012169" />
          <path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFF" strokeWidth="6" />
          <path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="3" />
          <rect x="25" width="10" height="40" fill="#FFF" />
          <rect y="15" width="60" height="10" fill="#FFF" />
          <rect x="27" width="6" height="40" fill="#C8102E" />
          <rect y="17" width="60" height="6" fill="#C8102E" />
        </svg>
      );
  }
}
