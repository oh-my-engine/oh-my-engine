#!/bin/bash

# Oh My Engine Quick Installer
# Supports: Claude Code and Codex
# Usage: curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash
# Usage with agent: curl -fsSL https://raw.githubusercontent.com/oh-my-engine/oh-my-engine/main/quick-install.sh | bash -s -- --agent codex

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
AGENT_TARGET=""

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

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --agent)
                AGENT_TARGET="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done
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

# Detect available agents
detect_agents() {
    local has_claude=false
    local has_codex=false

    if [ -d "$HOME/.claude" ]; then
        has_claude=true
    fi

    if [ -d "$HOME/.codex" ]; then
        has_codex=true
    fi

    # If agent not specified, auto-detect
    if [ -z "$AGENT_TARGET" ]; then
        if $has_claude && $has_codex; then
            # Non-interactive: install for both
            AGENT_TARGET="both"
            echo -e "${BLUE}ℹ${NC} Both Claude Code and Codex detected, installing for both"
        elif $has_claude; then
            AGENT_TARGET="claude"
        elif $has_codex; then
            AGENT_TARGET="codex"
        else
            echo -e "${YELLOW}⚠️  Neither Claude Code nor Codex detected${NC}"
            echo ""
            echo "Please install one of the following:"
            echo ""
            echo "Claude Code:"
            echo "  • CLI:     npm install -g @anthropic-ai/claude-code"
            echo "  • Desktop: https://claude.ai/code"
            echo "  • VS Code: Search 'Claude Code' in extensions"
            echo ""
            echo "Codex:"
            echo "  • Visit: https://codex.dev"
            echo ""
            echo "Continuing with Claude Code as default target..."
            AGENT_TARGET="claude"
        fi
    fi

    # Validate agent target
    case $AGENT_TARGET in
        claude|codex|both)
            ;;
        *)
            echo -e "${RED}✗${NC} Invalid agent: $AGENT_TARGET"
            echo "Valid options: claude, codex, both"
            exit 1
            ;;
    esac

    echo -e "${GREEN}✓${NC} Target agent(s): ${GREEN}$AGENT_TARGET${NC}"
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

# Clone repository
clone_repo() {
    echo ""
    echo -e "${BLUE}📦 Downloading Oh My Engine...${NC}"

    # Clean up any existing temp directory
    rm -rf "$TEMP_DIR"

    # Clone the repository
    if git clone --depth 1 "$REPO_URL" "$TEMP_DIR" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Downloaded successfully"
    else
        echo -e "${RED}✗${NC} Failed to download repository"
        echo -e "${YELLOW}ℹ${NC} This might be due to network issues or GitHub access problems"
        echo ""
        echo "Please try one of these alternatives:"
        echo ""
        echo "1. Manual installation:"
        echo "   git clone https://github.com/oh-my-engine/oh-my-engine.git"
        echo "   cd oh-my-engine"
        echo "   ./install.sh --agent $AGENT_TARGET"
        echo ""
        echo "2. Check your network connection and try again"
        echo ""
        exit 1
    fi
}

# Install skills for a specific agent
install_for_agent() {
    local agent=$1
    local agent_name=$2
    local skills_dir="$HOME/.$agent/skills"

    echo ""
    echo -e "${BLUE}📦 Installing skills for ${GREEN}$agent_name${BLUE}...${NC}"
    echo -e "${BLUE}ℹ${NC} Target directory: $skills_dir"
    echo ""

    # Create skills directory
    mkdir -p "$skills_dir"

    local installed_count=0

    for skill_dir in "$TEMP_DIR/skills"/*; do
        if [ -d "$skill_dir" ]; then
            skill_name=$(basename "$skill_dir")
            target_dir="$skills_dir/$skill_name"

            # Check if skill already exists
            if [ -L "$target_dir" ] || [ -d "$target_dir" ]; then
                echo -e "${YELLOW}⚠️  $skill_name already exists${NC}"
                echo -e "   ${GREEN}→${NC} Auto-replacing (non-interactive mode)"
                rm -rf "$target_dir"
            fi

            # Copy skill
            cp -r "$skill_dir" "$target_dir"
            echo -e "   ${GREEN}✓${NC} Installed ${GREEN}$skill_name${NC}"
            ((installed_count++))
        fi
    done

    echo ""
    echo -e "${GREEN}✅ Installation complete for $agent_name!${NC}"
    echo -e "   Installed: ${GREEN}$installed_count${NC} skills"
}

# Install skills based on target
install_skills() {
    case $AGENT_TARGET in
        claude)
            install_for_agent "claude" "Claude Code"
            ;;
        codex)
            install_for_agent "codex" "Codex"
            ;;
        both)
            install_for_agent "claude" "Claude Code"
            install_for_agent "codex" "Codex"
            ;;
    esac
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

    case $AGENT_TARGET in
        claude)
            echo -e "  ${GREEN}/oh-my-engine-init${NC}    Initialize in your project"
            echo -e "  ${GREEN}/oh-my-engine-ui${NC}      Restore UI from designs"
            echo -e "  ${GREEN}/oh-my-engine-bug${NC}     Analyze and fix bugs"
            echo -e "  ${GREEN}/oh-my-engine-comp${NC}    Generate components"
            echo -e "  ${GREEN}/oh-my-engine-api${NC}     Integrate APIs"
            echo -e "  ${GREEN}/oh-my-engine-memory${NC}  View execution history"
            echo -e "  ${GREEN}/oh-my-engine-evolve${NC}  Evolve workflows"
            ;;
        codex)
            echo -e "  ${GREEN}/oh-my-engine-init${NC}    Initialize in your project"
            echo -e "  ${GREEN}/oh-my-engine-ui${NC}      Restore UI from designs"
            echo -e "  ${GREEN}/oh-my-engine-bug${NC}     Analyze and fix bugs"
            echo -e "  ${GREEN}/oh-my-engine-comp${NC}    Generate components"
            echo -e "  ${GREEN}/oh-my-engine-api${NC}     Integrate APIs"
            echo -e "  ${GREEN}/oh-my-engine-memory${NC}  View execution history"
            echo -e "  ${GREEN}/oh-my-engine-evolve${NC}  Evolve workflows"
            ;;
        both)
            echo -e "${BLUE}Claude Code & Codex:${NC}"
            echo -e "  ${GREEN}/oh-my-engine-init${NC}    Initialize in your project"
            echo -e "  ${GREEN}/oh-my-engine-ui${NC}      Restore UI from designs"
            echo -e "  ${GREEN}/oh-my-engine-bug${NC}     Analyze and fix bugs"
            echo -e "  ${GREEN}/oh-my-engine-comp${NC}    Generate components"
            echo -e "  ${GREEN}/oh-my-engine-api${NC}     Integrate APIs"
            echo -e "  ${GREEN}/oh-my-engine-memory${NC}  View execution history"
            echo -e "  ${GREEN}/oh-my-engine-evolve${NC}  Evolve workflows"
            ;;
    esac

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}Quick Start:${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""

    case $AGENT_TARGET in
        claude)
            echo "  1. Open your project in Claude Code"
            echo "  2. Run: ${GREEN}/oh-my-engine-init${NC}"
            echo "  3. Start using workflows!"
            ;;
        codex)
            echo "  1. Open your project in Codex"
            echo "  2. Run: ${GREEN}/oh-my-engine-init${NC}"
            echo "  3. Start using workflows!"
            ;;
        both)
            echo "  ${BLUE}In Claude Code or Codex:${NC}"
            echo "    1. Open your project"
            echo "    2. Run: ${GREEN}/oh-my-engine-init${NC}"
            echo "    3. Start using workflows!"
            ;;
    esac

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
    parse_args "$@"
    print_banner
    detect_os
    check_dependencies
    detect_agents
    clone_repo
    install_skills
    cleanup
    print_usage
}

# Run installation
main "$@"
