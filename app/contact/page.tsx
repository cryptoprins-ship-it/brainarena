"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/lib/i18n";

const TOPICS = [
  { value: "general", label: "General question" },
  { value: "bug", label: "Bug report" },
  { value: "leaderboard", label: "Leaderboard removal" },
  { value: "privacy", label: "Privacy / data request" },
  { value: "partnership", label: "Partnership" },
];

export default function ContactPage() {
  const { t } = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("general");
  const [message, setMessage] = useState("");

  const recipient = "info@brainarena.fun";

  function buildMailto() {
    const subject = `[${topic}] BrainArena — ${name || "Contact"}`;
    const body = [
      `Name: ${name}`,
      `Reply-to: ${email}`,
      `Topic: ${topic}`,
      "",
      message,
    ].join("\n");
    return `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    window.location.href = buildMailto();
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-black md:text-4xl">{t("contact_title")}</h1>
      <p className="mt-2 text-sm text-gray-400">
        Bug reports, leaderboard removal requests, partnerships — drop us a line.
      </p>

      <a
        href="mailto:info@brainarena.fun"
        className="mt-6 block rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5 transition hover:border-indigo-400/40"
      >
        <p className="text-xs uppercase tracking-wider text-gray-500">Email</p>
        <p className="mt-1 text-base font-bold">info@brainarena.fun</p>
        <p className="mt-1 text-sm text-gray-400">
          Questions, feedback, bug reports, partnerships, privacy / data
          removal requests — all welcome. See also our{" "}
          <Link href="/privacy" className="underline hover:text-indigo-300">privacy policy</Link>.
        </p>
      </a>

      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-5"
      >
        <h2 className="text-lg font-bold">{t("contact_send_us_message")}</h2>
        <p className="mt-1 text-xs text-gray-500">
          Submitting opens your default email client with the message pre-filled.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={64}
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm"
              placeholder="Your name"
            />
          </Field>
          <Field label="Email">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm"
              placeholder="you@example.com"
            />
          </Field>
        </div>

        <div className="mt-3">
          <Field label="Topic">
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm"
            >
              {TOPICS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-3">
          <Field label="Message">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={6}
              maxLength={4000}
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-sm resize-none"
              placeholder="What's on your mind?"
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            Sending to <span className="font-mono">{recipient}</span>
          </p>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold hover:bg-indigo-500"
          >
            Open email →
          </button>
        </div>
      </form>

      <p className="mt-8 text-xs text-gray-600">
        Prefer a one-line approach?{" "}
        <a href="mailto:info@brainarena.fun" className="underline hover:text-indigo-300">
          email us directly
        </a>.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-gray-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
