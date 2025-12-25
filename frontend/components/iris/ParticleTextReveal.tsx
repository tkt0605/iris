"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { motion, useTime, useTransform, useSpring, MotionValue } from "framer-motion";

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

export  function ParticleTextReveal() {
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

    const fontSize = Math.min(width / 8, 140);
    ctx.font = `900 ${fontSize}px sans-serif`;
    ctx.fillStyle = "white";
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
  }, []);

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black perspective-1000">
      
      {/* 粒子コンテナ */}
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

      {/* クリック判定用（球体時のみ） */}
      {!isTextMode && (
        <div 
          onClick={() => setIsTextMode(true)}
          className="absolute z-50 cursor-pointer rounded-full"
          style={{
            width: SPHERE_RADIUS * 2.2,
            height: SPHERE_RADIUS * 2.2,
          }}
        />
      )}
      {isTextMode && (
                <div 
                onClick={() => setIsTextMode(false)}
                className="absolute z-50 cursor-pointer rounded-full"
                style={{
                  width: SPHERE_RADIUS * 2.2,
                  height: SPHERE_RADIUS * 2.2,
                }}
              />
      )}

      {/* リセットボタン */}
      {/* {isTextMode && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          onClick={() => setIsTextMode(false)}
          className="fixed bottom-10 z-50 rounded border border-cyan-500/30 bg-black/50 px-6 py-2 text-cyan-400 backdrop-blur-md hover:bg-cyan-900/30"
        >
          Return to Orbit
        </motion.button>
      )} */}
      
      {!isTextMode && particles.length > 0 && (
         <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         className="fixed bottom-20 text-xs text-white/30 tracking-widest pointer-events-none"
       >
         CLICK THE PLANET
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
  const backgroundColor = useTransform(mode, [0, 1], ["#22d3ee", "#ffffff"]);

  return (
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
  );
};