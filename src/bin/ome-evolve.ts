#!/usr/bin/env node
const { runShortcut } = require('../cli');

runShortcut('evolve', process.argv.slice(2));

export {};
