# 🤖 Install Oh My Engine with AI

You can install Oh My Engine in multiple ways. The current model is:

1. Install the `ome` CLI with npm or from a local GitHub clone.
2. Optionally install Claude Code/Codex skills for native agent entry points.
3. Run `ome init && ome rules sync` inside each target project.

## 🚀 CLI Install (Recommended)

Install the CLI:

```bash
npm install -g oh-my-engine
ome --help
```

Initialize a project:

```bash
cd your-project
ome init
ome doctor
ome rules sync
```

## 🧩 Optional Claude Code / Codex Skills

If you also want native Claude Code slash commands or Codex skill-name entry points, install skills from a GitHub clone:

```bash
git clone https://github.com/oh-my-engine/oh-my-engine.git
cd oh-my-engine
npm install
npm run build
npm link

./install.sh --agent claude
./install.sh --agent codex
./install.sh --agent both
```

The quick installer copies skills only:

```bash
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent both
```

---

## 🤖 AI-Assisted Installation

You can also install Oh My Engine by simply copying and pasting this prompt to any AI assistant (Claude, ChatGPT, etc.):

---

## Installation Prompt (English)

```
Please help me install Oh My Engine, a TypeScript-driven workflow engine for Claude Code, Codex, Trae, Cursor, Windsurf, OpenCode, Qoder, and Antigravity.

Follow these steps:

1. Install the CLI:
   npm install -g oh-my-engine

   If npm package installation is not available, install from GitHub:
   git clone https://github.com/oh-my-engine/oh-my-engine.git
   cd oh-my-engine
   npm install
   npm run build
   npm link

2. Optionally install Claude Code/Codex skills from the cloned repo:
   ./install.sh --agent claude   # Claude Code only
   ./install.sh --agent codex    # Codex only
   ./install.sh --agent both     # Both agents

3. Initialize it in my project:
   cd /path/to/my-project
   ome init
   ome doctor
   ome rules sync

4. Explain tool-specific usage:
   - Claude Code: /ome-init and CLAUDE.md from ome rules sync
   - Codex: skill names such as ome-init and AGENTS.md from ome rules sync
   - Trae/Cursor/Windsurf/OpenCode/Qoder/Antigravity: generated rule files from ome rules sync

5. Show me the main commands: ome spec, ome guidance, ome memory, and ome evolve.

If you encounter any issues, help me troubleshoot them.
```

---

## 安装提示词（中文）

```
请帮我安装 Oh My Engine，这是一个 TypeScript 驱动、支持 Claude Code / Codex / Trae / Cursor / Windsurf / OpenCode / Qoder / Antigravity 的工作流引擎。

按照以下步骤操作：

1. 安装 CLI：
   npm install -g oh-my-engine

   如果 npm 包还不可用，则从 GitHub 安装：
   git clone https://github.com/oh-my-engine/oh-my-engine.git
   cd oh-my-engine
   npm install
   npm run build
   npm link

2. 可选：从克隆仓库安装 Claude Code / Codex skills：
   ./install.sh --agent claude
   ./install.sh --agent codex
   ./install.sh --agent both

3. 在我的项目中初始化：
   cd /path/to/my-project
   ome init
   ome doctor
   ome rules sync

4. 解释不同工具的用法：
   - Claude Code：可用 /ome-init，并读取 ome rules sync 生成的 CLAUDE.md
   - Codex：按 ome-init 等 skill 名触发，并读取 AGENTS.md
   - Trae / Cursor / Windsurf / OpenCode / Qoder / Antigravity：读取 ome rules sync 生成的规则文件

5. 展示主要命令：ome spec、ome guidance、ome memory、ome evolve。

如果遇到任何问题，请帮我排查。
```

---

## インストールプロンプト（日本語）

```
Claude Code と Codex 用の自己進化型ワークフローフレームワーク「Oh My Engine」のインストールを手伝ってください。

以下の手順に従ってください：

1. リポジトリをクローン：
   git clone https://github.com/oh-my-engine/oh-my-engine.git
   cd oh-my-engine

2. インストールスクリプトを実行：
   chmod +x install.sh
   ./install.sh

   必要なら次も使えます：
   ./install.sh --agent claude
   ./install.sh --agent codex
   ./install.sh --agent both

3. インストール後、プロジェクトで初期化：
   - プロジェクトディレクトリに移動
   - Claude Code では実行：/ome-init
   - Codex ではスキル名で呼び出す：ome-init

4. Oh My Engine の機能と利用可能なコマンドを説明してください。

問題が発生した場合は、トラブルシューティングを手伝ってください。
```

---

## 설치 프롬프트 (한국어)

```
Claude Code와 Codex를 위한 자체 진화 워크플로우 프레임워크인 Oh My Engine 설치를 도와주세요.

다음 단계를 따라주세요:

1. 저장소 클론:
   git clone https://github.com/oh-my-engine/oh-my-engine.git
   cd oh-my-engine

2. 설치 스크립트 실행:
   chmod +x install.sh
   ./install.sh

   필요하면 다음도 사용할 수 있습니다:
   ./install.sh --agent claude
   ./install.sh --agent codex
   ./install.sh --agent both

3. 설치 후 프로젝트에서 초기화:
   - 프로젝트 디렉토리로 이동
   - Claude Code: /ome-init
   - Codex: ome-init

4. Oh My Engine의 기능과 사용 가능한 명령어를 설명해주세요.

문제가 발생하면 문제 해결을 도와주세요.
```

---

## Prompt de instalación (Español)

```
Por favor ayúdame a instalar Oh My Engine, un framework de flujo de trabajo auto-evolutivo para Claude Code y Codex.

Sigue estos pasos:

1. Clonar el repositorio:
   git clone https://github.com/oh-my-engine/oh-my-engine.git
   cd oh-my-engine

2. Ejecutar el script de instalación:
   chmod +x install.sh
   ./install.sh

   Si hace falta, también puedo usar:
   ./install.sh --agent claude
   ./install.sh --agent codex
   ./install.sh --agent both

3. Después de la instalación, inicialízalo en mi proyecto:
   - Navega a mi directorio de proyecto
   - En Claude Code: /ome-init
   - En Codex: invoca la skill por nombre: ome-init

4. Explica qué hace Oh My Engine y muéstrame los comandos disponibles.

Si encuentras algún problema, ayúdame a solucionarlo.
```

---

## Invite d'installation (Français)

```
Aidez-moi à installer Oh My Engine, un framework de workflow auto-évolutif pour Claude Code et Codex.

Suivez ces étapes :

1. Cloner le dépôt :
   git clone https://github.com/oh-my-engine/oh-my-engine.git
   cd oh-my-engine

2. Exécuter le script d'installation :
   chmod +x install.sh
   ./install.sh

   Si besoin, je peux aussi utiliser :
   ./install.sh --agent claude
   ./install.sh --agent codex
   ./install.sh --agent both

3. Après l'installation, initialisez-le dans mon projet :
   - Accédez à mon répertoire de projet
   - Dans Claude Code : /ome-init
   - Dans Codex : invoquez la skill par son nom : ome-init

4. Expliquez ce que fait Oh My Engine et montrez-moi les commandes disponibles.

Si vous rencontrez des problèmes, aidez-moi à les résoudre.
```

---

## Why Install with AI?

Installing with AI assistance provides several benefits:

- **Guided Installation**: AI walks you through each step
- **Automatic Troubleshooting**: AI can detect and fix common issues
- **Contextual Help**: AI explains what each command does
- **Project-Specific Setup**: AI can customize the setup for your project
- **Learning Experience**: Understand what's happening during installation

## Alternative: Manual Installation

If you prefer manual installation:

```bash
# Clone the repository
git clone https://github.com/oh-my-engine/oh-my-engine.git
cd oh-my-engine

# Run the installer
chmod +x install.sh
./install.sh

# Initialize in your project
cd /path/to/your/project
# Then in Claude Code, run: /ome-init
```

## Verification

After installation, verify it worked:

1. Run `ome --help`
2. Run `ome doctor` in a project initialized with `ome init`
3. If you installed Claude Code commands, type `/ome` and press Tab
4. If you installed Codex skills, invoke `ome-init` or `ome-bug` by skill name

## Need Help?

- 📖 [Documentation](https://github.com/oh-my-engine/oh-my-engine)
- 🐛 [Report Issues](https://github.com/oh-my-engine/oh-my-engine/issues)
- 💬 [Discussions](https://github.com/oh-my-engine/oh-my-engine/discussions)
