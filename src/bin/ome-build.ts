#!/usr/bin/env node
const { runShortcut } = require('../cli');

runShortcut('build', process.argv.slice(2));

export {};
