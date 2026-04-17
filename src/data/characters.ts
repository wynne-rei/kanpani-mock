// かんぱに新作モック v1.5 - キャラクターデータ
// 実キャラ画像は権利確認後に差し替え。現在は仮色＋名前プレースホルダー。

export type Job = "sword" | "axe" | "bow" | "magic" | "priest";
export type Department =
  | "dining"
  | "infirmary"
  | "dormitory"
  | "hr"
  | "accounting"
  | "pr";

export interface Character {
  id: string;
  name: string;
  job: Job;
  title: string;
  /** プレースホルダー用の色（Tailwindクラス互換の16進） */
  color: string;
  /** 実画像パス（あれば）。無い場合はSVGプレースホルダーで描画 */
  image?: string;
  department: Department;
  greeting: {
    morning: string;
    noon: string;
    evening: string;
    night: string;
  };
  aiPersonality: "aggressive" | "tactical" | "defensive" | "support";
  skillName: string;
}

export const CHARACTERS: Character[] = [
  {
    id: "monique",
    name: "モニク",
    job: "sword",
    title: "聖装モニク",
    color: "#d4c5f0", // lavender（実画像の髪色基調）
    image: "characters/monique.png",
    department: "hr",
    greeting: {
      morning: "社長、おはようございます。今日もよろしくお願いします",
      noon: "お疲れ様です。お食事はもうお済みですか？",
      evening: "本日の業務、お疲れ様でした",
      night: "社長、そろそろお休みになったほうが…",
    },
    aiPersonality: "tactical",
    skillName: "聖剣・ルミナス",
  },
  {
    id: "rose",
    name: "ローズ",
    job: "sword",
    title: "剣聖ローズ",
    color: "#e84a6f", // rose red
    department: "dining",
    greeting: {
      morning: "おはよ社長！今日も一緒に稼ごうぜ！",
      noon: "社長〜、さぼってたりしない？",
      evening: "今日のダンジョン、あたしが一番斬ったからね！",
      night: "あたしまだ戦えるよ、社長？",
    },
    aiPersonality: "aggressive",
    skillName: "剣聖連撃",
  },
  {
    id: "siegrit",
    name: "ジークリット",
    job: "axe",
    title: "竜公",
    color: "#9a85d6", // purple（実画像の髪色基調）
    image: "characters/siegrit.png",
    department: "dormitory",
    greeting: {
      morning: "社長、おはよう。本日の任務を確認した",
      noon: "休息も職務のうちだ。社長も休むといい",
      evening: "社長、本日の成果を報告する",
      night: "夜更かしは健康に障る。だが、社長の判断を尊重しよう",
    },
    aiPersonality: "defensive",
    skillName: "竜公の大斧",
  },
];

// モック用：プレースホルダー2人（戦闘画面で6人編成を成立させるため）
export const PLACEHOLDER_CHARACTERS: Character[] = [
  {
    id: "placeholder_bow",
    name: "（弓職）",
    job: "bow",
    title: "遠距離支援",
    color: "#6ab97a",
    department: "pr",
    greeting: { morning: "", noon: "", evening: "", night: "" },
    aiPersonality: "support",
    skillName: "精密射撃",
  },
  {
    id: "placeholder_magic",
    name: "（魔法職）",
    job: "magic",
    title: "範囲攻撃",
    color: "#5a8cd6",
    department: "accounting",
    greeting: { morning: "", noon: "", evening: "", night: "" },
    aiPersonality: "support",
    skillName: "魔導陣",
  },
  {
    id: "placeholder_priest",
    name: "（僧侶職）",
    job: "priest",
    title: "回復支援",
    color: "#e8d47a",
    department: "infirmary",
    greeting: { morning: "", noon: "", evening: "", night: "" },
    aiPersonality: "support",
    skillName: "聖なる癒し",
  },
];

// 6人編成デッキ（モック用固定）
export const DEFAULT_DECK: Character[] = [
  ...CHARACTERS,
  ...PLACEHOLDER_CHARACTERS,
];

/** 時間帯から挨拶キーを返す */
export function getGreetingKey(hour: number): keyof Character["greeting"] {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "noon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}
