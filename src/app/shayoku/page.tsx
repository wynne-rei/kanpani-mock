"use client";

import { useState } from "react";
import { ShayokuCanvas } from "@/components/ShayokuCanvas";
import { DEPARTMENTS } from "@/data/departments";

export default function ShayokuPage() {
  const [festival, setFestival] = useState(false);

  return (
    <div className="flex-1 flex flex-col p-4 max-w-6xl mx-auto w-full gap-3">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-amber-200">社屋ビュー</h1>
        <div className="text-xs text-stone-400">
          会社全体の建物群＝社屋 / 生活維持×経営の6部署
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-stone-400">通常</span>
          <button
            onClick={() => setFestival((f) => !f)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              festival ? "bg-rose-500" : "bg-stone-700"
            }`}
            aria-label="夏祭り切替"
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                festival ? "translate-x-7" : "translate-x-0.5"
              }`}
            />
          </button>
          <span
            className={`text-xs transition-colors ${
              festival ? "text-rose-300 font-bold" : "text-stone-400"
            }`}
          >
            夏祭り！
          </span>
        </div>
      </div>

      {/* キャンバス */}
      <div className="flex-1 min-h-[540px] rounded-xl overflow-hidden border border-stone-700 bg-stone-950 relative">
        <ShayokuCanvas festival={festival} />
        <div className="absolute top-3 left-3 bg-stone-950/80 border border-stone-700 rounded px-3 py-1 text-xs text-stone-300">
          {festival ? "🎆 夏祭り！開催中 — 街並みが夏模様に変化" : "☀️ 通常営業中"}
        </div>
        <div className="absolute top-3 right-3 bg-stone-950/80 border border-stone-700 rounded px-3 py-1 text-[10px] text-stone-400">
          ホワサバ風ビジュアルイメージ（仮素材）
        </div>
      </div>

      {/* 部署リスト */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {DEPARTMENTS.map((d) => (
          <div
            key={d.id}
            className="border border-stone-700 bg-stone-900 rounded px-3 py-2"
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">{d.emoji}</span>
              <span className="font-bold text-stone-100">{d.name}</span>
              <span
                className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
                  d.category === "life"
                    ? "bg-emerald-900/60 text-emerald-300"
                    : "bg-blue-900/60 text-blue-300"
                }`}
              >
                {d.category === "life" ? "生活維持" : "経営"}
              </span>
            </div>
            <div className="text-[10px] text-stone-500 mt-1">{d.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
