#!/usr/bin/env node
const { runShortcut } = require('../cli');

runShortcut('superpowers', process.argv.slice(2));

export {};
