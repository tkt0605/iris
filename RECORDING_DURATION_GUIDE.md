# 🎙️ 録音時間追跡機能 - 実務実装ガイド

録音開始から停止までの経過時間を正確に記録し、データベースに保存する機能の完全ガイド

---

## 📚 目次

1. [基本概念](#基本概念)
2. [実装パターン](#実装パターン)
3. [コード詳細解説](#コード詳細解説)
4. [エラーハンドリング](#エラーハンドリング)
5. [応用例](#応用例)
6. [テストとデバッグ](#テストとデバッグ)

---

## 1️⃣ 基本概念

### 時間計測の仕組み

```typescript
// 基本原理
const startTime = Date.now();        // 開始時刻（ミリ秒）
// ... 録音中 ...
const endTime = Date.now();          // 終了時刻（ミリ秒）
const durationMs = endTime - startTime;    // 経過時間（ミリ秒）
const durationSeconds = Math.round(durationMs / 1000); // 秒に変換
```

### なぜRefを使うのか？

```typescript
// ❌ useState は再レンダリングを引き起こす
const [startTime, setStartTime] = useState<number>(0);

// ✅ useRef は再レンダリングなし、値は保持される
const startTimeRef = useRef<number | null>(null);
```

**理由:**
- 録音中に再レンダリングは不要
- パフォーマンスの最適化
- MediaRecorderのライフサイクルと独立

---

## 2️⃣ 実装パターン

### パターン1: シンプルな時間追跡（基本）

```typescript
import { useRef } from 'react';

function RecordingComponent() {
  // 録音開始時刻を保存
  const recordingStartTimeRef = useRef<number | null>(null);

  const startRecording = () => {
    // 録音開始時に現在時刻を記録
    recordingStartTimeRef.current = Date.now();
    console.log('Started at:', new Date(recordingStartTimeRef.current));
  };

  const stopRecording = () => {
    if (!recordingStartTimeRef.current) {
      console.error('Recording was not started');
      return;
    }

    // 経過時間を計算
    const durationMs = Date.now() - recordingStartTimeRef.current;
    const durationSeconds = Math.round(durationMs / 1000);
    
    console.log(`Duration: ${durationSeconds} seconds`);
    
    // リセット
    recordingStartTimeRef.current = null;
    
    // データベースに保存
    saveToDatabase(durationSeconds);
  };

  return (
    <div>
      <button onClick={startRecording}>Start</button>
      <button onClick={stopRecording}>Stop</button>
    </div>
  );
}
```

### パターン2: リアルタイム表示付き

```typescript
function RecordingWithTimer() {
  const recordingStartTimeRef = useRef<number | null>(null);
  const [currentDuration, setCurrentDuration] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = () => {
    recordingStartTimeRef.current = Date.now();
    
    // 1秒ごとに経過時間を更新
    timerIntervalRef.current = setInterval(() => {
      if (recordingStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
        setCurrentDuration(elapsed);
      }
    }, 1000);
  };

  const stopRecording = () => {
    // タイマー停止
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // 最終的な録音時間を計算
    const durationMs = Date.now() - (recordingStartTimeRef.current || Date.now());
    const durationSeconds = Math.round(durationMs / 1000);
    
    // リセット
    recordingStartTimeRef.current = null;
    setCurrentDuration(0);
    
    saveToDatabase(durationSeconds);
  };

  useEffect(() => {
    // クリーンアップ
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  return (
    <div>
      <div>Recording: {currentDuration}s</div>
      <button onClick={startRecording}>Start</button>
      <button onClick={stopRecording}>Stop</button>
    </div>
  );
}
```

### パターン3: MediaRecorderと統合（推奨）

```typescript
function RecordingWithMediaRecorder() {
  const recordingStartTimeRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);

    // 録音開始時刻を記録
    recordingStartTimeRef.current = Date.now();
    
    mediaRecorder.ondataavailable = (event) => {
      // 録音データの処理
    };

    mediaRecorder.onstop = async () => {
      // 録音時間を計算
      const durationMs = Date.now() - (recordingStartTimeRef.current || Date.now());
      const durationSeconds = Math.round(durationMs / 1000);
      
      console.log(`Recording duration: ${durationSeconds}s`);
      
      // データ保存処理
      await saveRecording({
        blob: audioBlob,
        duration: durationSeconds
      });
      
      // クリーンアップ
      recordingStartTimeRef.current = null;
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  return (
    <div>
      <button onClick={startRecording}>Start</button>
      <button onClick={stopRecording}>Stop</button>
    </div>
  );
}
```

---

## 3️⃣ コード詳細解説

### ステップ1: Refの定義

```typescript
// 録音開始時刻を保存するRef
const recordingStartTimeRef = useRef<number | null>(null);
```

**ポイント:**
- `number | null` 型: 未初期化状態を表現
- `null`チェックでエラー防止
- コンポーネント再レンダリングの影響を受けない

### ステップ2: 録音開始時の記録

```typescript
// MediaRecorder開始前に時刻を記録
recordingStartTimeRef.current = Date.now();
console.log('Recording started at:', new Date(recordingStartTimeRef.current).toISOString());
```

**Date.now()の特徴:**
- UNIX エポック（1970-01-01）からのミリ秒
- 精度: ミリ秒単位
- タイムゾーン非依存

**代替手段:**
```typescript
// performance.now() - より高精度（マイクロ秒）
recordingStartTimeRef.current = performance.now();

// Date オブジェクト
recordingStartTimeRef.current = new Date().getTime();
```

### ステップ3: 録音停止時の計算

```typescript
mediaRecorder.onstop = async () => {
  // 1. 経過時間を計算（ミリ秒）
  const durationMs = Date.now() - (recordingStartTimeRef.current || Date.now());
  
  // 2. 秒に変換して四捨五入
  const durationSeconds = Math.round(durationMs / 1000);
  
  console.log('Recording stopped. Duration:', durationSeconds, 'seconds');
  
  // 3. データ保存
  await handleRecordingComplete(audioBlob, durationSeconds);
  
  // 4. リセット
  recordingStartTimeRef.current = null;
};
```

**計算の詳細:**
```typescript
// 例: 45.678秒の録音
const startTime = 1706623456789;  // 開始時刻
const endTime = 1706623502467;    // 終了時刻

const durationMs = endTime - startTime;
// → 45678 (ミリ秒)

const durationSeconds = Math.round(durationMs / 1000);
// → 46 (秒) ※四捨五入

// 切り捨てが必要な場合
const durationSeconds = Math.floor(durationMs / 1000);
// → 45 (秒)

// より詳細な精度（小数点）
const durationSeconds = (durationMs / 1000).toFixed(2);
// → "45.68" (秒)
```

### ステップ4: データベース保存

```typescript
const handleRecordingComplete = async (audioBlob: Blob, durationSeconds: number) => {
  // Supabaseに保存
  const { data, error } = await supabase
    .from('discussions')
    .insert({
      audio_file_path: uploadData.path,
      duration_seconds: durationSeconds,  // ★ 録音時間
      user_id: user.id,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Save error:', error);
    throw error;
  }

  return data;
};
```

### ステップ5: クリーンアップ

```typescript
useEffect(() => {
  // ...録音処理...

  return () => {
    // コンポーネントアンマウント時のクリーンアップ
    recordingStartTimeRef.current = null;
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };
}, [isRecording]);
```

---

## 4️⃣ エラーハンドリング

### パターン1: 開始時刻が未設定

```typescript
const stopRecording = () => {
  if (!recordingStartTimeRef.current) {
    console.error('Recording was not started properly');
    alert('録音が正しく開始されていません');
    return;
  }

  // 正常な処理
  const durationMs = Date.now() - recordingStartTimeRef.current;
  // ...
};
```

### パターン2: 異常に長い録音時間

```typescript
const stopRecording = () => {
  const durationMs = Date.now() - (recordingStartTimeRef.current || Date.now());
  const durationSeconds = Math.round(durationMs / 1000);

  // 異常値チェック（例: 1時間以上）
  if (durationSeconds > 3600) {
    console.warn('Recording duration is abnormally long:', durationSeconds);
    // オプション: ユーザーに確認
    const confirmed = confirm(`録音時間が${Math.floor(durationSeconds / 60)}分です。保存しますか？`);
    if (!confirmed) return;
  }

  // 通常の処理
  await saveRecording(durationSeconds);
};
```

### パターン3: ネットワークエラーのリトライ

```typescript
const saveRecording = async (durationSeconds: number, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await supabase
        .from('discussions')
        .insert({
          duration_seconds: durationSeconds,
          // ...
        });

      if (error) throw error;
      return data; // 成功

    } catch (error) {
      console.error(`Save attempt ${i + 1} failed:`, error);
      
      if (i === retries - 1) {
        // 最後の試行も失敗
        alert('録音の保存に失敗しました');
        throw error;
      }
      
      // 待機してリトライ
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

---

## 5️⃣ 応用例

### 応用1: 複数セグメントの録音

```typescript
interface RecordingSegment {
  startTime: number;
  endTime: number;
  duration: number;
}

function MultiSegmentRecorder() {
  const segmentsRef = useRef<RecordingSegment[]>([]);
  const currentStartTimeRef = useRef<number | null>(null);

  const startSegment = () => {
    currentStartTimeRef.current = Date.now();
  };

  const stopSegment = () => {
    if (!currentStartTimeRef.current) return;

    const endTime = Date.now();
    const duration = Math.round((endTime - currentStartTimeRef.current) / 1000);

    segmentsRef.current.push({
      startTime: currentStartTimeRef.current,
      endTime,
      duration
    });

    currentStartTimeRef.current = null;
  };

  const getTotalDuration = () => {
    return segmentsRef.current.reduce((total, seg) => total + seg.duration, 0);
  };

  const saveRecording = async () => {
    const totalDuration = getTotalDuration();
    
    await supabase.from('discussions').insert({
      duration_seconds: totalDuration,
      segment_count: segmentsRef.current.length,
      segments: JSON.stringify(segmentsRef.current)
    });
  };

  return (
    <div>
      <button onClick={startSegment}>Start Segment</button>
      <button onClick={stopSegment}>Stop Segment</button>
      <button onClick={saveRecording}>Save All</button>
      <div>Total: {getTotalDuration()}s</div>
    </div>
  );
}
```

### 応用2: 時間制限付き録音

```typescript
function TimeLimitedRecorder({ maxDuration = 300 }) { // 5分
  const recordingStartTimeRef = useRef<number | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = () => {
    recordingStartTimeRef.current = Date.now();

    // 1秒ごとに時間をチェック
    checkIntervalRef.current = setInterval(() => {
      if (!recordingStartTimeRef.current) return;

      const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);

      if (elapsed >= maxDuration) {
        console.log('Max duration reached, stopping...');
        stopRecording();
      }
    }, 1000);
  };

  const stopRecording = () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }

    // 録音停止処理
    // ...
  };

  return (
    <div>
      <button onClick={startRecording}>Start (Max {maxDuration}s)</button>
      <button onClick={stopRecording}>Stop</button>
    </div>
  );
}
```

### 応用3: 一時停止機能付き

```typescript
function RecorderWithPause() {
  const recordingStartTimeRef = useRef<number | null>(null);
  const pausedDurationRef = useRef<number>(0); // 累積停止時間
  const pauseStartTimeRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const startRecording = () => {
    recordingStartTimeRef.current = Date.now();
    pausedDurationRef.current = 0;
  };

  const pauseRecording = () => {
    pauseStartTimeRef.current = Date.now();
    setIsPaused(true);
  };

  const resumeRecording = () => {
    if (pauseStartTimeRef.current) {
      // 停止時間を累積
      const pauseDuration = Date.now() - pauseStartTimeRef.current;
      pausedDurationRef.current += pauseDuration;
      pauseStartTimeRef.current = null;
    }
    setIsPaused(false);
  };

  const stopRecording = () => {
    if (!recordingStartTimeRef.current) return;

    // 実際の録音時間 = 総経過時間 - 停止時間
    const totalElapsed = Date.now() - recordingStartTimeRef.current;
    const actualDuration = Math.round((totalElapsed - pausedDurationRef.current) / 1000);

    console.log('Actual recording duration:', actualDuration, 'seconds');
    
    saveRecording(actualDuration);
  };

  return (
    <div>
      <button onClick={startRecording}>Start</button>
      <button onClick={isPaused ? resumeRecording : pauseRecording}>
        {isPaused ? 'Resume' : 'Pause'}
      </button>
      <button onClick={stopRecording}>Stop</button>
    </div>
  );
}
```

---

## 6️⃣ テストとデバッグ

### デバッグログの追加

```typescript
const startRecording = () => {
  const timestamp = Date.now();
  recordingStartTimeRef.current = timestamp;
  
  console.group('🎙️ Recording Started');
  console.log('Timestamp:', timestamp);
  console.log('ISO String:', new Date(timestamp).toISOString());
  console.log('Local Time:', new Date(timestamp).toLocaleString());
  console.groupEnd();
};

const stopRecording = () => {
  const endTime = Date.now();
  const startTime = recordingStartTimeRef.current || endTime;
  const durationMs = endTime - startTime;
  const durationSeconds = Math.round(durationMs / 1000);
  
  console.group('🛑 Recording Stopped');
  console.log('Start Time:', new Date(startTime).toISOString());
  console.log('End Time:', new Date(endTime).toISOString());
  console.log('Duration (ms):', durationMs);
  console.log('Duration (s):', durationSeconds);
  console.log('Duration (formatted):', formatDuration(durationSeconds));
  console.groupEnd();
};

// 時間をフォーマット
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

### テストケース

```typescript
describe('Recording Duration Tracking', () => {
  it('should calculate duration correctly', () => {
    const recorder = new RecordingTracker();
    
    // 開始時刻を設定
    recorder.start();
    const startTime = Date.now();
    
    // 5秒待機（モック）
    jest.advanceTimersByTime(5000);
    
    // 停止
    const duration = recorder.stop();
    
    expect(duration).toBe(5); // 5秒
  });

  it('should handle null start time', () => {
    const recorder = new RecordingTracker();
    
    // 開始せずに停止
    expect(() => recorder.stop()).toThrow('Recording not started');
  });

  it('should reset after stop', () => {
    const recorder = new RecordingTracker();
    
    recorder.start();
    recorder.stop();
    
    expect(recorder.getStartTime()).toBeNull();
  });
});
```

---

## 📊 データベーススキーマ

### 基本スキーマ

```sql
CREATE TABLE discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  audio_file_path TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,  -- 録音時間（秒）
  created_at TIMESTAMP DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_discussions_duration ON discussions(duration_seconds);
```

### 拡張スキーマ

```sql
CREATE TABLE discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  audio_file_path TEXT NOT NULL,
  
  -- 時間情報
  duration_seconds INTEGER NOT NULL,
  duration_formatted TEXT,  -- "2:35" のようなフォーマット
  recording_started_at TIMESTAMP,
  recording_ended_at TIMESTAMP,
  
  -- セグメント情報
  segment_count INTEGER DEFAULT 1,
  segments JSONB,
  
  -- メタデータ
  file_size_bytes BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 ベストプラクティス

### 1. 常にエラーチェック

```typescript
✅ Good:
if (!recordingStartTimeRef.current) {
  console.error('Recording not started');
  return;
}

❌ Bad:
const duration = Date.now() - recordingStartTimeRef.current; // null の可能性
```

### 2. リソースのクリーンアップ

```typescript
✅ Good:
useEffect(() => {
  return () => {
    recordingStartTimeRef.current = null;
    // 他のクリーンアップ
  };
}, []);

❌ Bad:
// クリーンアップなし
```

### 3. ログの活用

```typescript
✅ Good:
console.log('Duration:', durationSeconds, 'seconds');
console.log('File size:', audioBlob.size, 'bytes');

❌ Bad:
// ログなし、デバッグが困難
```

### 4. 型の明示

```typescript
✅ Good:
const recordingStartTimeRef = useRef<number | null>(null);

❌ Bad:
const recordingStartTimeRef = useRef(null); // 型推論が any
```

---

## 📚 まとめ

### 必須実装項目

- [x] `useRef<number | null>` で開始時刻を保存
- [x] 録音開始時に `Date.now()` を記録
- [x] 録音停止時に経過時間を計算
- [x] データベースに `duration_seconds` を保存
- [x] クリーンアップ処理でリセット

### オプション実装項目

- [ ] リアルタイム表示
- [ ] 時間制限機能
- [ ] 一時停止機能
- [ ] セグメント録音
- [ ] エラーリトライ

このガイドを参考に、実務でも確実に録音時間追跡機能を実装できます！
