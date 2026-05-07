#!/usr/bin/env node
const { runShortcut } = require('../cli');

runShortcut('ship', process.argv.slice(2));

export {};
