"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CHARACTERS, getGreetingKey } from "@/data/characters";

export default function HomePage() {
  const [hour, setHour] = useState<number>(() => new Date().getHours());

  useEffect(() => {
    const id = setInterval(() => {
      setHour(new Date().getHours());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // ホーム画面のメインキャラはモニク固定
  // （レイさん指定／実画像がある看板キャラ）
  const greeter =
    CHARACTERS.find((c) => c.id === "monique") ?? CHARACTERS[0];
  const greeting = greeter.greeting[getGreetingKey(hour)];

  const [pw, setPw] = useState(72);
  useEffect(() => {
    const id = setInterval(() => {
      setPw((p) => Math.min(100, p + 1));
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  // 時間帯で空の色を変える
  const isNight = hour >= 18 || hour < 6;
  const isEvening = hour >= 16 && hour < 19;

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* ヘッダー（時計・PW・通貨） */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 py-2 flex items-center gap-3 bg-gradient-to-b from-stone-950/80 to-transparent">
        <div className="text-xs text-amber-200/80 font-mono">
          {String(hour).padStart(2, "0")}:00 / {isNight ? "夜" : isEvening ? "夕" : "昼"}
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1 text-amber-200">
            <span>✨ PW</span>
            <span className="font-mono text-sm">{pw}</span>
            <span className="text-stone-500">/100</span>
          </div>
          <div className="flex items-center gap-1 text-yellow-300">
            <span>💎 SS</span>
            <span className="font-mono text-sm">12,340</span>
          </div>
          <div className="flex items-center gap-1 text-rose-300">
            <span>🪙</span>
            <span className="font-mono text-sm">8,250</span>
          </div>
        </div>
      </div>

      {/* 執務室 背景 */}
      <div
        className={`absolute inset-0 transition-colors duration-1000 ${
          isNight
            ? "bg-gradient-to-b from-indigo-950 via-stone-950 to-stone-900"
            : isEvening
            ? "bg-gradient-to-b from-orange-950 via-amber-950 to-stone-900"
            : "bg-gradient-to-b from-sky-900 via-stone-800 to-stone-900"
        }`}
      >
        {/* 床 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[35%]"
          style={{
            background: `linear-gradient(180deg, #4a3a2a 0%, #3a2a1a 100%)`,
          }}
        />
        {/* 床の模様 */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[35%] opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0px, transparent 80px, rgba(0,0,0,0.3) 80px, rgba(0,0,0,0.3) 82px)",
          }}
        />
        {/* 壁の装飾（モールディング） */}
        <div
          className="absolute left-0 right-0 opacity-30"
          style={{
            bottom: "35%",
            height: "3px",
            background: "#8a6a4a",
          }}
        />
      </div>

      {/* 執務室 家具（SVG） */}
      <ExecutiveRoomDecor isNight={isNight} />

      {/* メインキャラ（立ち絵） */}
      <div className="relative z-10 flex-1 flex items-center justify-center pt-14 pb-32">
        <CharacterPortrait
          name={greeter.name}
          color={greeter.color}
          title={greeter.title}
          image={greeter.image}
        />
      </div>

      {/* キャラ吹き出し */}
      <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-30 max-w-xl w-[calc(100%-2rem)]">
        <div className="bg-stone-950/85 backdrop-blur border border-amber-200/50 rounded-xl px-5 py-3 shadow-2xl">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm text-amber-200 font-bold">{greeter.name}</span>
            <span className="text-[10px] text-stone-400">（{greeter.title}）</span>
          </div>
          <div className="text-stone-100 text-base leading-relaxed">
            「{greeting}」
          </div>
        </div>
      </div>

      {/* 下部の5機能ボタン */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 bg-gradient-to-t from-stone-950/90 via-stone-950/70 to-transparent">
        <div className="max-w-4xl mx-auto grid grid-cols-5 gap-2 md:gap-3">
          <ExecutiveBtn href="/shayoku" icon="🏢" label="社屋" sub="日常と襲来" color="amber" />
          <ExecutiveBtn href="/kyukei" icon="🌸" label="休憩室" sub="社員と一対一" color="rose" />
          <ExecutiveBtn href="#" icon="📄" label="採用" sub="履歴書ガチャ" color="emerald" disabled />
          <ExecutiveBtn href="#" icon="🎆" label="イベント" sub="夏祭り・闇金" color="orange" disabled />
          <ExecutiveBtn href="#" icon="🏪" label="市場" sub="売買・闇金" color="purple" disabled />
        </div>
      </div>
    </div>
  );
}

/* ---------- 執務室の家具装飾 ---------- */

function ExecutiveRoomDecor({ isNight }: { isNight: boolean }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {/* 左の本棚 */}
      <g>
        <rect x="20" y="180" width="130" height="340" fill="#3a2818" stroke="#5a3a2a" strokeWidth="2" />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <rect
              x="28"
              y={190 + i * 65}
              width="114"
              height="55"
              fill="#2a1808"
            />
            {/* 本たち */}
            <rect x="32" y={194 + i * 65} width="8" height="48" fill="#8b3a3a" />
            <rect x="42" y={194 + i * 65} width="10" height="46" fill="#3a5a8b" />
            <rect x="54" y={192 + i * 65} width="6" height="50" fill="#c8a050" />
            <rect x="62" y={194 + i * 65} width="12" height="48" fill="#5a8b3a" />
            <rect x="76" y={194 + i * 65} width="8" height="47" fill="#8b5a3a" />
            <rect x="86" y={194 + i * 65} width="14" height="49" fill="#3a3a8b" />
            <rect x="102" y={194 + i * 65} width="9" height="46" fill="#8b3a5a" />
            <rect x="114" y={194 + i * 65} width="10" height="48" fill="#a08050" />
            <rect x="126" y={194 + i * 65} width="8" height="47" fill="#5a5a8b" />
          </g>
        ))}
      </g>

      {/* 右の窓（社屋が見える） */}
      <g>
        {/* 窓枠 */}
        <rect x="950" y="140" width="220" height="220" fill="#2a1a0a" />
        {/* 外の空 */}
        <rect
          x="960"
          y="150"
          width="200"
          height="200"
          fill={isNight ? "#0a0a2a" : "#6ba3d6"}
        />
        {/* 遠景の社屋シルエット */}
        <g opacity="0.7">
          <rect x="975" y="240" width="40" height="105" fill={isNight ? "#1a1a3a" : "#3a5a7a"} />
          <rect x="1025" y="220" width="50" height="125" fill={isNight ? "#2a2a4a" : "#4a6a8a"} />
          <rect x="1085" y="250" width="35" height="95" fill={isNight ? "#1a1a3a" : "#3a5a7a"} />
          <rect x="1125" y="230" width="30" height="115" fill={isNight ? "#2a2a4a" : "#4a6a8a"} />
          {/* 窓明かり（夜のみ） */}
          {isNight && (
            <>
              <rect x="982" y="260" width="5" height="5" fill="#ffe080" opacity="0.9" />
              <rect x="995" y="270" width="5" height="5" fill="#ffe080" opacity="0.9" />
              <rect x="1033" y="255" width="5" height="5" fill="#ffe080" opacity="0.9" />
              <rect x="1050" y="285" width="5" height="5" fill="#ffe080" opacity="0.9" />
              <rect x="1095" y="275" width="5" height="5" fill="#ffe080" opacity="0.9" />
              <rect x="1130" y="260" width="5" height="5" fill="#ffe080" opacity="0.9" />
            </>
          )}
        </g>
        {/* 窓格子 */}
        <line x1="1060" y1="150" x2="1060" y2="350" stroke="#2a1a0a" strokeWidth="4" />
        <line x1="960" y1="250" x2="1160" y2="250" stroke="#2a1a0a" strokeWidth="4" />
        {/* 窓の光（昼のみ） */}
        {!isNight && (
          <rect
            x="960"
            y="150"
            width="200"
            height="200"
            fill="url(#windowLight)"
            opacity="0.3"
          />
        )}
        {/* カーテン */}
        <path d="M 920 140 L 960 140 L 960 360 L 940 370 L 920 360 Z" fill="#5a3a3a" />
        <path d="M 1160 140 L 1200 140 L 1200 360 L 1180 370 L 1160 360 Z" fill="#5a3a3a" />
      </g>

      {/* 右下の執務机 */}
      <g>
        <ellipse cx="950" cy="620" rx="130" ry="12" fill="#000" opacity="0.5" />
        <rect x="830" y="560" width="240" height="60" fill="#5a3a1a" stroke="#3a2a0a" strokeWidth="2" />
        <rect x="830" y="620" width="240" height="8" fill="#3a2a0a" />
        {/* 机の脚 */}
        <rect x="835" y="620" width="15" height="80" fill="#3a2a0a" />
        <rect x="1050" y="620" width="15" height="80" fill="#3a2a0a" />
        {/* 書類 */}
        <rect x="850" y="540" width="60" height="25" fill="#f4e3b8" stroke="#8a6a4a" strokeWidth="1" transform="rotate(-3 880 555)" />
        <rect x="920" y="535" width="50" height="28" fill="#f8ecc8" stroke="#8a6a4a" strokeWidth="1" transform="rotate(2 945 550)" />
        {/* ランプ */}
        <g transform="translate(1000, 500)">
          <rect x="-3" y="30" width="6" height="30" fill="#3a2a0a" />
          <ellipse cx="0" cy="35" rx="20" ry="8" fill="#2a1a0a" />
          <path d="M -18 30 L 18 30 L 14 5 L -14 5 Z" fill="#c89060" />
          {/* 光 */}
          <circle cx="0" cy="15" r="10" fill="#ffe080" opacity="0.6" />
        </g>
      </g>

      {/* 左下のソファ */}
      <g>
        <rect x="30" y="620" width="280" height="60" rx="10" fill="#4a2a3a" stroke="#2a0a1a" strokeWidth="2" />
        <rect x="30" y="580" width="30" height="100" rx="8" fill="#3a1a2a" />
        <rect x="280" y="580" width="30" height="100" rx="8" fill="#3a1a2a" />
        {/* クッション */}
        <rect x="70" y="600" width="60" height="25" rx="5" fill="#6a3a4a" />
        <rect x="160" y="600" width="60" height="25" rx="5" fill="#6a3a4a" />
        {/* 脚 */}
        <rect x="40" y="680" width="12" height="15" fill="#1a0a0a" />
        <rect x="290" y="680" width="12" height="15" fill="#1a0a0a" />
      </g>

      {/* ランプの光用グラデーション */}
      <defs>
        <radialGradient id="windowLight">
          <stop offset="0%" stopColor="#ffedb8" stopOpacity="1" />
          <stop offset="100%" stopColor="#ffedb8" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* ---------- キャラ立ち絵 ---------- */

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
  if (image) {
    const src =
      process.env.NODE_ENV === "production"
        ? `/isekai-shachou-mock/${image}`
        : `/${image}`;
    return (
      <div className="relative h-full w-full max-w-xl overflow-hidden flex justify-center">
        {/* キャラ背後の発光 */}
        <div
          className="absolute inset-0 opacity-60 blur-3xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${color}88 0%, transparent 60%)`,
          }}
        />
        {/* バストアップ表示：画像を親の約200%高さにして上から出し、腰〜下を切る */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${name}（${title}）`}
          className="absolute top-0 left-1/2 -translate-x-1/2 h-[200%] max-h-none w-auto object-contain drop-shadow-[0_0_40px_rgba(0,0,0,0.7)]"
          style={{ objectPosition: "center top" }}
        />
      </div>
    );
  }

  return (
    <div className="relative h-full flex items-end justify-center">
      <svg
        viewBox="0 0 200 400"
        className="h-full max-h-[500px] drop-shadow-[0_0_30px_rgba(0,0,0,0.6)]"
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

/* ---------- 執務室ボタン ---------- */

function ExecutiveBtn({
  href,
  icon,
  label,
  sub,
  color,
  disabled,
}: {
  href: string;
  icon: string;
  label: string;
  sub: string;
  color: "amber" | "rose" | "emerald" | "orange" | "purple";
  disabled?: boolean;
}) {
  const colorMap = {
    amber: "from-amber-900/80 to-amber-700/60 border-amber-500/50 hover:from-amber-800/90 hover:border-amber-300 text-amber-100",
    rose: "from-rose-900/80 to-rose-700/60 border-rose-500/50 hover:from-rose-800/90 hover:border-rose-300 text-rose-100",
    emerald: "from-emerald-900/80 to-emerald-700/60 border-emerald-500/50 hover:from-emerald-800/90 hover:border-emerald-300 text-emerald-100",
    orange: "from-orange-900/80 to-orange-700/60 border-orange-500/50 hover:from-orange-800/90 hover:border-orange-300 text-orange-100",
    purple: "from-purple-900/80 to-purple-700/60 border-purple-500/50 hover:from-purple-800/90 hover:border-purple-300 text-purple-100",
  };

  const content = (
    <div className="flex flex-col items-center text-center">
      <div className="text-2xl md:text-3xl mb-0.5">{icon}</div>
      <div className="text-sm md:text-base font-bold">{label}</div>
      <div className="text-[9px] md:text-[10px] opacity-80 mt-0.5">{sub}</div>
      {disabled && (
        <div className="text-[8px] text-stone-400 mt-0.5">v2実装予定</div>
      )}
    </div>
  );

  const base =
    "rounded-xl border-2 backdrop-blur-sm py-2.5 md:py-3 px-2 transition-all";

  if (disabled) {
    return (
      <div className={`${base} bg-stone-900/70 border-stone-700 text-stone-500 cursor-not-allowed opacity-70`}>
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={`${base} bg-gradient-to-b ${colorMap[color]} block`}>
      {content}
    </Link>
  );
}
