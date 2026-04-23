#!/bin/bash

# Oh My Engine Installation Script
# Supports: Claude Code and Codex
# Platforms: macOS, Linux, Windows (Git Bash/WSL)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Agent configuration
AGENT_TARGET=""
AGENT_NAME=""
SKILLS_DIR=""

# Print banner
print_banner() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                       ║${NC}"
    echo -e "${CYAN}║        ${GREEN}Oh My Engine Installer${CYAN}        ║${NC}"
    echo -e "${CYAN}║                                       ║${NC}"
    echo -e "${CYAN}║   Self-Evolving Workflow Framework    ║${NC}"
    echo -e "${CYAN}║                                       ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════╝${NC}"
    echo ""
}

# Print usage
print_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --agent <claude|codex|both>  Target agent(s) for installation"
    echo "  -h, --help                   Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                    # Auto-detect agent"
    echo "  $0 --agent claude     # Install for Claude Code only"
    echo "  $0 --agent codex      # Install for Codex only"
    echo "  $0 --agent both       # Install for both agents"
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
            -h|--help)
                print_help
                exit 0
                ;;
            *)
                echo -e "${RED}✗${NC} Unknown option: $1"
                print_help
                exit 1
                ;;
        esac
    done
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
            echo -e "${BLUE}ℹ${NC} Both Claude Code and Codex detected"
            if [ -t 0 ]; then
                echo ""
                echo "Install for:"
                echo "  1) Claude Code only"
                echo "  2) Codex only"
                echo "  3) Both"
                echo ""
                read -p "Choose (1/2/3): " -n 1 -r choice
                echo
                case $choice in
                    1) AGENT_TARGET="claude" ;;
                    2) AGENT_TARGET="codex" ;;
                    3) AGENT_TARGET="both" ;;
                    *)
                        echo -e "${RED}✗${NC} Invalid choice"
                        exit 1
                        ;;
                esac
            else
                # Non-interactive: install for both
                AGENT_TARGET="both"
            fi
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

            if [ -t 0 ]; then
                read -p "Continue anyway and choose target? (y/n) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    echo ""
                    echo "Install for:"
                    echo "  1) Claude Code"
                    echo "  2) Codex"
                    echo "  3) Both"
                    echo ""
                    read -p "Choose (1/2/3): " -n 1 -r choice
                    echo
                    case $choice in
                        1) AGENT_TARGET="claude" ;;
                        2) AGENT_TARGET="codex" ;;
                        3) AGENT_TARGET="both" ;;
                        *)
                            echo -e "${RED}✗${NC} Invalid choice"
                            exit 1
                            ;;
                    esac
                else
                    exit 1
                fi
            else
                echo -e "${BLUE}ℹ${NC} Agent directory not detected yet, installing for both targets to avoid missing Codex"
                AGENT_TARGET="both"
            fi
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
    local skipped_count=0

    for skill_dir in "$SCRIPT_DIR/skills"/*; do
        if [ -d "$skill_dir" ]; then
            skill_name=$(basename "$skill_dir")
            target_dir="$skills_dir/$skill_name"

            # Check if skill already exists
            if [ -L "$target_dir" ] || [ -d "$target_dir" ]; then
                echo -e "${YELLOW}⚠️  $skill_name already exists${NC}"

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
    echo -e "${GREEN}✅ Installation complete for $agent_name!${NC}"
    echo -e "   Installed: ${GREEN}$installed_count${NC} skills"
    if [ $skipped_count -gt 0 ]; then
        echo -e "   Skipped: ${YELLOW}$skipped_count${NC} skills"
    fi
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
            echo -e "  ${GREEN}oh-my-engine-init${NC}      Invoke the installed init skill"
            echo -e "  ${GREEN}oh-my-engine-ui${NC}        Invoke the UI restore skill"
            echo -e "  ${GREEN}oh-my-engine-bug${NC}       Invoke the bug analysis skill"
            echo -e "  ${GREEN}oh-my-engine-comp${NC}      Invoke the component generator skill"
            echo -e "  ${GREEN}oh-my-engine-api${NC}       Invoke the API integration skill"
            echo -e "  ${GREEN}oh-my-engine-memory${NC}    Invoke the memory viewer skill"
            echo -e "  ${GREEN}oh-my-engine-evolve${NC}    Invoke the evolution skill"
            ;;
        both)
            echo -e "${BLUE}Claude Code:${NC}"
            echo -e "  ${GREEN}/oh-my-engine-init${NC}    Initialize in your project"
            echo -e "  ${GREEN}/oh-my-engine-ui${NC}      Restore UI from designs"
            echo -e "  ${GREEN}/oh-my-engine-bug${NC}     Analyze and fix bugs"
            echo -e "  ${GREEN}/oh-my-engine-comp${NC}    Generate components"
            echo -e "  ${GREEN}/oh-my-engine-api${NC}     Integrate APIs"
            echo -e "  ${GREEN}/oh-my-engine-memory${NC}  View execution history"
            echo -e "  ${GREEN}/oh-my-engine-evolve${NC}  Evolve workflows"
            echo ""
            echo -e "${BLUE}Codex:${NC}"
            echo -e "  ${GREEN}oh-my-engine-init${NC}      Invoke the installed init skill"
            echo -e "  ${GREEN}oh-my-engine-ui${NC}        Invoke the UI restore skill"
            echo -e "  ${GREEN}oh-my-engine-bug${NC}       Invoke the bug analysis skill"
            echo -e "  ${GREEN}oh-my-engine-comp${NC}      Invoke the component generator skill"
            echo -e "  ${GREEN}oh-my-engine-api${NC}       Invoke the API integration skill"
            echo -e "  ${GREEN}oh-my-engine-memory${NC}    Invoke the memory viewer skill"
            echo -e "  ${GREEN}oh-my-engine-evolve${NC}    Invoke the evolution skill"
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
            echo "  2. Invoke the installed skill by name: ${GREEN}oh-my-engine-init${NC}"
            echo "  3. Use the other installed skill names in the same way"
            ;;
        both)
            echo "  ${BLUE}Claude Code:${NC}"
            echo "    1. Open your project in Claude Code"
            echo "    2. Run: ${GREEN}/oh-my-engine-init${NC}"
            echo ""
            echo "  ${BLUE}Codex:${NC}"
            echo "    1. Open your project in Codex"
            echo "    2. Invoke the installed skill by name: ${GREEN}oh-my-engine-init${NC}"
            ;;
    esac

    echo ""
    echo -e "${BLUE}Documentation:${NC}"
    echo "  https://github.com/oh-my-engine/oh-my-engine"
    echo ""
}

# Main installation flow
main() {
    parse_args "$@"
    print_banner
    detect_os
    detect_agents
    install_skills
    print_usage
}

# Run installation
main "$@"
