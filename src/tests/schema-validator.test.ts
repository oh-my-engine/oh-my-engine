const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { validateJsonFile } = require('../core/schema/validator');

function createWorkspace(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'oh-my-engine-schema-'));
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

test('schema validator enforces enum, nested arrays, and additional properties', () => {
  const workspace = createWorkspace();
  const schemaPath = path.join(workspace, 'schema.json');
  const valuePath = path.join(workspace, 'value.json');

  writeJson(schemaPath, {
    type: 'object',
    required: ['mode', 'rules'],
    additionalProperties: false,
    properties: {
      mode: { type: 'string', enum: ['strict', 'loose'] },
      rules: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['name'],
          additionalProperties: false,
          properties: {
            name: { type: 'string' },
            enabled: { type: 'boolean' }
          }
        }
      }
    }
  });

  writeJson(valuePath, {
    mode: 'legacy',
    extra: true,
    rules: [
      { enabled: 'yes', unexpected: 'value' }
    ]
  });

  const result = validateJsonFile(valuePath, schemaPath);

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.issues.map((issue: { path: string; message: string }) => `${issue.path} ${issue.message}`).sort(),
    [
      '$.extra additional property is not allowed',
      '$.mode expected one of: strict, loose',
      '$.rules[0].enabled expected boolean, got string',
      '$.rules[0].name required property missing',
      '$.rules[0].unexpected additional property is not allowed'
    ]
  );
});

test('schema validator accepts valid values with optional properties omitted', () => {
  const workspace = createWorkspace();
  const schemaPath = path.join(workspace, 'schema.json');
  const valuePath = path.join(workspace, 'value.json');

  writeJson(schemaPath, {
    type: 'object',
    required: ['name'],
    additionalProperties: false,
    properties: {
      name: { type: 'string' },
      tags: { type: 'array', items: { type: 'string' } }
    }
  });
  writeJson(valuePath, { name: 'demo', tags: ['stable'] });

  const result = validateJsonFile(valuePath, schemaPath);

  assert.equal(result.ok, true);
  assert.deepEqual(result.issues, []);
});

export {};
