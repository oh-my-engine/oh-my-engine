#!/usr/bin/env node
const { runShortcut } = require('../cli');

runShortcut('comp', process.argv.slice(2));

export {};
