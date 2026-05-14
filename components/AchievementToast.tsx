"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Achievement } from "@/lib/achievements";
import { useLocale } from "@/lib/i18n";

type Toast = Achievement & { _key: number };

const subscribers = new Set<(t: Toast) => void>();
let key = 0;

export function pushAchievementToast(a: Achievement) {
  key += 1;
  const t: Toast = { ...a, _key: key };
  subscribers.forEach((fn) => fn(t));
}

export default function AchievementToast() {
  const { t } = useLocale();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const fn = (t: Toast) => {
      setToasts((cur) => [...cur, t]);
      window.setTimeout(() => {
        setToasts((cur) => cur.filter((x) => x._key !== t._key));
      }, 4000);
    };
    subscribers.add(fn);
    return () => { subscribers.delete(fn); };
  }, []);

  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast._key}
          className="pointer-events-auto flex w-72 items-center gap-3 rounded-2xl border border-indigo-400/40 bg-[#1a1a1a] p-3 shadow-2xl animate-[slidein_300ms_ease-out]"
          style={{ animation: "slidein 300ms ease-out" }}
        >
          <span className="text-3xl">{toast.icon}</span>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider text-indigo-300">{t("achievement_unlocked")}</p>
            <p className="text-sm font-bold">{toast.name}</p>
            <p className="text-xs text-gray-400">{toast.desc}</p>
          </div>
          <Link href="/achievements" className="text-xs text-indigo-300 hover:text-indigo-200">→</Link>
        </div>
      ))}
      <style jsx global>{`
        @keyframes slidein {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
