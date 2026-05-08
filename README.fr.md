# Oh My Engine

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md)

---

> Current usage note: `ome` is the TypeScript-driven source of truth. Install the CLI with `npm install -g oh-my-engine`, initialize projects with `ome init && ome rules sync`, and use optional Claude Code/Codex skills only for native agent entry points. See [docs/installation-and-usage.md](docs/installation-and-usage.md).

> Un moteur de workflow auto-évolutif avec capacités de mémoire et d'apprentissage pour Claude Code et Codex

Oh My Engine est un framework puissant qui transforme Claude Code et Codex en un système de workflow intelligent. Il apprend de vos modèles d'utilisation, mémorise vos préférences et évolue pour créer automatiquement des workflows personnalisés.

## ✨ Fonctionnalités

- **🧠 Système de Mémoire** : Mémorise l'historique d'exécution, les apprentissages et les préférences utilisateur
- **🔄 Auto-Évolution** : Identifie automatiquement les modèles et génère de nouvelles compétences
- **⚙️ Configuration de Projet** : Personnalisation des workflows par projet avec `.ome/`
- **📋 Workflows Riches** : Workflows préconstruits pour la restauration d'UI, l'analyse de bugs, la génération de composants et l'intégration d'API
- **📝 Mode Spec** : Workflow compatible OpenSpec pour proposer, planifier, appliquer, vérifier et archiver des changements
- **🎯 Contexte Intelligent** : Charge automatiquement les règles et configurations spécifiques au projet
- **🔧 Extensible** : Création facile de workflows personnalisés pour vos besoins spécifiques

## 🚀 Démarrage Rapide

### Installation

#### Méthode 1 : Installation Rapide (Recommandé)

Une commande pour tout installer :

```bash
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash
```

Ou avec wget :

```bash
wget -qO- https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash
```

**Installer pour un agent spécifique :**

```bash
# Claude Code uniquement
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent claude

# Codex uniquement
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent codex

# Les deux
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent both
```

#### Méthode 2 : Cloner et Installer

```bash
# Cloner le dépôt
git clone https://github.com/oh-my-engine/oh-my-engine.git

# Exécuter le script d'installation
cd oh-my-engine
chmod +x install.sh

# Détection automatique de l'agent
./install.sh

# Ou agent explicite
./install.sh --agent claude   # Claude Code uniquement
./install.sh --agent codex    # Codex uniquement
./install.sh --agent both     # Les deux agents
```

#### Méthode 3 : Installer avec l'IA

Copiez l'invite d'installation de [INSTALL_WITH_AI.md](INSTALL_WITH_AI.md) et collez-la dans n'importe quel assistant IA (Claude, ChatGPT, etc.), et l'IA vous guidera à travers l'installation.

L'installateur copiera toutes les compétences dans `~/.claude/skills/` et/ou `~/.codex/skills/`.

Dans Claude Code, vous pouvez invoquer les workflows installés comme des commandes slash.
Dans Codex, vous devez invoquer les skills installées par leur nom ; ne supposez pas que `/oh-my-engine-*` y sera disponible.

### Initialiser un Projet

Dans votre répertoire de projet :

**Claude Code :**
```bash
/ome-init
```

**Codex :**
```bash
ome-init
```

Cela crée un répertoire `.ome/` avec :
- `config.json` - Configurations de workflow
- `rules/` - Règles spécifiques au projet
- `memory/` - Historique d'exécution et apprentissages (ignoré par git)

Cela crée aussi un espace `openspec/` pour les specs durables et les changements actifs :
- `project.md` - Contexte au niveau projet
- `changes/` - Changements en cours
- `specs/` - Specs de capacité stables
- `archive/` - Changements terminés

### Commandes Disponibles

- Claude Code : `/ome-init`, `/ome-init-rules`, `/ome-ui`, `/ome-bug`, `/ome-comp`, `/ome-api`, `/ome-spec`, `/ome-memory`, `/ome-evolve`, `/ome-superpowers`, `/ome-mcp`
- Noms de skill Codex : `ome-init`, `ome-init-rules`, `ome-ui`, `ome-bug`, `ome-comp`, `ome-api`, `ome-spec`, `ome-memory`, `ome-evolve`, `ome-superpowers`, `ome-mcp`

### Workflow Spec

```bash
# Initialiser l'espace spec
ome spec init

# Importer les entrées PRD et l'intention opérateur
ome spec import user-authentication

# Préparer proposal/design/tasks/spec delta à partir du contexte importé
ome spec decompose user-authentication

# Le scaffold manuel reste disponible
ome spec propose user-authentication

# Affiner et charger le contexte d'exécution
ome spec plan user-authentication
ome spec apply user-authentication
ome spec apply user-authentication --task "Implement the change"
ome spec status user-authentication

# Vérifier et archiver le changement
ome spec verify user-authentication
ome spec archive user-authentication
```

`import` enregistre le texte source normalisé, le prompt, la traçabilité et les pièces jointes copiées sous `openspec/changes/<change-id>/context/`. `decompose` transforme ce contexte d'entrée en `analysis.md`, `proposal.md`, `design.md`, `tasks.md` et spec deltas, tout en conservant les références de source liées au changement. `apply` met à jour l'état du cycle de vie, peut marquer la progression des tâches et des critères d'acceptation, et affiche les fichiers que l'agent doit charger. Il ne génère pas automatiquement le code de production. `status` résume la phase courante et les éléments restants. `archive` crée la capability spec durable lors de la première acceptation, reconstruit le résumé canonique, les exigences et la compatibilité à partir des deltas acceptés, et conserve à la fois le snapshot courant accepté et l'historique archivé.
Vous pouvez ajouter de vraies vérifications projet sous `workflows.spec.options.verifyCommands` dans `.ome/config.json` ; `verify` les exécute séquentiellement et échoue à la première sortie non nulle. `verify` bloque aussi les marqueurs `TBD:` non résolus et exige que chaque spec delta sélectionne exactement un type de changement ainsi qu'au moins une exigence concrète et un scénario WHEN/THEN.

## 📖 Documentation

- [Aperçu de l'Architecture](docs/architecture.md)
- [Architecture d'Intake Spec Guidée par Prompt](docs/spec-intake-architecture.md)
- [Créer des Workflows Personnalisés](docs/custom-workflows.md)
- [Guide de Configuration](docs/configuration.md)
- [Système de Mémoire](docs/memory-system.md)
- [Mécanisme d'Évolution](docs/evolution.md)

## 🎯 Exemples

### Projet React Native

Consultez [examples/react-native](examples/react-native) pour un exemple de configuration complet incluant :
- Règles i18n pour le support multilingue
- Intégration du système de thèmes
- Jetons de design
- Directives de style de code

### Workflow Personnalisé

```markdown
---
name: oh-my-engine-deploy
description: Déploiement d'application avec vérifications préalables
---

# Workflow de Déploiement

## Chargement du Contexte
1. Charger `.ome/config.json`
2. Vérifier la configuration de déploiement
3. Vérifier les variables d'environnement

## Vérifications Préalables
- Exécuter les tests
- Vérifier l'état de la compilation
- Vérifier les dépendances

## Déploiement
- Compiler le bundle de production
- Déployer vers l'environnement configuré
- Mettre à jour les journaux de déploiement

## Post-déploiement
- Sauvegarder l'exécution en mémoire
- Mettre à jour les apprentissages
```

## 🏗️ Architecture

```
~/.claude/skills/           # Skills Claude Code
~/.codex/skills/            # Skills Codex
├── oh-my-engine/          # Framework principal
├── ome-init/     # Initialisation de projet
├── ome-ui/       # Workflow de restauration d'UI
├── ome-bug/      # Workflow d'analyse de bugs
├── ome-comp/     # Workflow de génération de composants
├── ome-api/      # Workflow d'intégration d'API
├── ome-spec/     # Workflow spec compatible OpenSpec
├── ome-memory/   # Visualiseur de mémoire
└── ome-evolve/   # Analyseur d'évolution

project/
├── .ome/         # Configuration et mémoire spécifiques au projet
│   ├── config.json        # Paramètres de workflow
│   ├── rules/             # Règles du projet (commitées dans git)
│   └── memory/            # Historique d'exécution (ignoré par git)
└── openspec/              # Espace compatible OpenSpec
    ├── project.md         # Contexte du projet
    ├── changes/           # Changements en cours
    │   └── <change-id>/context/  # PRD importé, prompt, analyse, références et pièces jointes
    ├── specs/             # Specs de capacité stables
    └── archive/           # Changements terminés
```

## 🤝 Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à soumettre une Pull Request.

1. Forkez le dépôt
2. Créez votre branche de fonctionnalité (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add amazing feature'`)
4. Poussez vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

## 📝 Licence

Licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails

## 🙏 Remerciements

Construit pour [Claude Code](https://claude.ai/code) d'Anthropic et [Codex](https://codex.dev).

---

**Note** : Oh My Engine nécessite Claude Code ou Codex pour fonctionner. Assurez-vous qu'au moins l'un des deux est installé et configuré avant d'utiliser ce framework.
## MCP Setup

Use one project-local MCP source and sync it to each editor:

```bash
ome mcp init --all
ome mcp sync
ome mcp doctor
```

`ome mcp init` creates `.ome/mcp/source.json` and `.ome/mcp/README.md`. Edit the source file, then run `ome mcp sync` to write editor-specific MCP config files. Keep real tokens in environment variables such as `FIGMA_API_KEY` and `MG_MCP_TOKEN`.
