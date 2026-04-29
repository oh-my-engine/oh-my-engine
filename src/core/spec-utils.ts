const fs = require('node:fs');

export function slugify(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '');
}

export function utcIso(): string {
  return new Date().toISOString();
}

export function utcStamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').replace('T', '-');
}

export function renderTemplate(sourcePath: string, replacements: Record<string, string>): string {
  let content = fs.readFileSync(sourcePath, 'utf8');
  for (const [key, value] of Object.entries(replacements)) {
    content = content.split(key).join(value);
  }
  return content;
}

export function countOpenCheckboxes(filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  return fs.readFileSync(filePath, 'utf8').split('\n').filter((line: string) => /^- \[ \]/.test(line)).length;
}

export function countDoneCheckboxes(filePath: string): number {
  if (!fs.existsSync(filePath)) return 0;
  return fs.readFileSync(filePath, 'utf8').split('\n').filter((line: string) => /^- \[[xX]\]/.test(line)).length;
}
