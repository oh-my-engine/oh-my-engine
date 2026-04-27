#!/usr/bin/env node
const { runShortcut } = require('../cli');

runShortcut('memory', process.argv.slice(2));

export {};
