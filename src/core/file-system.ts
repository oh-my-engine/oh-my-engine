const fs = require('node:fs');
const path = require('node:path');

export function ensureDirectory(directoryPath: string): void {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function tempSiblingPath(filePath: string): string {
  const directory = path.dirname(filePath);
  const baseName = path.basename(filePath);
  return path.join(directory, `.${baseName}.${process.pid}.${Date.now()}.tmp`);
}

export function writeTextFile(filePath: string, content: string, options: { finalNewline?: boolean; atomic?: boolean } = {}): void {
  const finalNewline = options.finalNewline !== false;
  const atomic = options.atomic !== false;
  const normalized = finalNewline && !content.endsWith('\n') ? `${content}\n` : content;

  ensureDirectory(path.dirname(filePath));

  if (!atomic) {
    fs.writeFileSync(filePath, normalized, 'utf8');
    return;
  }

  const temporaryPath = tempSiblingPath(filePath);
  try {
    fs.writeFileSync(temporaryPath, normalized, 'utf8');
    fs.renameSync(temporaryPath, filePath);
  } catch (error) {
    fs.rmSync(temporaryPath, { force: true });
    throw error;
  }
}

export function writeJsonFile(filePath: string, payload: Record<string, unknown>, options: { atomic?: boolean } = {}): void {
  writeTextFile(filePath, JSON.stringify(payload, null, 2), { atomic: options.atomic });
}
