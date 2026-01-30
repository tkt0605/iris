"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// 設定パラメータ
const CORE_PARTICLE_COUNT = 2000;
const CORE_RADIUS = 80;
const ORBIT_COUNT = 5;

// 色設定
const BASE_COLOR_CYAN = { r: 34, g: 211, b: 238 };
const BASE_COLOR_RED = { r: 248, g: 113, b: 113 };

export function SampleWithIris() {
  const [isRecording, setIsRecording] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // 音声処理用のRef
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // 1. 録音の開始・停止処理
  useEffect(() => {
    const handleAudio = async () => {
      if (isRecording) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const analyser = audioCtx.createAnalyser();
          
          analyser.fftSize = 512;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;
          dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer> ;
          sourceRef.current = source;

        } catch (error) {
          console.error("Microphone access denied:", error);
          setIsRecording(false);
        }
      } else {
        if (sourceRef.current) {
          sourceRef.current.disconnect();
          sourceRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        analyserRef.current = null;
        dataArrayRef.current = null;
      }
    };

    handleAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isRecording]);


  // 2. Canvas描画ループ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();
    window.addEventListener("resize", setSize);

    // 粒子初期化
    const coreParticles: any[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < CORE_PARTICLE_COUNT; i++) {
      const y = 1 - (i / (CORE_PARTICLE_COUNT - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      coreParticles.push({
        basePos: { x: x * CORE_RADIUS, y: y * CORE_RADIUS, z: z * CORE_RADIUS },
      });
    }

    // 軌道初期化
    const orbits: any[] = [];
    for (let i = 0; i < ORBIT_COUNT; i++) {
      orbits.push({
        radius: CORE_RADIUS * (1.5 + i * 0.3),
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() * 0.02 + 0.01) * (Math.random() < 0.5 ? 1 : -1),
        tiltX: Math.random() * Math.PI,
        tiltY: Math.random() * Math.PI,
        electronAngle: Math.random() * Math.PI * 2,
      });
    }

    // --- 描画ループ ---
    let time = 0;
    const render = () => {
      time++; // 時間経過
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // 音声データの取得
      let audioLevel = 0;
      if (isRecording && analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current as Uint8Array<ArrayBuffer>);
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i];
        }
        const average = sum / dataArrayRef.current.length;
        audioLevel = average / 128.0; 
      }

      // 配色：録音中は赤、待機中はシアン
      const currentColor = isRecording ? BASE_COLOR_RED : BASE_COLOR_CYAN;
      const colorStr = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;

      const project = (x: number, y: number, z: number) => {
        const scale = 300 / (300 + z);
        return {
          x: centerX + x * scale,
          y: centerY + y * scale,
          scale,
        };
      };

      // ★★★ A. 中心核の描画 ★★★
      ctx.fillStyle = colorStr;
      
      // 回転速度の制御
      // 録音中(isRecording)は 0 (停止)、待機中は 0.002 (ゆっくり回転)
      const rotSpeed = isRecording ? 0 : 0.002;
      
      // 現在の回転角度（録音中は時間が止まったように見せるため time を進めないアプローチも可ですが、
      // ここでは回転速度0にするだけで「その場でピタッと止まる」表現にしています）
      const currentRotation = time * rotSpeed;

      coreParticles.forEach((p) => {
        // 振動係数: 録音中 かつ audioLevelがある場合のみ揺らす
        const vibration = isRecording 
          ? (Math.random() - 0.5) * (audioLevel * 40) // 40は揺れ幅係数
          : 0;
        
        // 膨張係数: 音が大きいと球体が膨らむ
        const expansion = isRecording 
          ? 1.0 + (audioLevel * 0.4) 
          : 1.0;

        // 基本位置に膨張と振動を適用
        const px = p.basePos.x * expansion + vibration;
        const py = p.basePos.y * expansion + vibration;
        const pz = p.basePos.z * expansion + vibration;

        // 回転計算
        // 待機中は time * 0.002 で回転、録音中は rotSpeedが0になるので回転角が増えない（停止）
        // ※厳密に「その場で急停止」させるには回転角のstate管理が必要ですが、
        // 簡易的に速度0にすると「初期位置に戻って止まる」か「今の角度でゆっくりになる」挙動になります。
        // ここでは「常に回転し続けているが、録音時は回転成分を加算しない」動きになります。
        
        // 回転行列 (Y軸回転)
        const rotatedX = px * Math.cos(currentRotation) - pz * Math.sin(currentRotation);
        const rotatedZ = px * Math.sin(currentRotation) + pz * Math.cos(currentRotation);

        const proj = project(rotatedX, py, rotatedZ);
        const alpha = Math.max(0.1, proj.scale * 0.8);
        
        ctx.globalAlpha = alpha;
        
        // 粒子サイズ: 音量に合わせて少し大きくなる
        const size = isRecording 
          ? (1 * proj.scale) + (audioLevel * 2.0 * proj.scale) 
          : 1 * proj.scale;
        
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // ★★★ B. 軌道と電子の描画 ★★★
      orbits.forEach((o) => {
        // 電子の回転: 録音中は速くする（球体は止まるが電子は解析のために動いている演出）
        const currentSpeed = isRecording 
            ? o.speed + (o.speed * audioLevel * 2) 
            : o.speed;
        
        // 軌道の広がり
        const currentRadius = isRecording 
            ? o.radius + (audioLevel * 15) 
            : o.radius;

        o.angle += currentSpeed;
        o.electronAngle += currentSpeed * 1.5;

        ctx.beginPath();
        const opacity = isRecording ? 0.2 + (audioLevel * 0.3) : 0.2;
        ctx.strokeStyle = `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${opacity})`;
        ctx.lineWidth = isRecording ? 1 + audioLevel : 0.8;

        for (let j = 0; j <= 64; j++) {
          const a = (j / 64) * Math.PI * 2;
          let ox = Math.cos(a) * currentRadius;
          let oz = Math.sin(a) * currentRadius;
          let oy = 0;

          let tx = ox;
          let ty = oy * Math.cos(o.tiltX) - oz * Math.sin(o.tiltX);
          let tz = oy * Math.sin(o.tiltX) + oz * Math.cos(o.tiltX);
          ox = tx; oy = ty; oz = tz;

          tx = ox * Math.cos(o.tiltY) + oz * Math.sin(o.tiltY);
          ty = oy;
          tz = -ox * Math.sin(o.tiltY) + oz * Math.cos(o.tiltY);
          ox = tx; oy = ty; oz = tz;

          const proj = project(ox, oy, oz);
          if (j === 0) ctx.moveTo(proj.x, proj.y);
          else ctx.lineTo(proj.x, proj.y);
        }
        ctx.stroke();

        // 電子
        let ex = Math.cos(o.electronAngle) * currentRadius;
        let ez = Math.sin(o.electronAngle) * currentRadius;
        let ey = 0;

        let tx = ex;
        let ty = ey * Math.cos(o.tiltX) - ez * Math.sin(o.tiltX);
        let tz = ey * Math.sin(o.tiltX) + ez * Math.cos(o.tiltX);
        ex = tx; ey = ty; ez = tz;

        tx = ex * Math.cos(o.tiltY) + ez * Math.sin(o.tiltY);
        ty = ey;
        tz = -ex * Math.sin(o.tiltY) + ez * Math.cos(o.tiltY);
        ex = tx; ey = ty; ez = tz;

        const eProj = project(ex, ey, ez);

        ctx.fillStyle = colorStr;
        ctx.beginPath();
        ctx.arc(eProj.x, eProj.y, 4 * eProj.scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        const gradient = ctx.createRadialGradient(
          eProj.x, eProj.y, 0, eProj.x, eProj.y, 15 * eProj.scale
        );
        gradient.addColorStop(0, `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 0.8)`);
        gradient.addColorStop(1, `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 0)`);
        ctx.fillStyle = gradient;
        ctx.arc(eProj.x, eProj.y, 15 * eProj.scale, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener("resize", setSize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isRecording]); 

  return (
    <div className="relative flex h-screen w-full items-center justify-center bg-black overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 block" />

      <div className="relative z-10 flex flex-col items-center gap-8 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={isRecording ? "rec" : "idle"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`text-xl tracking-[0.3em] font-bold ${
              isRecording ? "text-red-400" : "text-cyan-400"
            }`}
          >
            {isRecording ? "● LISTENING" : "SYSTEM IDLE"}
          </motion.div>
        </AnimatePresence>

        <button
          onClick={() => setIsRecording(!isRecording)}
          className={`pointer-events-auto rounded-full border-2 px-10 py-4 text-sm tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm ${
            isRecording
              ? "border-red-500 bg-red-950/30 text-red-300 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
              : "border-cyan-500 bg-cyan-950/30 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:bg-cyan-900/50"
          }`}
        >
          {isRecording ? "STOP TRANSMISSION" : "INITIALIZE LINK"}
        </button>
      </div>
    </div>
  );
}