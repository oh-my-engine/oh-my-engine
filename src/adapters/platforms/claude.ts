const { createFilePlatformAdapter } = require('./base');
module.exports = createFilePlatformAdapter('claude-code', 'Claude Code', ['rules:index', 'skills:claude']);
export {};
