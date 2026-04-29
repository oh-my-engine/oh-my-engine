const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { writeJsonFile, writeTextFile } = require('../core/file-system');
const { countDoneCheckboxes, countOpenCheckboxes, renderTemplate, slugify } = require('../core/spec-utils');

function createWorkspace(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'oh-my-engine-core-utils-'));
}

test('writeTextFile creates parent directories and leaves no temp sibling', () => {
  const workspace = createWorkspace();
  const target = path.join(workspace, 'nested', 'state.txt');

  writeTextFile(target, 'ready');

  assert.equal(fs.readFileSync(target, 'utf8'), 'ready\n');
  assert.deepEqual(fs.readdirSync(path.dirname(target)), ['state.txt']);
});

test('writeJsonFile writes formatted JSON atomically', () => {
  const workspace = createWorkspace();
  const target = path.join(workspace, 'state', 'payload.json');

  writeJsonFile(target, { ok: true, count: 2 });

  assert.deepEqual(JSON.parse(fs.readFileSync(target, 'utf8')), { ok: true, count: 2 });
  assert.match(fs.readFileSync(target, 'utf8'), /\n  "count": 2\n/);
});

test('spec utility helpers normalize slugs, templates, and checkbox counts', () => {
  const workspace = createWorkspace();
  const templatePath = path.join(workspace, 'template.md');
  const checklistPath = path.join(workspace, 'tasks.md');

  fs.writeFileSync(templatePath, 'Hello <name>, <name>.\n', 'utf8');
  fs.writeFileSync(checklistPath, '- [ ] Open\n- [x] Done\n- [X] Also done\n', 'utf8');

  assert.equal(slugify('User Auth Flow!'), 'user-auth-flow');
  assert.equal(renderTemplate(templatePath, { '<name>': 'engine' }), 'Hello engine, engine.\n');
  assert.equal(countOpenCheckboxes(checklistPath), 1);
  assert.equal(countDoneCheckboxes(checklistPath), 2);
});

export {};
