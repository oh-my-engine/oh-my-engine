#!/usr/bin/env node
const { runShortcut } = require('../cli');

runShortcut('ui', process.argv.slice(2));

export {};
