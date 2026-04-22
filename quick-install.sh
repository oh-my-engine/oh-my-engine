#!/bin/bash

# Oh My Engine Quick Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/oh-my-engine/oh-my-engine.git"
TEMP_DIR="/tmp/oh-my-engine-install-$$"
SKILLS_DIR="$HOME/.claude/skills"

# Print banner
print_banner() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                       ║${NC}"
    echo -e "${CYAN}║   ${GREEN}Oh My Engine Quick Installer${CYAN}    ║${NC}"
    echo -e "${CYAN}║                                       ║${NC}"
    echo -e "${CYAN}║   Self-Evolving Workflow Framework    ║${NC}"
    echo -e "${CYAN}║                                       ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════╝${NC}"
    echo ""
}

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Darwin*)    OS="macOS";;
        Linux*)     OS="Linux";;
        CYGWIN*|MINGW*|MSYS*) OS="Windows";;
        *)          OS="Unknown";;
    esac
    echo -e "${BLUE}ℹ${NC} Detected OS: ${GREEN}$OS${NC}"
}

# Check dependencies
check_dependencies() {
    echo -e "${BLUE}ℹ${NC} Checking dependencies..."

    if ! command -v git &> /dev/null; then
        echo -e "${RED}✗${NC} Git is not installed"
        echo ""
        echo "Please install Git first:"
        case "$OS" in
            macOS)
                echo "  brew install git"
                ;;
            Linux)
                echo "  sudo apt-get install git  # Debian/Ubuntu"
                echo "  sudo yum install git       # CentOS/RHEL"
                ;;
            Windows)
                echo "  Download from: https://git-scm.com/download/win"
                ;;
        esac
        exit 1
    fi

    echo -e "${GREEN}✓${NC} Git found"
}

# Check Claude Code
check_claude_code() {
    echo -e "${BLUE}ℹ${NC} Checking Claude Code installation..."

    if [ ! -d "$HOME/.claude" ]; then
        echo -e "${YELLOW}⚠️  Warning: ~/.claude directory not found${NC}"
        echo ""
        echo "Claude Code doesn't appear to be installed."
        echo "Please install Claude Code first:"
        echo ""
        echo "  • CLI:     npm install -g @anthropic-ai/claude-code"
        echo "  • Desktop: https://claude.ai/code"
        echo "  • VS Code: Search 'Claude Code' in extensions"
        echo ""
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo -e "${GREEN}✓${NC} Claude Code found"
    fi
}

# Clone repository
clone_repo() {
    echo ""
    echo -e "${BLUE}📦 Downloading Oh My Engine...${NC}"

    # Clean up any existing temp directory
    rm -rf "$TEMP_DIR"

    # Clone the repository
    if git clone --depth 1 "$REPO_URL" "$TEMP_DIR" 2>&1 | grep -v "Cloning into"; then
        echo -e "${GREEN}✓${NC} Downloaded successfully"
    else
        echo -e "${RED}✗${NC} Failed to download repository"
        exit 1
    fi
}

# Install skills
install_skills() {
    echo ""
    echo -e "${BLUE}📦 Installing skills...${NC}"
    echo ""

    # Create skills directory
    mkdir -p "$SKILLS_DIR"

    local installed_count=0
    local skipped_count=0

    for skill_dir in "$TEMP_DIR/skills"/*; do
        if [ -d "$skill_dir" ]; then
            skill_name=$(basename "$skill_dir")
            target_dir="$SKILLS_DIR/$skill_name"

            # Check if skill already exists
            if [ -L "$target_dir" ] || [ -d "$target_dir" ]; then
                echo -e "${YELLOW}⚠️  $skill_name already exists${NC}"

                # In non-interactive mode (piped install), auto-replace
                if [ -t 0 ]; then
                    read -p "   Replace it? (y/n) " -n 1 -r
                    echo
                    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                        echo -e "   ${YELLOW}↷${NC} Skipped $skill_name"
                        ((skipped_count++))
                        continue
                    fi
                else
                    echo -e "   ${GREEN}→${NC} Auto-replacing (non-interactive mode)"
                fi

                rm -rf "$target_dir"
            fi

            # Copy skill
            cp -r "$skill_dir" "$target_dir"
            echo -e "   ${GREEN}✓${NC} Installed ${GREEN}$skill_name${NC}"
            ((installed_count++))
        fi
    done

    echo ""
    echo -e "${GREEN}✅ Installation complete!${NC}"
    echo -e "   Installed: ${GREEN}$installed_count${NC} skills"
    if [ $skipped_count -gt 0 ]; then
        echo -e "   Skipped: ${YELLOW}$skipped_count${NC} skills"
    fi
}

# Cleanup
cleanup() {
    echo ""
    echo -e "${BLUE}ℹ${NC} Cleaning up..."
    rm -rf "$TEMP_DIR"
    echo -e "${GREEN}✓${NC} Cleanup complete"
}

# Print usage guide
print_usage() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}Available Commands:${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${GREEN}/oh-my-engine-init${NC}    Initialize in your project"
    echo -e "  ${GREEN}/oh-my-engine-ui${NC}      Restore UI from designs"
    echo -e "  ${GREEN}/oh-my-engine-bug${NC}     Analyze and fix bugs"
    echo -e "  ${GREEN}/oh-my-engine-comp${NC}    Generate components"
    echo -e "  ${GREEN}/oh-my-engine-api${NC}     Integrate APIs"
    echo -e "  ${GREEN}/oh-my-engine-memory${NC}  View execution history"
    echo -e "  ${GREEN}/oh-my-engine-evolve${NC}  Evolve workflows"
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}Quick Start:${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""
    echo "  1. Open your project in Claude Code"
    echo "  2. Run: ${GREEN}/oh-my-engine-init${NC}"
    echo "  3. Start using workflows!"
    echo ""
    echo -e "${BLUE}Documentation:${NC}"
    echo "  https://github.com/oh-my-engine/oh-my-engine"
    echo ""
}

# Error handler
error_handler() {
    echo ""
    echo -e "${RED}✗ Installation failed${NC}"
    cleanup
    exit 1
}

# Set error trap
trap error_handler ERR

# Main installation flow
main() {
    print_banner
    detect_os
    check_dependencies
    check_claude_code
    clone_repo
    install_skills
    cleanup
    print_usage
}

# Run installation
main
