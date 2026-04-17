"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CHARACTERS, getGreetingKey } from "@/data/characters";

export default function HomePage() {
  const [hour, setHour] = useState<number>(() => new Date().getHours());
  const [dayIndex, setDayIndex] = useState<number>(
    () => Math.floor(Date.now() / 86400000) % CHARACTERS.length
  );

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setHour(now.getHours());
      setDayIndex(Math.floor(Date.now() / 86400000) % CHARACTERS.length);
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const greeter = CHARACTERS[dayIndex];
  const greeting = greeter.greeting[getGreetingKey(hour)];

  const [pw, setPw] = useState(72);
  useEffect(() => {
    const id = setInterval(() => {
      setPw((p) => Math.min(100, p + 1));
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  const notifications = useMemo(
    () => [
      { id: 1, text: "傭兵業の新規依頼が 3件 届いています", tone: "info" as const },
      { id: 2, text: "夏祭り！開催中 — 社屋の街並みが夏模様に", tone: "event" as const },
      { id: 3, text: "ルカから履歴書が届きました", tone: "info" as const },
    ],
    []
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-6xl mx-auto w-full">
      {/* 左：キャラ立ち絵エリア */}
      <section className="flex-1 min-h-[480px] relative rounded-xl overflow-hidden border border-stone-700 bg-gradient-to-b from-indigo-950 via-stone-900 to-stone-950">
        <CharacterPortrait
          name={greeter.name}
          color={greeter.color}
          title={greeter.title}
          image={greeter.image}
        />

        {/* 吹き出し */}
        <div className="absolute bottom-6 left-6 right-6 bg-stone-950/85 backdrop-blur border border-amber-200/40 rounded-lg px-5 py-4 shadow-lg">
          <div className="text-xs text-amber-200 mb-1">
            {greeter.name}（{greeter.title}）
          </div>
          <div className="text-stone-100 text-lg leading-relaxed">
            「{greeting}」
          </div>
        </div>

        {!greeter.image && (
          <div className="absolute top-3 right-3 text-[10px] text-stone-500 bg-stone-950/60 px-2 py-0.5 rounded">
            プレースホルダー（実キャラ画像 v2 差替）
          </div>
        )}
      </section>

      {/* 右：社長ステータス＋メニュー */}
      <section className="w-full lg:w-80 flex flex-col gap-3">
        <div className="rounded-xl border border-stone-700 bg-stone-900 p-4">
          <div className="text-xs text-stone-400 mb-2">社長ステータス</div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-xs text-stone-400">PW</span>
            <span className="text-2xl font-mono text-amber-200">{pw}</span>
            <span className="text-xs text-stone-500">/100</span>
          </div>
          <div className="w-full h-2 bg-stone-800 rounded overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-300 to-rose-300 transition-all"
              style={{ width: `${pw}%` }}
            />
          </div>
          <div className="text-[10px] text-stone-500 mt-1">1分ごとに自動回復（原作仕様踏襲）</div>
        </div>

        <div className="rounded-xl border border-stone-700 bg-stone-900 p-4">
          <div className="text-xs text-stone-400 mb-2">通知</div>
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`text-sm px-3 py-2 rounded border ${
                  n.tone === "event"
                    ? "bg-rose-950/40 border-rose-800/60 text-rose-100"
                    : "bg-stone-800/60 border-stone-700 text-stone-200"
                }`}
              >
                {n.tone === "event" ? "🎆 " : "📮 "}
                {n.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-stone-700 bg-stone-900 p-4">
          <div className="text-xs text-stone-400 mb-2">メニュー</div>
          <div className="grid grid-cols-2 gap-2">
            <MenuBtn href="/shayoku" label="🏢 社屋へ" primary />
            <MenuBtn href="/kyukei" label="🌸 休憩室" primary />
            <MenuBtn href="#" label="📄 履歴書ガチャ" disabled />
            <MenuBtn href="#" label="🏪 市場" disabled />
            <MenuBtn href="#" label="💰 闇金！" disabled />
            <MenuBtn href="#" label="🎆 夏祭り！" disabled />
          </div>
          <div className="text-[10px] text-stone-500 mt-2">
            ※ 灰色のボタンは v2 以降で実装予定
          </div>
        </div>
      </section>
    </div>
  );
}

/* --- サブコンポーネント --- */

function CharacterPortrait({
  name,
  color,
  title,
  image,
}: {
  name: string;
  color: string;
  title: string;
  image?: string;
}) {
  // 実画像あり：ほぼ全画面表示＋柔らかいグロー
  if (image) {
    const src = process.env.NODE_ENV === "production"
      ? `/isekai-shachou-mock/${image}`
      : `/${image}`;
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        {/* ドロップシャドウのための発光リング */}
        <div
          className="absolute inset-0 opacity-50 blur-3xl"
          style={{
            background: `radial-gradient(circle at center, ${color}44 0%, transparent 60%)`,
          }}
        />
        {/* 本画像 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${name}（${title}）`}
          className="h-full max-h-[560px] object-contain drop-shadow-[0_0_40px_rgba(0,0,0,0.6)]"
        />
      </div>
    );
  }

  // 画像なし：SVGプレースホルダー
  return (
    <div className="absolute inset-0 flex items-end justify-center pb-32">
      <svg
        viewBox="0 0 200 400"
        className="h-full max-h-[500px] drop-shadow-[0_0_30px_rgba(0,0,0,0.6)]"
        aria-label={`${name}（${title}）のプレースホルダー`}
      >
        <ellipse cx="100" cy="80" rx="55" ry="60" fill={color} opacity="0.9" />
        <ellipse cx="100" cy="100" rx="35" ry="42" fill="#f9e5d3" />
        <ellipse cx="88" cy="100" rx="3" ry="5" fill="#2a2a2a" />
        <ellipse cx="112" cy="100" rx="3" ry="5" fill="#2a2a2a" />
        <path d="M65 80 Q100 60 135 80 L130 95 Q100 75 70 95 Z" fill={color} />
        <rect x="60" y="150" width="80" height="180" rx="10" fill={color} opacity="0.85" />
        <rect x="50" y="155" width="100" height="15" rx="5" fill={color} />
        <rect x="60" y="260" width="80" height="10" fill="#3a2a1a" />
        <path d="M55 330 L145 330 L155 395 L45 395 Z" fill={color} opacity="0.7" />
      </svg>
    </div>
  );
}

function MenuBtn({
  href,
  label,
  primary,
  disabled,
}: {
  href: string;
  label: string;
  primary?: boolean;
  disabled?: boolean;
}) {
  const base = "text-sm px-3 py-2.5 rounded border transition text-left";
  if (disabled) {
    return (
      <div className={`${base} bg-stone-900 border-stone-800 text-stone-600 cursor-not-allowed`}>
        {label}
      </div>
    );
  }
  return (
    <Link
      href={href}
      className={`${base} ${
        primary
          ? "bg-amber-200/90 border-amber-300 text-stone-900 hover:bg-amber-100 font-medium"
          : "bg-stone-800 border-stone-700 text-stone-200 hover:bg-stone-700"
      }`}
    >
      {label}
    </Link>
  );
}
