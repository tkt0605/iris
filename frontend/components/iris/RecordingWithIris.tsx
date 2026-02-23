"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase";
import { useRouter, useParams } from "next/navigation";
// 設定パラメータ
const CORE_PARTICLE_COUNT = 1500; // 中心の粒子数
const CORE_RADIUS = 60; // 中心半径
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
  onClick?: () => void;
  NewChat?: boolean;
}

export function RecordingWithIris({
  width = 400,
  height = 400,
  className = "",
  fullScreen = false,
  showUI = false,
  showBackground = false,
  rounded = false,
  shadow = false,
  transparent = false,
  NewChat = false,
  onRecordingChange
}: RecordingWithIrisProps = {}) {
  const router = useRouter();
  const params = useParams();
  const routeId = params.id as string;
  const supabase = createClient();
  const worker = useRef<Worker | null>(null);
  const llmworker = useRef<Worker | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const isThinkingRef = useRef<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const userRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const tempAudioPath = useRef<string>("");
  const tempAudioDuration = useRef<number>(0);

  const [isRecording, setIsRecording] = useState(false);
  const [isDone, setIsDown] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const currentConversationIdRef = useRef<string | null>(null);
  useEffect(() => {
    userRef.current = user;
    console.log('ログインユーザーID:', userRef.current?.id);
  }, [user]);
  useEffect(() => {
    const getAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      console.log('ログインユーザーdetails：', session?.user?.user_metadata);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Workerの初期化 worker.js/llm-worker.js
  useEffect(() => {
    // worker.js
    try {
      worker.current = new Worker(new URL("worker.js", import.meta.url), {type: "module"});
      worker.current.onmessage = async (event) => {
        const { status, output, ...rest} = event.data;
        if (status === "complete") {
          const text = output.text;
          console.log('🔥 解析完了！テキスト:', text);
          setTranscription(text);
          if (!userRef.current?.id) {
            alert('ログインが必要です');
            return router.push('/auth/login_signup');
          }

          const convId = await saveFinalToSupabase(
            text,
            tempAudioPath.current,
            tempAudioDuration.current
          );
          if (!convId) {
            alert('データ保存に失敗しました');
            return;
          }
          currentConversationIdRef.current = convId;
          isThinkingRef.current = true;
          setIsThinking(true);

          llmworker.current?.postMessage({
            userText: text,
          })
        }else if (status === "error") {
          console.error('Worker Error:', rest.error);
          alert('Worker Error:' + rest.error);
          return;
        }else if (status === "progress" && rest.progress === 100) {
          console.log('✅ Whisper Worker ロード完了'+ rest.file);
        }
      }
    } catch (error) {
      console.error('Worker initialization error:', error);
      alert('Worker initialization error:' + error);
      return;
    }
    // llm-worker.js
    try {
      llmworker.current = new Worker(new URL("llm-worker.js", import.meta.url), { type: "module"});
      llmworker.current.onmessage = async(event) => {
        const { status, output, ...rest } = event.data;
        if (status === "complete") {
          isThinkingRef.current = false;
          setIsThinking(false);
          console.log('🔥 LLM Worker 解析完了！返答:', output);
          const convId = currentConversationIdRef.current;

          if (convId) {
            await saveAssistantMessage(output, convId);
            router.push(`/discus/${convId}`);
          }else{
            alert("会話履歴が見つかりませんでした。")
          }
          return;
        }else if (status === "error") {
          isThinkingRef.current = false;
          setIsThinking(false);
          console.error('LLM Worker Error:', rest.error);
          alert('LLM Worker Error:' + rest.error);
          if (currentConversationIdRef.current) {
            router.push(`/discus/${currentConversationIdRef.current}`);
          }
        }else if (status === "progress" && rest.progress === 100) {
          console.log('✅ LLM Worker ロード完了'+ rest.progress);
        }
      }
    } catch (error) {
      console.error('LLM Worker initialization error:', error);
      alert('LLM Worker initialization error:' + error);
      return;
    }

    return () => {
      worker.current?.terminate();
      worker.current = null;
      llmworker.current?.terminate();
      llmworker.current = null;
    };
  }, []);
  // BolbをFolat32Arrayに変換して、Worker.jsへ。
  const handleAudioData = async(audioBlob: Blob) => {
    try {
      const render = new FileReader();
      render.onload = async () => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)(
          { sampleRate: 16000 }
        );
        const decoded = await audioContext.decodeAudioData(render.result as ArrayBuffer);
        const audioData = decoded.getChannelData(0);

        worker.current?.postMessage({ audio: audioData });
      };
      render.readAsArrayBuffer(audioBlob);
    } catch (error) {
      console.error('Audio data conversion error:', error);
      alert('Audio data conversion error');
      return;
    }
  };


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
      handleAudioData(audioBlob);
      // 音声ファイルをストレージに保存
      const timestamp = Date.now();
      // file_path
      const path = `${user.id}/record_${timestamp}_${crypto.randomUUID()}.webm`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-recordings')
        .upload(path, audioBlob, {
          contentType: "audio/webm",
          upsert: false
        });
      if (uploadError) {
        console.error('Audio Upload Error:', uploadError);
        throw uploadError;
      }
      console.log('Audio Uploaded Successfully:', uploadData);
      tempAudioPath.current = uploadData?.path ?? "";
      tempAudioDuration.current = durationSeconds;
      // //NewChatがtrueの時、Conversationsレコード（親）を新規作成
    } catch (error) {
      console.error('Recording complete error:', error);
      alert('処理中にエラーが発生しました');
      throw error;
    }
  };
  const saveFinalToSupabase = async(
    text: string,
    audioPath: string,
    audioDuration: number,
  ): Promise<string | null> => {
    try {
      const user_id = userRef.current?.id;
      if (NewChat as boolean === true) {

        console.log('New Chat is:', NewChat);
        const generated_title = text.length > 20 ? text.slice(0, 20) + "..." : text;
        const { data: conversationData, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            user_id: user_id,
            title: generated_title,
            is_activate: true,
          })
          .select()
          .single();
        if (conversationError) {
          console.error('Conversation creation error:', conversationError);
          throw conversationError;
        }
        const newConversationId = conversationData.id;
        console.log('New ConverSation Created:', newConversationId);

        // Messagesレコード（子）を作成
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .insert({
            conversation_id: newConversationId,
            role: "user",
            context: text,
            audio_url: audioPath,
            audio_duration: audioDuration,
            metadata: {
              action: "record",
              status: "success",
              device: "web"
            }
          })
          .select()
          .single();
        if (messagesError) {
          console.error('Messages creation error:', messagesError);
          throw messagesError;
        }
        console.log('Messages Created Successfully:', messagesData);
        return newConversationId;
      } else {
        console.log('New Chat is:', NewChat);
        const WhereAmI = params.id as string;
        console.log('Where Am I?:', WhereAmI);
        const { data: ContinueMessagesData, error: ContinueMessagesError } = await supabase
          .from('messages')
          .insert({
            conversation_id: WhereAmI,
            role: "user",
            context: text,
            audio_url: audioPath,
            audio_duration: audioDuration,
            metadata: {
              action: "record",
              status: "success",
              device: "web"
            }
          })
          .select()
          .single();
        if (ContinueMessagesError) {
          console.log("I am here:", WhereAmI);
          console.error('Continue Messages creation Error:', ContinueMessagesError);
          throw ContinueMessagesError;
        }
        console.log('contine Messages Created Successfully:', ContinueMessagesData);

        return WhereAmI;
      }
    } catch (error) {
      console.error('Final save error:', error);
      return null;
    }
  }
  // 録音状態の切り替えハンドラー
  const handleToggleRecording = () => {
    const newState = !isRecording;
    setIsRecording(newState);
    onRecordingChange?.(newState);
  };

  // アシスタントでのAI返信
  const saveAssistantMessage = async (
    replyText: string,
    conversationId: string,
  ) => {
    try {
      const { data: assistantMessageData, error: assistantMessageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        context: replyText,
        metadata: {
          action: "llm-reply",
          status: "success",
          device: "web"
        }
      })
      .select()
      .single();
      if (assistantMessageError){
        console.error('Assistant Message creation Error:', assistantMessageError);
        throw assistantMessageError;
      }
      console.log('Assistant Message Created Successfully:', assistantMessageData);
      return assistantMessageData.id;
    } catch (error) {
      console.error('Assistant Message creation Error:', error);
      throw error;
    }
  }

  // 1. 録音開始・停止処理 /Conversationsの作成
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
          // analyser.fftSize = 512;
          analyser.fftSize = 256;
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
            //録音停止の際に、音声データをworkers.jsへ送信
            // handleAudioData(audioBlob);

            // 音声データと録音時間を処理してページ遷移
            // const role = isRecording ? "user" : "assistant";
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
    // <div className={`relative flex items-center justify-center ${fullScreen ? 'h-screen w-full' : ''} ${className}`}>
    // <div className="relative flex items-center">
    <div className={`relative flex items-center ${fullScreen ? 'h-screen w-full' : ''} ${className}`}>
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
                className={`text-xl tracking-[0.1em] font-bold ${isRecording ? "text-red-400" : "text-cyan-400"
                  }`}
              >
                {isThinking ? "◎ THINKING...🤔" : isRecording ? "● LISTENING" : "SYSTEM IDLE"}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}; 