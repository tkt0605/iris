# バックエンドフレームワーク検証：Django vs FastAPI

## 現在のbackendの実態

| ファイル | 中身 |
|---|---|
| `api/views.py` | 空（viewsなし） |
| `api/models.py` | 空（modelなし） |
| `config/urls.py` | adminルートのみ |
| `main.py` | `print("Hello from backend!")` のみ |

**Djangoは一切使われていない。**

## LLM処理の実態

```
frontend/app/api/llm/route.ts  ← ここでGemini APIを直接呼んでいる
frontend/utils/supabase.ts     ← 認証もfrontend側のSupabaseで完結
```

Djangoが担うべき仕事がそもそも存在していない状態。

---

## 仮説の評価：Django は過剰（FastAPI が妥当）

| 観点 | Django | FastAPI |
|---|---|---|
| 現在の使用機能 | admin・ORM・auth・session・template | **すべて未使用** |
| 起動時の読み込み | INSTALLED_APPSを全部初期化 | 必要な分だけ |
| 非同期サポート | 後付け（ASGI化が必要） | **ネイティブ非同期** |
| LLM連携との相性 | 悪い（同期前提の設計） | **良い（async/await前提）** |
| 移行コスト | - | **ゼロ（実装が空のため）** |

---

## 結論

- Django は過剰であることが確認された
- 実装がゼロのため、FastAPI への移行コストもゼロ
- LLM・非同期処理との相性からも FastAPI が適切

## 未解決の問い

backendに今後何をやらせるか次第で最終判断が変わる。

- DB操作（PostgreSQL）をbackend経由にするか
- 認証をSupabaseだけで完結させるか、backend側でも持つか
- 音声処理（Whisper等）をbackendに移すか
