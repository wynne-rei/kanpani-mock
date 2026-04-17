"use client";

import { useEffect, useRef } from "react";
import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import type { Character } from "@/data/characters";

export interface SkillAction {
  id: string;
  type: "heal" | "attack_up" | "defense_up" | "crit_up" | "ult";
  label: string;
}

interface Props {
  deck: Character[];
  skillTrigger: SkillAction | null;
  onWaveChange: (wave: number) => void;
}

/**
 * 戦闘キャンバス（PixiJS）
 * - 敵モブが外周から湧く、味方キャラは自律AIで対処
 * - キャラ個性：aggressive=前突進、tactical=中央守備、defensive=後衛タンク、support=遠距離
 * - 社長スキル発動時にカットイン演出
 */
export function BattleCanvas({ deck, skillTrigger, onWaveChange }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const stateRef = useRef<BattleState | null>(null);

  useEffect(() => {
    let canceled = false;
    const host = hostRef.current;
    if (!host) return;

    const app = new Application();

    (async () => {
      await app.init({
        resizeTo: host,
        background: 0x1a2418,
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

      // レイヤー
      const bgLayer = new Container();
      const enemyLayer = new Container();
      const allyLayer = new Container();
      const fxLayer = new Container();
      const cutinLayer = new Container();
      const uiLayer = new Container();
      app.stage.addChild(bgLayer, enemyLayer, allyLayer, fxLayer, cutinLayer, uiLayer);

      // 背景（森林の俯瞰）
      const bg = new Graphics();
      bgLayer.addChild(bg);

      // 初期化: 味方配置
      const allies: Ally[] = deck.map((ch, i) => {
        const sprite = createAllySprite(ch);
        allyLayer.addChild(sprite);
        return {
          character: ch,
          sprite,
          x: 0,
          y: 0,
          hp: 100,
          maxHp: 100,
          targetX: 0,
          targetY: 0,
          attackCooldown: 0,
          skillCooldown: 3 + i,
          index: i,
        };
      });

      // Wave情報UI（右上）
      const waveText = new Text({
        text: "",
        style: new TextStyle({
          fontSize: 14,
          fill: 0xffffff,
          stroke: { color: 0x000000, width: 3 },
        }),
      });
      waveText.anchor.set(1, 0);
      uiLayer.addChild(waveText);

      const state: BattleState = {
        allies,
        enemies: [],
        effects: [],
        cutins: [],
        wave: 1,
        waveSpawnTimer: 60,
        waveEnemiesLeft: 5,
        pendingSkill: null,
        buffs: { atk: 0, def: 0, crit: 0 },
      };
      stateRef.current = state;

      const layout = () => {
        const W = app.renderer.width / (window.devicePixelRatio || 1);
        const H = app.renderer.height / (window.devicePixelRatio || 1);

        bg.clear();
        // 森の地面（グラデ風）
        bg.rect(0, 0, W, H).fill(0x1a2418);
        bg.rect(0, H * 0.3, W, H * 0.7).fill(0x2a3628);
        bg.rect(0, H * 0.6, W, H * 0.4).fill(0x3a4838);
        // 木のシルエット（簡易）
        for (let i = 0; i < 10; i++) {
          const x = (W / 10) * i + Math.sin(i * 2) * 30;
          const y = H * 0.25 + Math.cos(i) * 10;
          bg.circle(x, y, 18).fill({ color: 0x1a2e18, alpha: 0.8 });
          bg.rect(x - 3, y, 6, 14).fill({ color: 0x3a2a18, alpha: 0.7 });
        }
        // 味方の拠点マーカー（中央）
        bg.circle(W / 2, H * 0.65, 50).stroke({
          width: 2,
          color: 0xffe080,
          alpha: 0.5,
        });

        // 味方の初期配置：中央周辺
        const cx = W / 2;
        const cy = H * 0.65;
        const radius = 40;
        state.allies.forEach((a, i) => {
          const angle = (Math.PI * 2 * i) / state.allies.length - Math.PI / 2;
          a.x = cx + Math.cos(angle) * radius;
          a.y = cy + Math.sin(angle) * radius;
          a.targetX = a.x;
          a.targetY = a.y;
          a.sprite.position.set(a.x, a.y);
        });

        waveText.position.set(W - 8, 8);
      };
      layout();

      const ro = new ResizeObserver(() => {
        if (appRef.current) layout();
      });
      ro.observe(host);

      // メインループ
      app.ticker.add((ticker) => {
        if (!stateRef.current) return;
        const s = stateRef.current;
        const W = app.renderer.width / (window.devicePixelRatio || 1);
        const H = app.renderer.height / (window.devicePixelRatio || 1);
        const dt = ticker.deltaTime;

        // 敵スポーン
        s.waveSpawnTimer -= dt;
        if (s.waveSpawnTimer <= 0 && s.waveEnemiesLeft > 0) {
          const e = spawnEnemy(W, H);
          enemyLayer.addChild(e.sprite);
          s.enemies.push(e);
          s.waveEnemiesLeft -= 1;
          s.waveSpawnTimer = 40 + Math.random() * 30;
        }

        // Wave完了判定
        if (s.waveEnemiesLeft <= 0 && s.enemies.length === 0) {
          s.wave += 1;
          if (s.wave > 10) s.wave = 1; // モックはループ
          s.waveEnemiesLeft = 5 + s.wave;
          s.waveSpawnTimer = 120;
          onWaveChange(s.wave);
          // Wave開始エフェクト
          spawnWaveBanner(fxLayer, W, H, s.wave);
        }

        // 敵の動き（中央拠点へ向かう）
        const cx = W / 2;
        const cy = H * 0.65;
        s.enemies.forEach((e) => {
          const dx = cx - e.x;
          const dy = cy - e.y;
          const dist = Math.hypot(dx, dy);
          const speed = 0.4 + Math.random() * 0.1;
          if (dist > 80) {
            e.x += (dx / dist) * speed * dt;
            e.y += (dy / dist) * speed * dt;
          }
          e.sprite.position.set(e.x, e.y);
        });

        // 味方AI
        s.allies.forEach((a) => {
          const personality = a.character.aiPersonality;

          // 最寄り敵
          let nearest: Enemy | null = null;
          let nearestDist = Infinity;
          s.enemies.forEach((e) => {
            const d = Math.hypot(e.x - a.x, e.y - a.y);
            if (d < nearestDist) {
              nearestDist = d;
              nearest = e;
            }
          });

          // 個性別ターゲット設定
          if (nearest) {
            const n: Enemy = nearest;
            if (personality === "aggressive" && nearestDist < 260) {
              // 敵陣深くまで突撃
              a.targetX = n.x;
              a.targetY = n.y;
            } else if (personality === "tactical" && nearestDist < 180) {
              // 中距離から回り込む
              a.targetX = n.x + Math.sin(performance.now() / 500) * 40;
              a.targetY = n.y + Math.cos(performance.now() / 500) * 40;
            } else if (personality === "defensive" && nearestDist < 120) {
              // 防衛：拠点付近で迎撃
              const angle = Math.atan2(n.y - cy, n.x - cx);
              a.targetX = cx + Math.cos(angle) * 60;
              a.targetY = cy + Math.sin(angle) * 60;
            } else if (personality === "support") {
              // 遠距離支援：拠点から少し後ろ
              const angle = Math.atan2(n.y - cy, n.x - cx);
              a.targetX = cx - Math.cos(angle) * 45;
              a.targetY = cy - Math.sin(angle) * 45;
            }
          } else {
            // 敵なし：初期配置に戻る
            const angle = (Math.PI * 2 * a.index) / s.allies.length - Math.PI / 2;
            a.targetX = cx + Math.cos(angle) * 40;
            a.targetY = cy + Math.sin(angle) * 40;
          }

          // 移動
          const dx = a.targetX - a.x;
          const dy = a.targetY - a.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 1) {
            const speed = 0.8 * dt;
            a.x += (dx / dist) * Math.min(dist, speed);
            a.y += (dy / dist) * Math.min(dist, speed);
          }
          a.sprite.position.set(a.x, a.y);

          // 攻撃
          a.attackCooldown -= dt;
          if (a.attackCooldown <= 0 && nearest) {
            const n: Enemy = nearest;
            const range =
              personality === "support" ? 200 : personality === "aggressive" ? 40 : 80;
            if (nearestDist < range) {
              // 攻撃エフェクト
              spawnAttackFx(fxLayer, a.x, a.y, n.x, n.y, a.character.color);
              n.hp -= 25 + s.buffs.atk * 30;
              if (n.hp <= 0) {
                enemyLayer.removeChild(n.sprite);
                s.enemies = s.enemies.filter((x) => x !== n);
              }
              a.attackCooldown = 45 + Math.random() * 20;
            }
          }

          // スキル自動発動（長めクールダウンで演出として）
          a.skillCooldown -= dt * 0.01;
          if (a.skillCooldown <= 0 && s.enemies.length > 0) {
            spawnSkillCutin(cutinLayer, app, a.character.name, a.character.skillName, a.character.color);
            // 範囲ダメージ
            s.enemies.slice(0, 3).forEach((en) => {
              en.hp -= 60;
              if (en.hp <= 0) {
                enemyLayer.removeChild(en.sprite);
                s.enemies = s.enemies.filter((x) => x !== en);
              }
            });
            a.skillCooldown = 18 + Math.random() * 10;
          }
        });

        // バフ減衰
        s.buffs.atk = Math.max(0, s.buffs.atk - 0.001 * dt);
        s.buffs.def = Math.max(0, s.buffs.def - 0.001 * dt);
        s.buffs.crit = Math.max(0, s.buffs.crit - 0.001 * dt);

        // UI更新
        const buffTag =
          s.buffs.atk > 0 ? " [攻UP]" : s.buffs.def > 0 ? " [守UP]" : s.buffs.crit > 0 ? " [必UP]" : "";
        waveText.text = `敵残り ${s.enemies.length + s.waveEnemiesLeft}${buffTag}`;

        // Pending skill処理
        if (s.pendingSkill) {
          applyCommanderSkill(s, s.pendingSkill, cutinLayer, app, fxLayer, enemyLayer);
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
  }, [deck, onWaveChange]);

  // 社長スキル発動時
  useEffect(() => {
    if (!skillTrigger || !stateRef.current) return;
    stateRef.current.pendingSkill = skillTrigger;
  }, [skillTrigger]);

  return <div ref={hostRef} className="absolute inset-0" />;
}

/* ---------- 型 ---------- */

interface Ally {
  character: Character;
  sprite: Container;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  targetX: number;
  targetY: number;
  attackCooldown: number;
  skillCooldown: number;
  index: number;
}

interface Enemy {
  sprite: Container;
  x: number;
  y: number;
  hp: number;
}

interface BattleState {
  allies: Ally[];
  enemies: Enemy[];
  effects: unknown[];
  cutins: unknown[];
  wave: number;
  waveSpawnTimer: number;
  waveEnemiesLeft: number;
  pendingSkill: SkillAction | null;
  buffs: { atk: number; def: number; crit: number };
}

/* ---------- ヘルパー ---------- */

function createAllySprite(ch: Character): Container {
  const c = new Container();

  // 影
  const shadow = new Graphics();
  shadow.ellipse(0, 18, 14, 4).fill({ color: 0x000000, alpha: 0.5 });
  c.addChild(shadow);

  // 体（プレースホルダー）
  const body = new Graphics();
  body.circle(0, 0, 12).fill(colorToNumber(ch.color));
  body.stroke({ width: 2, color: 0x000000, alpha: 0.5 });
  c.addChild(body);

  // 頭
  const head = new Graphics();
  head.circle(0, -8, 7).fill(0xf9e5d3);
  c.addChild(head);

  // ジョブアイコン
  const jobIcon = { sword: "🗡", axe: "🪓", bow: "🏹", magic: "✨", priest: "✝" }[ch.job];
  const icon = new Text({
    text: jobIcon,
    style: new TextStyle({ fontSize: 10 }),
  });
  icon.anchor.set(0.5);
  icon.position.set(0, 0);
  c.addChild(icon);

  // ネームタグ
  const name = new Text({
    text: ch.name,
    style: new TextStyle({
      fontSize: 10,
      fill: 0xffffff,
      stroke: { color: 0x000000, width: 3 },
      fontWeight: "bold",
    }),
  });
  name.anchor.set(0.5, 1);
  name.position.set(0, -16);
  c.addChild(name);

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

  return { sprite: c, x, y, hp: 50 };
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
  line.moveTo(x1, y1).lineTo(x2, y2).stroke({ width: 3, color: colorToNumber(color), alpha: 0.9 });
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

  // 背景帯
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

  // フェードアウト
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

function spawnWaveBanner(layer: Container, W: number, H: number, wave: number) {
  const c = new Container();
  const bg = new Graphics();
  bg.roundRect(W / 2 - 120, H / 2 - 30, 240, 60, 8).fill({ color: 0x000000, alpha: 0.8 });
  bg.stroke({ width: 2, color: 0xffe080 });
  c.addChild(bg);
  const style = new TextStyle({
    fontSize: 24,
    fill: 0xffe080,
    fontWeight: "bold",
  });
  const t = new Text({ text: `Wave ${wave}`, style });
  t.anchor.set(0.5);
  t.position.set(W / 2, H / 2);
  c.addChild(t);
  layer.addChild(c);

  let alpha = 1;
  let life = 0;
  const id = setInterval(() => {
    life += 1;
    if (life > 20) {
      alpha -= 0.1;
      c.alpha = alpha;
    }
    if (alpha <= 0) {
      clearInterval(id);
      layer.removeChild(c);
      c.destroy({ children: true });
    }
  }, 60);
}

function applyCommanderSkill(
  s: BattleState,
  skill: SkillAction,
  cutinLayer: Container,
  app: Application,
  fxLayer: Container,
  enemyLayer: Container
) {
  // カットイン（社長のスキル発動演出）
  spawnSkillCutin(cutinLayer, app, "社長", skill.label, "#e8b050");

  switch (skill.type) {
    case "heal":
      s.allies.forEach((a) => (a.hp = a.maxHp));
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
    case "ult": {
      // 全員必殺：全敵にダメージ
      s.enemies.forEach((e) => {
        e.hp -= 999;
      });
      s.enemies.forEach((e) => enemyLayer.removeChild(e.sprite));
      s.enemies = [];
      // 全員のスキルを即時発動っぽく演出
      s.allies.forEach((a, i) => {
        setTimeout(() => {
          spawnSkillCutin(cutinLayer, app, a.character.name, a.character.skillName, a.character.color);
        }, i * 250);
      });
      break;
    }
  }
}

function colorToNumber(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}
