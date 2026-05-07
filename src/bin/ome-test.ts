#!/usr/bin/env node
const { runShortcut } = require('../cli');

runShortcut('test', process.argv.slice(2));

export {};
