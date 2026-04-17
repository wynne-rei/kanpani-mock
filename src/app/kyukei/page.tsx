"use client";

import { useState } from "react";
import { CHARACTERS, type Character } from "@/data/characters";

type Pose = "standing" | "sitting" | "reading" | "sleeping" | "smiling" | "stretching";

const POSES: { id: Pose; label: string; emoji: string }[] = [
  { id: "standing", label: "立ち姿", emoji: "🧍" },
  { id: "sitting", label: "座り", emoji: "🪑" },
  { id: "reading", label: "読書", emoji: "📖" },
  { id: "sleeping", label: "お昼寝", emoji: "😴" },
  { id: "smiling", label: "笑顔", emoji: "😊" },
  { id: "stretching", label: "伸び", emoji: "🙆" },
];

type ReactionSpot = "head" | "cheek" | "hand" | "shoulder";

const REACTIONS: Record<Pose, Record<ReactionSpot, string[]>> = {
  standing: {
    head: ["社長、髪が乱れます", "もう…しょうがないですね", "撫でられるの、好きかも…"],
    cheek: ["っ、くすぐったい！", "もう、お行儀悪いですよ", "えへへ…"],
    hand: ["手、温かいですね", "繋いでてもいいですか？", "ありがと、社長"],
    shoulder: ["ん、肩ですか？", "まだ疲れてませんよ", "支えてくれるんですか"],
  },
  sitting: {
    head: ["あら、どうぞ撫でてください", "うとうと…してきました", "心地いいです"],
    cheek: ["んふふ", "近いですよ、社長", "もう！"],
    hand: ["重ねてもらえますか…", "温かい", "じっと見ないで"],
    shoulder: ["肩寄せても？", "落ち着きますね", "一緒にいるの、好き"],
  },
  reading: {
    head: ["…社長、読書の邪魔です", "あ、でも続けて", "集中切れちゃう"],
    cheek: ["ひゃっ", "本が落ちちゃう", "もう、またですか"],
    hand: ["一緒に読みますか？", "このページ、面白いんです", "指が触れて…"],
    shoulder: ["隣、どうぞ", "一緒に本を…", "静かで好きですよ、こういう時間"],
  },
  sleeping: {
    head: ["…ん…", "すー、すー…", "…社長…？"],
    cheek: ["……むにゃ", "…起きちゃう", "やさしい"],
    hand: ["…あたたかい…", "…社長の手…", "…もう少しだけ…"],
    shoulder: ["…もう朝…？", "…まだ夢…", "…ここに居ていいですか…"],
  },
  smiling: {
    head: ["えへへ", "嬉しいです！", "社長のそれ、好き"],
    cheek: ["もう、照れますってば", "いきなり！", "ふふっ"],
    hand: ["はい、どうぞ", "握り返しちゃった", "今日もよろしくお願いします"],
    shoulder: ["肩を組むんですか？", "近い距離、好きかも", "ふふ、仲間ですね"],
  },
  stretching: {
    head: ["んー、気持ちいい", "撫でられながら伸びは…反則です", "ふにゃ〜"],
    cheek: ["ひゃぁ！びっくりした", "触るならタイミング考えてください", "もう〜"],
    hand: ["引っ張らないで〜", "伸びきっちゃいます", "この格好、恥ずかしい…"],
    shoulder: ["肩、凝ってます？", "一緒にストレッチしますか", "ぎゅーって…"],
  },
};

export default function KyukeiPage() {
  const [charIndex, setCharIndex] = useState(0);
  const [pose, setPose] = useState<Pose>("standing");
  const [reaction, setReaction] = useState<{ text: string; key: number } | null>(null);
  const [visitCount, setVisitCount] = useState(0);

  const char = CHARACTERS[charIndex];

  const handleTouch = (spot: ReactionSpot) => {
    const options = REACTIONS[pose][spot];
    const text = options[Math.floor(Math.random() * options.length)];
    setReaction({ text, key: Date.now() });
    setVisitCount((c) => c + 1);
  };

  return (
    <div className="flex-1 flex flex-col p-4 max-w-6xl mx-auto w-full gap-3">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-lg font-bold text-amber-200">🌸 休憩室</h1>
        <div className="text-xs text-stone-400">
          1日1回は訪ねよう ／ 社員の素顔を覗ける唯一の場所
        </div>
        <div className="ml-auto text-xs text-stone-400">
          今日の訪問回数:{" "}
          <span className="text-amber-200 font-mono">{visitCount}</span>
        </div>
      </div>

      {/* キャラ選択タブ */}
      <div className="flex gap-2">
        {CHARACTERS.map((c, i) => (
          <button
            key={c.id}
            onClick={() => {
              setCharIndex(i);
              setReaction(null);
            }}
            className={`px-4 py-2 rounded border transition ${
              i === charIndex
                ? "bg-amber-200 text-stone-900 border-amber-300 font-bold"
                : "bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-800"
            }`}
            style={
              i === charIndex
                ? {
                    boxShadow: `0 0 20px ${c.color}60`,
                  }
                : undefined
            }
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* メインエリア */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3">
        {/* キャラ部屋 */}
        <section
          className="flex-1 min-h-[500px] relative rounded-xl overflow-hidden border-2"
          style={{
            borderColor: char.color,
            background: `linear-gradient(180deg, ${char.color}22 0%, #1a1a22 60%, #0a0a12 100%)`,
          }}
        >
          {/* 部屋の装飾 */}
          <RoomDecor pose={pose} color={char.color} />

          {/* キャラSVG */}
          <PoseCharacter char={char} pose={pose} onTouch={handleTouch} />

          {/* リアクション吹き出し */}
          {reaction && (
            <ReactionBubble key={reaction.key} text={reaction.text} />
          )}

          {/* 左上タグ */}
          <div className="absolute top-3 left-3 bg-stone-950/80 border border-stone-700 rounded px-3 py-1 text-xs text-stone-300">
            {char.name} の休憩室（{char.title}）
          </div>
          <div className="absolute top-3 right-3 text-[10px] text-stone-500 bg-stone-950/60 px-2 py-0.5 rounded">
            プレースホルダー（v2で本キャラ差替）
          </div>

          {/* タッチヒント */}
          <div className="absolute bottom-3 left-3 text-[10px] text-stone-400 bg-stone-950/80 px-2 py-1 rounded">
            ヒント: キャラの 頭 / 頬 / 手 / 肩 をクリックしてみて
          </div>
        </section>

        {/* コントロール */}
        <aside className="w-full lg:w-72 flex flex-col gap-3">
          {/* ポーズ切替 */}
          <div className="rounded-xl border border-stone-700 bg-stone-900 p-3">
            <div className="text-xs text-stone-400 mb-2">ポーズ（6種類）</div>
            <div className="grid grid-cols-2 gap-2">
              {POSES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPose(p.id);
                    setReaction(null);
                  }}
                  className={`px-2 py-2 rounded border text-sm transition ${
                    pose === p.id
                      ? "bg-amber-200/90 text-stone-900 border-amber-300 font-bold"
                      : "bg-stone-800 text-stone-200 border-stone-700 hover:bg-stone-700"
                  }`}
                >
                  <div className="text-xl">{p.emoji}</div>
                  <div className="text-xs">{p.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 撮影（飾り） */}
          <div className="rounded-xl border border-stone-700 bg-stone-900 p-3">
            <div className="text-xs text-stone-400 mb-2">撮影</div>
            <button
              onClick={() => alert("📸 撮影しました！（v2でギャラリー機能）")}
              className="w-full px-3 py-2 rounded border bg-rose-950/40 border-rose-500/40 text-rose-100 hover:bg-rose-900/50"
            >
              📸 スクリーンショット
            </button>
            <div className="text-[10px] text-stone-500 mt-2">
              v2: カメラ自由操作・X共有対応予定
            </div>
          </div>

          {/* 説明 */}
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3">
            <div className="text-xs text-amber-300 font-bold mb-1">💡 休憩室の設計意図</div>
            <div className="text-[11px] text-stone-300 leading-relaxed">
              ドルフロ2の休憩室にインスパイア。
              <br />
              <br />
              「キャラの生活そのもの」コンセプトの
              <span className="text-amber-200">最小単位</span>。
              1日1回訪問が推奨され、社長（プレイヤー）の習慣になる。
              <br />
              <br />
              本実装では：
              <br />
              ・6ポーズ × 4タッチポイント = <span className="text-amber-200">24種の反応</span>
              <br />
              ・ポーズ別に固有セリフ
              <br />
              ・キャラごとに性格が出る（モニクは丁寧、ローズはフランク、ジークリットは硬派）
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------- キャラ立ち絵（SVG、ポーズ別） ---------- */

function PoseCharacter({
  char,
  pose,
  onTouch,
}: {
  char: Character;
  pose: Pose;
  onTouch: (spot: ReactionSpot) => void;
}) {
  // 実画像あり：画像をベースにタッチポイントをオーバーレイ
  if (char.image) {
    const src =
      process.env.NODE_ENV === "production"
        ? `/isekai-shachou-mock/${char.image}`
        : `/${char.image}`;
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="absolute inset-0 opacity-50 blur-3xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${char.color}44 0%, transparent 65%)`,
          }}
        />
        <div className="relative h-full max-h-[500px] aspect-square">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`${char.name}（${char.title}）`}
            className="h-full w-full object-contain drop-shadow-[0_0_40px_rgba(0,0,0,0.6)]"
          />
          {/* タッチポイント（%ベース配置） */}
          <TouchOverlay spot="head" onTouch={onTouch} style={{ top: "12%", left: "45%", width: "20%", height: "18%" }} label="頭" />
          <TouchOverlay spot="cheek" onTouch={onTouch} style={{ top: "25%", left: "40%", width: "12%", height: "10%" }} label="頬" />
          <TouchOverlay spot="shoulder" onTouch={onTouch} style={{ top: "32%", left: "30%", width: "40%", height: "12%" }} label="肩" />
          <TouchOverlay spot="hand" onTouch={onTouch} style={{ top: "42%", left: "15%", width: "18%", height: "18%" }} label="手" />
        </div>
        {/* 下部の注記 */}
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 text-[10px] text-stone-400 bg-stone-950/80 px-2 py-1 rounded pointer-events-none">
          ※ ポーズ別画像は v2 で差替。現在は1ポーズのみ表示、リアクションはポーズ別に変化
        </div>
      </div>
    );
  }

  // 画像なし：SVGプレースホルダー
  return (
    <div className="absolute inset-0 flex items-end justify-center pb-8">
      <svg
        viewBox="0 0 300 500"
        className="h-full max-h-[460px] drop-shadow-[0_0_40px_rgba(0,0,0,0.6)]"
        aria-label={`${char.name}の${pose}ポーズ`}
      >
        {/* ポーズ別にSVGを変える */}
        {pose === "standing" && <StandingPose color={char.color} onTouch={onTouch} />}
        {pose === "sitting" && <SittingPose color={char.color} onTouch={onTouch} />}
        {pose === "reading" && <ReadingPose color={char.color} onTouch={onTouch} />}
        {pose === "sleeping" && <SleepingPose color={char.color} onTouch={onTouch} />}
        {pose === "smiling" && <SmilingPose color={char.color} onTouch={onTouch} />}
        {pose === "stretching" && <StretchingPose color={char.color} onTouch={onTouch} />}
      </svg>
    </div>
  );
}

function TouchOverlay({
  spot,
  onTouch,
  style,
  label,
}: {
  spot: ReactionSpot;
  onTouch: (s: ReactionSpot) => void;
  style: React.CSSProperties;
  label: string;
}) {
  return (
    <button
      onClick={() => onTouch(spot)}
      className="absolute rounded-full border-2 border-white/20 border-dashed hover:border-amber-300 hover:bg-amber-300/10 transition cursor-pointer"
      style={style}
      title={label}
      aria-label={label}
    />
  );
}

const BodyBase = ({ color, className = "" }: { color: string; className?: string }) => (
  <g className={className}>
    <ellipse cx="150" cy="150" rx="60" ry="65" fill={color} opacity="0.9" />
    <ellipse cx="150" cy="170" rx="38" ry="46" fill="#f9e5d3" />
    <ellipse cx="138" cy="168" rx="3" ry="5" fill="#2a2a2a" />
    <ellipse cx="162" cy="168" rx="3" ry="5" fill="#2a2a2a" />
    <path d="M120 150 Q150 130 180 150 L175 168 Q150 145 125 168 Z" fill={color} />
  </g>
);

// クリック領域を持つ共通コンポーネント
function TouchTarget({
  cx,
  cy,
  r,
  spot,
  onTouch,
  label,
}: {
  cx: number;
  cy: number;
  r: number;
  spot: ReactionSpot;
  onTouch: (spot: ReactionSpot) => void;
  label: string;
}) {
  return (
    <g style={{ cursor: "pointer" }} onClick={() => onTouch(spot)}>
      <circle cx={cx} cy={cy} r={r} fill="transparent" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.15"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <title>{label}</title>
    </g>
  );
}

function StandingPose({ color, onTouch }: { color: string; onTouch: (s: ReactionSpot) => void }) {
  return (
    <>
      <BodyBase color={color} />
      {/* 体 */}
      <rect x="110" y="220" width="80" height="180" rx="12" fill={color} opacity="0.85" />
      <rect x="100" y="225" width="100" height="15" rx="5" fill={color} />
      {/* スカート */}
      <path d="M105 400 L195 400 L205 470 L95 470 Z" fill={color} opacity="0.7" />
      {/* 腕 */}
      <rect x="95" y="240" width="18" height="90" rx="8" fill={color} opacity="0.9" />
      <rect x="187" y="240" width="18" height="90" rx="8" fill={color} opacity="0.9" />

      <TouchTarget cx={150} cy={125} r={40} spot="head" onTouch={onTouch} label="頭" />
      <TouchTarget cx={130} cy={170} r={15} spot="cheek" onTouch={onTouch} label="頬" />
      <TouchTarget cx={104} cy={335} r={18} spot="hand" onTouch={onTouch} label="手" />
      <TouchTarget cx={115} cy={228} r={18} spot="shoulder" onTouch={onTouch} label="肩" />
    </>
  );
}

function SittingPose({ color, onTouch }: { color: string; onTouch: (s: ReactionSpot) => void }) {
  return (
    <>
      <g transform="translate(0, 60)">
        <BodyBase color={color} />
        <rect x="110" y="220" width="80" height="130" rx="12" fill={color} opacity="0.85" />
        <rect x="100" y="225" width="100" height="15" rx="5" fill={color} />
        {/* 曲げた脚 */}
        <rect x="90" y="340" width="120" height="35" rx="10" fill={color} opacity="0.7" />
        <rect x="95" y="240" width="18" height="80" rx="8" fill={color} opacity="0.9" />
        <rect x="187" y="240" width="18" height="80" rx="8" fill={color} opacity="0.9" />
      </g>
      {/* 椅子 */}
      <rect x="80" y="445" width="140" height="20" fill="#4a3a2a" />
      <rect x="85" y="465" width="10" height="20" fill="#3a2a1a" />
      <rect x="205" y="465" width="10" height="20" fill="#3a2a1a" />

      <TouchTarget cx={150} cy={185} r={40} spot="head" onTouch={onTouch} label="頭" />
      <TouchTarget cx={130} cy={230} r={15} spot="cheek" onTouch={onTouch} label="頬" />
      <TouchTarget cx={104} cy={380} r={18} spot="hand" onTouch={onTouch} label="手" />
      <TouchTarget cx={115} cy={288} r={18} spot="shoulder" onTouch={onTouch} label="肩" />
    </>
  );
}

function ReadingPose({ color, onTouch }: { color: string; onTouch: (s: ReactionSpot) => void }) {
  return (
    <>
      <g transform="translate(0, 40)">
        <BodyBase color={color} />
        <rect x="110" y="220" width="80" height="150" rx="12" fill={color} opacity="0.85" />
        {/* 本 */}
        <g transform="translate(110, 240)">
          <path d="M0 0 L40 10 L80 0 L80 50 L40 60 L0 50 Z" fill="#f4e3b8" stroke="#5a3a2a" strokeWidth="1.5" />
          <line x1="40" y1="10" x2="40" y2="60" stroke="#5a3a2a" strokeWidth="1" />
        </g>
        <rect x="95" y="240" width="18" height="70" rx="8" fill={color} opacity="0.9" />
        <rect x="187" y="240" width="18" height="70" rx="8" fill={color} opacity="0.9" />
        <path d="M105 370 L195 370 L205 440 L95 440 Z" fill={color} opacity="0.7" />
      </g>

      <TouchTarget cx={150} cy={165} r={40} spot="head" onTouch={onTouch} label="頭" />
      <TouchTarget cx={130} cy={210} r={15} spot="cheek" onTouch={onTouch} label="頬" />
      <TouchTarget cx={150} cy={290} r={25} spot="hand" onTouch={onTouch} label="手（本ごと）" />
      <TouchTarget cx={115} cy={268} r={18} spot="shoulder" onTouch={onTouch} label="肩" />
    </>
  );
}

function SleepingPose({ color, onTouch }: { color: string; onTouch: (s: ReactionSpot) => void }) {
  return (
    <>
      <g transform="translate(-20, 120) rotate(-15 150 200)">
        {/* 横向き */}
        <ellipse cx="150" cy="150" rx="60" ry="65" fill={color} opacity="0.9" />
        <ellipse cx="150" cy="170" rx="38" ry="46" fill="#f9e5d3" />
        <line x1="138" y1="168" x2="144" y2="168" stroke="#2a2a2a" strokeWidth="2" />
        <line x1="162" y1="168" x2="168" y2="168" stroke="#2a2a2a" strokeWidth="2" />
        <path d="M120 150 Q150 130 180 150 L175 168 Q150 145 125 168 Z" fill={color} />
        <rect x="110" y="220" width="180" height="70" rx="30" fill={color} opacity="0.85" />
        <rect x="95" y="240" width="18" height="50" rx="8" fill={color} opacity="0.9" />
      </g>
      {/* ベッド */}
      <rect x="40" y="330" width="260" height="50" rx="8" fill="#7a5a3a" />
      <rect x="40" y="380" width="260" height="20" fill="#5a3a2a" />
      {/* 「Z」のシンボル */}
      <text x="220" y="90" fontSize="24" fill="#ffe080" opacity="0.8" fontWeight="bold">
        ☽ z z
      </text>

      <TouchTarget cx={120} cy={210} r={35} spot="head" onTouch={onTouch} label="頭" />
      <TouchTarget cx={145} cy={245} r={15} spot="cheek" onTouch={onTouch} label="頬" />
      <TouchTarget cx={250} cy={280} r={25} spot="hand" onTouch={onTouch} label="手" />
      <TouchTarget cx={180} cy={300} r={20} spot="shoulder" onTouch={onTouch} label="肩" />
    </>
  );
}

function SmilingPose({ color, onTouch }: { color: string; onTouch: (s: ReactionSpot) => void }) {
  return (
    <>
      <ellipse cx="150" cy="150" rx="60" ry="65" fill={color} opacity="0.9" />
      <ellipse cx="150" cy="170" rx="38" ry="46" fill="#f9e5d3" />
      {/* にっこり目 */}
      <path d="M133 168 Q138 164 143 168" fill="none" stroke="#2a2a2a" strokeWidth="2" strokeLinecap="round" />
      <path d="M157 168 Q162 164 167 168" fill="none" stroke="#2a2a2a" strokeWidth="2" strokeLinecap="round" />
      <path d="M140 185 Q150 192 160 185" fill="none" stroke="#c85a5a" strokeWidth="2" strokeLinecap="round" />
      {/* 頬染め */}
      <circle cx="125" cy="180" r="6" fill="#ff8888" opacity="0.5" />
      <circle cx="175" cy="180" r="6" fill="#ff8888" opacity="0.5" />
      <path d="M120 150 Q150 130 180 150 L175 168 Q150 145 125 168 Z" fill={color} />
      <rect x="110" y="220" width="80" height="180" rx="12" fill={color} opacity="0.85" />
      <rect x="100" y="225" width="100" height="15" rx="5" fill={color} />
      <path d="M105 400 L195 400 L205 470 L95 470 Z" fill={color} opacity="0.7" />
      {/* 両手を顔のそばに */}
      <rect x="80" y="190" width="18" height="60" rx="8" fill={color} transform="rotate(-20 89 220)" />
      <rect x="202" y="190" width="18" height="60" rx="8" fill={color} transform="rotate(20 211 220)" />
      {/* ハートパーティクル */}
      <text x="60" y="100" fontSize="20" fill="#ff88aa" opacity="0.8">♥</text>
      <text x="230" y="80" fontSize="16" fill="#ff88aa" opacity="0.7">♥</text>
      <text x="250" y="140" fontSize="14" fill="#ff88aa" opacity="0.6">♥</text>

      <TouchTarget cx={150} cy={125} r={40} spot="head" onTouch={onTouch} label="頭" />
      <TouchTarget cx={125} cy={180} r={15} spot="cheek" onTouch={onTouch} label="頬" />
      <TouchTarget cx={80} cy={235} r={20} spot="hand" onTouch={onTouch} label="手" />
      <TouchTarget cx={115} cy={228} r={18} spot="shoulder" onTouch={onTouch} label="肩" />
    </>
  );
}

function StretchingPose({ color, onTouch }: { color: string; onTouch: (s: ReactionSpot) => void }) {
  return (
    <>
      <g transform="translate(0, 30)">
        <ellipse cx="150" cy="130" rx="60" ry="65" fill={color} opacity="0.9" />
        <ellipse cx="150" cy="150" rx="38" ry="46" fill="#f9e5d3" />
        <ellipse cx="138" cy="148" rx="3" ry="4" fill="#2a2a2a" />
        <ellipse cx="162" cy="148" rx="3" ry="4" fill="#2a2a2a" />
        <path d="M140 168 Q150 175 160 168" fill="none" stroke="#c85a5a" strokeWidth="2" />
        <path d="M120 130 Q150 110 180 130 L175 148 Q150 125 125 148 Z" fill={color} />
        <rect x="110" y="200" width="80" height="180" rx="12" fill={color} opacity="0.85" />
        <rect x="100" y="205" width="100" height="15" rx="5" fill={color} />
        {/* 両手を上に伸ばす */}
        <rect x="100" y="100" width="18" height="120" rx="8" fill={color} transform="rotate(-20 109 160)" />
        <rect x="182" y="100" width="18" height="120" rx="8" fill={color} transform="rotate(20 191 160)" />
        <path d="M105 380 L195 380 L205 450 L95 450 Z" fill={color} opacity="0.7" />
      </g>

      <TouchTarget cx={150} cy={125} r={40} spot="head" onTouch={onTouch} label="頭" />
      <TouchTarget cx={130} cy={180} r={15} spot="cheek" onTouch={onTouch} label="頬" />
      <TouchTarget cx={100} cy={170} r={22} spot="hand" onTouch={onTouch} label="手" />
      <TouchTarget cx={120} cy={230} r={18} spot="shoulder" onTouch={onTouch} label="肩" />
    </>
  );
}

/* ---------- 部屋装飾 ---------- */

function RoomDecor({ pose, color }: { pose: Pose; color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* 窓 */}
      <div className="absolute top-10 right-10 w-32 h-24 border-4 border-stone-600 bg-gradient-to-b from-sky-300/20 to-amber-300/20 rounded">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px">
          <div className="border border-stone-700" />
          <div className="border border-stone-700" />
          <div className="border border-stone-700" />
          <div className="border border-stone-700" />
        </div>
      </div>
      {/* カーペット */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16 opacity-30"
        style={{ background: `linear-gradient(180deg, transparent, ${color})` }}
      />
      {/* ポーズ固有の小物 */}
      {pose === "reading" && (
        <div className="absolute bottom-20 left-8 text-3xl opacity-40">📚</div>
      )}
      {pose === "sleeping" && (
        <div className="absolute top-8 left-8 text-3xl opacity-50">🌙</div>
      )}
      {pose === "smiling" && (
        <div className="absolute top-12 left-12 text-2xl opacity-50">✨</div>
      )}
    </div>
  );
}

/* ---------- リアクション吹き出し ---------- */

function ReactionBubble({ text }: { text: string }) {
  // アニメーション用の簡易CSS
  return (
    <>
      <style jsx>{`
        @keyframes reactFade {
          0% { opacity: 0; transform: translateY(20px) scale(0.8); }
          15% { opacity: 1; transform: translateY(0) scale(1.05); }
          25% { transform: translateY(0) scale(1); }
          85% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .bubble {
          animation: reactFade 3s ease-out forwards;
        }
      `}</style>
      <div
        className="bubble absolute top-1/3 left-1/2 -translate-x-1/2 bg-white text-stone-900 px-5 py-3 rounded-2xl shadow-xl border-2 border-rose-300 max-w-xs text-center"
        style={{ zIndex: 10 }}
      >
        <div className="text-sm font-bold">「{text}」</div>
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-white"
        />
      </div>
    </>
  );
}
