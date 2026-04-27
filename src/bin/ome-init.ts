#!/usr/bin/env node
const { runShortcut } = require('../cli');

runShortcut('init', process.argv.slice(2));

export {};
