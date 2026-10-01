import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (name) => readFileSync(resolve(root, name), 'utf8');
const marker = 'CHATMCP_SECURITY_HOLD';

test('deployment hold exits unsuccessfully without an environment bypass', () => {
  for (const values of [{}, { NODE_ENV: 'production', ALLOW_DEPLOY: 'true', DISABLE_AUTH: 'false' }]) {
    const result = spawnSync(process.execPath, ['scripts/security/deployment-hold.cjs'], {
      cwd: root, env: values, encoding: 'utf8', timeout: 5000,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /CHATMCP_SECURITY_HOLD/);
    assert.equal(result.stdout, '');
  }
});

for (const [file, names] of [
  ['package.json', ['build', 'dev', 'start', 'deploy', 'docker:up']],
  ['apps/orchestrator/package.json', ['build', 'start', 'start:dev', 'start:debug', 'start:prod']],
  ['apps/web-platform/package.json', ['build', 'dev', 'start']],
]) {
  test(`${file}: all known startup/build scripts run only the unconditional hold`, () => {
    const { scripts } = JSON.parse(read(file));
    for (const name of names) {
      const match = /^node (?:\.\.\/)*scripts\/security\/deployment-hold\.cjs$/.exec(scripts[name]);
      assert.ok(match, name);
      const result = spawnSync(process.execPath, [scripts[name].slice(5)], {
        cwd: dirname(resolve(root, file)), env: {}, encoding: 'utf8', timeout: 5000,
      });
      assert.equal(result.status, 1, name);
      assert.ok(result.stderr.includes(marker), name);
    }
  });
}

test('orchestrator bootstrap fails before imports, provider construction, or listening', () => {
  const source = read('apps/orchestrator/src/main.ts');
  assert.doesNotMatch(source, /^\s*(?:import|export)\s/m);
  assert.doesNotMatch(source, /\brequire\s*\(/);
  assert.throws(() => vm.runInNewContext(source, {}, { timeout: 100 }), /CHATMCP_SECURITY_HOLD/);
});

test('actual guard method denies empty and forged contexts without reading identity', () => {
  const source = read('apps/orchestrator/src/auth/guards/jwt-auth.guard.ts');
  // This small static fixture intentionally avoids installing or bootstrapping Nest/providers.
  assert.match(source, /canActivate\(_context: ExecutionContext\): boolean/);
  const runnable = source
    .replace(/^import .*;\n/m, '')
    .replace('@Injectable()', '')
    .replace('export class JwtAuthGuard implements CanActivate', 'class JwtAuthGuard')
    .replace('_context: ExecutionContext', '_context')
    .replace('): boolean', ')') + '\nnew JwtAuthGuard();';
  const guard = vm.runInNewContext(runnable, {}, { timeout: 100 });
  for (const context of [undefined, {}, { user: { sub: 'forged-test-user' } }, new Proxy({}, { get() { throw new Error('identity accessed'); } })]) {
    assert.equal(guard.canActivate(context), false);
  }
});

test('agent, conversation, and tool controllers use the deny guard at class scope', () => {
  for (const [name, guard] of [['agent', 'JwtAuthGuard'], ['conversation', 'JwtAuthGuard'], ['tools', 'AuthGuard']]) {
    const source = read(`apps/orchestrator/src/${name}/${name}.controller.ts`);
    assert.match(source, new RegExp(`@UseGuards\\(${guard}\\)\\s*export class`));
  }
  assert.match(read('apps/orchestrator/src/tools/tools.controller.ts'), /JwtAuthGuard as AuthGuard.*guards\/jwt-auth.guard/);
  assert.match(read('apps/orchestrator/src/health/health.controller.ts'), /@Post\('test-o3'\)\s*@UseGuards\(JwtAuthGuard\)/);
});

for (const file of ['Dockerfile', 'apps/orchestrator/Dockerfile', 'apps/web-platform/Dockerfile']) {
  test(`${file}: build fails in the base stage before dependency/network commands`, () => {
    const source = read(file);
    const firstRun = source.match(/^RUN .+$/m)?.[0];
    assert.equal(firstRun, `RUN node -e 'throw new Error("${marker}")'`);
    const firstFrom = source.indexOf('\nFROM ');
    const secondFrom = source.indexOf('\nFROM ', firstFrom + 1);
    assert.ok(source.indexOf(firstRun) < secondFrom);
  });
}

for (const file of ['.github/workflows/fly-deploy.yml', '.github/workflows/deploy-vercel.yml']) {
  test(`${file}: first step stops deployment before checkout, build, or credentials`, () => {
    const source = read(file);
    assert.match(source, /steps:\s*\n\s*- name: Stop unreviewed deployment/);
    const firstStep = source.slice(source.indexOf('    steps:'), source.indexOf('\n      - ', source.indexOf('Stop unreviewed deployment')));
    assert.match(firstStep, /CHATMCP_SECURITY_HOLD/);
    assert.match(firstStep, /exit 1/);
    assert.doesNotMatch(firstStep, /\bif:|continue-on-error|secrets\./);
    assert.doesNotMatch(source, /\bif:\s*always\(|continue-on-error:\s*true/);
  });
}

test('Fly source configs cannot restore public listeners or autostart', () => {
  for (const file of ['fly.toml', 'apps/orchestrator/fly.toml']) {
    const source = read(file);
    assert.match(source, /app\s*=\s*['"]chatmcp['"]/);
    assert.doesNotMatch(source, /^\[\[?(?:http_service|services)/m);
    assert.doesNotMatch(source, /auto_start_machines\s*=\s*true/);
  }
});

test('legacy Kubernetes deployment cannot start cached application images', () => {
  assert.match(read('infra/k8s/web-platform-deployment.yaml'), /^  replicas: 0$/m);
});

test('required containment CI uses dependency-free tests on pull requests and main', () => {
  const workflow = read('.github/workflows/security-containment.yml');
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /branches: \[main\]/);
  assert.match(workflow, /name: ChatMCP security containment/);
  assert.match(workflow, /node --test scripts\/security\/containment.test.mjs/);
  assert.doesNotMatch(workflow, /npm (?:ci|install)|pnpm install|secrets\./);
});
