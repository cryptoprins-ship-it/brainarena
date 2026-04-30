import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-black md:text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-gray-400">Last updated: April 2026</p>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-gray-300">
        <Section title="Summary">
          BrainArena is a free puzzle and word-game site. We try to collect as little
          personal data as possible. Your game progress and streaks live on your own
          device. The only data that leaves your browser is the score you submit
          to the global leaderboard, plus standard server logs and advertising
          cookies.
        </Section>

        <Section title="Data stored on your device">
          The following lives in your browser&apos;s <code className="rounded bg-[#1a1a1a] px-1 py-0.5 text-xs">localStorage</code>{" "}
          and is never sent to us:
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Your selected language and preferred name.</li>
            <li>Daily streak, total games played, time played, and play history (used by{" "}
              <Link href="/achievements" className="underline hover:text-indigo-300">/achievements</Link>).</li>
            <li>Per-game records (best Wordle guesses, top TileDrop score, etc.).</li>
            <li>A daily player-count seed (cosmetic).</li>
          </ul>
          You can clear it any time from your browser&apos;s site-data settings.
        </Section>

        <Section title="Leaderboard submissions">
          When you finish a game and tap <em>Submit</em>, the following is sent to our server
          and saved alongside other players&apos; entries:
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>The display name you typed (24-character limit, anything goes — use a nickname).</li>
            <li>Your score, time, and game-specific metadata (e.g. difficulty, accuracy).</li>
            <li>The selected language and, if your browser provides it, a 2-letter country code.</li>
            <li>The submission timestamp.</li>
          </ul>
          We never collect your email, phone, address or any government identifier with these submissions.
          To request removal of an entry, see <a href="#contact" className="underline hover:text-indigo-300">Contact</a>.
        </Section>

        <Section title="Server logs">
          Our hosting provider records standard request logs (IP address, user agent,
          requested path, timestamp) for security and abuse-prevention. These are
          retained for a short period and not combined with any personal profile.
        </Section>

        <Section title="Advertising">
          BrainArena displays ads through Google AdSense. AdSense and its partners
          may set cookies and use device identifiers to personalise ads, measure
          performance, and prevent fraud. You can manage these via your browser
          settings or Google&apos;s{" "}
          <a className="underline hover:text-indigo-300" href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer">
            ad settings
          </a>.
        </Section>

        <Section title="Cookies">
          We use a single first-party storage area (browser <code className="rounded bg-[#1a1a1a] px-1 py-0.5 text-xs">localStorage</code>),
          not cookies, for game state. Third-party cookies are limited to the AdSense
          script described above.
        </Section>

        <Section title="Children">
          BrainArena is suitable for all ages, but we don&apos;t knowingly collect personal
          data from children under 13. If you believe a child has submitted personal
          information, contact us and we&apos;ll delete it.
        </Section>

        <Section title="Your rights">
          You can erase all on-device data by clearing site data in your browser.
          For leaderboard removal or any data-protection question (access, deletion,
          correction), email us at the address below.
        </Section>

        <Section title="Contact" id="contact">
          For privacy questions:{" "}
          <a href="mailto:privacy@brainarena.fun" className="underline hover:text-indigo-300">privacy@brainarena.fun</a> — or visit the{" "}
          <Link href="/contact" className="underline hover:text-indigo-300">contact page</Link>.
        </Section>
      </div>

      <p className="mt-10 text-xs text-gray-600">
        BrainArena · brainarena.fun
      </p>
    </div>
  );
}

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
