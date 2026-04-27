#!/usr/bin/env node
const { runShortcut } = require('../cli');

runShortcut('api', process.argv.slice(2));

export {};
