"use client";

import { useCallback, useEffect, useState } from "react";
import { ShayokuCanvas, type Phase, type SkillAction } from "@/components/ShayokuCanvas";
import { DEPARTMENTS } from "@/data/departments";

const COMMANDER_SKILLS = [
  { id: "heal", name: "回復", icon: "💚", desc: "全員HP全回復", cost: 60 },
  { id: "attack_up", name: "鼓舞", icon: "⚔️", desc: "2ターン攻撃UP", cost: 30 },
  { id: "defense_up", name: "守護", icon: "🛡️", desc: "2ターン防御UP", cost: 30 },
  { id: "crit_up", name: "必中", icon: "🎯", desc: "2ターン命中UP", cost: 40 },
  { id: "ult", name: "奥義", icon: "✨", desc: "全員必殺同時発動", cost: 80 },
] as const;

const PHASE_LABEL: Record<Phase, { text: string; bg: string; fg: string }> = {
  peace: { text: "☀️ 平穏（通常業務中）", bg: "bg-stone-800", fg: "text-stone-200" },
  warning: { text: "⚠️ 襲来予兆", bg: "bg-amber-900", fg: "text-amber-200" },
  raid: { text: "🗡️ 襲来中！ 迎撃中", bg: "bg-rose-900", fg: "text-rose-100" },
  victory: { text: "🎉 撃退成功！", bg: "bg-emerald-900", fg: "text-emerald-100" },
};

export default function ShayokuPage() {
  const [festival, setFestival] = useState(false);
  const [phase, setPhase] = useState<Phase>("peace");
  const [nextRaid, setNextRaid] = useState(25);
  const [skillTrigger, setSkillTrigger] = useState<SkillAction | null>(null);

  // PW自動回復（モック速度：1秒1PW、本番は1分1PW）
  const [pw, setPw] = useState(72);
  useEffect(() => {
    const id = setInterval(() => setPw((p) => Math.min(100, p + 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const handleSkill = useCallback(
    (skillId: string) => {
      const skill = COMMANDER_SKILLS.find((s) => s.id === skillId);
      if (!skill) return;
      if (pw < skill.cost) return;
      setPw((p) => p - skill.cost);
      setSkillTrigger({
        id: `${skillId}-${Date.now()}`,
        type: skill.id,
        label: `社長スキル：${skill.name}`,
      });
    },
    [pw]
  );

  const phaseInfo = PHASE_LABEL[phase];

  return (
    <div className="flex-1 flex flex-col p-4 max-w-6xl mx-auto w-full gap-3">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-lg font-bold text-amber-200">社屋</h1>
        <div className="text-xs text-stone-400">
          日常 × 襲来 の舞台 / 生活維持×経営の6部署
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

      {/* フェーズ表示 */}
      <div
        className={`flex items-center gap-3 px-4 py-2 rounded border border-stone-700 ${phaseInfo.bg}`}
      >
        <span className={`text-sm font-bold ${phaseInfo.fg}`}>{phaseInfo.text}</span>
        {phase === "peace" && (
          <span className="text-xs text-stone-300 ml-auto">
            次の襲来まで: <span className="font-mono text-amber-200">{nextRaid}s</span>
          </span>
        )}
      </div>

      {/* キャンバス */}
      <div className="flex-1 min-h-[480px] rounded-xl overflow-hidden border border-stone-700 bg-stone-950 relative">
        <ShayokuCanvas
          festival={festival}
          skillTrigger={skillTrigger}
          onPhaseChange={setPhase}
          onNextRaidChange={setNextRaid}
        />
        <div className="absolute top-3 left-3 bg-stone-950/80 border border-stone-700 rounded px-3 py-1 text-[10px] text-stone-400">
          ホワサバ風ビジュアル（仮素材）／ 部署前に社員が生息 → 襲来時は自律AIで迎撃
        </div>
      </div>

      {/* 社長スキル */}
      <div className="rounded-xl border border-stone-700 bg-stone-900 p-3">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-stone-400">社長スキル（唯一の能動介入）</span>
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
          <span className="text-[10px] text-stone-500">
            原作踏襲：1分1PW（モックは1秒1PW加速）
          </span>
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
                <div className="text-[9px] text-amber-200 mt-0.5">コスト {s.cost}</div>
              </button>
            );
          })}
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
