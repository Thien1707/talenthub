/**
 * Production start for Render / Docker.
 * Builds when dist entry missing (if @nestjs/cli is installed from build phase).
 */
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const apiRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(apiRoot, '../..');

const DIST_CANDIDATES = [
  path.join(apiRoot, 'dist', 'main.js'),
  path.join(apiRoot, 'dist', 'src', 'main.js'),
];

function resolveDistMain() {
  return DIST_CANDIDATES.find((p) => fs.existsSync(p)) ?? null;
}

function tryBuild(label, cwd, cmd) {
  console.log(`[api] ${label}: ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd, env: process.env });
}

function ensureBuilt() {
  if (resolveDistMain()) return;

  console.warn('[api] dist entry missing — running build before start…');

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

const distMain = resolveDistMain();
if (!distMain) {
  console.error(
    '\n[api] Build failed — no dist/main.js or dist/src/main.js.\n' +
      'Render Build Command (Root Directory apps/api):\n' +
      '  cd ../.. && NPM_CONFIG_PRODUCTION=false npm install && NODE_OPTIONS=--max-old-space-size=512 npm run build -w api && npm run prisma:deploy -w api\n' +
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
