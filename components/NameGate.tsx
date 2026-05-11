"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";

// Imperative API: any code calling `ensurePlayerName()` (lib/scores.ts) fires
// `brainarena:request-name`. This modal opens, waits for input, then fires
// `brainarena:name-submitted` with the chosen name. The promise on the
// caller side resolves to that name. No state library needed.
export default function NameGate() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onRequest = () => {
      setValue("");
      setError(false);
      setOpen(true);
    };
    window.addEventListener("brainarena:request-name", onRequest);
    return () => window.removeEventListener("brainarena:request-name", onRequest);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError(true);
      return;
    }
    window.dispatchEvent(
      new CustomEvent("brainarena:name-submitted", { detail: trimmed.slice(0, 24) })
    );
    setOpen(false);
  }, [value]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 px-4 py-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#13141c] p-5 shadow-2xl"
      >
        <h2 className="text-xl font-black">{t("name_gate_title")}</h2>
        <p className="mt-1 text-sm text-gray-400">{t("name_gate_subtitle")}</p>
        <input
          ref={inputRef}
          type="text"
          inputMode="text"
          maxLength={24}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(false);
          }}
          placeholder={t("name_gate_placeholder")}
          aria-label={t("name_gate_placeholder")}
          className={`mt-4 w-full rounded-lg border bg-[#0a0a0a] px-3 py-2.5 text-base focus:outline-none focus:ring-2 ${
            error
              ? "border-rose-500/60 focus:ring-rose-500/40"
              : "border-[#2a2a2a] focus:ring-indigo-500/40"
          }`}
        />
        {error ? (
          <p className="mt-2 text-xs text-rose-400">{t("name_gate_required")}</p>
        ) : null}
        <button
          type="submit"
          className="mt-4 min-h-[44px] w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-bold hover:opacity-90"
        >
          {t("name_gate_submit")}
        </button>
      </form>
    </div>
  );
}
