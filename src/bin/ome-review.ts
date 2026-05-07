#!/usr/bin/env node
const { runShortcut } = require('../cli');

runShortcut('review', process.argv.slice(2));

export {};
