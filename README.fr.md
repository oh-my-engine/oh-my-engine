# Oh My Engine

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md)

---

> Un moteur de workflow auto-évolutif avec capacités de mémoire et d'apprentissage pour Claude Code et Codex

Oh My Engine est un framework puissant qui transforme Claude Code et Codex en un système de workflow intelligent. Il apprend de vos modèles d'utilisation, mémorise vos préférences et évolue pour créer automatiquement des workflows personnalisés.

## ✨ Fonctionnalités

- **🧠 Système de Mémoire** : Mémorise l'historique d'exécution, les apprentissages et les préférences utilisateur
- **🔄 Auto-Évolution** : Identifie automatiquement les modèles et génère de nouvelles compétences
- **⚙️ Configuration de Projet** : Personnalisation des workflows par projet avec `.oh-my-engine/`
- **📋 Workflows Riches** : Workflows préconstruits pour la restauration d'UI, l'analyse de bugs, la génération de composants et l'intégration d'API
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

#### Méthode 2 : Cloner et Installer

```bash
# Cloner le dépôt
git clone https://github.com/oh-my-engine/oh-my-engine.git

# Exécuter le script d'installation
cd oh-my-engine
chmod +x install.sh
./install.sh
```

#### Méthode 3 : Installer avec l'IA

Copiez l'invite d'installation de [INSTALL_WITH_AI.md](INSTALL_WITH_AI.md) et collez-la dans n'importe quel assistant IA (Claude, ChatGPT, etc.), et l'IA vous guidera à travers l'installation.

L'installateur copiera toutes les compétences dans `~/.claude/skills/` et les rendra disponibles globalement dans Claude Code.

### Initialiser un Projet

Dans votre répertoire de projet :

```bash
/oh-my-engine-init
```

Cela crée un répertoire `.oh-my-engine/` avec :
- `config.json` - Configurations de workflow
- `rules/` - Règles spécifiques au projet
- `memory/` - Historique d'exécution et apprentissages (ignoré par git)

### Commandes Disponibles

- `/oh-my-engine-init` - Initialiser Oh My Engine dans le projet actuel
- `/oh-my-engine-ui` - Restaurer l'UI à partir de fichiers de design ou de captures d'écran
- `/oh-my-engine-bug` - Analyser et corriger les bugs avec contexte
- `/oh-my-engine-comp` - Générer des composants à partir de spécifications
- `/oh-my-engine-api` - Intégrer des APIs avec gestion d'erreurs appropriée
- `/oh-my-engine-memory` - Voir l'historique d'exécution et les apprentissages
- `/oh-my-engine-evolve` - Analyser les modèles et suggérer de nouveaux workflows

## 📖 Documentation

- [Aperçu de l'Architecture](docs/architecture.md)
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
1. Charger `.oh-my-engine/config.json`
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
~/.claude/skills/           # Compétences globales (installées par install.sh)
├── oh-my-engine/          # Framework principal
├── oh-my-engine-init/     # Initialisation de projet
├── oh-my-engine-ui/       # Workflow de restauration d'UI
├── oh-my-engine-bug/      # Workflow d'analyse de bugs
├── oh-my-engine-comp/     # Workflow de génération de composants
├── oh-my-engine-api/      # Workflow d'intégration d'API
├── oh-my-engine-memory/   # Visualiseur de mémoire
└── oh-my-engine-evolve/   # Analyseur d'évolution

project/
└── .oh-my-engine/         # Configuration spécifique au projet
    ├── config.json        # Paramètres de workflow
    ├── rules/             # Règles du projet (commitées dans git)
    └── memory/            # Historique d'exécution (ignoré par git)
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

Construit pour [Claude Code](https://claude.ai/code) d'Anthropic.

---

**Note** : Oh My Engine nécessite Claude Code pour fonctionner. Assurez-vous d'avoir Claude Code installé et configuré avant d'utiliser ce framework.
