const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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
    'ome-define': 'dist/bin/ome-define.js',
    'ome-plan': 'dist/bin/ome-plan.js',
    'ome-build': 'dist/bin/ome-build.js',
    'ome-test': 'dist/bin/ome-test.js',
    'ome-review': 'dist/bin/ome-review.js',
    'ome-ship': 'dist/bin/ome-ship.js',
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

test('npm package exposes a typed framework API entrypoint', () => {
  const packageJson = JSON.parse(fs.readFileSync(repoPath('package.json'), 'utf8'));

  assert.equal(packageJson.main, 'dist/index.js');
  assert.equal(packageJson.types, 'dist/index.d.ts');
  assert.deepEqual(packageJson.exports, {
    '.': {
      types: './dist/index.d.ts',
      require: './dist/index.js'
    },
    './package.json': './package.json'
  });

  assert.ok(packageJson.files.includes('dist/index.js'));
  assert.ok(packageJson.files.includes('dist/index.d.ts'));
  assert.ok(packageJson.files.includes('docs/framework-api.md'));
  assert.ok(fs.existsSync(repoPath('dist', 'index.js')));
  assert.ok(fs.existsSync(repoPath('dist', 'index.d.ts')));

  const api = require(path.join(repoPath('dist'), 'index.js'));

  assert.equal(typeof api.listAdapters, 'function');
  assert.equal(typeof api.listAdapterManifests, 'function');
  assert.equal(typeof api.previewAdapterSync, 'function');
  assert.equal(typeof api.renderWorkflowCommand, 'function');
  assert.equal(typeof api.writeTextFile, 'function');
  assert.equal(typeof api.slugify, 'function');
  assert.equal(typeof api.validateJsonFile, 'function');
  assert.equal(typeof api.listSpecCommands, 'function');
});

export {};
