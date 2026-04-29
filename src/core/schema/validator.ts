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

type JsonSchema = Record<string, any>;

function typeOf(value: unknown): string {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeOf(value) === 'object';
}

function expectedTypes(schema: JsonSchema): string[] {
  if (Array.isArray(schema.type)) return schema.type.filter((item: unknown) => typeof item === 'string');
  if (typeof schema.type === 'string') return [schema.type];
  return [];
}

function validateType(schema: JsonSchema, value: unknown, valuePath: string): SchemaIssue[] {
  const types = expectedTypes(schema);
  if (types.length === 0 || types.includes(typeOf(value))) return [];
  return [{ path: valuePath, message: `expected ${types.join(' or ')}, got ${typeOf(value)}` }];
}

function validateScalarConstraints(schema: JsonSchema, value: unknown, valuePath: string): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    issues.push({ path: valuePath, message: `expected one of: ${schema.enum.join(', ')}` });
  }

  if (Object.prototype.hasOwnProperty.call(schema, 'const') && value !== schema.const) {
    issues.push({ path: valuePath, message: `expected constant value ${String(schema.const)}` });
  }

  if (typeof value === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
      issues.push({ path: valuePath, message: `expected string length >= ${schema.minLength}` });
    }
    if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) {
      issues.push({ path: valuePath, message: `expected string length <= ${schema.maxLength}` });
    }
    if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern).test(value)) {
      issues.push({ path: valuePath, message: `expected string to match pattern ${schema.pattern}` });
    }
  }

  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      issues.push({ path: valuePath, message: `expected number >= ${schema.minimum}` });
    }
    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      issues.push({ path: valuePath, message: `expected number <= ${schema.maximum}` });
    }
  }

  return issues;
}

function validateObject(schema: JsonSchema, value: unknown, valuePath: string): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  if (!isObject(value)) return issues;

  for (const key of schema.required || []) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) {
      issues.push({ path: `${valuePath}.${key}`, message: 'required property missing' });
    }
  }

  const properties = schema.properties || {};
  for (const [key, childSchema] of Object.entries(properties) as Array<[string, JsonSchema]>) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      issues.push(...validateAgainstSchema(childSchema, value[key], `${valuePath}.${key}`));
    }
  }

  for (const key of Object.keys(value)) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) continue;
    if (schema.additionalProperties === false) {
      issues.push({ path: `${valuePath}.${key}`, message: 'additional property is not allowed' });
    } else if (isObject(schema.additionalProperties)) {
      issues.push(...validateAgainstSchema(schema.additionalProperties, value[key], `${valuePath}.${key}`));
    }
  }

  return issues;
}

function validateArray(schema: JsonSchema, value: unknown, valuePath: string): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  if (!Array.isArray(value)) return issues;

  if (typeof schema.minItems === 'number' && value.length < schema.minItems) {
    issues.push({ path: valuePath, message: `expected array length >= ${schema.minItems}` });
  }
  if (typeof schema.maxItems === 'number' && value.length > schema.maxItems) {
    issues.push({ path: valuePath, message: `expected array length <= ${schema.maxItems}` });
  }
  if (schema.items) {
    value.forEach((item: unknown, index: number) => {
      issues.push(...validateAgainstSchema(schema.items, item, `${valuePath}[${index}]`));
    });
  }

  return issues;
}

function validateAgainstSchema(schema: JsonSchema, value: unknown, valuePath: string): SchemaIssue[] {
  const typeIssues = validateType(schema, value, valuePath);
  if (typeIssues.length > 0) return typeIssues;

  return [
    ...validateScalarConstraints(schema, value, valuePath),
    ...validateObject(schema, value, valuePath),
    ...validateArray(schema, value, valuePath)
  ];
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
