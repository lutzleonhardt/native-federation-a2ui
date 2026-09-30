#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { cpSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = (path) => resolve(repoRoot, 'dist', path);

/** The remotes of the deployment: manifest name, Angular project, folder below the shell. */
const REMOTES = [
  { name: 'charts', project: 'mfe-charts', folder: 'charts' },
  { name: 'maps', project: 'mfe-maps', folder: 'maps' },
];

const USAGE = `Usage: npm run build:deploy -- [--base-href /path/]
  --base-href  the path the site is served under, with a leading and a trailing "/" (default: /)`;

/** The base href, or undefined for any argument list other than none or one valid `--base-href`. */
function baseHrefFrom(args) {
  if (args.length === 0) return '/';
  const [flag, base, ...rest] = args;
  const valid = flag === '--base-href' && rest.length === 0 && /^\/(.*\/)?$/.test(base ?? '');
  return valid ? base : undefined;
}

function sh(command) {
  console.log(`\n[build-deploy] $ ${command}`);
  execSync(command, { cwd: repoRoot, stdio: 'inherit' });
}

const base = baseHrefFrom(process.argv.slice(2));
if (base === undefined) {
  console.error(USAGE);
  process.exit(1);
}

// `ng serve` writes its federation artifacts into the same dist folders and artifact cache.
sh('npm run clean');
for (const { project, folder } of REMOTES) {
  // A remote's standalone page lives below the shell, so its base href is its own folder.
  sh(`npx ng build ${project} --base-href ${base}${folder}/`);
}
sh(`npx ng build shell --configuration deploy --base-href ${base}`);

rmSync(dist('deploy'), { recursive: true, force: true });
cpSync(dist('shell/browser'), dist('deploy'), { recursive: true });
for (const { project, folder } of REMOTES) {
  cpSync(dist(`${project}/browser`), dist(`deploy/${folder}`), { recursive: true });
}

// Replaces the copied dev manifest (localhost URLs). The `./` prefix is load-bearing:
// es-module-shims treats a bare string as a bare specifier.
const manifest = Object.fromEntries(
  REMOTES.map(({ name, folder }) => [name, `./${folder}/remoteEntry.json`]),
);
writeFileSync(dist('deploy/federation.manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

const servedAs = base.slice(1, -1);
console.log('\n[build-deploy] dist/deploy ready.');
console.log('[build-deploy] Smoke recipe:');
if (servedAs === '') {
  console.log('  npx serve dist/deploy -l 8088');
} else {
  console.log(`  mv dist/deploy dist/${servedAs}`);
  console.log('  npx serve dist -l 8088');
}
console.log(`  open http://localhost:8088${base}`);
console.log('[build-deploy] Before the next `npm start`: npm run clean');
