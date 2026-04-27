# Oh My Engine

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md)

---

> Current usage note: `ome` is the TypeScript-driven source of truth. Install the CLI with `npm install -g oh-my-engine`, initialize projects with `ome init && ome rules sync`, and use optional Claude Code/Codex skills only for native agent entry points. See [docs/installation-and-usage.md](docs/installation-and-usage.md).

> メモリと学習機能を備えた自己進化型ワークフローエンジン（Claude Code and Codex 用）

Oh My Engine は、Claude Code and Codex をインテリジェントなワークフローシステムに変換する強力なフレームワークです。使用パターンから学習し、設定を記憶し、自動的に進化してカスタムワークフローを作成します。

## ✨ 機能

- **🧠 メモリシステム**：実行履歴、学習内容、ユーザー設定を記憶
- **🔄 自己進化**：パターンを自動識別し、新しいスキルを生成
- **⚙️ プロジェクト設定**：`.ome/` によるプロジェクト単位のワークフローカスタマイズ
- **📋 豊富なワークフロー**：UI 復元、バグ分析、コンポーネント生成、API 統合などのプリセットワークフロー
- **📝 Spec モード**：変更提案、計画、適用、検証、アーカイブを行う OpenSpec 互換ワークフロー
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

**特定のエージェント向けにインストール:**

```bash
# Claude Code のみ
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent claude

# Codex のみ
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent codex

# 両方
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent both
```

#### 方法 2：クローンしてインストール

```bash
# リポジトリをクローン
git clone https://github.com/oh-my-engine/oh-my-engine.git

# インストールスクリプトを実行
cd oh-my-engine
chmod +x install.sh

# エージェントを自動検出
./install.sh

# またはエージェントを明示
./install.sh --agent claude   # Claude Code のみ
./install.sh --agent codex    # Codex のみ
./install.sh --agent both     # 両方のエージェント
```

#### 方法 3：AI でインストール

[INSTALL_WITH_AI.md](INSTALL_WITH_AI.md) のインストールプロンプトをコピーして、任意の AI アシスタント（Claude、ChatGPT など）に貼り付けると、AI がインストールをガイドします。

インストーラーはすべてのスキルを `~/.claude/skills/` および/または `~/.codex/skills/` にコピーします。

Claude Code ではインストール済みワークフローを slash command として呼び出せます。
Codex ではスキル名で呼び出してください。`/oh-my-engine-*` が使える前提にはしないでください。

### プロジェクトの初期化

プロジェクトディレクトリで：

**Claude Code:**
```bash
/ome-init
```

**Codex:**
```bash
ome-init
```

これにより、以下を含む `.ome/` ディレクトリが作成されます：
- `config.json` - ワークフロー設定
- `rules/` - プロジェクト固有のルール
- `memory/` - 実行履歴と学習内容（git で無視）

あわせて、長期仕様と進行中の変更のための `openspec/` ワークスペースも作成されます：
- `project.md` - プロジェクトレベルのコンテキスト
- `changes/` - 進行中の変更
- `specs/` - 安定した capability spec
- `archive/` - 完了した変更

### 利用可能なコマンド

- Claude Code: `/ome-init`、`/ome-ui`、`/ome-bug`、`/ome-comp`、`/ome-api`、`/ome-spec`、`/ome-memory`、`/ome-evolve`
- Codex のスキル名: `ome-init`、`ome-ui`、`ome-bug`、`ome-comp`、`ome-api`、`ome-spec`、`ome-memory`、`ome-evolve`

### Spec ワークフロー

```bash
# spec ワークスペースを初期化
ome spec init

# PRD 入力とオペレーター意図を取り込む
ome spec import user-authentication

# 取り込んだコンテキストから proposal/design/tasks/spec delta を準備
ome spec decompose user-authentication

# 手動 scaffold パスも引き続き利用可能
ome spec propose user-authentication

# 実行コンテキストを精緻化して読み込む
ome spec plan user-authentication
ome spec apply user-authentication
ome spec apply user-authentication --task "Implement the change"
ome spec status user-authentication

# 変更を検証してアーカイブ
ome spec verify user-authentication
ome spec archive user-authentication
```

`import` は、正規化されたソーステキスト、プロンプト、来歴情報、コピーした添付ファイルを `openspec/changes/<change-id>/context/` に保存します。`decompose` は、その intake コンテキストを `analysis.md`、`proposal.md`、`design.md`、`tasks.md`、spec delta に変換し、ソース参照を変更に紐付けたまま保持します。`apply` はライフサイクル状態を更新し、タスクや受け入れ条件の進捗を反映しつつ、エージェントが読み込むべきファイルを表示します。プロダクションコードは自動生成しません。`status` は現在のフェーズと残件を要約します。`archive` は初回受け入れ時に長期 capability spec を作成し、受け入れ済み delta から canonical な summary、requirements、compatibility を再構築し、現在の受け入れ snapshot と履歴の両方を保持します。
`.ome/config.json` の `workflows.spec.options.verifyCommands` に実際のプロジェクトチェックを追加できます。`verify` はそれらを順番に実行し、最初の非ゼロ終了で失敗します。さらに、未解決の `TBD:` マーカーをブロックし、各 spec delta に対して変更タイプがちょうど 1 つ選択されていること、少なくとも 1 つの具体的な requirement と WHEN/THEN シナリオがあることを要求します。

## 📖 ドキュメント

- [アーキテクチャ概要](docs/architecture.md)
- [プロンプト駆動 Spec Intake アーキテクチャ](docs/spec-intake-architecture.md)
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
1. `.ome/config.json` を読み込み
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
~/.claude/skills/           # Claude Code のスキル
~/.codex/skills/            # Codex のスキル
├── oh-my-engine/          # コアフレームワーク
├── ome-init/     # プロジェクト初期化
├── ome-ui/       # UI 復元ワークフロー
├── ome-bug/      # バグ分析ワークフロー
├── ome-comp/     # コンポーネント生成ワークフロー
├── ome-api/      # API 統合ワークフロー
├── ome-spec/     # OpenSpec 互換の spec ワークフロー
├── ome-memory/   # メモリビューア
└── ome-evolve/   # 進化アナライザー

project/
├── .ome/         # プロジェクト固有の設定とメモリ
│   ├── config.json        # ワークフロー設定
│   ├── rules/             # プロジェクトルール（git にコミット）
│   └── memory/            # 実行履歴（git で無視）
└── openspec/              # OpenSpec 互換ワークスペース
    ├── project.md         # プロジェクトコンテキスト
    ├── changes/           # 進行中の変更
    │   └── <change-id>/context/  # 取り込んだ PRD、プロンプト、分析、参照、添付ファイル
    ├── specs/             # 安定した capability spec
    └── archive/           # 完了した変更
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

Anthropic の [Claude Code](https://claude.ai/code) と [Codex](https://codex.dev) 用に構築されました。

---

**注意**：Oh My Engine を使用するには Claude Code または Codex が必要です。このフレームワークを使用する前に、少なくとも一方がインストールされ、設定されていることを確認してください。
