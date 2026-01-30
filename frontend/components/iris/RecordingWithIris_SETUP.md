# RecordingWithIris セットアップガイド

## 📋 概要
録音機能付き3D球体UIコンポーネント。録音終了時に音声データをSupabaseにアップロードし、discussページに自動遷移します。

## 🔧 必要な設定

### 1. Supabase Storage バケット作成

Supabaseダッシュボードで以下の設定を行ってください：

#### Step 1: バケット作成
**Storage** セクション → **New bucket** をクリック

- **名前**: `audio-recordings`
- **Public bucket**: ❌ **OFF（チェックを外す）**
  - 理由: 録音データはプライベートで、認証ユーザーのみアクセス可能にする
- **File size limit**: `52428800` (50MB) - 音声ファイルの最大サイズ
- **Allowed MIME types**: `audio/webm, audio/mp4, audio/ogg` - 許可する音声形式

#### Step 2: Storage Policies 設定

**Storage** → **Policies** → `audio-recordings` バケットを選択

##### ✅ アップロードポリシー（INSERT）
```sql
-- 認証済みユーザーが自分のフォルダに音声をアップロード可能
CREATE POLICY "Users can upload their own recordings"
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'audio-recordings' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```
**解説**: ユーザーは `{user_id}/filename.webm` のようなパスにのみアップロード可能

##### ✅ 読み取りポリシー（SELECT）
```sql
-- 認証済みユーザーが自分の音声を読み取り可能
CREATE POLICY "Users can read their own recordings"
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'audio-recordings' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```
**解説**: ユーザーは自分がアップロードした音声のみ取得可能

##### ✅ 更新ポリシー（UPDATE）（オプション）
```sql
-- 認証済みユーザーが自分の音声を更新可能
CREATE POLICY "Users can update their own recordings"
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'audio-recordings' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'audio-recordings' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

##### ✅ 削除ポリシー（DELETE）（オプション）
```sql
-- 認証済みユーザーが自分の音声を削除可能
CREATE POLICY "Users can delete their own recordings"
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'audio-recordings' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Step 3: バケット設定の確認

**Settings** タブで以下を確認:
- ✅ **Public access**: OFF
- ✅ **File size limit**: 50-100MB
- ✅ **Allowed MIME types**: audio/webm, audio/mp4など

---

## 🔒 セキュリティ設定の詳細解説

### なぜ Public: OFF にするのか？

#### ❌ Public: ON の場合（非推奨）
- **誰でも** URLを知っていればファイルにアクセス可能
- 録音データが漏洩するリスク
- 不正アクセスやスクレイピングの対象になる可能性

```typescript
// Public URLの例（誰でもアクセス可能）
const publicUrl = supabase.storage
  .from('audio-recordings')
  .getPublicUrl('user123/recording.webm').data.publicUrl;
// → https://xxx.supabase.co/storage/v1/object/public/audio-recordings/user123/recording.webm
```

#### ✅ Public: OFF の場合（推奨）
- **認証済みユーザーのみ** アクセス可能
- Storage Policies で細かいアクセス制御
- 期限付き署名URL（Signed URL）を使用

```typescript
// Signed URLの例（認証必要、期限付き）
const { data } = await supabase.storage
  .from('audio-recordings')
  .createSignedUrl('user123/recording.webm', 3600); // 1時間有効
// → https://xxx.supabase.co/storage/v1/object/sign/audio-recordings/user123/recording.webm?token=xxx
```

### フォルダ構造のベストプラクティス

```
audio-recordings/
├── {user_id_1}/
│   ├── recording_1234567890.webm
│   ├── recording_1234567891.webm
│   └── recording_1234567892.webm
├── {user_id_2}/
│   ├── recording_1234567893.webm
│   └── recording_1234567894.webm
└── ...
```

**メリット:**
- ユーザーごとにファイルを分離
- Storage Policies で `(storage.foldername(name))[1] = auth.uid()::text` により自分のフォルダのみアクセス可能
- ファイル管理が容易

### その他の推奨設定

#### File size limit（ファイルサイズ制限）
```
推奨値: 52428800 (50MB)
```
- 1分の音声 ≈ 1-2MB（WebM形式）
- 10分の音声 ≈ 10-20MB
- 長時間録音を想定する場合は調整

#### Allowed MIME types（許可する形式）
```
audio/webm, audio/mp4, audio/ogg, audio/wav
```
- **WebM**: Chrome, Edge, Firefox でサポート、圧縮率が高い（推奨）
- **MP4/AAC**: Safari で推奨
- **OGG**: Firefox, Chrome でサポート
- **WAV**: 無圧縮、ファイルサイズ大

ブラウザ互換性チェック:
```typescript
const getSupportedMimeType = () => {
  const types = [
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/mp4'
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'audio/webm'; // fallback
};
```

### 2. Database テーブル作成

discussions テーブルを作成（存在しない場合）:

```sql
CREATE TABLE IF NOT EXISTS discussions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  audio_file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) を有効化
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーが自分のdiscussionを作成可能
CREATE POLICY "Users can create their own discussions"
ON discussions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 認証済みユーザーが自分のdiscussionを読み取り可能
CREATE POLICY "Users can read their own discussions"
ON discussions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### 3. 環境変数確認

`.env.local` に以下が設定されていることを確認:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📝 使用方法

### 基本的な使い方

```tsx
import { RecordingWithIris } from "@/components/iris/RecordingWithIris";

export default function Page() {
  return (
    <RecordingWithIris 
      width={600}
      height={600}
      transparent={true}
    />
  );
}
```

### カスタマイズ例

```tsx
// 小さいサイズ + UI表示
<RecordingWithIris 
  width={400}
  height={400}
  showUI={true}
  rounded={true}
  shadow={true}
  onRecordingChange={(isRecording) => {
    console.log('録音状態:', isRecording);
  }}
/>

// 全画面モード
<RecordingWithIris fullScreen={true} showUI={true} />
```

## 🎬 動作フロー

1. **球体をクリック** → 録音開始
   - マイクへのアクセス許可を要求
   - 球体が赤色に変化し、音量に反応して振動

2. **再度クリック** → 録音停止
   - 音声データ（WebM形式）を生成
   - Supabase Storageにアップロード
   - discussionsテーブルにレコード作成
   - `/discus/[id]` ページに自動遷移

3. **討論ページ** (`/discus/[id]`)
   - 録音された音声データを取得
   - 音声再生や文字起こしなどの処理

## ⚠️ トラブルシューティング

### マイクにアクセスできない
- ブラウザのマイク許可設定を確認
- HTTPSまたはlocalhost環境で実行していることを確認

### アップロードエラー
- Supabaseのストレージバケット `audio-recordings` が作成されているか確認
- ストレージポリシーが正しく設定されているか確認
- ユーザーが認証済みか確認

### データベースエラー
- `discussions` テーブルが存在するか確認
- テーブルのカラム名が一致しているか確認
- RLSポリシーが正しく設定されているか確認

## 🔄 カスタマイズポイント

### テーブル名やカラム名の変更

`handleRecordingComplete` 関数内を修正:

```typescript
const { data: discussData, error: discussError } = await supabase
  .from('your_table_name') // テーブル名変更
  .insert({
    your_column_name: uploadData.path, // カラム名変更
    // ...
  })
```

### 音声形式の変更

MediaRecorder の mimeType を変更:

```typescript
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/mp4' // または 'audio/ogg', 'audio/wav' など
});
```

ブラウザ対応状況を確認:
```typescript
if (MediaRecorder.isTypeSupported('audio/mp4')) {
  // mp4をサポート
}
```

## 📂 討論ページでの音声ファイル取得方法

`/app/(app)/discus/[id]/page.tsx` での実装例:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase';

export default function DiscusPage({ params }: { params: { id: string } }) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [discussion, setDiscussion] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchDiscussion = async () => {
      // 1. discussionデータを取得
      const { data, error } = await supabase
        .from('discussions')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Error fetching discussion:', error);
        return;
      }

      setDiscussion(data);

      // 2. 署名付きURLを生成（1時間有効）
      const { data: signedUrlData } = await supabase.storage
        .from('audio-recordings')
        .createSignedUrl(data.audio_file_path, 3600);

      if (signedUrlData) {
        setAudioUrl(signedUrlData.signedUrl);
      }
    };

    fetchDiscussion();
  }, [params.id, supabase]);

  if (!discussion || !audioUrl) {
    return <div>読み込み中...</div>;
  }

  return (
    <div>
      <h1>Discussion {params.id}</h1>
      
      {/* 音声プレーヤー */}
      <audio controls src={audioUrl}>
        お使いのブラウザは音声再生に対応していません。
      </audio>

      {/* その他の情報 */}
      <p>作成日時: {new Date(discussion.created_at).toLocaleString()}</p>
    </div>
  );
}
```

### 音声ファイルのダウンロード

```typescript
const downloadRecording = async (filePath: string) => {
  const { data, error } = await supabase.storage
    .from('audio-recordings')
    .download(filePath);

  if (error) {
    console.error('Download error:', error);
    return;
  }

  // Blobをダウンロード
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'recording.webm';
  a.click();
  URL.revokeObjectURL(url);
};
```

## 🎯 運用時のヒント

### 1. ストレージ容量の管理

古い録音データの削除処理:

```typescript
// 30日以上前のファイルを削除
const deleteOldRecordings = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 古いdiscussionを取得
  const { data: oldDiscussions } = await supabase
    .from('discussions')
    .select('id, audio_file_path')
    .lt('created_at', thirtyDaysAgo.toISOString());

  // ファイルを削除
  for (const discussion of oldDiscussions || []) {
    await supabase.storage
      .from('audio-recordings')
      .remove([discussion.audio_file_path]);
    
    // DBレコードも削除
    await supabase
      .from('discussions')
      .delete()
      .eq('id', discussion.id);
  }
};
```

### 2. エラーハンドリング

```typescript
// 詳細なエラーログ
if (uploadError) {
  console.error('Upload failed:', {
    error: uploadError,
    bucket: 'audio-recordings',
    fileName: fileName,
    fileSize: audioBlob.size,
    userId: user?.id
  });
  
  // エラーメッセージをユーザーに表示
  if (uploadError.message.includes('exceeded')) {
    alert('ファイルサイズが大きすぎます（最大50MB）');
  } else if (uploadError.message.includes('permission')) {
    alert('アップロード権限がありません');
  } else {
    alert(`アップロードエラー: ${uploadError.message}`);
  }
}
```

### 3. プログレス表示

長い録音の場合、アップロード進捗を表示:

```typescript
const [uploadProgress, setUploadProgress] = useState(0);

// XMLHttpRequestを使用してプログレスを取得
const uploadWithProgress = async (file: Blob, path: string) => {
  const xhr = new XMLHttpRequest();
  
  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const progress = (e.loaded / e.total) * 100;
      setUploadProgress(progress);
    }
  });

  // 署名付きアップロードURLを取得して使用...
};
```

## 📊 モニタリング

### Supabaseダッシュボードで確認すべき項目

1. **Storage Usage**: ストレージ使用量
2. **API Requests**: APIリクエスト数
3. **Storage Policies**: ポリシーが正しく動作しているか

### ログ監視

```typescript
// フロントエンドでの監視
console.log('Recording started', {
  userId: user?.id,
  timestamp: new Date().toISOString()
});

console.log('Upload completed', {
  filePath: uploadData.path,
  fileSize: audioBlob.size,
  duration: recordingDuration
});
```

## 📚 関連ファイル

- コンポーネント: `/frontend/components/iris/RecordingWithIris.tsx`
- 討論ページ: `/frontend/app/(app)/discus/[id]/page.tsx`
- Supabaseユーティリティ: `/frontend/utils/supabase.ts`
- セットアップガイド: `/frontend/components/iris/RecordingWithIris_SETUP.md`
