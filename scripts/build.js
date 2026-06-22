#!/usr/bin/env node
/**
 * 跨平台构建辅助脚本（替代原先依赖 pwsh 的 clean/pack 脚本）。
 *
 * 用法（在 package.json scripts 中）：
 *   "clean": "node scripts/build.js clean",
 *   "pack": "node scripts/build.js pack",
 *
 * 子命令：
 *   clean [target...]   删除指定目录（默认 dist；lubejs 传 dist doc）
 *   pack                将 README*.md、package.json 复制到 dist/ 后在 dist/ 执行 pnpm pack
 *
 * 仅使用 Node 内置 fs / child_process，无额外依赖，Linux/macOS/Windows 均可运行。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = process.cwd();
const distDir = path.join(root, 'dist');

function rmrf(target) {
  const abs = path.join(root, target);
  if (fs.existsSync(abs)) {
    fs.rmSync(abs, { recursive: true, force: true });
    console.log(`[build] removed ${target}`);
  }
}

function clean(targets) {
  (targets && targets.length ? targets : ['dist']).forEach(rmrf);
}

/**
 * 复制单个文件，源文件不存在时跳过（不报错），便于不同包共用同一脚本。
 */
function copyOptional(srcName) {
  const src = path.join(root, srcName);
  if (!fs.existsSync(src)) return;
  fs.copyFileSync(src, path.join(distDir, srcName));
}

function pack() {
  if (!fs.existsSync(distDir)) {
    throw new Error(`dist directory not found at ${distDir}, run tsc first.`);
  }
  // 复制打包所需元文件到 dist
  copyOptional('README.md');
  copyOptional('README-zh_CN.md');
  copyOptional('package.json');
  // 在 dist 目录执行 pnpm pack
  // 优先用 pnpm pack（与原脚本一致），退回 npm pack
  let result = spawnSync('pnpm', ['pack'], { cwd: distDir, stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    // pnpm 不可用时退回 npm pack
    result = spawnSync('npm', ['pack'], { cwd: distDir, stdio: 'inherit' });
  }
  if (result.status !== 0) {
    throw new Error(`pnpm pack failed with exit code ${result.status}`);
  }
}

function main() {
  const [, , sub, ...rest] = process.argv;
  switch (sub) {
    case 'clean':
      clean(rest);
      break;
    case 'pack':
      pack();
      break;
    default:
      console.error(`Unknown subcommand: ${sub}. Use "clean" or "pack".`);
      process.exit(1);
  }
}

try {
  main();
} catch (e) {
  console.error(`[build] ${e.message}`);
  process.exit(1);
}
