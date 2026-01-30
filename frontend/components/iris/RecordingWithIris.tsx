"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import { convertSegmentPathToStaticExportFilename } from "next/dist/shared/lib/segment-cache/segment-value-encoding";
// 設定パラメータ
const CORE_PARTICLE_COUNT = 2000; // 中心の粒子数
const CORE_RADIUS = 80; // 中心半径
const ORBIT_COUNT = 5; // 周りの軌道数

// 待機時の色 (Cyan)
const BASE_COLOR_CYAN = { r: 34, g: 211, b: 238 };
// 録音時の色 (Red)
const BASE_COLOR_RED = { r: 248, g: 113, b: 113 };

interface RecordingWithIrisProps {
  width?: number | string;      // 幅 (デフォルト: 600px)
  height?: number | string;     // 高さ (デフォルト: 600px)
  className?: string;           // 追加のクラス名
  fullScreen?: boolean;         // 全画面表示モード
  showUI?: boolean;             // UIオーバーレイの表示 (デフォルト: false)
  showBackground?: boolean;     // 背景グラデーションの表示 (デフォルト: false)
  rounded?: boolean;            // 角を丸くする (デフォルト: false)
  shadow?: boolean;             // シャドウ効果 (デフォルト: false)
  transparent?: boolean;        // 背景を透明にする (デフォルト: false)
  onRecordingChange?: (isRecording: boolean) => void; // 録音状態変更コールバック
}

export function RecordingWithIris({ 
  width = 450, 
  height = 450, 
  className = "",
  fullScreen = false,
  showUI = false,
  showBackground = false,
  rounded = false,
  shadow = false,
  transparent = false,
  onRecordingChange
}: RecordingWithIrisProps = {}) {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isDone, setIsDown] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // ユーザー情報取得
  useEffect(() => {
    const getUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    getUser();
  }, [supabase]);
  
  // 音声処理用のRef
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // 録音保存用のRef
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  // 録音時間追跡用のRef
  const recordingStartTimeRef = useRef<number | null>(null);

  // MotionValueを使って音量を管理（描画ループ内で使用）
  const audioLevel = useMotionValue(0);

  // 録音完了時の処理
  const handleRecordingComplete = async (audioBlob: Blob, durationSeconds: number) => {
    try {
      // ユーザー認証チェック
      if (!user?.id) {
        alert('ログインが必要です');
        router.push('/auth/login_signup');
        return;
      }

      // 1. 音声ファイルをSupabase Storageにアップロード
      // ユーザーIDをフォルダ名として使用（セキュリティポリシーに準拠）
      const timestamp = Date.now();
      const fileName = `${user.id}/recording_${timestamp}.webm`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-recordings')
        .upload(fileName, audioBlob, {
          contentType: 'audio/webm',
          upsert: false,
          cacheControl: '3600' // 1時間キャッシュ
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert(`音声のアップロードに失敗しました: ${uploadError.message}`);
        return;
      }

      console.log('Upload successful:', uploadData);
      console.log('File size:', audioBlob.size, 'bytes');
      console.log('Duration:', durationSeconds, 'seconds');

      // 2. アップロード成功後、discussionレコードを作成
      const { data: discussData, error: discussError } = await supabase
        .from('discussions')
        .insert({
          audio_file_path: uploadData.path,
          created_at: new Date().toISOString(),
          user_id: user.id,
          duration_seconds: durationSeconds // 実際の録音時間（秒）
        })
        .select()
        .single();

      if (discussError) {
        console.error('Database error:', discussError);
        alert(`データベースへの保存に失敗しました: ${discussError.message}`);
        return;
      }

      console.log('Discussion created:', discussData);

      // 3. 画面遷移
      const discussId = discussData.id;
      router.push(`/discus/${discussId}`);

    } catch (error) {
      console.error('Recording complete error:', error);
      alert('処理中にエラーが発生しました');
    }
  };

  // 録音状態の切り替えハンドラー
  const handleToggleRecording = () => {
    const newState = !isRecording;
    setIsRecording(newState);
    onRecordingChange?.(newState);
  };

  // 1. 録音開始・停止処理
  useEffect(() => {
    const handleAudio = async () => {
      if (isRecording) {
        try {
          // マイクアクセス取得
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;

          // 視覚化用のAudioContext
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 512;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;
          dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
          sourceRef.current = source;

          // 実際の録音用のMediaRecorder
          audioChunksRef.current = [];
          
          // 録音開始時刻を記録
          recordingStartTimeRef.current = Date.now();
          const startNow = new Date(recordingStartTimeRef.current as number).getTime();
          console.log('Recording started at:', new Date(recordingStartTimeRef.current).toISOString());
          console.log('recordingStartTimeRef.current:', new Date(recordingStartTimeRef.current as number).getTime());          
          const mediaRecorder = new MediaRecorder(stream);
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.onstop = async () => {
            // 録音時間を計算（秒単位）
            const stopNow = Date.now();
            const Now = new Date(stopNow).getTime();
            console.log("startNow:", startNow);
            console.log("Now:", Now);
            const durationMs = Number(Now) - Number(startNow);
            console.log("durationMs:", durationMs);
            const durationSeconds = Math.round(durationMs / 1000);
            
            console.log('Recording stopped. Duration:', durationSeconds, 'seconds');
            
            // 録音データをBlobに変換
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            
            // 音声データと録音時間を処理してページ遷移
            await handleRecordingComplete(audioBlob, durationSeconds);
            
            // 録音開始時刻をリセット
            recordingStartTimeRef.current = null;
          };

          mediaRecorder.start();
          mediaRecorderRef.current = mediaRecorder;

        } catch (error) {
          console.error("Microphone access denied:", error);
          setIsRecording(false);
        }
      } else {
        // 録音停止
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }

        // ストリームを停止
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // 視覚化用のクリーンアップ
        if (sourceRef.current) {
          sourceRef.current.disconnect();
          sourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        analyserRef.current = null;
        dataArrayRef.current = null;
        audioLevel.set(0);
        setIsDown(true);
      }
    };

    handleAudio();

    return () => {
      // クリーンアップ時に録音時間もリセット
      recordingStartTimeRef.current = null;
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording]);
  // 2. Canvas描画ループ
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setSize = () => {
      // 親要素のサイズに合わせる
      const parent = canvas.parentElement;
      // 画面全体ではなく、親要素に合わせるので柔軟な設計
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    setSize();
    window.addEventListener('resize', setSize);

    // 粒子データの初期化
    const coreParticles: any[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < CORE_PARTICLE_COUNT; i++) {
      const y = 1 - (i / (CORE_PARTICLE_COUNT - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      // basePosには正規化された（半径1の）座標を入れておくと計算しやすいです
      coreParticles.push({
        basePos: { x, y, z }
      });
    }

    // 描画ループ
    let time = 0;
    const render = () => {
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // 音声データの取得
      if (isRecording && analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += dataArrayRef.current[i];
        }
        // console.log("音声の周波数データの合計：",sum);
        // console.log("音声の周波数データの長さ：",dataArrayRef.current.length);
        const average = sum / dataArrayRef.current.length;
        // 感度調整: 30.0で割るとかなり敏感になります
        audioLevel.set(average / 30.0);
        // console.log("音声の周波数データの平均：",average);
      }

      const currentColor = isRecording ? BASE_COLOR_RED : BASE_COLOR_CYAN;
      const colorStr = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;

      // 3D投影の簡易ヘルパー
      const project = (x: number, y: number, z: number) => {
        const scale = 300 / (300 + z);
        return {
          x: centerX + x * scale,
          y: centerY + y * scale,
          scale
        };
      };

      // --- A. 中心核の描画 ---
      ctx.fillStyle = colorStr;

      // 録音中は回転停止、待機中はゆっくり回転
      const rotSpeed = isRecording ? 0 : 0.002;
      const currentRotation = time * rotSpeed;

      // 現在の音量レベルを取得
      const currentLevel = audioLevel.get();

      coreParticles.forEach((p) => {
        // 振動の計算
        // isRecording時のみ、音量(currentLevel)に応じてランダムに揺らす
        // 感度係数 60 はかなり激しいです。お好みで 30〜80 くらいで調整してください。
        const vibrationX = isRecording ? (Math.random() - 0.5) * (currentLevel * 35) : 0;
        const vibrationY = isRecording ? (Math.random() - 0.5) * (currentLevel * 35) : 0;
        const vibrationZ = isRecording ? (Math.random() - 0.5) * (currentLevel * 35) : 0;

        // 膨張の計算
        const expansion = isRecording ? 1.0 + (currentLevel * 0.1) : 1.0;

        // 座標計算: (基本単位ベクトル * 半径 * 膨張) + 振動
        const px = p.basePos.x * CORE_RADIUS * expansion + vibrationX;
        const py = p.basePos.y * CORE_RADIUS * expansion + vibrationY;
        const pz = p.basePos.z * CORE_RADIUS * expansion + vibrationZ;

        // 回転行列の適用
        const rotatedX = px * Math.cos(currentRotation) - pz * Math.sin(currentRotation);
        const rotatedZ = px * Math.sin(currentRotation) + pz * Math.cos(currentRotation);

        const proj = project(rotatedX, py, rotatedZ);

        // 描画
        const alpha = Math.max(0.1, proj.scale * 0.8);
        ctx.globalAlpha = alpha;

        // 粒子サイズも音量で少し変化
        const size = isRecording ? 1.5 * proj.scale : 1 * proj.scale;

        ctx.beginPath();
        ctx.arc(proj.x, proj.y, size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // ループ継続
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', setSize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isRecording]); // isRecordingが変わったら描画ループを再初期化

  // サイズの計算
  const sizeStyle = fullScreen 
    ? { width: '100vw', height: '100vh' }
    : { 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
      };

  // スタイルクラスの構築
  const containerClasses = [
    'relative',
    rounded ? 'rounded-2xl' : '',
    'overflow-hidden',
    shadow ? 'shadow-2xl' : '',
    fullScreen ? 'w-full h-full' : ''
  ].filter(Boolean).join(' ');

  const canvasClasses = [
    'absolute inset-0 w-full h-full block cursor-pointer',
    transparent ? 'bg-transparent' : showBackground ? 'bg-gradient-to-br from-gray-900 to-black' : 'bg-black'
  ].filter(Boolean).join(' ');

  return (
    <div className={`relative flex items-center justify-center ${fullScreen ? 'h-screen w-full' : ''} ${className}`}>
      {/* Canvasコンテナ */}
      <div 
        className={containerClasses}
        style={!fullScreen ? sizeStyle : undefined}
      >
        {/* 背景Canvas - 球体のみ */}
        <canvas
          ref={canvasRef}
          className={canvasClasses}
          onClick={handleToggleRecording}
        />
        
        {/* UIオーバーレイ - showUIがtrueの場合のみ表示 */}
        {showUI && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.div
                key={isRecording ? "rec" : "idle"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`text-xl tracking-[0.1em] font-bold ${
                  isRecording ? "text-red-400" : "text-cyan-400"
                }`}
              >
                {isRecording ? "● LISTENING" : "SYSTEM IDLE"}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};