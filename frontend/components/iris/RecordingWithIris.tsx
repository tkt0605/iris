"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useTime, useTransform, useMotionValue, MotionValue, useSpring } from "framer-motion";

// 設定
const SPHERE_RADIUS = 80;
const PARTICLE_SIZE = 4;
const PARTICLE_COUNT = 1500; // 粒子数（多すぎると音声同期でラグるため調整）
const SENSITIVITY = 2.0; // 音声に対する反応の良さ

interface ParticleData {
  id: number;
  vx: number; // 単位ベクトルX (中心から外向きの方向)
  vy: number; // 単位ベクトルY
  vz: number; // 単位ベクトルZ
  baseX: number; // 基本位置X
  baseY: number; // 基本位置Y
  baseZ: number; // 基本位置Z
}

export function RecordingWithIris() {
  const [isRecording, setIsRecording] = useState(false);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  
  // 音声レベルを管理するMotionValue (0.0 〜 255.0)
  const audioLevel = useMotionValue(0);
  // スムーズな動きにするためにSpringをかませる
  const smoothAudioLevel = useSpring(audioLevel, { stiffness: 300, damping: 20 });

  const analyzerRef = useRef<AnalyserNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // 1. 初期化：粒子の生成（静止した球体）
  useEffect(() => {
    const tempParticles: ParticleData[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const y = 1 - (i / (PARTICLE_COUNT - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      // 単位球上の座標（半径1）= 方向ベクトル
      const vx = Math.cos(theta) * radiusAtY;
      const vy = y;
      const vz = Math.sin(theta) * radiusAtY;

      // 実際の半径を掛ける
      // 少しランダムな厚みを持たせる
      const r = SPHERE_RADIUS + (Math.random() - 0.5) * 10;

      tempParticles.push({
        id: i,
        vx, vy, vz, // 振動する方向（法線ベクトル）
        baseX: vx * r,
        baseY: vy * r,
        baseZ: vz * r,
      });
    }
    setParticles(tempParticles);

    // クリーンアップ
    return () => {
      stopRecording();
    };
  }, []);

  // 2. 録音開始処理
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyzer = audioCtx.createAnalyser();
      
      analyzer.fftSize = 256; // データの細かさ
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyzer);

      analyzerRef.current = analyzer;
      audioContextRef.current = audioCtx;
      setIsRecording(true);

      // アニメーションループ開始
      updateAudioData();
    } catch (err) {
      console.error("マイクへのアクセスが拒否されました", err);
      alert("マイクの使用を許可してください");
    }
  };

  // 3. 録音停止処理
  const stopRecording = () => {
    setIsRecording(false);
    audioLevel.set(0); // レベルリセット

    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (audioContextRef.current) {
        audioContextRef.current.close();
    }
    analyzerRef.current = null;
  };

  // 4. マイクデータを毎フレーム取得してMotionValueに流し込む
  const updateAudioData = () => {
    if (!analyzerRef.current) return;

    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteFrequencyData(dataArray);

    // 全周波数の平均音量を取得
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;

    // MotionValueを更新（これで全粒子が反応する）
    audioLevel.set(average);

    rafIdRef.current = requestAnimationFrame(updateAudioData);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex  items-center justify-center overflow-hidden">

      {/* 🔹 コンテンツ基準コンテナ */}
      <div className="relative flex flex-col items-center justify-center">

        {/* 🔹 球体本体 */}
        <div className="relative flex w-60 h-60 items-center justify-center overflow-visible">
          
          {/* 粒子描画 */}
          <div className="relative h-0 w-0 perspective-1000 pointer-events-none">
            {particles.map((p) => (
              <AudioParticle
                key={p.id}
                data={p}
                audioLevel={smoothAudioLevel}
                isRecording={isRecording}
              />
            ))}
          </div>

          {/* ヒットボックス */}
          <motion.div
            onClick={toggleRecording}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="absolute z-10 cursor-pointer rounded-full hover:bg-white/5 transition-colors duration-500"
            style={{
              width: SPHERE_RADIUS * 2.8,
              height: SPHERE_RADIUS * 2.8,
            }}
          />
        </div>

        {/* 🔹 ステータス表示（親基準・absolute） */}
        <div className="absolute -bottom-10 text-[10px] tracking-[0.3em] text-white/20 pointer-events-none select-none">
          {isRecording ? "LISTENING..." : "TAP CORE TO SPEAK"}
        </div>

      </div>
    </div>
  );
}

// 個別の粒子コンポーネント
const AudioParticle = ({ 
  data, 
  audioLevel,
  isRecording
}: { 
  data: ParticleData; 
  audioLevel: MotionValue<number>;
  isRecording: boolean;
}) => {
  
  // 位置の計算
  // 音量が大きいほど、中心から外側へ (vx, vy, vz) 方向に移動する
  const x = useTransform(audioLevel, (level) => {
    // levelは 0〜255
    const displacement = isRecording ? (level * SENSITIVITY * Math.random()) : 0;
    return data.baseX + data.vx * displacement;
  });

  const y = useTransform(audioLevel, (level) => {
    const displacement = isRecording ? (level * SENSITIVITY * Math.random()) : 0;
    return data.baseY + data.vy * displacement;
  });

  const z = useTransform(audioLevel, (level) => {
    const displacement = isRecording ? (level * SENSITIVITY * Math.random()) : 0;
    return data.baseZ + data.vz * displacement;
  });

  // 見た目の変化
  // 音が大きいときは粒子が大きく、明るくなる
  const scale = useTransform(audioLevel, (level) => {
     // 基本サイズ + 音量に応じた拡大
     return isRecording ? 1 + (level / 100) : 1;
  });

  const opacity = useTransform(audioLevel, (level) => {
      // 普段は薄く、音がなると濃くなる
      return isRecording ? 0.3 + (level / 200) : 0.3;
  });

  // 色の変化（録音中は赤みを帯びる、普段はシアン）
  const color = isRecording ? "#f87171" : "#22d3ee"; // red-400 : cyan-400

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        x, y, 
        // zIndexのような重なり順序制御は重いので、Z座標に応じたスケール調整で擬似3D
        // ここでは簡易的にscaleとopacityのみで制御
        width: PARTICLE_SIZE,
        height: PARTICLE_SIZE,
        scale,
        opacity,
        backgroundColor: color,
        boxShadow: isRecording ? `0 0 ${scale}px ${color}` : "none",
      }}
    />
  );
};