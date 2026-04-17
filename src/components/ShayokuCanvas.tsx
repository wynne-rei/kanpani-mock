"use client";

import { useEffect, useRef } from "react";
import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
import { DEPARTMENTS } from "@/data/departments";
import { CHARACTERS } from "@/data/characters";

interface Props {
  festival: boolean;
}

/**
 * 社屋の俯瞰ビュー（PixiJS）
 * - 6部署の建物配置
 * - キャラのランダムウォーク
 * - 夏祭りトグル時：提灯・屋台・櫓 追加、空色変化
 */
export function ShayokuCanvas({ festival }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const festivalLayerRef = useRef<Container | null>(null);
  const skyRef = useRef<Graphics | null>(null);

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

      // レイヤー
      const bgLayer = new Container();
      const groundLayer = new Container();
      const buildingLayer = new Container();
      const charLayer = new Container();
      const festivalLayer = new Container();
      stage.addChild(bgLayer, groundLayer, buildingLayer, charLayer, festivalLayer);
      festivalLayerRef.current = festivalLayer;

      // 空
      const sky = new Graphics();
      skyRef.current = sky;
      bgLayer.addChild(sky);

      // 地面（石畳）
      const ground = new Graphics();
      groundLayer.addChild(ground);

      // 建物
      type BuildingRef = {
        container: Container;
        labelBg: Graphics;
        dept: typeof DEPARTMENTS[number];
      };
      const buildingRefs: BuildingRef[] = [];
      DEPARTMENTS.forEach((d) => {
        const c = createBuilding(d.color, d.name, d.emoji);
        buildingLayer.addChild(c.container);
        buildingRefs.push({ ...c, dept: d });
      });

      // キャラ
      type CharRef = {
        sprite: Container;
        deptId: string;
        target: { x: number; y: number } | null;
      };
      const charRefs: CharRef[] = CHARACTERS.map((ch) => {
        const s = createCharacterSprite(ch.name, ch.color);
        charLayer.addChild(s);
        return { sprite: s, deptId: ch.department, target: null };
      });

      // ルカ（人事部の扉前）
      const lukaSprite = createCharacterSprite("ルカ", "#ffe37a", 0.7);
      charLayer.addChild(lukaSprite);
      const lukaRef: CharRef = { sprite: lukaSprite, deptId: "hr", target: null };
      const allCharRefs: CharRef[] = [...charRefs, lukaRef];

      // レイアウト関数（初回 + リサイズ対応）
      const layout = () => {
        const W = app.renderer.width / (window.devicePixelRatio || 1);
        const H = app.renderer.height / (window.devicePixelRatio || 1);

        // 空
        sky.clear();
        sky.rect(0, 0, W, H).fill(0x2a2d3a);

        // 地面（俯瞰石畳の簡易表現）
        ground.clear();
        ground.rect(0, H * 0.15, W, H * 0.85).fill(0x4a4236);
        // 石畳タイル
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

        // 建物配置（2行×3列）
        const cols = 3;
        const rows = 2;
        const marginX = W * 0.08;
        const marginY = H * 0.3;
        const gapX = (W - marginX * 2) / cols;
        const gapY = (H * 0.6) / rows;

        buildingRefs.forEach((b) => {
          const col = b.dept.grid.col;
          const row = b.dept.grid.row;
          const x = marginX + gapX * col + gapX / 2;
          const y = marginY + gapY * row + gapY / 2;
          b.container.position.set(x, y);
        });

        // キャラ初期位置（担当部署の前）
        allCharRefs.forEach((ref) => {
          const b = buildingRefs.find((b) => b.dept.id === ref.deptId);
          if (b) {
            ref.sprite.position.set(
              b.container.x + (Math.random() - 0.5) * 60,
              b.container.y + 70 + Math.random() * 20
            );
          }
        });
      };

      layout();

      // リサイズ対応
      const ro = new ResizeObserver(() => {
        if (appRef.current) {
          layout();
        }
      });
      ro.observe(host);

      // キャラアニメーション（ランダムウォーク）
      app.ticker.add(() => {
        allCharRefs.forEach((ref) => {
          const ch = ref.sprite;
          const b = buildingRefs.find((b) => b.dept.id === ref.deptId);
          if (!b) return;
          const cx = b.container.x;
          const cy = b.container.y + 75;

          if (!ref.target || Math.hypot(ch.x - ref.target.x, ch.y - ref.target.y) < 2) {
            ref.target = {
              x: cx + (Math.random() - 0.5) * 60,
              y: cy + (Math.random() - 0.5) * 20,
            };
          }
          const dx = ref.target.x - ch.x;
          const dy = ref.target.y - ch.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 1) {
            const speed = 0.3;
            ch.x += (dx / dist) * speed;
            ch.y += (dy / dist) * speed;
          }
          const t = performance.now() / 300;
          ch.scale.y = 1 + Math.sin(t + ch.x) * 0.04;
        });
      });
    })();

    return () => {
      canceled = true;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, []);

  // 夏祭りトグル変化の反映
  useEffect(() => {
    const layer = festivalLayerRef.current;
    const sky = skyRef.current;
    const app = appRef.current;
    if (!layer || !sky || !app) return;

    layer.removeChildren();

    const W = app.renderer.width / (window.devicePixelRatio || 1);
    const H = app.renderer.height / (window.devicePixelRatio || 1);

    // 空の色を変える
    sky.clear();
    if (festival) {
      // 夕焼け
      sky.rect(0, 0, W, H * 0.5).fill(0xd06b4a);
      sky.rect(0, H * 0.3, W, H * 0.4).fill({ color: 0xa04a3a, alpha: 0.6 });
    } else {
      sky.rect(0, 0, W, H).fill(0x2a2d3a);
    }

    if (festival) {
      // 櫓（中央奥）
      const yagura = new Graphics();
      yagura.rect(W / 2 - 40, H * 0.18, 80, 50).fill(0x6a3a2a);
      yagura.rect(W / 2 - 50, H * 0.15, 100, 10).fill(0x3a1a0a);
      yagura.rect(W / 2 - 55, H * 0.14, 110, 4).fill(0xd03030);
      layer.addChild(yagura);

      // 提灯（ランダム配置・横に並ぶ）
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

      // 屋台（左右に2-3個）
      const stalls = [
        { x: W * 0.15, color: 0xa0423a, label: "🍡" },
        { x: W * 0.5, color: 0x3a8050, label: "🎯" },
        { x: W * 0.85, color: 0xa07a3a, label: "🍺" },
      ];
      stalls.forEach((s) => {
        const stall = new Graphics();
        stall.rect(-30, -40, 60, 40).fill(s.color);
        stall.rect(-34, -50, 68, 10).fill(0x5a2a1a);
        stall.position.set(s.x, H * 0.85);
        layer.addChild(stall);

        const style = new TextStyle({
          fontSize: 22,
        });
        const t = new Text({ text: s.label, style });
        t.anchor.set(0.5);
        t.position.set(s.x, H * 0.85 - 20);
        layer.addChild(t);
      });

      // 「夏祭り！」バナー
      const bannerBg = new Graphics();
      bannerBg
        .roundRect(W / 2 - 100, H * 0.03, 200, 36, 6)
        .fill(0xd03030)
        .stroke({ width: 2, color: 0xffe080 });
      layer.addChild(bannerBg);
      const bannerText = new Text({
        text: "🎆 夏祭り！ 🎆",
        style: new TextStyle({
          fontSize: 20,
          fill: 0xfff5a0,
          fontWeight: "bold",
        }),
      });
      bannerText.anchor.set(0.5);
      bannerText.position.set(W / 2, H * 0.03 + 18);
      layer.addChild(bannerText);
    }
  }, [festival]);

  return <div ref={hostRef} className="absolute inset-0" />;
}

/* ---------- ヘルパー ---------- */

function createBuilding(color: string, name: string, emoji: string) {
  const container = new Container();

  // 影
  const shadow = new Graphics();
  shadow.ellipse(0, 70, 75, 14).fill({ color: 0x000000, alpha: 0.4 });
  container.addChild(shadow);

  // 建物本体（俯瞰2.5D風）
  const body = new Graphics();
  body.rect(-65, -20, 130, 80).fill(colorToNumber(color));
  // 屋根（上辺を少しずらした台形で奥行き感）
  body.poly([-70, -20, -55, -40, 55, -40, 70, -20]).fill({
    color: shadeColor(color, -20),
  });
  body.stroke({ width: 1, color: 0x000000, alpha: 0.3 });
  container.addChild(body);

  // ドア
  const door = new Graphics();
  door.rect(-10, 20, 20, 40).fill(0x3a2a1a);
  container.addChild(door);

  // 窓
  const window1 = new Graphics();
  window1.rect(-50, 0, 20, 20).fill(0xfff5b0);
  window1.rect(30, 0, 20, 20).fill(0xfff5b0);
  container.addChild(window1);

  // ラベル背景
  const labelBg = new Graphics();
  labelBg
    .roundRect(-50, -62, 100, 22, 4)
    .fill({ color: 0x000000, alpha: 0.7 })
    .stroke({ width: 1, color: 0xffffff, alpha: 0.3 });
  container.addChild(labelBg);

  // ラベルテキスト
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

  // 影
  const shadow = new Graphics();
  shadow.ellipse(0, 16, 10, 3).fill({ color: 0x000000, alpha: 0.5 });
  c.addChild(shadow);

  // 体
  const body = new Graphics();
  body.circle(0, 0, 10).fill(colorToNumber(color));
  body.rect(-7, 0, 14, 14).fill(colorToNumber(color));
  c.addChild(body);

  // 頭（肌色）
  const head = new Graphics();
  head.circle(0, -5, 6).fill(0xf9e5d3);
  c.addChild(head);

  // ネームタグ
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
