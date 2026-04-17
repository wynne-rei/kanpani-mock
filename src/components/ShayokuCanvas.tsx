"use client";

import { useEffect, useRef } from "react";
import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { DEPARTMENTS } from "@/data/departments";
import { CHARACTERS, PLACEHOLDER_CHARACTERS } from "@/data/characters";

export interface SkillAction {
  id: string;
  type: "heal" | "attack_up" | "defense_up" | "crit_up" | "ult";
  label: string;
}

interface Props {
  festival: boolean;
  skillTrigger: SkillAction | null;
  onPhaseChange: (phase: Phase) => void;
  onNextRaidChange: (sec: number) => void;
}

export type Phase = "peace" | "warning" | "raid" | "victory";

/**
 * 社屋（v1.6）：日常 × 襲来 の一体型キャンバス
 * - 通常時：キャラが担当部署前でちょこちょこ動く
 * - 一定周期で敵が外周から襲来
 * - 襲来時：キャラが戦闘モード、個性AIで応戦
 * - 撃退後：日常に戻る
 * - 社長スキル5種で介入可能
 */
export function ShayokuCanvas({
  festival,
  skillTrigger,
  onPhaseChange,
  onNextRaidChange,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const festivalLayerRef = useRef<Container | null>(null);
  const skyRef = useRef<Graphics | null>(null);
  const stateRef = useRef<State | null>(null);

  useEffect(() => {
    let canceled = false;
    const host = hostRef.current;
    if (!host) return;

    const app = new Application();

    (async () => {
      await app.init({
        resizeTo: host,
        background: 0x1a1a22,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
      });
      if (canceled) {
        app.destroy(true);
        return;
      }
      host.appendChild(app.canvas);
      appRef.current = app;

      const stage = app.stage;

      const bgLayer = new Container();
      const groundLayer = new Container();
      const buildingLayer = new Container();
      const charLayer = new Container();
      const enemyLayer = new Container();
      const fxLayer = new Container();
      const cutinLayer = new Container();
      const festivalLayer = new Container();
      stage.addChild(
        bgLayer,
        groundLayer,
        buildingLayer,
        charLayer,
        enemyLayer,
        fxLayer,
        festivalLayer,
        cutinLayer
      );
      festivalLayerRef.current = festivalLayer;

      const sky = new Graphics();
      skyRef.current = sky;
      bgLayer.addChild(sky);

      const ground = new Graphics();
      groundLayer.addChild(ground);

      // 襲来警告の画面端エフェクト
      const warnBorder = new Graphics();
      fxLayer.addChild(warnBorder);
      warnBorder.alpha = 0;

      // 建物
      type BuildingRef = {
        container: Container;
        dept: typeof DEPARTMENTS[number];
      };
      const buildingRefs: BuildingRef[] = [];
      DEPARTMENTS.forEach((d) => {
        const c = createBuilding(d.color, d.name, d.emoji);
        buildingLayer.addChild(c.container);
        buildingRefs.push({ container: c.container, dept: d });
      });

      // キャラ（6人編成：3人看板＋3プレースホルダー）
      const deck = [...CHARACTERS, ...PLACEHOLDER_CHARACTERS];
      type CharRef = {
        sprite: Container;
        deptId: string;
        charColor: string;
        charName: string;
        skillName: string;
        personality: "aggressive" | "tactical" | "defensive" | "support";
        x: number;
        y: number;
        targetX: number;
        targetY: number;
        idleTarget: { x: number; y: number } | null;
        attackCd: number;
        skillCd: number;
      };
      const charRefs: CharRef[] = deck.map((ch) => {
        const sprite = createCharacterSprite(ch.name, ch.color);
        charLayer.addChild(sprite);
        return {
          sprite,
          deptId: ch.department,
          charColor: ch.color,
          charName: ch.name,
          skillName: ch.skillName,
          personality: ch.aiPersonality,
          x: 0,
          y: 0,
          targetX: 0,
          targetY: 0,
          idleTarget: null,
          attackCd: 0,
          skillCd: 6 + Math.random() * 4,
        };
      });

      // ルカ（人事部前、襲来時も動かない観戦役）
      const lukaSprite = createCharacterSprite("ルカ", "#ffe37a", 0.7);
      charLayer.addChild(lukaSprite);

      // 状態
      const state: State = {
        phase: "peace",
        phaseTimer: 25, // 最初の襲来まで25秒
        enemies: [],
        pendingSkill: null,
        buffs: { atk: 0, def: 0, crit: 0 },
        raidCount: 0,
      };
      stateRef.current = state;

      // レイアウト
      const layout = () => {
        const W = app.renderer.width / (window.devicePixelRatio || 1);
        const H = app.renderer.height / (window.devicePixelRatio || 1);

        // 空
        sky.clear();
        sky.rect(0, 0, W, H).fill(0x2a2d3a);

        // 地面
        ground.clear();
        ground.rect(0, H * 0.15, W, H * 0.85).fill(0x4a4236);
        const tileW = 80;
        const tileH = 36;
        for (let y = H * 0.15; y < H; y += tileH) {
          for (let x = -tileW; x < W; x += tileW) {
            const offset = ((y / tileH) | 0) % 2 === 0 ? 0 : tileW / 2;
            ground.rect(x + offset, y, tileW - 4, tileH - 4).fill({
              color: 0x5a5246,
              alpha: 0.6,
            });
          }
        }

        // 警告枠（赤点滅用）
        warnBorder.clear();
        warnBorder.rect(0, 0, W, H).stroke({
          width: 12,
          color: 0xff2020,
          alpha: 1,
        });

        // 建物配置
        const marginX = W * 0.12;
        const marginY = H * 0.28;
        const gapX = (W - marginX * 2) / 3;
        const gapY = (H * 0.55) / 2;
        buildingRefs.forEach((b) => {
          const col = b.dept.grid.col;
          const row = b.dept.grid.row;
          const x = marginX + gapX * col + gapX / 2;
          const y = marginY + gapY * row + gapY / 2;
          b.container.position.set(x, y);
        });

        // キャラ初期位置（担当部署前）
        charRefs.forEach((ref) => {
          const b = buildingRefs.find((b) => b.dept.id === ref.deptId);
          if (b) {
            ref.x = b.container.x + (Math.random() - 0.5) * 60;
            ref.y = b.container.y + 70 + Math.random() * 20;
            ref.targetX = ref.x;
            ref.targetY = ref.y;
            ref.sprite.position.set(ref.x, ref.y);
          }
        });
        // ルカ：人事部の前
        const hrB = buildingRefs.find((b) => b.dept.id === "hr");
        if (hrB) {
          lukaSprite.position.set(hrB.container.x - 40, hrB.container.y + 90);
        }
      };
      layout();

      const ro = new ResizeObserver(() => {
        if (appRef.current) layout();
      });
      ro.observe(host);

      // メインループ
      app.ticker.add((ticker) => {
        const s = stateRef.current;
        if (!s) return;
        const W = app.renderer.width / (window.devicePixelRatio || 1);
        const H = app.renderer.height / (window.devicePixelRatio || 1);
        const dt = ticker.deltaTime;
        const dtSec = dt / 60;

        // フェーズタイマー
        s.phaseTimer -= dtSec;

        // フェーズ遷移
        if (s.phase === "peace" && s.phaseTimer <= 0) {
          // 警戒フェーズへ
          s.phase = "warning";
          s.phaseTimer = 3; // 3秒警告
          onPhaseChange("warning");
          spawnTextBanner(cutinLayer, W, H, "⚠️ 襲来予兆！", 0xff6060, 60);
        } else if (s.phase === "warning" && s.phaseTimer <= 0) {
          // 襲来開始
          s.phase = "raid";
          s.raidCount += 1;
          const enemyCount = 6 + s.raidCount * 2;
          for (let i = 0; i < enemyCount; i++) {
            setTimeout(() => {
              if (stateRef.current?.phase !== "raid") return;
              const e = spawnEnemy(W, H);
              enemyLayer.addChild(e.sprite);
              stateRef.current.enemies.push(e);
            }, i * 250);
          }
          s.phaseTimer = 60; // 最大60秒
          onPhaseChange("raid");
          spawnTextBanner(cutinLayer, W, H, `🗡️ 襲来開始！ (第${s.raidCount}回)`, 0xff3030, 70);
        } else if (s.phase === "raid") {
          // 敵全滅 or タイマー切れで撃退判定
          if (s.enemies.length === 0 && s.phaseTimer < 57) {
            s.phase = "victory";
            s.phaseTimer = 3;
            onPhaseChange("victory");
            spawnTextBanner(cutinLayer, W, H, "🎉 撃退成功！", 0x60ff60, 70);
          }
        } else if (s.phase === "victory" && s.phaseTimer <= 0) {
          s.phase = "peace";
          s.phaseTimer = 30 + Math.random() * 10; // 次の襲来まで
          onPhaseChange("peace");
          // 残敵除去
          s.enemies.forEach((e) => enemyLayer.removeChild(e.sprite));
          s.enemies = [];
        }

        // 次の襲来カウント表示
        if (s.phase === "peace") {
          onNextRaidChange(Math.ceil(s.phaseTimer));
        } else if (s.phase === "warning") {
          onNextRaidChange(0);
        }

        // 警告点滅
        if (s.phase === "warning") {
          warnBorder.alpha = 0.4 + Math.sin(performance.now() / 100) * 0.4;
        } else if (s.phase === "raid") {
          warnBorder.alpha = 0.2 + Math.sin(performance.now() / 300) * 0.15;
        } else {
          warnBorder.alpha = Math.max(0, warnBorder.alpha - 0.02);
        }

        // 拠点中央（撃退防衛の中心）
        const cx = W / 2;
        const cy = H * 0.55;

        // 敵の動き（中央の拠点マーカーへ向かう）
        s.enemies.forEach((e) => {
          const dx = cx - e.x;
          const dy = cy - e.y;
          const dist = Math.hypot(dx, dy);
          const speed = 0.3 + Math.random() * 0.05;
          if (dist > 40) {
            e.x += (dx / dist) * speed * dt;
            e.y += (dy / dist) * speed * dt;
          }
          e.sprite.position.set(e.x, e.y);
        });

        // キャラAI
        charRefs.forEach((ref) => {
          const b = buildingRefs.find((b) => b.dept.id === ref.deptId);
          if (!b) return;
          const homeX = b.container.x;
          const homeY = b.container.y + 75;

          if (s.phase === "raid") {
            // 戦闘モード：最寄り敵を探す
            let nearest: Enemy | null = null;
            let nearestDist = Infinity;
            s.enemies.forEach((e) => {
              const d = Math.hypot(e.x - ref.x, e.y - ref.y);
              if (d < nearestDist) {
                nearestDist = d;
                nearest = e;
              }
            });

            if (nearest) {
              const n: Enemy = nearest;
              if (ref.personality === "aggressive" && nearestDist < 300) {
                ref.targetX = n.x;
                ref.targetY = n.y;
              } else if (ref.personality === "tactical" && nearestDist < 240) {
                ref.targetX = n.x + Math.sin(performance.now() / 500) * 40;
                ref.targetY = n.y + Math.cos(performance.now() / 500) * 40;
              } else if (ref.personality === "defensive" && nearestDist < 200) {
                const angle = Math.atan2(n.y - homeY, n.x - homeX);
                ref.targetX = homeX + Math.cos(angle) * 60;
                ref.targetY = homeY + Math.sin(angle) * 60;
              } else if (ref.personality === "support") {
                ref.targetX = homeX;
                ref.targetY = homeY;
              }
            } else {
              ref.targetX = homeX;
              ref.targetY = homeY;
            }

            // 攻撃
            ref.attackCd -= dt;
            if (ref.attackCd <= 0 && nearest) {
              const n: Enemy = nearest;
              const range =
                ref.personality === "support"
                  ? 220
                  : ref.personality === "aggressive"
                  ? 50
                  : 90;
              if (nearestDist < range) {
                spawnAttackFx(fxLayer, ref.x, ref.y, n.x, n.y, ref.charColor);
                n.hp -= 30 + s.buffs.atk * 40;
                if (n.hp <= 0) {
                  enemyLayer.removeChild(n.sprite);
                  s.enemies = s.enemies.filter((x) => x !== n);
                }
                ref.attackCd = 40 + Math.random() * 20;
              }
            }

            // スキル
            ref.skillCd -= dtSec;
            if (ref.skillCd <= 0 && s.enemies.length > 0) {
              spawnSkillCutin(cutinLayer, app, ref.charName, ref.skillName, ref.charColor);
              s.enemies.slice(0, 3).forEach((en) => {
                en.hp -= 80;
                if (en.hp <= 0) {
                  enemyLayer.removeChild(en.sprite);
                  s.enemies = s.enemies.filter((x) => x !== en);
                }
              });
              ref.skillCd = 15 + Math.random() * 8;
            }
          } else {
            // 日常モード：部署前をうろうろ
            if (
              !ref.idleTarget ||
              Math.hypot(ref.x - ref.idleTarget.x, ref.y - ref.idleTarget.y) < 2
            ) {
              ref.idleTarget = {
                x: homeX + (Math.random() - 0.5) * 60,
                y: homeY + (Math.random() - 0.5) * 20,
              };
            }
            ref.targetX = ref.idleTarget.x;
            ref.targetY = ref.idleTarget.y;
          }

          // 移動
          const dx = ref.targetX - ref.x;
          const dy = ref.targetY - ref.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 1) {
            const speed = (s.phase === "raid" ? 0.9 : 0.3) * dt;
            ref.x += (dx / dist) * Math.min(dist, speed);
            ref.y += (dy / dist) * Math.min(dist, speed);
          }
          ref.sprite.position.set(ref.x, ref.y);
          const t = performance.now() / 300;
          ref.sprite.scale.y = 1 + Math.sin(t + ref.x) * 0.04;
        });

        // バフ減衰
        s.buffs.atk = Math.max(0, s.buffs.atk - 0.001 * dt);
        s.buffs.def = Math.max(0, s.buffs.def - 0.001 * dt);
        s.buffs.crit = Math.max(0, s.buffs.crit - 0.001 * dt);

        // 社長スキル処理
        if (s.pendingSkill) {
          applyCommanderSkill(s, s.pendingSkill, cutinLayer, app, enemyLayer);
          s.pendingSkill = null;
        }
      });
    })();

    return () => {
      canceled = true;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
      stateRef.current = null;
    };
  }, [onPhaseChange, onNextRaidChange]);

  // 社長スキル発動
  useEffect(() => {
    if (!skillTrigger || !stateRef.current) return;
    stateRef.current.pendingSkill = skillTrigger;
  }, [skillTrigger]);

  // 夏祭り
  useEffect(() => {
    const layer = festivalLayerRef.current;
    const sky = skyRef.current;
    const app = appRef.current;
    if (!layer || !sky || !app) return;

    layer.removeChildren();

    const W = app.renderer.width / (window.devicePixelRatio || 1);
    const H = app.renderer.height / (window.devicePixelRatio || 1);

    sky.clear();
    if (festival) {
      sky.rect(0, 0, W, H * 0.5).fill(0xd06b4a);
      sky.rect(0, H * 0.3, W, H * 0.4).fill({ color: 0xa04a3a, alpha: 0.6 });
    } else {
      sky.rect(0, 0, W, H).fill(0x2a2d3a);
    }

    if (festival) {
      // 櫓
      const yagura = new Graphics();
      yagura.rect(W / 2 - 40, H * 0.18, 80, 50).fill(0x6a3a2a);
      yagura.rect(W / 2 - 50, H * 0.15, 100, 10).fill(0x3a1a0a);
      yagura.rect(W / 2 - 55, H * 0.14, 110, 4).fill(0xd03030);
      layer.addChild(yagura);

      // 提灯
      for (let i = 0; i < 14; i++) {
        const lantern = new Graphics();
        const x = (W / 15) * (i + 1);
        const y = H * 0.2 + Math.sin(i * 0.9) * 8;
        lantern.circle(0, 0, 10).fill(0xe8572a);
        lantern.rect(-2, -14, 4, 6).fill(0x3a1a0a);
        lantern.rect(-8, -2, 16, 2).fill(0xfff7a0);
        lantern.position.set(x, y);
        layer.addChild(lantern);
      }

      // 屋台
      const stalls = [
        { x: W * 0.15, color: 0xa0423a, label: "🍡" },
        { x: W * 0.5, color: 0x3a8050, label: "🎯" },
        { x: W * 0.85, color: 0xa07a3a, label: "🍺" },
      ];
      stalls.forEach((s) => {
        const stall = new Graphics();
        stall.rect(-30, -40, 60, 40).fill(s.color);
        stall.rect(-34, -50, 68, 10).fill(0x5a2a1a);
        stall.position.set(s.x, H * 0.88);
        layer.addChild(stall);

        const style = new TextStyle({ fontSize: 22 });
        const t = new Text({ text: s.label, style });
        t.anchor.set(0.5);
        t.position.set(s.x, H * 0.88 - 20);
        layer.addChild(t);
      });

      const bannerBg = new Graphics();
      bannerBg
        .roundRect(W / 2 - 100, H * 0.03, 200, 36, 6)
        .fill(0xd03030)
        .stroke({ width: 2, color: 0xffe080 });
      layer.addChild(bannerBg);
      const bannerText = new Text({
        text: "🎆 夏祭り！ 🎆",
        style: new TextStyle({ fontSize: 20, fill: 0xfff5a0, fontWeight: "bold" }),
      });
      bannerText.anchor.set(0.5);
      bannerText.position.set(W / 2, H * 0.03 + 18);
      layer.addChild(bannerText);
    }
  }, [festival]);

  return <div ref={hostRef} className="absolute inset-0" />;
}

/* ---------- 型 ---------- */

interface Enemy {
  sprite: Container;
  x: number;
  y: number;
  hp: number;
}

interface State {
  phase: Phase;
  phaseTimer: number;
  enemies: Enemy[];
  pendingSkill: SkillAction | null;
  buffs: { atk: number; def: number; crit: number };
  raidCount: number;
}

/* ---------- ヘルパー ---------- */

function createBuilding(color: string, name: string, emoji: string) {
  const container = new Container();

  const shadow = new Graphics();
  shadow.ellipse(0, 70, 75, 14).fill({ color: 0x000000, alpha: 0.4 });
  container.addChild(shadow);

  const body = new Graphics();
  body.rect(-65, -20, 130, 80).fill(colorToNumber(color));
  body.poly([-70, -20, -55, -40, 55, -40, 70, -20]).fill({
    color: shadeColor(color, -20),
  });
  body.stroke({ width: 1, color: 0x000000, alpha: 0.3 });
  container.addChild(body);

  const door = new Graphics();
  door.rect(-10, 20, 20, 40).fill(0x3a2a1a);
  container.addChild(door);

  const window1 = new Graphics();
  window1.rect(-50, 0, 20, 20).fill(0xfff5b0);
  window1.rect(30, 0, 20, 20).fill(0xfff5b0);
  container.addChild(window1);

  const labelBg = new Graphics();
  labelBg
    .roundRect(-50, -62, 100, 22, 4)
    .fill({ color: 0x000000, alpha: 0.7 })
    .stroke({ width: 1, color: 0xffffff, alpha: 0.3 });
  container.addChild(labelBg);

  const labelStyle = new TextStyle({
    fontSize: 13,
    fill: 0xffffff,
    fontWeight: "bold",
  });
  const label = new Text({
    text: `${emoji} ${name}`,
    style: labelStyle,
  });
  label.anchor.set(0.5);
  label.position.set(0, -50);
  container.addChild(label);

  return { container, labelBg };
}

function createCharacterSprite(name: string, color: string, scale = 1) {
  const c = new Container();

  const shadow = new Graphics();
  shadow.ellipse(0, 16, 10, 3).fill({ color: 0x000000, alpha: 0.5 });
  c.addChild(shadow);

  const body = new Graphics();
  body.circle(0, 0, 10).fill(colorToNumber(color));
  body.rect(-7, 0, 14, 14).fill(colorToNumber(color));
  c.addChild(body);

  const head = new Graphics();
  head.circle(0, -5, 6).fill(0xf9e5d3);
  c.addChild(head);

  const nameStyle = new TextStyle({
    fontSize: 10,
    fill: 0xffffff,
    stroke: { color: 0x000000, width: 3 },
    fontWeight: "bold",
  });
  const nameText = new Text({ text: name, style: nameStyle });
  nameText.anchor.set(0.5, 1);
  nameText.position.set(0, -14);
  c.addChild(nameText);

  c.scale.set(scale);
  return c;
}

function spawnEnemy(W: number, H: number): Enemy {
  const side = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;
  if (side === 0) {
    x = Math.random() * W;
    y = -30;
  } else if (side === 1) {
    x = W + 30;
    y = Math.random() * H;
  } else if (side === 2) {
    x = Math.random() * W;
    y = H + 30;
  } else {
    x = -30;
    y = Math.random() * H;
  }

  const c = new Container();
  const shadow = new Graphics();
  shadow.ellipse(0, 14, 10, 3).fill({ color: 0x000000, alpha: 0.5 });
  c.addChild(shadow);
  const body = new Graphics();
  body.circle(0, 0, 9).fill(0x6a3a3a);
  body.stroke({ width: 1, color: 0x000000 });
  c.addChild(body);
  const eye = new Graphics();
  eye.circle(-2, -2, 1.5).fill(0xff3030);
  eye.circle(2, -2, 1.5).fill(0xff3030);
  c.addChild(eye);
  c.position.set(x, y);

  return { sprite: c, x, y, hp: 70 };
}

function spawnAttackFx(
  layer: Container,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string
) {
  const line = new Graphics();
  line.moveTo(x1, y1).lineTo(x2, y2).stroke({
    width: 3,
    color: colorToNumber(color),
    alpha: 0.9,
  });
  layer.addChild(line);
  let alpha = 1;
  const id = setInterval(() => {
    alpha -= 0.1;
    line.alpha = alpha;
    if (alpha <= 0) {
      clearInterval(id);
      layer.removeChild(line);
      line.destroy();
    }
  }, 30);
}

function spawnSkillCutin(
  layer: Container,
  app: Application,
  charName: string,
  skillName: string,
  color: string
) {
  const W = app.renderer.width / (window.devicePixelRatio || 1);
  const H = app.renderer.height / (window.devicePixelRatio || 1);

  const container = new Container();
  layer.addChild(container);

  const bar = new Graphics();
  bar.rect(0, H / 2 - 40, W, 80).fill({ color: colorToNumber(color), alpha: 0.8 });
  bar.rect(0, H / 2 - 42, W, 4).fill(0xffffff);
  bar.rect(0, H / 2 + 38, W, 4).fill(0xffffff);
  container.addChild(bar);

  const style1 = new TextStyle({
    fontSize: 14,
    fill: 0xffe080,
    fontWeight: "bold",
    stroke: { color: 0x000000, width: 3 },
  });
  const t1 = new Text({ text: charName, style: style1 });
  t1.anchor.set(0, 0.5);
  t1.position.set(60, H / 2 - 12);
  container.addChild(t1);

  const style2 = new TextStyle({
    fontSize: 26,
    fill: 0xffffff,
    fontWeight: "bold",
    stroke: { color: 0x000000, width: 4 },
  });
  const t2 = new Text({ text: skillName, style: style2 });
  t2.anchor.set(0, 0.5);
  t2.position.set(60, H / 2 + 14);
  container.addChild(t2);

  let t = 0;
  const id = setInterval(() => {
    t += 1;
    if (t < 4) {
      container.x = (4 - t) * -20;
    } else if (t > 15) {
      container.alpha -= 0.1;
      if (container.alpha <= 0) {
        clearInterval(id);
        layer.removeChild(container);
        container.destroy({ children: true });
      }
    }
  }, 80);
}

function spawnTextBanner(
  layer: Container,
  W: number,
  H: number,
  text: string,
  color: number,
  fontSize: number
) {
  const c = new Container();
  const bg = new Graphics();
  bg.roundRect(W / 2 - 200, H / 2 - 40, 400, 80, 10).fill({ color: 0x000000, alpha: 0.85 });
  bg.stroke({ width: 3, color });
  c.addChild(bg);
  const t = new Text({
    text,
    style: new TextStyle({
      fontSize,
      fill: color,
      fontWeight: "bold",
      stroke: { color: 0x000000, width: 4 },
    }),
  });
  t.anchor.set(0.5);
  t.position.set(W / 2, H / 2);
  c.addChild(t);
  layer.addChild(c);

  let life = 0;
  const id = setInterval(() => {
    life += 1;
    if (life > 20) {
      c.alpha -= 0.08;
      if (c.alpha <= 0) {
        clearInterval(id);
        layer.removeChild(c);
        c.destroy({ children: true });
      }
    }
  }, 60);
}

function applyCommanderSkill(
  s: State,
  skill: SkillAction,
  cutinLayer: Container,
  app: Application,
  enemyLayer: Container
) {
  spawnSkillCutin(cutinLayer, app, "社長", skill.label, "#e8b050");

  switch (skill.type) {
    case "heal":
      // モックでは演出のみ（キャラHPは実装省略）
      break;
    case "attack_up":
      s.buffs.atk = 1;
      break;
    case "defense_up":
      s.buffs.def = 1;
      break;
    case "crit_up":
      s.buffs.crit = 1;
      break;
    case "ult":
      s.enemies.forEach((e) => {
        e.hp -= 999;
      });
      s.enemies.forEach((e) => enemyLayer.removeChild(e.sprite));
      s.enemies = [];
      break;
  }
}

function colorToNumber(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

function shadeColor(hex: string, percent: number): number {
  const n = colorToNumber(hex);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 0xff) + percent));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + percent));
  const b = Math.max(0, Math.min(255, (n & 0xff) + percent));
  return (r << 16) | (g << 8) | b;
}
