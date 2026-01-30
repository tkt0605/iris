"use client";
import React, {useState, useEffect, useRef} from "react";
import { motion, AnimatePresence, scale } from "framer-motion";
import { div } from "framer-motion/client";

// 設定パラメータ
const CORE_PARTICALE_COUNT = 2000; //中心の粒子数
const CORE_RADIUS = 80; // 中心半径
const ORBIT_COUNT = 5; // 周りの起動数
//起動前の色
const BASE_COLOR_CYAN = {
  r: 34,
  g: 211,
  b: 238
};
//起動時の色
const BASE_COLOR_RED = {
  r: 248,
  g: 113,
  b: 113
};

export function RecordingWithIris(){
  const [isRecording, setIsRecording] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const RecordingStateRef = useRef(isRecording);
  //状態更新をrefに同期
  useEffect(() => {
    RecordingStateRef.current = isRecording;
  }, [isRecording]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    //キャンバスサイズの設計
    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();
    window.addEventListener('resize', setSize);

    // 粒子データの初期化
    // 1.中心核の粒子（フィボナッチ数列の応用）
    const coreParticales: any[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < CORE_PARTICALE_COUNT; i++){
      const y = 1 - (i / (CORE_PARTICALE_COUNT - 1)) * 2;
      const radiusAtY = Math.sqrt( 1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      coreParticales.push({
        x: x * CORE_RADIUS,
        y: y * CORE_RADIUS,
        z: z * CORE_RADIUS,
        basePos: { x, y, z }
      });
    }

    // 2.軌道データ
    const orbits: any[] = [];
    for (let i =0; i < ORBIT_COUNT; i++){
      orbits.push({
        radius: CORE_RADIUS * (  0.8 + i * 0.3), //半径をずらす
        angle: Math.random() * Math.PI * 2,
        speed: (Math.random() * 0.02 + 0.01) * (Math.random() < 0.5 ? 1 : -1), //ランダムな速さと方向
        tiltX: Math.random() * Math.PI, // 起動の傾き
        tiltY: Math.random() * Math.PI,
        electronAngle: Math.random() * Math.PI * 2, // 電子の位置
      })
    }

    // 描画ループ
    let time = 0;
    const render = () => {
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const recording = RecordingStateRef.current;
      
      //現在の配色の決定（線形補間は複雑になるので、単純にする）
      const currentColor = recording ? BASE_COLOR_RED : BASE_COLOR_CYAN;
      const colorStr = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;

      //3D投影の簡易ヘルパー
      const project = (x: number, y: number, z: number) => {
        const scale = 300 / (300 + z);
        return {
          x: centerX + x * scale,
          y: centerY + y * scale,
          scale
        };
      };

      // A.中心核の描画
      ctx.fillStyle = colorStr;
      coreParticales.forEach((p) => {
        // 録音中は振動ノイズの追加
        const vibration = recording ? (Math.random() - 0.5) * 15 : 0;
        // 録音中は少々、膨張する。
        const expansion =  recording ? 1.2 : 1.0;

        const px = p.basePos.x * CORE_RADIUS * expansion + vibration;
        const py = p.basePos.y * CORE_RADIUS * expansion + vibration;
        const pz = p.basePos.z * CORE_RADIUS * expansion + vibration;

        // Y軸回転（ゆっくり自転）
        const rotSpeed = recording ? 0.01 : 0.002;
        const rotatedX = px * Math.cos(time * rotSpeed) - pz * Math.sin(time * rotSpeed);
        const rotatedZ = px * Math.sin(time * rotSpeed) + pz * Math.cos(time * rotSpeed);

        const proj = project(rotatedX, py, rotatedZ);
        // 奥にある粒子は小さく
        const alpha = Math.max(0.1, proj.scale * 0.8);
        ctx.globalAlpha = alpha;
        const size = recording ? 1.5 * proj.scale : 1 * proj.scale;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
      
      // B.起動と電子の描画
      orbits.forEach((o, i) => {
        // 録音中は回転スピードアップと起動の拡大
        const currentSpeed = recording ? o.speed * 3 : o.speed;
        const currentRadius = recording ? o.radius * 1.1 : o.radius;

        o.angle += currentSpeed;
        o.electronAngle +=currentSpeed * 1.5; //電子は少々、速く
        
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, ${recording ? 0.4 : 0.2})`;
        ctx.lineWidth  = recording ? 1.5 : 0.8;

        //起動のパスを描画（疑似3D円）
        for (let j = 0; j <= 64; j++){
          const a = (j / 64) * Math.PI * 2;
          //基本的な円の構造
          let ox = Math.cos(a) * currentRadius;
          let oz = Math.sin(a) * currentRadius;
          let oy = 0;

          //軌道を傾ける回転処理
          let tx = ox;
          let ty = oy * Math.cos(o.tiltX) - oz * Math.sin(o.tiltX);
          let tz = oy * Math.sin(o.tiltX) + oz * Math.cos(o.tiltX);
          ox = tx;
          oy = ty;
          oz = tz;

          tx = ox * Math.cos(o.tiltY) + oz * Math.sin(o.tiltY);
          ty = oy;
          tz = -ox * Math.sin(o.tiltY) + oz * Math.cos(o.tiltY);

          ox = tx;
          oy = ty;
          oz = tz;

          const proj = project(ox, oy, oz);
          if (j === 0) ctx.moveTo(proj.x, proj.y);
          else ctx.lineTo(proj.x, proj.y);
        }

        ctx.stroke();

        // 電子（軌道上の発光体）を描画
        let ex = Math.cos(o.electronAngle) * currentRadius;
        let ez = Math.sin(o.electronAngle) * currentRadius;
        let ey = 0;
        // 軌道と同じ傾きを適応
        let tx = ex;
        let ty = ey * Math.cos(o.tiltX) - ez * Math.sin(o.tiltX);
        let tz = ey * Math.sin(o.tiltX) + ez * Math.cos(o.tiltX);
        ex = tx;
        ey = ty;
        ez = tz;

        tx = ex * Math.cos(o.tiltY) + ez * Math.sin(o.tiltY);
        ty = ey;
        tz = -ex * Math.sin(o.tiltY) + ez * Math.cos(o.tiltY);

        ex = tx;
        ey = ty;
        ez = tz;

        const eProj = project(ex, ey, ez);
        // 電子本体
        ctx.fillStyle = colorStr;
        ctx.beginPath();
        ctx.arc(eProj.x, eProj.y, 4 * eProj.scale, 0, Math.PI * 2);
        ctx.fill();
        //電子の輝き（グロー効果）
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
      //ループ継続
      animationRef.current = requestAnimationFrame(render); 
    };
    render();
    //クリーンアップ
    return () => {
      window.removeEventListener('resize', setSize);
      if(animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return(
    <div></div>
  );

};