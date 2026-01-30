# 🗄️ Storage & Database 設計ドキュメント

音声録音機能のためのSupabase設定

---

## 📦 1. Storage（ストレージ）設計

### バケット作成

```
バケット名: audio-recordings
Public bucket: OFF (重要！)
File size limit: 52428800 (50MB)
Allowed MIME types: audio/webm, audio/mp4, audio/ogg
```

### フォルダ構造

```
audio-recordings/
├── {user_id_1}/
│   ├── recording_1234567890.webm
│   └── recording_1234567891.webm
├── {user_id_2}/
│   └── recording_1234567892.webm
└── ...
```

**ルール:**
- ユーザーIDをフォルダ名として使用
- ファイル名形式: `recording_{timestamp}.webm`
- 完全なパス例: `550e8400-e29b-41d4-a716-446655440000/recording_1705123456789.webm`

### Storage Policies

#### INSERT（アップロード権限）
```sql
CREATE POLICY "Users can upload their own recordings"
ON storage.objects 
FOR INSERT 
TO authenticated　  
WITH CHECK (
  bucket_id = 'audio-recordings' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### SELECT（読み取り権限）
```sql
CREATE POLICY "Users can read their own recordings"
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'audio-recordings' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### UPDATE（更新権限）- オプション
```sql
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

#### DELETE（削除権限）- オプション
```sql
CREATE POLICY "Users can delete their own recordings"
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'audio-recordings' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 🗃️ 2. Database（データベース）設計

### discussions テーブル

```sql
CREATE TABLE discussions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audio_file_path TEXT NOT NULL,
  title TEXT,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX idx_discussions_user_id ON discussions(user_id);
CREATE INDEX idx_discussions_created_at ON discussions(created_at DESC);
CREATE INDEX idx_discussions_status ON discussions(status);

-- 更新日時の自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discussions_updated_at 
  BEFORE UPDATE ON discussions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### カラム説明

| カラム名 | 型 | 説明 | 必須 |
|---------|-----|------|------|
| `id` | UUID | 主キー、自動生成 | ✅ |
| `user_id` | UUID | ユーザーID（auth.users参照） | ✅ |
| `audio_file_path` | TEXT | Storageのファイルパス | ✅ |
| `title` | TEXT | 討論のタイトル | ❌ |
| `description` | TEXT | 討論の説明 | ❌ |
| `status` | TEXT | ステータス（active/archived/deleted） | ✅ |
| `created_at` | TIMESTAMP | 作成日時 | ✅ |
| `updated_at` | TIMESTAMP | 更新日時 | ✅ |

### Row Level Security (RLS) Policies

```sql
-- RLS有効化
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- INSERT: 認証済みユーザーが自分のdiscussionを作成可能
CREATE POLICY "Users can create their own discussions"
ON discussions 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- SELECT: 認証済みユーザーが自分のdiscussionを閲覧可能
CREATE POLICY "Users can read their own discussions"
ON discussions 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- UPDATE: 認証済みユーザーが自分のdiscussionを更新可能
CREATE POLICY "Users can update their own discussions"
ON discussions 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: 認証済みユーザーが自分のdiscussionを削除可能
CREATE POLICY "Users can delete their own discussions"
ON discussions 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);
```

---

## 🔄 3. データフロー

### 録音 → 保存 → 表示の流れ

```
1. ユーザーが録音開始
   ↓
2. MediaRecorder で音声データを記録
   ↓
3. 録音停止時、Blob生成
   ↓
4. Storage にアップロード
   - バケット: audio-recordings
   - パス: {user_id}/recording_{timestamp}.webm
   ↓
5. discussions テーブルに INSERT
   - audio_file_path: Storage のパス
   - user_id: 現在のユーザーID
   ↓
6. /discus/{discussion_id} に画面遷移
   ↓
7. 討論ページで音声ファイルを取得
   - discussions テーブルから audio_file_path 取得
   - Storage から署名付きURL生成
   - audio要素で再生
```

### コード例

#### アップロード（コンポーネント側）
```typescript
// 1. Storage にアップロード
const fileName = `${user.id}/recording_${Date.now()}.webm`;
const { data: uploadData } = await supabase.storage
  .from('audio-recordings')
  .upload(fileName, audioBlob, {
    contentType: 'audio/webm',
    upsert: false
  });

// 2. discussions テーブルに保存
const { data: discussData } = await supabase
  .from('discussions')
  .insert({
    audio_file_path: uploadData.path,
    user_id: user.id
  })
  .select()
  .single();

// 3. 画面遷移
router.push(`/discus/${discussData.id}`);
```

#### 取得（討論ページ側）
```typescript
// 1. discussions データ取得
const { data: discussion } = await supabase
  .from('discussions')
  .select('*')
  .eq('id', discussionId)
  .single();

// 2. 署名付きURL生成（1時間有効）
const { data: signedUrlData } = await supabase.storage
  .from('audio-recordings')
  .createSignedUrl(discussion.audio_file_path, 3600);

// 3. 音声再生
<audio controls src={signedUrlData.signedUrl} />
```

---

## 🔒 4. セキュリティ設計

### Storage セキュリティ

| 項目 | 設定 | 理由 |
|------|------|------|
| Public bucket | ❌ OFF | 認証ユーザーのみアクセス可能 |
| Folder structure | `{user_id}/` | ユーザーごとに隔離 |
| Policies | `auth.uid()` 一致のみ | 他ユーザーのファイルにアクセス不可 |
| URL type | Signed URL | 期限付き、トークン付き |

### Database セキュリティ

| 項目 | 設定 | 理由 |
|------|------|------|
| RLS | ✅ ON | 行レベルでアクセス制御 |
| Policies | `auth.uid() = user_id` | 自分のデータのみアクセス可能 |
| Foreign Key | `ON DELETE CASCADE` | ユーザー削除時に関連データも削除 |
| Status | enum制約 | 不正な値を防ぐ |

### アクセス制御マトリクス

|  | Storage | Database |
|---|---------|----------|
| **自分のデータ** | ✅ Read/Write | ✅ CRUD |
| **他人のデータ** | ❌ アクセス不可 | ❌ アクセス不可 |
| **未認証ユーザー** | ❌ アクセス不可 | ❌ アクセス不可 |

---

## 📊 5. 容量・パフォーマンス設計

### ストレージ見積もり

```
音声形式: WebM（Opus codec）
平均ビットレート: 24-32 kbps

1分の録音 ≈ 1.8 MB
5分の録音 ≈ 9 MB
10分の録音 ≈ 18 MB
```

### 推奨設定

| 項目 | 推奨値 | 備考 |
|------|--------|------|
| File size limit | 50MB | 約27分の録音 |
| Signed URL有効期限 | 3600秒（1時間） | 再生には十分 |
| インデックス | user_id, created_at | 検索パフォーマンス向上 |

### スケーラビリティ

```
想定ユーザー数: 10,000人
平均録音数/ユーザー: 10件
平均ファイルサイズ: 5MB

必要容量 = 10,000 × 10 × 5MB = 500GB
```

---

## 🧹 6. メンテナンス設計

### 古いファイルの自動削除

```sql
-- 90日以上前のdiscussionを検索する関数
CREATE OR REPLACE FUNCTION delete_old_discussions()
RETURNS void AS $$
DECLARE
  old_discussion RECORD;
BEGIN
  FOR old_discussion IN 
    SELECT id, audio_file_path 
    FROM discussions 
    WHERE created_at < NOW() - INTERVAL '90 days'
  LOOP
    -- Storageからファイル削除（アプリケーション側で実行）
    -- DBレコード削除
    DELETE FROM discussions WHERE id = old_discussion.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### バックアップ戦略

1. **Database**: Supabase自動バックアップ（有料プラン）
2. **Storage**: 定期的なエクスポート推奨
3. **重要データ**: 外部ストレージへのコピー

---

## ✅ セットアップチェックリスト

### Storage
- [ ] バケット `audio-recordings` 作成
- [ ] Public: OFF に設定
- [ ] File size limit: 50MB に設定
- [ ] Allowed MIME types 設定
- [ ] INSERT Policy 追加
- [ ] SELECT Policy 追加
- [ ] UPDATE Policy 追加（オプション）
- [ ] DELETE Policy 追加（オプション）

### Database
- [ ] `discussions` テーブル作成
- [ ] インデックス作成
- [ ] updated_at トリガー作成
- [ ] RLS 有効化
- [ ] INSERT Policy 追加
- [ ] SELECT Policy 追加
- [ ] UPDATE Policy 追加
- [ ] DELETE Policy 追加

### 動作確認
- [ ] 認証ユーザーでアップロード成功
- [ ] 自分のファイルが表示される
- [ ] 他人のファイルにアクセスできない
- [ ] 未認証ユーザーがアクセスできない
- [ ] 署名付きURLで音声再生可能

---

## 📝 SQL実行順序

```sql
-- 1. テーブル作成
CREATE TABLE discussions (...);

-- 2. インデックス作成
CREATE INDEX idx_discussions_user_id ON discussions(user_id);
CREATE INDEX idx_discussions_created_at ON discussions(created_at DESC);
CREATE INDEX idx_discussions_status ON discussions(status);

-- 3. トリガー関数作成
CREATE OR REPLACE FUNCTION update_updated_at_column() ...;

-- 4. トリガー設定
CREATE TRIGGER update_discussions_updated_at ...;

-- 5. RLS有効化
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- 6. RLSポリシー追加
CREATE POLICY "Users can create their own discussions" ...;
CREATE POLICY "Users can read their own discussions" ...;
CREATE POLICY "Users can update their own discussions" ...;
CREATE POLICY "Users can delete their own discussions" ...;
```

Storageポリシーは、Supabaseダッシュボードの Storage → Policies から追加してください。
