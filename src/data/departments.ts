// かんぱに新作モック v1.5 - 部署データ
// 「襲来対策」じゃなく「生活維持×経営」の6部署
// 戦闘系（傭兵派遣部）はモックv1.5では表示しない方針

import type { Department } from "./characters";

export interface DepartmentInfo {
  id: Department;
  name: string;
  category: "life" | "management";
  /** 社屋画面上のグリッド位置 */
  grid: { col: number; row: number };
  /** プレースホルダーの建物色 */
  color: string;
  emoji: string;
  description: string;
}

export const DEPARTMENTS: DepartmentInfo[] = [
  // 生活維持系
  {
    id: "dining",
    name: "食堂",
    category: "life",
    grid: { col: 0, row: 0 },
    color: "#d98e6b",
    emoji: "🍱",
    description: "社員の食事・交流の場",
  },
  {
    id: "infirmary",
    name: "医務室",
    category: "life",
    grid: { col: 1, row: 0 },
    color: "#e8a1a1",
    emoji: "💊",
    description: "治療・コンディション管理",
  },
  {
    id: "dormitory",
    name: "寮",
    category: "life",
    grid: { col: 2, row: 0 },
    color: "#b4c4e0",
    emoji: "🛋️",
    description: "休息・私生活の場",
  },
  // 経営系
  {
    id: "hr",
    name: "人事部",
    category: "management",
    grid: { col: 0, row: 1 },
    color: "#9fc9a3",
    emoji: "📄",
    description: "履歴書ガチャ・採用業務",
  },
  {
    id: "accounting",
    name: "経理部",
    category: "management",
    grid: { col: 1, row: 1 },
    color: "#e8d47a",
    emoji: "💰",
    description: "資金管理・闇金かんぱに！",
  },
  {
    id: "pr",
    name: "広報部",
    category: "management",
    grid: { col: 2, row: 1 },
    color: "#c8a8e0",
    emoji: "📢",
    description: "市場・外部取引",
  },
];

export function getDepartment(id: Department): DepartmentInfo | undefined {
  return DEPARTMENTS.find((d) => d.id === id);
}
