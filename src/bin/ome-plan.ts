#!/usr/bin/env node
const { runShortcut } = require('../cli');

runShortcut('plan', process.argv.slice(2));

export {};
