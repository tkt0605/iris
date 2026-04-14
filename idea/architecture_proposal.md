# IRISアーキテクチャ設計案

## 構成概要

```
Browser
  │  音声入力・UI表示
  ↓
Next.js（Frontend）
  │  STT（Whisper）・認証・画面遷移
  ↓
FastAPI（Backend）          ← Dockerネットワーク内
  │  LLM通信・会話履歴管理・DB操作
  ↓
Ollama（Gemma 4）  PostgreSQL
```

---

## 各サービスの責務

### Frontend（Next.js）

| 処理 | 備考 |
|---|---|
| UI・画面遷移 | 本来の役割 |
| 音声録音 | ブラウザのMicrophone API |
| Whisper STT | `@xenova/transformers` で既にpackage.jsonに存在、ブラウザで完結 |
| Supabase認証 | 既存実装をそのまま活かす |
| FastAPIへのリクエスト送信 | テキスト化した発言を渡すだけ |

### Backend（FastAPI）

| 処理 | 備考 |
|---|---|
| Ollamaへのリクエスト中継 | OllamaはDockerネットワーク内のみ到達可能 |
| 会話履歴の保存・取得 | PostgreSQL経由、リロードで消えない |
| ストリーミングレスポンス | FastAPIの非同期が活きる |
| ユーザーごとの会話管理 | サーバーサイドで一元管理 |

### Ollama

- Gemma 4 の推論エンジン
- Docker内部ネットワークでFastAPIからのみ接続
- OpenAI互換APIを提供するためコード変更が最小限

### PostgreSQL

- 会話履歴の永続化

### Supabase

- ユーザー認証（外部サービス）

---

## 移行方針

### Gemini → Gemma 4（Ollama）

```typescript
// 変更前：Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
ai.models.generateContent({ model: "gemini-2.5-flash", ... })

// 変更後：Ollama（FastAPI経由）
const response = await fetch("http://localhost:8000/api/llm", {
  method: "POST",
  body: JSON.stringify({ userText, conversationHistory })
})
```

### Django → FastAPI

- 現状のDjangoは実装ゼロのため移行コストなし
- FastAPIはネイティブ非同期でLLM・ストリーミングに適している

### `app/api/llm/route.ts` の扱い

- FastAPI移行後は削除
- LLM通信・タイトル生成はFastAPIのエンドポイントに統一

---

## ハードウェア前提

- MacBook Pro M5 Pro / メモリ48GB / ストレージ1TB
- Gemma 4 27B（量子化版）でも快適に動作可能
- OllamaはApple Silicon（Metal）に最適化済み

---

## 未解決の問い

- Whisper STTはブラウザ側（@xenova/transformers）で完結させるか、FastAPI側に移すか
- 会話履歴のスキーマ設計（ユーザーID・セッション・メッセージ）
- Gemma 4の日本語精度がGemini 2.5 Flashと比較して許容範囲か（要検証）
