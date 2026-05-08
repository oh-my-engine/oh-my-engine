#!/usr/bin/env node
const { run } = require('../cli/index');

run(['mcp', ...process.argv.slice(2)]);

export {};
