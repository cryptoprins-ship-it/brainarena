import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Typing Speed Test Online Free",
  description:
    "Free online typing speed test in 5 languages. Measure your WPM and accuracy in 60 seconds. Compete on the global BrainArena leaderboard.",
  alternates: { canonical: "/typing" },
};

export default function TypingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
