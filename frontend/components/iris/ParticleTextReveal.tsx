"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, useTime, useTransform, useSpring, MotionValue, SwitchLayoutGroupContext } from "framer-motion";
import { Swanky_and_Moo_Moo } from "next/font/google";

// 設定
const SPHERE_RADIUS = 90; // 球体の半径
const PARTICLE_SIZE = 4;
const PARTICLE_GAP = 5; // 粒子の密度（小さいほど高負荷・高精細）
const TEXT = "HELLO WORLD";
const ROTATION_SPEED = 0.0005; // 回転速度

interface ParticleData {
  id: number;
  textX: number;
  textY: number;
  sphereX: number;
  sphereY: number;
  sphereZ: number;
}

export function ParticleTextReveal() {
  const [isTextMode, setIsTextMode] = useState(false);
  const [particles, setParticles] = useState<ParticleData[]>([]);

  // フレームごとの時間を取得（すべての粒子で共有）
  const time = useTime();

  // モード切り替えのアニメーション値（0: 球体, 1: テキスト）
  // useSpringを使うことで、数値の変化に物理的な慣性を持たせる
  const mode = useSpring(0, { stiffness: 40, damping: 15 });

  useEffect(() => {
    // isTextModeが変わったら、springの目標値を更新
    mode.set(isTextMode ? 1 : 0);
  }, [isTextMode, mode]);

  useEffect(() => {
    // 1. Canvasでテキスト座標を生成
    const width = window.innerWidth;
    const height = window.innerHeight;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    if (!ctx) return;
    if (width > 768) {
      // PC
      const fontSize = 100;
      ctx.font = `900 ${fontSize}px sans-serif`;
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(TEXT, width / 2, height / 2);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const tempParticles: ParticleData[] = [];

      // スキャン
      for (let y = 0; y < height; y += PARTICLE_GAP) {
        for (let x = 0; x < width; x += PARTICLE_GAP) {
          const index = (y * width + x) * 4;
          if (data[index + 3] > 128) {
            tempParticles.push({
              id: index,
              textX: x - width / 2,
              textY: y - height / 2,
              sphereX: 0,
              sphereY: 0,
              sphereZ: 0,
            });
          }
        }
      }

      // 2. 球体座標を計算（フィボナッチ球面）
      const count = tempParticles.length;
      const phi = Math.PI * (3 - Math.sqrt(5));

      for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = phi * i;

        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;

        // 半径に少しランダム性を持たせて雲のような質感にする
        const r = SPHERE_RADIUS + (Math.random() - 0.5) * 10;

        tempParticles[i].sphereX = x * r;
        tempParticles[i].sphereY = y * r;
        tempParticles[i].sphereZ = z * r;
      }

      setParticles(tempParticles);
    } else if (width <= 768) {
      // SmartPhone
      const fontSize = Math.min(width / 5, 140);
      ctx.font = `900 ${fontSize}px sans-serif`;
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(TEXT, width / 2, height / 2);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const tempParticles: ParticleData[] = [];

      // スキャン
      for (let y = 0; y < height; y += PARTICLE_GAP) {
        for (let x = 0; x < width; x += PARTICLE_GAP) {
          const index = (y * width + x) * 4;
          if (data[index + 3] > 128) {
            tempParticles.push({
              id: index,
              textX: x - width / 2,
              textY: y - height / 2,
              sphereX: 0,
              sphereY: 0,
              sphereZ: 0,
            });
          }
        }
      }

      // 2. 球体座標を計算（フィボナッチ球面）
      const count = tempParticles.length;
      const phi = Math.PI * (3 - Math.sqrt(5));

      for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);
        const theta = phi * i;

        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;

        // 半径に少しランダム性を持たせて雲のような質感にする
        const r = SPHERE_RADIUS + (Math.random() - 0.5) * 10;

        tempParticles[i].sphereX = x * r;
        tempParticles[i].sphereY = y * r;
        tempParticles[i].sphereZ = z * r;
      }

      setParticles(tempParticles);
    };
  }, []);
  const Switch = () => {
    setIsTextMode((prev) => !prev);
  };
  return (
    // <div className="relative flex h-screen w-full items-center justify-center overflow-hidden  perspective-1000">
    <div className={`
      relative w-full bg-white translation-all  duration-1000 ${
        isTextMode ? "min-h-[200vh]" : "h-screen overflow-hidden"
      }`}
    >
      {/* 粒子コンテナ */}
      {/* <div className="relative h-0 w-0">
        {particles.map((p) => (
          <RotatingParticle
            key={p.id}
            data={p}
            time={time}
            mode={mode}
          />
        ))}
      </div> */}
      <div className="sticky top-0 left-0 flex h-screen w-full items-center justify-center overflow-hidden perspective-1000 z-10 pointer-events-none">
        <div className="relative h-0 w-0">
          {particles.map((p) => (
            <RotatingParticle
              key={p.id}
              data={p}
              time={time}
              mode={mode}
            />
          ))}
        </div>
      </div>

      {/* クリック判定用（球体時のみ） */}
      {/* {!isTextMode ?
        <div
          onClick={Switch}
          className="absolute z-50 cursor-pointer rounded-full"
          style={{
            width: SPHERE_RADIUS * 2.2,
            height: SPHERE_RADIUS * 2.2,
          }}
        />
        :
        <div
          onClick={() => setIsTextMode(false)}
          className="absolute z-50 cursor-pointer rounded-full"
          style={{
            width: SPHERE_RADIUS * 2.2,
            height: SPHERE_RADIUS * 2.2,
          }}
        />
      } */}

      <div
        onClick={Switch}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 cursor-pointer rounded-full transition-all duration-500 ${isTextMode ? 'pointer-events-none opacity-0' : ''}`}
        style={{
          width: SPHERE_RADIUS * 2.2,
          height: SPHERE_RADIUS * 2.2,
        }}
      />
      {isTextMode && (
        <motion.div
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: 10 }}
        transition={{ delay: 1.5, duration: 1, repeat: Infinity, repeatType: "reverse" }}
        className="fixed bottom-10 left-0 w-full text-center text-sm font-bold text-black z-40"
      >
        SCROLL DOWN ↓
      </motion.div>
      )}
      {isTextMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="relative z-20 w-full bg-white px-6 pb-20 pt-20"
          style={{ marginTop: "10vh" }} // 少し被せるか、100vhで完全に分けるか調整
        >
          <div className="mx-auto max-w-3xl space-y-12">
            
            {/* イントロダクション */}
            <section className="space-y-6 text-center">
              <h2 className="text-4xl font-bold tracking-tighter text-black md:text-6xl">
                I/R/I/S について
              </h2>
              <p className="text-lg leading-relaxed text-gray-600">
                Irisは、視覚と情報の境界を探求するプロジェクトです。<br />
                粒子が集まり意味を成すその瞬間、デジタル空間に新たな「瞳」が開かれます。
              </p>
            </section>

            {/* 詳細説明ブロック */}
            <section className="grid gap-8 md:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-8 shadow-sm">
                <h3 className="mb-4 text-xl font-bold">コンセプト</h3>
                <p className="text-sm text-gray-500">
                  物理演算を用いたパーティクルシステムにより、静的な情報（テキスト）と動的な物質（球体）の間の可逆性を表現しました。すべての粒子は独立した座標を持ちながら、全体として一つの秩序を形成しています。
                </p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-8 shadow-sm">
                <h3 className="mb-4 text-xl font-bold">技術</h3>
                <p className="text-sm text-gray-500">
                  Next.js, Framer Motion, そしてHTML Canvas APIを組み合わせて構築されています。Reactのレンダリングサイクルをバイパスし、GPUアクセラレーションを最大限に活用することで、数千個の粒子のリアルタイム制御を実現しました。
                </p>
              </div>
            </section>

            {/* フッター的なもの */}
            <div className="text-center pt-10">
              <button 
                onClick={Switch} 
                className="rounded-full border border-black px-8 py-3 text-sm transition-colors hover:bg-black hover:text-white"
              >
                閉じる
              </button>
            </div>

          </div>
        </motion.div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 個別の粒子コンポーネント（MotionValue駆動）
// -------------------------------------------------------------
const RotatingParticle = ({
  data,
  time,
  mode
}: {
  data: ParticleData;
  time: MotionValue<number>;
  mode: MotionValue<number>;
}) => {
  // ■ 1. 回転計算 (Rotation Logic)
  // 時間経過に基づいて回転角度を生成
  // y軸回転のみ（地球のような自転）
  const rotateX = useTransform(time, (t) => {
    const angle = t * ROTATION_SPEED + data.id * 0.0001; // idを使って初期位置をばらけさせる効果も少し追加
    // 回転行列 (Rotation Matrix for Y-axis)
    // newX = x * cos(θ) + z * sin(θ)
    return data.sphereX * Math.cos(angle) + data.sphereZ * Math.sin(angle);
  });

  const rotateZ = useTransform(time, (t) => {
    const angle = t * ROTATION_SPEED + data.id * 0.0001;
    // newZ = -x * sin(θ) + z * cos(θ)
    return -data.sphereX * Math.sin(angle) + data.sphereZ * Math.cos(angle);
  });

  // ■ 2. 座標のブレンド (Blending Logic)
  // modeの値 (0=Sphere, 1=Text) に応じて、回転座標とテキスト座標を混ぜる

  // 最終的なX座標
  const x = useTransform([rotateX, mode], ([rx, m]: number[]) => {
    // lerp (Linear Interpolation): (1-m)*Sphere + m*Text
    return (1 - m) * rx + m * data.textX;
  });

  // 最終的なY座標（球体Yは回転しないのでそのまま、テキストYへ遷移）
  const y = useTransform(mode, (m) => {
    return (1 - m) * data.sphereY + m * data.textY;
  });

  // 最終的なZ座標（テキストモード時はZ=0にする）
  const z = useTransform([rotateZ, mode], ([rz, m]: number[]) => {
    return (1 - m) * rz + m * 0;
  });

  // ■ 3. ビジュアル効果 (Visual Effects)
  // Z座標（奥行き）に基づいてスケールと透明度を変更（擬似3D）
  const scale = useTransform(z, (currentZ) => {
    // 手前(Z>0)は大きく、奥(Z<0)は小さく
    const depthScale = (currentZ + SPHERE_RADIUS * 2) / (SPHERE_RADIUS * 2.5);
    // テキストモードのときはサイズを均一(1)に近づける
    const modeValue = mode.get();
    return (1 - modeValue) * depthScale + modeValue * 1;
  });

  const opacity = useTransform(z, (currentZ) => {
    // 奥に行くと暗くなる
    const depthOpacity = Math.max(0.1, (currentZ + SPHERE_RADIUS) / (SPHERE_RADIUS * 2));
    // テキストモードのときは不透明(1)にする
    const modeValue = mode.get();
    return (1 - modeValue) * depthOpacity + modeValue * 1;
  });

  // 色の変化（青 -> 白）
  const backgroundColor = useTransform(mode, [0, 1], ["#22d3ee", "#000000"]);

  return (

    <div>
      <motion.div
        className="absolute rounded-full"
        style={{
          x,
          y,
          scale,
          opacity,
          backgroundColor,
          width: PARTICLE_SIZE,
          height: PARTICLE_SIZE,
          // zIndexを制御しないと手前の粒子が奥の粒子の上に描画されない場合があるが、
          // 数千個のDOMでzIndexを動的に変えると重くなるため、
          // 今回は opacity と scale で「奥にある感」をごまかすアプローチを採用。
        }}
      />
    </div>
  );
};