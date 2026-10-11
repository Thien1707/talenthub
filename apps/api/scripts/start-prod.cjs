/**
 * Production start for Render / Docker.
 * Builds dist/main.js when missing (if @nestjs/cli is installed from build phase).
 */
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const apiRoot = path.resolve(__dirname, '..');
const distMain = path.join(apiRoot, 'dist', 'main.js');
const monorepoRoot = path.resolve(apiRoot, '../..');

function tryBuild(label, cwd, cmd) {
  console.log(`[api] ${label}: ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd, env: process.env });
}

function ensureBuilt() {
  if (fs.existsSync(distMain)) return;

  console.warn('[api] dist/main.js missing — running build before start…');

  try {
    tryBuild('workspace build', monorepoRoot, 'npm run build -w api');
  } catch {
    try {
      tryBuild('local build', apiRoot, 'npm run build');
    } catch {
      /* handled below */
    }
  }
}

ensureBuilt();

if (!fs.existsSync(distMain)) {
  console.error(
    '\n[api] Build failed — dist/main.js still missing.\n' +
      'Render: set Build Command to:\n' +
      '  cd ../.. && NPM_CONFIG_PRODUCTION=false npm install && npm run build -w api\n' +
      'Or Root Directory empty, Build: NPM_CONFIG_PRODUCTION=false npm install,\n' +
      'Start: npm run start:render\n' +
      'See docs/DEPLOY_RENDER.md\n',
  );
  process.exit(1);
}

const child = spawnSync(process.execPath, [distMain], {
  stdio: 'inherit',
  cwd: apiRoot,
  env: process.env,
});
process.exit(child.status === null ? 1 : child.status);
