---
name: ome-mcp
version: 1.0.0
description: Initialize, sync, preview, or inspect Figma and MasterGo MCP configuration for Agent editors.
author: oh-my-engine
tags: [ome, mcp, workflow]
---

# ome-mcp

## Purpose
Initialize, sync, preview, and inspect project MCP configuration for design-tool integrations.

## When to Use
- Use when the project needs Figma or MasterGo MCP setup.
- Use when editor-specific MCP files need regeneration from a single source.
- Do not use when the task is unrelated to MCP configuration.

## Inputs
- The current `.ome/mcp/source.json` or project MCP request.
- Environment variable names and any required token strategy.
- The target editors or platforms that need synced MCP files.

## Process
1. Read the MCP source and current environment assumptions first.
2. Generate or update the project MCP source files.
3. Sync editor-specific MCP outputs from the source.
4. Keep tokens out of repository files and use environment variables instead.
5. Preview or doctor the generated configuration when needed.
6. Report which files were written and which settings still depend on the environment.
7. Do not hardcode real secrets into the repo.

## Red Flags
- A real token or secret would be written to disk.
- The editor outputs diverge from the source without explanation.
- The task tries to bypass the source-based MCP flow.
- The environment assumptions are undocumented.

## Common Rationalizations
- "The obvious fix is good enough without a closer read of the rules."
- "I can skip verification because the change is small."
- "I should broaden the patch while I am here."
- "A vague summary is enough for handoff."

## Verification
- Check that source and generated outputs are in sync.
- Confirm secrets remain in environment variables.
- Run the available MCP doctor or preview command if available.
- State any platform-specific limitations.

## Output Contract
Final response must include:
- Generated MCP files
- Environment assumptions
- Verification
- Remaining risks
