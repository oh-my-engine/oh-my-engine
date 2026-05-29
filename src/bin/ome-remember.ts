#!/usr/bin/env node
const { runShortcut } = require('../cli');

runShortcut('remember', process.argv.slice(2));

export {};
