"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "🏠 ホーム" },
  { href: "/shayoku", label: "🏢 社屋（日常＋襲来）" },
  { href: "/kyukei", label: "🌸 休憩室" },
];

export function GlobalNav() {
  const pathname = usePathname();
  const [clock, setClock] = useState("--:--:--");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      setClock(`${hh}:${mm}:${ss}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="border-b border-stone-700 bg-stone-950/80 backdrop-blur">
      <div className="px-4 py-2 flex items-center gap-4">
        <div className="font-bold text-amber-200 tracking-wide">
          異世界<span className="text-rose-300">★</span>社長
          <span className="ml-2 text-xs text-stone-400">（仮）モック</span>
        </div>
        <nav className="flex gap-1 ml-4">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1 rounded text-sm transition ${
                  active
                    ? "bg-amber-200 text-stone-900 font-medium"
                    : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto font-mono text-sm text-stone-300 tabular-nums">
          {clock}
        </div>
      </div>
    </header>
  );
}
