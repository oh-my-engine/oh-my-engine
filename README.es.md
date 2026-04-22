# Oh My Engine

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Español](README.es.md) | [Français](README.fr.md)

---

> Un motor de flujo de trabajo auto-evolutivo con capacidades de memoria y aprendizaje para Claude Code

Oh My Engine es un framework poderoso que transforma Claude Code en un sistema de flujo de trabajo inteligente. Aprende de tus patrones, recuerda tus preferencias y evoluciona para crear flujos de trabajo personalizados automáticamente.

## ✨ Características

- **🧠 Sistema de Memoria**: Recuerda el historial de ejecución, aprendizajes y preferencias del usuario
- **🔄 Auto-Evolución**: Identifica patrones automáticamente y genera nuevas habilidades
- **⚙️ Configuración de Proyecto**: Personalización de flujos de trabajo por proyecto con `.oh-my-engine/`
- **📋 Flujos de Trabajo Ricos**: Flujos de trabajo preconstruidos para restauración de UI, análisis de bugs, generación de componentes e integración de APIs
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

#### Método 2: Clonar e Instalar

```bash
# Clonar el repositorio
git clone https://github.com/oh-my-engine/oh-my-engine.git

# Ejecutar el script de instalación
cd oh-my-engine
chmod +x install.sh
./install.sh
```

#### Método 3: Instalar con IA

Copia el prompt de instalación de [INSTALL_WITH_AI.md](INSTALL_WITH_AI.md) y pégalo en cualquier asistente de IA (Claude, ChatGPT, etc.), y la IA te guiará a través de la instalación.

El instalador copiará todas las habilidades a `~/.claude/skills/` y las hará disponibles globalmente en Claude Code.

### Inicializar un Proyecto

En tu directorio de proyecto:

```bash
/oh-my-engine-init
```

Esto crea un directorio `.oh-my-engine/` con:
- `config.json` - Configuraciones de flujo de trabajo
- `rules/` - Reglas específicas del proyecto
- `memory/` - Historial de ejecución y aprendizajes (ignorado por git)

### Comandos Disponibles

- `/oh-my-engine-init` - Inicializar Oh My Engine en el proyecto actual
- `/oh-my-engine-ui` - Restaurar UI desde archivos de diseño o capturas de pantalla
- `/oh-my-engine-bug` - Analizar y corregir bugs con contexto
- `/oh-my-engine-comp` - Generar componentes desde especificaciones
- `/oh-my-engine-api` - Integrar APIs con manejo de errores adecuado
- `/oh-my-engine-memory` - Ver historial de ejecución y aprendizajes
- `/oh-my-engine-evolve` - Analizar patrones y sugerir nuevos flujos de trabajo

## 📖 Documentación

- [Descripción General de Arquitectura](docs/architecture.md)
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
~/.claude/skills/           # Habilidades globales (instaladas por install.sh)
├── oh-my-engine/          # Framework principal
├── oh-my-engine-init/     # Inicialización de proyecto
├── oh-my-engine-ui/       # Flujo de trabajo de restauración de UI
├── oh-my-engine-bug/      # Flujo de trabajo de análisis de bugs
├── oh-my-engine-comp/     # Flujo de trabajo de generación de componentes
├── oh-my-engine-api/      # Flujo de trabajo de integración de API
├── oh-my-engine-memory/   # Visor de memoria
└── oh-my-engine-evolve/   # Analizador de evolución

project/
└── .oh-my-engine/         # Configuración específica del proyecto
    ├── config.json        # Configuración de flujos de trabajo
    ├── rules/             # Reglas del proyecto (comprometidas en git)
    └── memory/            # Historial de ejecución (ignorado por git)
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

Construido para [Claude Code](https://claude.ai/code) de Anthropic.

---

**Nota**: Oh My Engine requiere Claude Code para funcionar. Asegúrate de tener Claude Code instalado y configurado antes de usar este framework.
