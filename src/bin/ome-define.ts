#!/usr/bin/env node
const { runShortcut } = require('../cli');

runShortcut('define', process.argv.slice(2));

export {};
