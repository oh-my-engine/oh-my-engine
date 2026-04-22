# Oh My Engine

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md)

---

> メモリと学習機能を備えた自己進化型ワークフローエンジン（Claude Code 用）

Oh My Engine は、Claude Code をインテリジェントなワークフローシステムに変換する強力なフレームワークです。使用パターンから学習し、設定を記憶し、自動的に進化してカスタムワークフローを作成します。

## ✨ 機能

- **🧠 メモリシステム**：実行履歴、学習内容、ユーザー設定を記憶
- **🔄 自己進化**：パターンを自動識別し、新しいスキルを生成
- **⚙️ プロジェクト設定**：`.oh-my-engine/` によるプロジェクト単位のワークフローカスタマイズ
- **📋 豊富なワークフロー**：UI 復元、バグ分析、コンポーネント生成、API 統合などのプリセットワークフロー
- **🎯 スマートコンテキスト**：プロジェクト固有のルールと設定を自動読み込み
- **🔧 拡張可能**：特定のニーズに合わせたカスタムワークフローを簡単に作成

## 🚀 クイックスタート

### インストール

#### 方法 1：クイックインストール（推奨）

すべてをインストールする1つのコマンド：

```bash
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash
```

または wget を使用：

```bash
wget -qO- https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash
```

#### 方法 2：クローンしてインストール

```bash
# リポジトリをクローン
git clone https://github.com/oh-my-engine/oh-my-engine.git

# インストールスクリプトを実行
cd oh-my-engine
chmod +x install.sh
./install.sh
```

#### 方法 3：AI でインストール

[INSTALL_WITH_AI.md](INSTALL_WITH_AI.md) のインストールプロンプトをコピーして、任意の AI アシスタント（Claude、ChatGPT など）に貼り付けると、AI がインストールをガイドします。

インストーラーはすべてのスキルを `~/.claude/skills/` にコピーし、Claude Code でグローバルに利用可能にします。

### プロジェクトの初期化

プロジェクトディレクトリで：

```bash
/oh-my-engine-init
```

これにより、以下を含む `.oh-my-engine/` ディレクトリが作成されます：
- `config.json` - ワークフロー設定
- `rules/` - プロジェクト固有のルール
- `memory/` - 実行履歴と学習内容（git で無視）

### 利用可能なコマンド

- `/oh-my-engine-init` - 現在のプロジェクトで Oh My Engine を初期化
- `/oh-my-engine-ui` - デザインファイルやスクリーンショットから UI を復元
- `/oh-my-engine-bug` - コンテキスト付きでバグを分析・修正
- `/oh-my-engine-comp` - 仕様からコンポーネントを生成
- `/oh-my-engine-api` - API を統合し、エラー処理を実装
- `/oh-my-engine-memory` - 実行履歴と学習内容を表示
- `/oh-my-engine-evolve` - パターンを分析し、新しいワークフローを提案

## 📖 ドキュメント

- [アーキテクチャ概要](docs/architecture.md)
- [カスタムワークフローの作成](docs/custom-workflows.md)
- [設定ガイド](docs/configuration.md)
- [メモリシステム](docs/memory-system.md)
- [進化メカニズム](docs/evolution.md)

## 🎯 例

### React Native プロジェクト

[examples/react-native](examples/react-native) で完全な設定例を参照してください：
- 多言語サポートのための i18n ルール
- テーマシステム統合
- デザイントークン
- コードスタイルガイドライン

### カスタムワークフロー

```markdown
---
name: oh-my-engine-deploy
description: プリフライトチェック付きアプリケーションデプロイ
---

# デプロイワークフロー

## コンテキスト読み込み
1. `.oh-my-engine/config.json` を読み込み
2. デプロイ設定を確認
3. 環境変数を検証

## プリフライトチェック
- テストを実行
- ビルドステータスを確認
- 依存関係を検証

## デプロイ
- プロダクションバンドルをビルド
- 設定された環境にデプロイ
- デプロイログを更新

## デプロイ後
- 実行をメモリに保存
- 学習内容を更新
```

## 🏗️ アーキテクチャ

```
~/.claude/skills/           # グローバルスキル（install.sh でインストール）
├── oh-my-engine/          # コアフレームワーク
├── oh-my-engine-init/     # プロジェクト初期化
├── oh-my-engine-ui/       # UI 復元ワークフロー
├── oh-my-engine-bug/      # バグ分析ワークフロー
├── oh-my-engine-comp/     # コンポーネント生成ワークフロー
├── oh-my-engine-api/      # API 統合ワークフロー
├── oh-my-engine-memory/   # メモリビューア
└── oh-my-engine-evolve/   # 進化アナライザー

project/
└── .oh-my-engine/         # プロジェクト固有の設定
    ├── config.json        # ワークフロー設定
    ├── rules/             # プロジェクトルール（git にコミット）
    └── memory/            # 実行履歴（git で無視）
```

## 🤝 コントリビューション

コントリビューションを歓迎します！お気軽にプルリクエストを送信してください。

1. リポジトリをフォーク
2. フィーチャーブランチを作成（`git checkout -b feature/amazing-feature`）
3. 変更をコミット（`git commit -m 'Add amazing feature'`）
4. ブランチにプッシュ（`git push origin feature/amazing-feature`）
5. プルリクエストを開く

## 📝 ライセンス

MIT ライセンス - 詳細は [LICENSE](LICENSE) ファイルを参照

## 🙏 謝辞

Anthropic の [Claude Code](https://claude.ai/code) 用に構築されました。

---

**注意**：Oh My Engine を使用するには Claude Code が必要です。このフレームワークを使用する前に、Claude Code がインストールされ、設定されていることを確認してください。
