# React Native Example

This example shows how to configure Oh My Engine for a React Native + Expo project with multi-language support.

## Configuration Highlights

### Multi-language Support (i18n)
- Supports 4 languages: English, Simplified Chinese, Traditional Chinese, Thai
- Translation files in `src/i18n/locales/`
- Automatic language switching based on device settings

### Theme System
- Uses `ThemedStyle` for consistent styling
- Centralized theme configuration
- Dark mode support

### Design Tokens
- Color palette defined in theme
- Typography scale
- Spacing system
- Component-specific tokens

### Code Style
- TypeScript strict mode
- Functional components with hooks
- Consistent naming conventions
- Proper error handling

## Project Structure

```
.oh-my-engine/
├── config.json           # Main configuration
├── rules/                # Project-specific rules
│   ├── i18n.md          # Translation guidelines
│   ├── theme.md         # Theme system rules
│   ├── design-tokens.md # Design token definitions
│   └── code-style.md    # Code style guidelines
├── workflows/           # Custom workflows (if any)
└── memory/              # Execution history (git-ignored)
```

## Usage

After initializing Oh My Engine in your React Native project:

```bash
# Restore UI from Figma
/oh-my-engine-ui

# Generate a new component
/oh-my-engine-comp

# Integrate an API
/oh-my-engine-api

# Analyze a bug
/oh-my-engine-bug
```

## Customization

Edit the files in `.oh-my-engine/rules/` to match your project's specific requirements:

- Add more languages to `i18n.md`
- Customize theme tokens in `theme.md`
- Update design tokens in `design-tokens.md`
- Adjust code style rules in `code-style.md`

The framework will automatically load these rules when executing workflows.
