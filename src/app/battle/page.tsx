"use client";

import { useCallback, useState } from "react";
import { BattleCanvas, type SkillAction } from "@/components/BattleCanvas";
import { DEFAULT_DECK } from "@/data/characters";

const COMMANDER_SKILLS = [
  { id: "heal", name: "回復", icon: "💚", desc: "全員HP全回復", cost: 60 },
  { id: "attack_up", name: "鼓舞", icon: "⚔️", desc: "2ターン攻撃UP", cost: 30 },
  { id: "defense_up", name: "守護", icon: "🛡️", desc: "2ターン防御UP", cost: 30 },
  { id: "crit_up", name: "必中", icon: "🎯", desc: "2ターン命中クリUP", cost: 40 },
  { id: "ult", name: "奥義", icon: "✨", desc: "全員必殺技同時発動", cost: 80 },
];

export default function BattlePage() {
  const [pw, setPw] = useState(72);
  const [wave, setWave] = useState(1);
  const [skillTrigger, setSkillTrigger] = useState<SkillAction | null>(null);

  const handleSkill = useCallback(
    (skillId: string) => {
      const skill = COMMANDER_SKILLS.find((s) => s.id === skillId);
      if (!skill) return;
      if (pw < skill.cost) return;
      setPw((p) => p - skill.cost);
      setSkillTrigger({
        id: `${skillId}-${Date.now()}`,
        type: skill.id as SkillAction["type"],
        label: `社長スキル：${skill.name}`,
      });
    },
    [pw]
  );

  return (
    <div className="flex-1 flex flex-col p-4 max-w-6xl mx-auto w-full gap-3">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-amber-200">傭兵派遣：ダンジョン攻略</h1>
        <div className="text-xs text-stone-400">
          放置型 × キャラ自律AI × 社長スキル介入
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="text-xs text-stone-400">
            Wave <span className="text-amber-200 font-mono text-lg">{wave}</span>
            <span className="text-stone-500"> / 10</span>
          </div>
        </div>
      </div>

      {/* キャンバス */}
      <div className="flex-1 min-h-[480px] rounded-xl overflow-hidden border border-stone-700 bg-stone-950 relative">
        <BattleCanvas
          deck={DEFAULT_DECK}
          skillTrigger={skillTrigger}
          onWaveChange={setWave}
        />
        <div className="absolute top-3 left-3 bg-stone-950/80 border border-stone-700 rounded px-3 py-1 text-xs text-stone-300">
          🏞️ 森林ダンジョン（派遣先）
        </div>
        <div className="absolute top-3 right-3 bg-stone-950/80 border border-stone-700 rounded px-3 py-1 text-[10px] text-stone-400">
          キャラは自律AIで動き、社長は観戦＋社長スキル発動のみ
        </div>
      </div>

      {/* 社長スキルスロット */}
      <div className="rounded-xl border border-stone-700 bg-stone-900 p-3">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-stone-400">社長スキル</span>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs text-stone-400">PW</span>
            <div className="flex-1 h-2 bg-stone-800 rounded overflow-hidden max-w-xs">
              <div
                className="h-full bg-gradient-to-r from-amber-300 to-rose-300 transition-all"
                style={{ width: `${pw}%` }}
              />
            </div>
            <span className="font-mono text-amber-200 text-sm tabular-nums">
              {pw}/100
            </span>
          </div>
          <span className="text-[10px] text-stone-500">原作踏襲：1分1PW自動回復</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {COMMANDER_SKILLS.map((s) => {
            const disabled = pw < s.cost;
            return (
              <button
                key={s.id}
                onClick={() => handleSkill(s.id)}
                disabled={disabled}
                className={`px-2 py-2 rounded border transition text-center ${
                  disabled
                    ? "bg-stone-900 border-stone-800 text-stone-600 cursor-not-allowed"
                    : "bg-gradient-to-b from-amber-900/40 to-stone-900 border-amber-500/40 text-amber-100 hover:from-amber-800/50 hover:border-amber-300"
                }`}
              >
                <div className="text-xl">{s.icon}</div>
                <div className="text-xs font-bold">{s.name}</div>
                <div className="text-[9px] text-stone-400 leading-tight">
                  {s.desc}
                </div>
                <div className="text-[9px] text-amber-200 mt-0.5">
                  コスト {s.cost}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
