#!/usr/bin/env node
const { runShortcut } = require('../cli');

runShortcut('spec', process.argv.slice(2));

export {};
