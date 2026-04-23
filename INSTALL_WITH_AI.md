# 🤖 Install Oh My Engine with AI

You can install Oh My Engine in multiple ways. Choose the method that works best for you:

## 🚀 Quick Install (Easiest)

Just run this one command:

```bash
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash
```

Or with wget:

```bash
wget -qO- https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash
```

**Install for specific agent:**

```bash
# For Claude Code only
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent claude

# For Codex only
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent codex

# For both
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent both
```

---

## 🤖 AI-Assisted Installation

You can also install Oh My Engine by simply copying and pasting this prompt to any AI assistant (Claude, ChatGPT, etc.):

---

## Installation Prompt (English)

```
Please help me install Oh My Engine, a self-evolving workflow framework for Claude Code and Codex.

Follow these steps:

1. Clone the repository:
   git clone https://github.com/oh-my-engine/oh-my-engine.git
   cd oh-my-engine

2. Run the installation script:
   chmod +x install.sh
   ./install.sh

   The installer will auto-detect whether I have Claude Code, Codex, or both installed.
   If I want to specify which agent to install for, I can use:
   ./install.sh --agent claude   # Claude Code only
   ./install.sh --agent codex    # Codex only
   ./install.sh --agent both     # Both agents

3. After installation, initialize it in my project:
   - Navigate to my project directory
   - In Claude Code, run: /oh-my-engine-init
   - In Codex, invoke the installed skill by name: oh-my-engine-init

4. Explain what Oh My Engine does and show me the available commands.

If you encounter any issues, help me troubleshoot them.
```

---

## 安装提示词（中文）

```
请帮我安装 Oh My Engine，这是一个为 Claude Code 和 Codex 设计的自我进化工作流框架。

按照以下步骤操作：

1. 克隆仓库：
   git clone https://github.com/oh-my-engine/oh-my-engine.git
   cd oh-my-engine

2. 运行安装脚本：
   chmod +x install.sh
   ./install.sh

   如果需要，也可以显式指定：
   ./install.sh --agent claude
   ./install.sh --agent codex
   ./install.sh --agent both

3. 安装完成后，在我的项目中初始化：
   - 进入我的项目目录
   - 如果是 Claude Code，运行：/oh-my-engine-init
   - 如果是 Codex，按技能名触发：oh-my-engine-init

4. 解释 Oh My Engine 的功能并展示可用的命令。

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
   - Claude Code では実行：/oh-my-engine-init
   - Codex ではスキル名で呼び出す：oh-my-engine-init

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
   - Claude Code: /oh-my-engine-init
   - Codex: oh-my-engine-init

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
   - En Claude Code: /oh-my-engine-init
   - En Codex: invoca la skill por nombre: oh-my-engine-init

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
   - Dans Claude Code : /oh-my-engine-init
   - Dans Codex : invoquez la skill par son nom : oh-my-engine-init

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
# Then in Claude Code, run: /oh-my-engine-init
```

## Verification

After installation, verify it worked:

1. Open Claude Code in your project
2. Type `/oh-my-engine` and press Tab
3. You should see autocomplete suggestions for all Oh My Engine commands

## Need Help?

- 📖 [Documentation](https://github.com/oh-my-engine/oh-my-engine)
- 🐛 [Report Issues](https://github.com/oh-my-engine/oh-my-engine/issues)
- 💬 [Discussions](https://github.com/oh-my-engine/oh-my-engine/discussions)
