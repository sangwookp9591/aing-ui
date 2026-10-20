#!/usr/bin/env node
'use strict';
const {spawnSync} = require('node:child_process');
let binary = process.env.AING_BINARY;
if (!binary) {
  const musl = process.platform === 'linux' && !process.report.getReport().header.glibcVersionRuntime;
  const name = `aing-${process.platform}-${process.arch}${musl ? '-musl' : ''}`;
  try { binary = require.resolve(`${name}/bin/aing${process.platform === 'win32' ? '.exe' : ''}`); }
  catch { console.error(`aing: missing native package ${name}. Reinstall aing with optional dependencies enabled.`); process.exit(1); }
}
const env = {...process.env};
try { env.AING_ESBUILD_PATH = require.resolve('esbuild'); } catch {}
const child = spawnSync(binary, process.argv.slice(2), {stdio:'inherit', env});
if (child.error) { console.error(`aing: ${child.error.message}`); process.exit(1); }
if (child.signal) { process.kill(process.pid, child.signal); }
process.exit(child.status ?? 1);
