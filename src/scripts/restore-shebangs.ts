#!/usr/bin/env node
const fs = require('node:fs');

const executableFiles = [
  'dist/bin/ome.js',
  'dist/bin/ome-init.js',
  'dist/bin/ome-bug.js',
  'dist/bin/ome-ui.js',
  'dist/bin/ome-comp.js',
  'dist/bin/ome-api.js',
  'dist/bin/ome-mcp.js',
  'dist/bin/ome-spec.js',
  'dist/bin/ome-memory.js',
  'dist/bin/ome-evolve.js',
  'dist/scripts/restore-shebangs.js',
  'dist/skills/oh-my-engine/scripts/adopt-learning-candidate.js',
  'dist/skills/oh-my-engine/scripts/adopt-skill-candidate.js',
  'dist/skills/oh-my-engine/scripts/build-engine-memory-context.js',
  'dist/skills/oh-my-engine/scripts/record-execution-memory.js',
  'dist/skills/oh-my-engine/scripts/record-preference-memory.js',
  'dist/skills/oh-my-engine/scripts/render-workflow-guidance.js',
  'dist/skills/oh-my-engine-evolve/scripts/run-evolve.js',
  'dist/skills/oh-my-engine-evolve/scripts/verify-learning-candidate.js',
  'dist/skills/oh-my-engine-evolve/scripts/verify-skill-candidate.js',
  'dist/skills/oh-my-engine-memory/scripts/view-memory.js'
];

for (const filePath of executableFiles) {
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  const withoutShebang = content.replace(/^#!.*\n/, '');
  fs.writeFileSync(filePath, `#!/usr/bin/env node\n${withoutShebang}`, 'utf8');
  fs.chmodSync(filePath, 0o755);
}

export {};
