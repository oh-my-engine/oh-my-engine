const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const { repoPath } = require('./helpers');

test('npm bin points directly to the compiled executable', () => {
  const packageJson = JSON.parse(fs.readFileSync(repoPath('package.json'), 'utf8'));
  const expectedBins = {
    ome: 'dist/bin/ome.js',
    'ome-init': 'dist/bin/ome-init.js',
    'ome-bug': 'dist/bin/ome-bug.js',
    'ome-ui': 'dist/bin/ome-ui.js',
    'ome-comp': 'dist/bin/ome-comp.js',
    'ome-api': 'dist/bin/ome-api.js',
    'ome-spec': 'dist/bin/ome-spec.js',
    'ome-memory': 'dist/bin/ome-memory.js',
    'ome-evolve': 'dist/bin/ome-evolve.js'
  };

  assert.deepEqual(packageJson.bin, expectedBins);

  for (const binPath of Object.values(expectedBins) as string[]) {
    assert.ok(fs.existsSync(repoPath(binPath)));
    const executable = fs.readFileSync(repoPath(binPath), 'utf8');
    assert.ok(executable.startsWith('#!/usr/bin/env node'));
  }
});

export {};
