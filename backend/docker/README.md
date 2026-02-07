# Iris Backend Docker環境

このディレクトリには、Iris BackendをDockerコンテナ化するための設定ファイルが含まれています。

## 📁 ファイル構成

- `dockerfile` - マルチステージビルドを使用したDockerfile（ベストプラクティス準拠）
- `docker-compose.yml` - Docker Composeの設定ファイル
- `.dockerignore` - Dockerビルド時に除外するファイル・ディレクトリの指定

## 🚀 使い方

### Docker Composeを使用する場合（推奨）

```bash
# dockerディレクトリに移動
cd docker

# ビルドと起動
docker-compose up -d --build

# ログの確認
docker-compose logs -f backend

# 停止
docker-compose down

# 完全削除（ボリュームも含む）
docker-compose down -v
```

### Dockerコマンドを直接使用する場合

```bash
# イメージのビルド
docker build -t iris-backend:latest -f docker/dockerfile .

# コンテナの起動
docker run -d \
  --name iris-backend \
  -p 8080:8080 \
  iris-backend:latest

# ログの確認
docker logs -f iris-backend

# コンテナの停止と削除
docker stop iris-backend
docker rm iris-backend
```

## 🔍 ヘルスチェック

コンテナにはヘルスチェック機能が組み込まれています。

```bash
# ヘルスチェック状態の確認
docker ps

# 直接エンドポイントにアクセス
curl http://localhost:8080/health
```

## 🛡️ セキュリティのベストプラクティス

このDockerfileは以下のセキュリティベストプラクティスに従っています：

1. **マルチステージビルド** - ビルドツールを最終イメージから除外
2. **非rootユーザー** - `appuser`として実行（セキュリティリスクの軽減）
3. **最小限のベースイメージ** - `python:3.12-slim`を使用（攻撃対象面の縮小）
4. **キャッシュの最適化** - レイヤーキャッシングを活用した高速ビルド
5. **不要ファイルの除外** - `.dockerignore`による効率的なビルド

## 📝 環境変数

環境変数は以下の方法で設定できます：

1. `docker-compose.yml`の`environment`セクション
2. `.env`ファイル（`docker-compose.yml`で`env_file`を有効化）
3. Dockerコマンドの`-e`オプション

## 🔧 カスタマイズ

### ポート番号の変更

`docker-compose.yml`または`docker run`コマンドでポートマッピングを変更してください。

```yaml
# docker-compose.yml
ports:
  - "3000:8080"  # ホスト:コンテナ
```

### 開発環境での使用

開発時にホットリロードを有効にする場合は、ボリュームマウントを追加してください。

```yaml
# docker-compose.ymlに追加
volumes:
  - ../backend/app:/app
```

## 🐛 トラブルシューティング

### コンテナが起動しない場合

```bash
# ログを確認
docker-compose logs backend

# コンテナに入って調査
docker-compose exec backend /bin/bash
```

### ポートが既に使用されている場合

`docker-compose.yml`のポートマッピングを変更するか、既存のプロセスを停止してください。

```bash
# ポート8080を使用しているプロセスを確認
lsof -i :8080
```

## 📚 参考資料

- [Docker公式ドキュメント](https://docs.docker.com/)
- [FastAPI Dockerデプロイメントガイド](https://fastapi.tiangolo.com/deployment/docker/)
- [Pythonコンテナのベストプラクティス](https://docs.docker.com/language/python/build-images/)
