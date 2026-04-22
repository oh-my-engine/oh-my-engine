#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SKILLS_DIR="$HOME/.claude/skills"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Installing Oh My Engine..."
echo ""

# Check if Claude Code is installed
if [ ! -d "$HOME/.claude" ]; then
    echo -e "${YELLOW}Warning: ~/.claude directory not found.${NC}"
    echo "Make sure Claude Code is installed before using Oh My Engine."
    echo ""
fi

# Create skills directory if it doesn't exist
mkdir -p "$SKILLS_DIR"

# Install each skill
echo "📦 Installing skills..."
for skill_dir in "$SCRIPT_DIR/skills"/*; do
    if [ -d "$skill_dir" ]; then
        skill_name=$(basename "$skill_dir")
        target_dir="$SKILLS_DIR/$skill_name"

        # Remove existing installation
        if [ -L "$target_dir" ]; then
            rm "$target_dir"
        elif [ -d "$target_dir" ]; then
            echo -e "${YELLOW}⚠️  Existing installation found at $target_dir${NC}"
            read -p "Replace it? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rm -rf "$target_dir"
            else
                echo "Skipping $skill_name"
                continue
            fi
        fi

        # Copy skill to skills directory
        cp -r "$skill_dir" "$target_dir"
        echo -e "${GREEN}✓${NC} Installed $skill_name"
    fi
done

echo ""
echo -e "${GREEN}✅ Oh My Engine installed successfully!${NC}"
echo ""
echo "Available commands:"
echo "  /oh-my-engine-init   - Initialize Oh My Engine in your project"
echo "  /oh-my-engine-ui     - Restore UI from design files"
echo "  /oh-my-engine-bug    - Analyze and fix bugs"
echo "  /oh-my-engine-comp   - Generate components"
echo "  /oh-my-engine-api    - Integrate APIs"
echo "  /oh-my-engine-memory - View execution history"
echo "  /oh-my-engine-evolve - Analyze patterns and evolve"
echo ""
echo "Get started by running '/oh-my-engine-init' in your project directory!"
