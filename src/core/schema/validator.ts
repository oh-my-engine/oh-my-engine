const fs = require('node:fs');
const path = require('node:path');

export interface SchemaIssue {
  path: string;
  message: string;
}

export interface SchemaValidationResult {
  ok: boolean;
  issues: SchemaIssue[];
}

function typeOf(value: any): string {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function validateAgainstSchema(schema: Record<string, any>, value: any, valuePath: string): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  const expectedType = schema.type;
  if (expectedType && typeOf(value) !== expectedType) {
    issues.push({ path: valuePath, message: `expected ${expectedType}, got ${typeOf(value)}` });
    return issues;
  }

  if (expectedType === 'object') {
    for (const key of schema.required || []) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        issues.push({ path: `${valuePath}.${key}`, message: 'required property missing' });
      }
    }

    for (const [key, childSchema] of Object.entries(schema.properties || {}) as Array<[string, any]>) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        issues.push(...validateAgainstSchema(childSchema, value[key], `${valuePath}.${key}`));
      }
    }
  }

  if (expectedType === 'array' && schema.items) {
    value.forEach((item: any, index: number) => {
      issues.push(...validateAgainstSchema(schema.items, item, `${valuePath}[${index}]`));
    });
  }

  return issues;
}

export function validateJsonFile(filePath: string, schemaPath: string): SchemaValidationResult {
  if (!fs.existsSync(filePath)) {
    return { ok: false, issues: [{ path: filePath, message: 'file missing' }] };
  }

  try {
    const value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    const issues = validateAgainstSchema(schema, value, '$');
    return { ok: issues.length === 0, issues };
  } catch (error) {
    return { ok: false, issues: [{ path: filePath, message: error instanceof Error ? error.message : String(error) }] };
  }
}

export function schemaPath(name: string): string {
  return path.join(__dirname, '..', '..', '..', 'schemas', name);
}
