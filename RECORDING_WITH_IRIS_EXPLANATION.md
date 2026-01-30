# 📘 RecordingWithIris.tsx - 完全解説

音声録音 × 3D球体ビジュアライゼーション × Supabase統合の統合コンポーネント

---

## 📚 目次

1. [概要](#概要)
2. [ファイル構造](#ファイル構造)
3. [定数・設定](#定数設定)
4. [Props定義](#props定義)
5. [State & Refs](#state--refs)
6. [主要関数](#主要関数)
7. [useEffect解説](#useeffect解説)
8. [描画ロジック](#描画ロジック)
9. [レンダリング](#レンダリング)
10. [データフロー](#データフロー)

---

## 🎯 概要

このコンポーネントは以下の3つの主要機能を統合しています：

1. **🎙️ 音声録音** - MediaRecorder APIによる高品質録音
2. **🌐 3D視覚化** - Canvas + 黄金螺旋による球体描画
3. **☁️ Supabase統合** - Storage & Databaseへの自動保存

---

## 📁 ファイル構造

```
RecordingWithIris.tsx (439行)
├── インポート (1-6行)
├── 定数定義 (7-15行)
├── Props型定義 (17-28行)
├── コンポーネント本体 (30-439行)
│   ├── State & Refs (42-74行)
│   ├── 関数定義 (76-144行)
│   ├── useEffect: 録音処理 (147-253行)
│   ├── useEffect: Canvas描画 (255-380行)
│   ├── スタイル計算 (382-402行)
│   └── JSX/レンダリング (404-438行)
```

---

## 🔢 定数・設定

### 行7-15: グローバル定数

```typescript
const CORE_PARTICLE_COUNT = 2000; // 球体を構成する粒子数
const CORE_RADIUS = 80;           // 球体の基準半径（ピクセル）
const ORBIT_COUNT = 5;            // 軌道数（未使用）

// 色定義（RGB）
const BASE_COLOR_CYAN = { r: 34, g: 211, b: 238 };  // 待機時: シアン
const BASE_COLOR_RED = { r: 248, g: 113, b: 113 };  // 録音時: 赤
```

**設計意図:**
- `CORE_PARTICLE_COUNT`: 多いほど滑らかだが重くなる
- `CORE_RADIUS`: 球体のサイズ調整
- 色: 状態を直感的に表現（待機=冷静、録音=アクティブ）

---

## 📋 Props定義

### 行17-28: インターフェース定義

```typescript
interface RecordingWithIrisProps {
  width?: number | string;      // 幅: 450px (デフォルト)
  height?: number | string;     // 高さ: 450px (デフォルト)
  className?: string;           // 追加CSSクラス
  fullScreen?: boolean;         // 全画面モード
  showUI?: boolean;             // "LISTENING" テキスト表示
  showBackground?: boolean;     // グラデーション背景
  rounded?: boolean;            // 角丸
  shadow?: boolean;             // 影
  transparent?: boolean;        // 背景透明
  onRecordingChange?: (isRecording: boolean) => void; // コールバック
}
```

**柔軟な設計:**
- すべてオプショナル（デフォルト値あり）
- 用途に応じてカスタマイズ可能
- コンポーネントの再利用性が高い

---

## 🗂️ State & Refs

### 行42-74: 状態管理

#### React State (42-46行)
```typescript
const [user, setUser] = useState<any>(null);           // ユーザー情報
const [isRecording, setIsRecording] = useState(false); // 録音状態
const [isDone, setIsDown] = useState(false);           // 完了フラグ
```

#### Canvas用Ref (47-48行)
```typescript
const canvasRef = useRef<HTMLCanvasElement>(null);     // Canvas要素
const animationRef = useRef<number | null>(null);      // アニメーションID
```

#### 音声解析用Ref (60-63行)
```typescript
const audioContextRef = useRef<AudioContext | null>(null);              // Web Audio API
const analyserRef = useRef<AnalyserNode | null>(null);                  // 周波数解析
const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);     // 周波数データ
const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);     // 音声ソース
```

**役割:**
- `AudioContext`: Web Audio APIのコンテキスト
- `AnalyserNode`: リアルタイム周波数解析
- `Uint8Array`: 0-255の周波数データ（256要素）
- `MediaStreamAudioSourceNode`: マイクからの音声ストリーム

#### 録音用Ref (66-68行)
```typescript
const mediaRecorderRef = useRef<MediaRecorder | null>(null);  // 録音API
const audioChunksRef = useRef<Blob[]>([]);                     // 録音データ蓄積
const streamRef = useRef<MediaStream | null>(null);            // マイクストリーム
```

#### 時間追跡用Ref (71行)
```typescript
const recordingStartTimeRef = useRef<number | null>(null);     // 録音開始時刻
```

#### MotionValue (74行)
```typescript
const audioLevel = useMotionValue(0);                          // 音量レベル
```

**なぜMotionValue?**
- React再レンダリングをトリガーしない
- 高頻度更新（60fps）に最適
- Framer Motionのアニメーションと統合可能

---

## 🔧 主要関数

### 1. handleRecordingComplete (77-137行)

```typescript
const handleRecordingComplete = async (audioBlob: Blob, durationSeconds: number) => {
  // 1. 認証チェック
  if (!user?.id) {
    alert('ログインが必要です');
    router.push('/auth/login_signup');
    return;
  }

  // 2. Supabase Storageにアップロード
  const fileName = `${user.id}/recording_${timestamp}.webm`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('audio-recordings')
    .upload(fileName, audioBlob, {
      contentType: 'audio/webm',
      upsert: false,
      cacheControl: '3600'
    });

  // 3. Databaseにレコード作成
  const { data: discussData, error: discussError } = await supabase
    .from('discussions')
    .insert({
      audio_file_path: uploadData.path,
      created_at: new Date().toISOString(),
      user_id: user.id,
      duration_seconds: durationSeconds
    })
    .select()
    .single();

  // 4. 討論ページへ遷移
  router.push(`/discus/${discussData.id}`);
};
```

**フロー:**
```
認証確認 → Storage Upload → DB Insert → 画面遷移
```

**エラーハンドリング:**
- 各ステップでエラーチェック
- ユーザーへのアラート表示
- コンソールログで詳細記録

### 2. handleToggleRecording (140-144行)

```typescript
const handleToggleRecording = () => {
  const newState = !isRecording;
  setIsRecording(newState);           // 内部状態更新
  onRecordingChange?.(newState);      // 外部コールバック実行
};
```

**役割:**
- Canvasクリック時のハンドラー
- 録音ON/OFF切り替え
- 親コンポーネントへの通知

---

## 🔄 useEffect解説

### useEffect #1: ユーザー情報取得 (51-57行)

```typescript
useEffect(() => {
  const getUser = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);
  };
  getUser();
}, [supabase]);
```

**目的:**
- コンポーネントマウント時にユーザー情報取得
- 録音保存時に必要

### useEffect #2: 録音処理 (147-253行)

#### 📍 録音開始フェーズ (149-211行)

```typescript
if (isRecording) {
  // 1. マイクアクセス取得
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
  // 2. AudioContext作成（視覚化用）
  const audioCtx = new AudioContext();
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;  // 周波数分解能
  const source = audioCtx.createMediaStreamSource(stream);
  source.connect(analyser);
  
  // 3. MediaRecorder作成（録音用）
  const mediaRecorder = new MediaRecorder(stream);
  
  // 4. 録音開始時刻を記録
  recordingStartTimeRef.current = Date.now();
  
  // 5. データ蓄積ハンドラー
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunksRef.current.push(event.data);
    }
  };
  
  // 6. 停止時ハンドラー
  mediaRecorder.onstop = async () => {
    // 録音時間計算
    const durationMs = Date.now() - recordingStartTimeRef.current;
    const durationSeconds = Math.round(durationMs / 1000);
    
    // Blob生成
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
    // 保存処理
    await handleRecordingComplete(audioBlob, durationSeconds);
    
    // リセット
    recordingStartTimeRef.current = null;
  };
  
  mediaRecorder.start();
}
```

**2つの並行処理:**
1. **AudioContext** - リアルタイム視覚化（球体の動き）
2. **MediaRecorder** - 実際の音声録音（ファイル保存）

#### 📍 録音停止フェーズ (212-237行)

```typescript
else {
  // 1. MediaRecorder停止
  if (mediaRecorderRef.current?.state !== 'inactive') {
    mediaRecorderRef.current.stop();  // → onstop イベント発火
  }
  
  // 2. マイクストリーム停止
  if (streamRef.current) {
    streamRef.current.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  }
  
  // 3. AudioContextクリーンアップ
  if (audioContextRef.current?.state !== 'closed') {
    audioContextRef.current.close();
    audioContextRef.current = null;
  }
  
  // 4. その他のリソース解放
  analyserRef.current = null;
  dataArrayRef.current = null;
  audioLevel.set(0);
}
```

**クリーンアップの重要性:**
- メモリリーク防止
- マイクアクセスの適切な解放
- 次回録音のための初期化

#### 📍 クリーンアップ関数 (242-252行)

```typescript
return () => {
  recordingStartTimeRef.current = null;
  
  if (audioContextRef.current?.state !== 'closed') {
    audioContextRef.current.close();
  }
  if (streamRef.current) {
    streamRef.current.getTracks().forEach(track => track.stop());
  }
};
```

**実行タイミング:**
- コンポーネントアンマウント時
- `isRecording` 依存配列変更時

### useEffect #3: Canvas描画ループ (255-380行)

#### 📍 初期化 (256-287行)

```typescript
const canvas = canvasRef.current;
const ctx = canvas.getContext('2d');

// Canvas サイズ設定
const setSize = () => {
  const parent = canvas.parentElement;
  if (parent) {
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
  }
};
setSize();
window.addEventListener('resize', setSize);

// 粒子初期化（黄金螺旋アルゴリズム）
const coreParticles: any[] = [];
const phi = Math.PI * (3 - Math.sqrt(5));  // 黄金角
for (let i = 0; i < CORE_PARTICLE_COUNT; i++) {
  const y = 1 - (i / (CORE_PARTICLE_COUNT - 1)) * 2;
  const radiusAtY = Math.sqrt(1 - y * y);
  const theta = phi * i;
  const x = Math.cos(theta) * radiusAtY;
  const z = Math.sin(theta) * radiusAtY;
  
  coreParticles.push({
    basePos: { x, y, z }  // 正規化座標（半径1）
  });
}
```

**黄金螺旋アルゴリズム:**
- 球面上に粒子を均等分布
- `phi` = 黄金角（137.5°）
- フィボナッチ数列に基づく自然なパターン

#### 📍 描画ループ (289-372行)

```typescript
let time = 0;
const render = () => {
  time++;  // フレームカウンタ
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // 【音声データ取得】
  if (isRecording && analyserRef.current && dataArrayRef.current) {
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
    }
    const average = sum / dataArrayRef.current.length;
    audioLevel.set(average / 30.0);  // 感度調整
  }
  
  // 【色の決定】
  const currentColor = isRecording ? BASE_COLOR_RED : BASE_COLOR_CYAN;
  const colorStr = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`;
  
  // 【3D投影関数】
  const project = (x: number, y: number, z: number) => {
    const scale = 300 / (300 + z);  // 遠近法
    return {
      x: centerX + x * scale,
      y: centerY + y * scale,
      scale
    };
  };
  
  // 【回転制御】
  const rotSpeed = isRecording ? 0 : 0.002;  // 録音中は停止
  const currentRotation = time * rotSpeed;
  
  // 【音量レベル取得】
  const currentLevel = audioLevel.get();
  
  // 【粒子描画】
  ctx.fillStyle = colorStr;
  coreParticles.forEach((p) => {
    // 振動計算（X, Y, Z軸独立）
    const vibrationX = isRecording ? (Math.random() - 0.5) * (currentLevel * 35) : 0;
    const vibrationY = isRecording ? (Math.random() - 0.5) * (currentLevel * 35) : 0;
    const vibrationZ = isRecording ? (Math.random() - 0.5) * (currentLevel * 35) : 0;
    
    // 膨張計算
    const expansion = isRecording ? 1.0 + (currentLevel * 0.1) : 1.0;
    
    // 座標計算
    const px = p.basePos.x * CORE_RADIUS * expansion + vibrationX;
    const py = p.basePos.y * CORE_RADIUS * expansion + vibrationY;
    const pz = p.basePos.z * CORE_RADIUS * expansion + vibrationZ;
    
    // Y軸回転
    const rotatedX = px * Math.cos(currentRotation) - pz * Math.sin(currentRotation);
    const rotatedZ = px * Math.sin(currentRotation) + pz * Math.cos(currentRotation);
    
    // 3D → 2D投影
    const proj = project(rotatedX, py, rotatedZ);
    
    // 透明度（奥ほど薄く）
    const alpha = Math.max(0.1, proj.scale * 0.8);
    ctx.globalAlpha = alpha;
    
    // サイズ（録音時は大きく）
    const size = isRecording ? 1.5 * proj.scale : 1 * proj.scale;
    
    // 円を描画
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, size, 0, Math.PI * 2);
    ctx.fill();
  });
  
  ctx.globalAlpha = 1.0;
  
  // 次フレームをリクエスト（60 FPS）
  animationRef.current = requestAnimationFrame(render);
};

render();  // 初回実行
```

**描画の4つの要素:**
1. **振動** - 音量に応じてランダムに揺れる
2. **膨張** - 音が大きいと球体が膨らむ
3. **回転** - 待機時のみゆっくり回転
4. **遠近感** - Z座標に応じて大きさ・透明度変化

---

## 🎨 レンダリング

### スタイル計算 (382-402行)

```typescript
// サイズスタイル
const sizeStyle = fullScreen 
  ? { width: '100vw', height: '100vh' }
  : { 
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height
    };

// コンテナクラス
const containerClasses = [
  'relative',
  rounded ? 'rounded-2xl' : '',
  'overflow-hidden',
  shadow ? 'shadow-2xl' : '',
  fullScreen ? 'w-full h-full' : ''
].filter(Boolean).join(' ');

// Canvasクラス
const canvasClasses = [
  'absolute inset-0 w-full h-full block cursor-pointer',
  transparent ? 'bg-transparent' 
    : showBackground ? 'bg-gradient-to-br from-gray-900 to-black' 
    : 'bg-black'
].filter(Boolean).join(' ');
```

**動的クラス構築:**
- Propsに応じて柔軟にスタイル変更
- `filter(Boolean)` で空文字を除去
- Tailwind CSSの utility-first アプローチ

### JSX構造 (404-438行)

```typescript
return (
  <div className="relative flex items-center justify-center...">
    {/* Canvasコンテナ */}
    <div className={containerClasses} style={sizeStyle}>
      
      {/* Canvas要素 */}
      <canvas
        ref={canvasRef}
        className={canvasClasses}
        onClick={handleToggleRecording}
      />
      
      {/* UIオーバーレイ（オプション） */}
      {showUI && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={isRecording ? "rec" : "idle"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={isRecording ? "text-red-400" : "text-cyan-400"}
            >
              {isRecording ? "● LISTENING" : "SYSTEM IDLE"}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  </div>
);
```

**構造:**
```
親div（センタリング）
  └─ コンテナdiv（サイズ・スタイル）
      ├─ canvas（描画・クリックハンドラー）
      └─ UIオーバーレイ（オプション、Framer Motion）
```

---

## 🔄 データフロー

### 全体フロー図

```
1. ユーザーがCanvasクリック
   ↓
2. handleToggleRecording()
   ↓
3. setIsRecording(true)
   ↓
4. useEffect (録音処理) 実行
   ├─ マイクアクセス取得
   ├─ AudioContext作成（視覚化）
   ├─ MediaRecorder作成（録音）
   └─ 録音開始時刻記録
   ↓
5. useEffect (Canvas描画) 実行
   ├─ 粒子初期化
   ├─ requestAnimationFrame
   ├─ 音声データ取得（60fps）
   └─ 球体描画（振動・膨張・回転）
   ↓
6. ユーザーが再度クリック
   ↓
7. setIsRecording(false)
   ↓
8. MediaRecorder.stop()
   ↓
9. onstop イベント発火
   ├─ 録音時間計算
   ├─ Blob生成
   └─ handleRecordingComplete()
       ├─ Storage Upload
       ├─ DB Insert
       └─ 画面遷移
   ↓
10. /discus/{id} ページ表示
```

### 並行処理

```
[録音中の状態]

Thread 1: 録音処理
  MediaRecorder → audioChunksRef に蓄積

Thread 2: 視覚化処理
  AnalyserNode → 周波数データ取得（リアルタイム）
  
Thread 3: 描画処理
  requestAnimationFrame → 球体描画（60fps）
  audioLevel.get() → 音量取得
  振動・膨張計算 → Canvas描画
```

---

## 🎯 設計のポイント

### 1. Refの使い分け

| Ref | 用途 | 理由 |
|-----|------|------|
| `useRef` | Canvas, Audio関連 | 再レンダリング不要 |
| `useState` | 録音状態 | UI更新が必要 |
| `useMotionValue` | 音量レベル | 高頻度更新、アニメーション |

### 2. 2つの音声処理系統

| 系統 | API | 目的 |
|------|-----|------|
| **視覚化** | AudioContext + AnalyserNode | リアルタイム周波数解析 |
| **録音** | MediaRecorder | 音声ファイル保存 |

**なぜ分離?**
- 目的が異なる
- AnalyserNodeは録音できない
- MediaRecorderは周波数データを取得できない

### 3. 正規化座標の活用

```typescript
basePos: { x, y, z }  // 半径1の球面座標

// 描画時にスケール適用
const px = p.basePos.x * CORE_RADIUS * expansion + vibrationX;
```

**メリット:**
- エフェクト計算が簡単
- 球のサイズを後から変更可能
- 数学的に綺麗

### 4. エラーハンドリング

```typescript
try {
  // 処理
} catch (error) {
  console.error('Error:', error);  // ログ
  alert('エラーメッセージ');      // ユーザー通知
  setIsRecording(false);           // 状態リセット
}
```

**3層防御:**
1. エラーログ（開発者向け）
2. ユーザー通知（UX）
3. 状態リセット（復旧）

---

## 📊 パフォーマンス考察

### 描画パフォーマンス

```
2000粒子 × 60fps = 120,000回/秒 の計算

各粒子ごと:
  - 振動計算（3軸）
  - 膨張計算
  - 回転行列
  - 3D投影
  - Canvas描画
```

**最適化ポイント:**
- `requestAnimationFrame` 使用（ブラウザ最適化）
- `useRef` で不要な再レンダリング回避
- `MotionValue` で状態管理のオーバーヘッド削減

### メモリ管理

```typescript
// クリーンアップ必須
return () => {
  if (animationRef.current) {
    cancelAnimationFrame(animationRef.current);
  }
  window.removeEventListener('resize', setSize);
};
```

**重要性:**
- メモリリーク防止
- イベントリスナー解放
- アニメーションフレーム停止

---

## 🔧 カスタマイズポイント

### 感度調整

```typescript
// 音量の感度（298-308行）
audioLevel.set(average / 30.0);  // ← この値を調整

// 振動の強さ（339-341行）
const vibrationX = (Math.random() - 0.5) * (currentLevel * 35);  // ← 35を調整

// 膨張率（344行）
const expansion = 1.0 + (currentLevel * 0.1);  // ← 0.1を調整
```

### 粒子数・サイズ

```typescript
// 定数を変更（8-9行）
const CORE_PARTICLE_COUNT = 2000;  // 粒子数
const CORE_RADIUS = 80;            // 球体サイズ
```

### 色のカスタマイズ

```typescript
// 色定義を変更（13-15行）
const BASE_COLOR_CYAN = { r: 34, g: 211, b: 238 };   // 任意のRGB
const BASE_COLOR_RED = { r: 248, g: 113, b: 113 };   // 任意のRGB
```

---

## 📚 まとめ

### コンポーネントの責務

1. **UI層** - Canvas描画、ユーザーインタラクション
2. **ビジネスロジック層** - 録音処理、時間追跡
3. **データ層** - Supabase統合、ファイル管理

### 技術的ハイライト

- ✅ **複雑な状態管理** - State, Ref, MotionValueの適切な使い分け
- ✅ **高度な描画** - 黄金螺旋 + 3D投影 + 60fps
- ✅ **Web APIs統合** - MediaRecorder + AudioContext + Canvas
- ✅ **エラーハンドリング** - 多層防御
- ✅ **柔軟な設計** - Props駆動、高い再利用性

### 学べること

1. Web Audio APIの実践的使用
2. Canvas 2Dでの3D表現
3. リアルタイム音声解析
4. 複雑な状態管理パターン
5. パフォーマンス最適化技法

---

このコンポーネントは、**音声録音**、**リアルタイム視覚化**、**クラウド統合**を統合した、実務レベルの複雑なReactコンポーネントの好例です。
