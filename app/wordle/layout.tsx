import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Play Wordle Free — Dutch, German, French, Spanish",
  description:
    "Free daily Wordle in 5 languages — English, Dutch, German, French, Spanish. Same answer for everyone, share your streak.",
  alternates: { canonical: "/wordle" },
};

export default function WordleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
