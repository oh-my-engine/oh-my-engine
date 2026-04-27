const claude = require('./platforms/claude');
const codex = require('./platforms/codex');
const opencode = require('./platforms/opencode');
const windsurf = require('./platforms/windsurf');
const cursor = require('./platforms/cursor');
const trae = require('./platforms/trae');
const antigravity = require('./platforms/antigravity');
const qoder = require('./platforms/qoder');

import type { PlatformAdapter } from './types';

const adapters: PlatformAdapter[] = [claude, codex, opencode, windsurf, cursor, trae, antigravity, qoder];

export function getAdapter(id: string): PlatformAdapter | undefined {
  return adapters.find(adapter => adapter.id === id);
}

export function getAdapters(): PlatformAdapter[] {
  return adapters;
}
