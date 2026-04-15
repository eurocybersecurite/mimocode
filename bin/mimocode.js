#!/usr/bin/env node

// CommonJS version - pas d'import
const { spawn } = require('child_process');
const path = require('path');

// Lancer la CLI
try {
  require('../dist/cli/index.js');
} catch (e) {
  console.error('Error loading Mimocode:', e.message);
  console.error('Try running: npm run build:cli');
  process.exit(1);
}
