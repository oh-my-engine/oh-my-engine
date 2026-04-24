# Oh My Engine

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md)

---

> Un motor de flujo de trabajo auto-evolutivo con capacidades de memoria y aprendizaje para Claude Code y Codex

Oh My Engine es un framework poderoso que transforma Claude Code y Codex en un sistema de flujo de trabajo inteligente. Aprende de tus patrones, recuerda tus preferencias y evoluciona para crear flujos de trabajo personalizados automáticamente.

## ✨ Características

- **🧠 Sistema de Memoria**: Recuerda el historial de ejecución, aprendizajes y preferencias del usuario
- **🔄 Auto-Evolución**: Identifica patrones automáticamente y genera nuevas habilidades
- **⚙️ Configuración de Proyecto**: Personalización de flujos de trabajo por proyecto con `.oh-my-engine/`
- **📋 Flujos de Trabajo Ricos**: Flujos de trabajo preconstruidos para restauración de UI, análisis de bugs, generación de componentes e integración de APIs
- **📝 Modo Spec**: Flujo compatible con OpenSpec para proponer, planificar, aplicar, verificar y archivar cambios
- **🎯 Contexto Inteligente**: Carga automáticamente reglas y configuraciones específicas del proyecto
- **🔧 Extensible**: Fácil creación de flujos de trabajo personalizados para tus necesidades específicas

## 🚀 Inicio Rápido

### Instalación

#### Método 1: Instalación Rápida (Recomendado)

Un comando para instalar todo:

```bash
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash
```

O con wget:

```bash
wget -qO- https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash
```

**Instalar para un agente específico:**

```bash
# Solo Claude Code
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent claude

# Solo Codex
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent codex

# Ambos
curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent both
```

#### Método 2: Clonar e Instalar

```bash
# Clonar el repositorio
git clone https://github.com/oh-my-engine/oh-my-engine.git

# Ejecutar el script de instalación
cd oh-my-engine
chmod +x install.sh

# Detectar el agente automáticamente
./install.sh

# O indicar el agente
./install.sh --agent claude   # Solo Claude Code
./install.sh --agent codex    # Solo Codex
./install.sh --agent both     # Ambos agentes
```

#### Método 3: Instalar con IA

Copia el prompt de instalación de [INSTALL_WITH_AI.md](INSTALL_WITH_AI.md) y pégalo en cualquier asistente de IA (Claude, ChatGPT, etc.), y la IA te guiará a través de la instalación.

El instalador copiará todas las habilidades a `~/.claude/skills/` y/o `~/.codex/skills/`.

En Claude Code puedes invocar los workflows instalados como comandos con `/`.
En Codex debes invocar las skills instaladas por nombre; no asumas que `/oh-my-engine-*` estará disponible allí.

### Inicializar un Proyecto

En tu directorio de proyecto:

**Claude Code:**
```bash
/oh-my-engine-init
```

**Codex:**
```bash
oh-my-engine-init
```

Esto crea un directorio `.oh-my-engine/` con:
- `config.json` - Configuraciones de flujo de trabajo
- `rules/` - Reglas específicas del proyecto
- `memory/` - Historial de ejecución y aprendizajes (ignorado por git)

También crea un espacio `openspec/` para especificaciones de largo plazo y cambios activos:
- `project.md` - Contexto a nivel de proyecto
- `changes/` - Cambios en curso
- `specs/` - Especificaciones estables por capacidad
- `archive/` - Cambios completados

### Comandos Disponibles

- Claude Code: `/oh-my-engine-init`, `/oh-my-engine-ui`, `/oh-my-engine-bug`, `/oh-my-engine-comp`, `/oh-my-engine-api`, `/oh-my-engine-spec`, `/oh-my-engine-memory`, `/oh-my-engine-evolve`
- Nombres de skill en Codex: `oh-my-engine-init`, `oh-my-engine-ui`, `oh-my-engine-bug`, `oh-my-engine-comp`, `oh-my-engine-api`, `oh-my-engine-spec`, `oh-my-engine-memory`, `oh-my-engine-evolve`

### Flujo Spec

```bash
# Inicializar el espacio spec
oh-my-engine-spec init

# Importar entradas del PRD y la intención del operador
oh-my-engine-spec import user-authentication

# Preparar proposal/design/tasks/spec delta desde el contexto importado
oh-my-engine-spec decompose user-authentication

# La vía manual de scaffold sigue disponible
oh-my-engine-spec propose user-authentication

# Refinar y cargar el contexto de ejecución
oh-my-engine-spec plan user-authentication
oh-my-engine-spec apply user-authentication
oh-my-engine-spec apply user-authentication --task "Implement the change"
oh-my-engine-spec status user-authentication

# Verificar y archivar el cambio
oh-my-engine-spec verify user-authentication
oh-my-engine-spec archive user-authentication
```

`import` guarda el texto fuente normalizado, el prompt, la trazabilidad y los adjuntos copiados en `openspec/changes/<change-id>/context/`. `decompose` convierte ese contexto de entrada en `analysis.md`, `proposal.md`, `design.md`, `tasks.md` y spec deltas, manteniendo las referencias de origen unidas al cambio. `apply` actualiza el estado del ciclo de vida, puede marcar el progreso de tareas y criterios de aceptación, y muestra qué archivos debe cargar el agente. No genera código de producción automáticamente. `status` resume la fase actual y los elementos pendientes. `archive` crea la capability spec de largo plazo en la primera aceptación, reconstruye el resumen canónico, los requisitos y la compatibilidad a partir de los deltas aceptados, y conserva tanto el snapshot actual aceptado como el historial archivado.
Puedes añadir comprobaciones reales del proyecto en `workflows.spec.options.verifyCommands` dentro de `.oh-my-engine/config.json`; `verify` las ejecuta secuencialmente y falla en el primer código de salida distinto de cero. `verify` también bloquea marcadores `TBD:` sin resolver y exige que cada spec delta seleccione exactamente un tipo de cambio y contenga al menos un requisito concreto y un escenario WHEN/THEN.

## 📖 Documentación

- [Descripción General de Arquitectura](docs/architecture.md)
- [Arquitectura de Intake Spec Guiado por Prompts](docs/spec-intake-architecture.md)
- [Crear Flujos de Trabajo Personalizados](docs/custom-workflows.md)
- [Guía de Configuración](docs/configuration.md)
- [Sistema de Memoria](docs/memory-system.md)
- [Mecanismo de Evolución](docs/evolution.md)

## 🎯 Ejemplos

### Proyecto React Native

Consulta [examples/react-native](examples/react-native) para un ejemplo de configuración completo que incluye:
- Reglas i18n para soporte multiidioma
- Integración del sistema de temas
- Tokens de diseño
- Directrices de estilo de código

### Flujo de Trabajo Personalizado

```markdown
---
name: oh-my-engine-deploy
description: Despliegue de aplicación con verificaciones previas
---

# Flujo de Trabajo de Despliegue

## Carga de Contexto
1. Cargar `.oh-my-engine/config.json`
2. Verificar configuración de despliegue
3. Verificar variables de entorno

## Verificaciones Previas
- Ejecutar pruebas
- Verificar estado de compilación
- Verificar dependencias

## Despliegue
- Compilar bundle de producción
- Desplegar al entorno configurado
- Actualizar registros de despliegue

## Post-despliegue
- Guardar ejecución en memoria
- Actualizar aprendizajes
```

## 🏗️ Arquitectura

```
~/.claude/skills/           # Skills de Claude Code
~/.codex/skills/            # Skills de Codex
├── oh-my-engine/          # Framework principal
├── oh-my-engine-init/     # Inicialización de proyecto
├── oh-my-engine-ui/       # Flujo de trabajo de restauración de UI
├── oh-my-engine-bug/      # Flujo de trabajo de análisis de bugs
├── oh-my-engine-comp/     # Flujo de trabajo de generación de componentes
├── oh-my-engine-api/      # Flujo de trabajo de integración de API
├── oh-my-engine-spec/     # Flujo spec compatible con OpenSpec
├── oh-my-engine-memory/   # Visor de memoria
└── oh-my-engine-evolve/   # Analizador de evolución

project/
├── .oh-my-engine/         # Configuración y memoria específicas del proyecto
│   ├── config.json        # Configuración de flujos de trabajo
│   ├── rules/             # Reglas del proyecto (comprometidas en git)
│   └── memory/            # Historial de ejecución (ignorado por git)
└── openspec/              # Espacio de trabajo compatible con OpenSpec
    ├── project.md         # Contexto del proyecto
    ├── changes/           # Cambios en curso
    │   └── <change-id>/context/  # PRD importado, prompt, análisis, referencias y adjuntos
    ├── specs/             # Especificaciones estables por capacidad
    └── archive/           # Cambios completados
```

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! No dudes en enviar un Pull Request.

1. Haz fork del repositorio
2. Crea tu rama de característica (`git checkout -b feature/amazing-feature`)
3. Haz commit de tus cambios (`git commit -m 'Add amazing feature'`)
4. Haz push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📝 Licencia

Licencia MIT - consulta el archivo [LICENSE](LICENSE) para más detalles

## 🙏 Agradecimientos

Construido para [Claude Code](https://claude.ai/code) de Anthropic y [Codex](https://codex.dev).

---

**Nota**: Oh My Engine requiere Claude Code o Codex para funcionar. Asegúrate de tener al menos uno instalado y configurado antes de usar este framework.
