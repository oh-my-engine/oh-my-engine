# NPM Release

Use this flow to bump `oh-my-engine`, verify the package, and publish the current `ome` CLI plus all `ome-*` command bins, including `ome-mcp`.

## Recommended Flow

```bash
npm run verify
npm pack --dry-run
npm version patch
npm publish
```

## Set an Explicit Version

If you need to publish an exact version instead of `patch`:

```bash
npm run verify
npm pack --dry-run
npm version 0.4.3
npm publish
```

## Common Version Bumps

```bash
npm version patch
npm version minor
npm version major
```

## What Gets Published

The npm package publishes:

- the `ome` CLI
- workflow bins such as `ome-init`, `ome-bug`, `ome-spec`, `ome-memory`, `ome-evolve`
- MCP tooling via `ome mcp ...` and the `ome-mcp` bin
- TypeScript runtime output under `dist/`
- public docs and bundled schemas

## Release Checklist

Run these before `npm publish`:

```bash
npm run verify
npm pack --dry-run
```

Then sanity check:

- `package.json` version is correct
- `CHANGELOG.md` is updated if needed
- `npm pack --dry-run` includes `dist/bin/ome.js` and `dist/bin/ome-mcp.js`
- no real secrets are present in `.ome/mcp/source.json` or synced MCP files

## Windows Notes

If PowerShell blocks `npm`, run through `cmd.exe`:

```powershell
cmd.exe /c npm.cmd run verify
cmd.exe /c npm.cmd pack --dry-run
cmd.exe /c npm.cmd version patch
cmd.exe /c npm.cmd publish
```

## Notes

- `npm version ...` updates `package.json`, creates a git commit, and creates a git tag by default.
- `npm publish` uses the current package contents and the current version in `package.json`.
- Run release commands from the repository root.
- If you need to publish a pre-release, use `npm version prerelease --preid beta` or an explicit semver.
