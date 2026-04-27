#!/usr/bin/env node
const { runShortcut } = require('../cli');

runShortcut('bug', process.argv.slice(2));

export {};
