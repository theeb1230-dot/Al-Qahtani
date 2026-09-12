#!/usr/bin/env node
import { spawn } from 'node:child_process';

const port = 3142;
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['server/index.mjs'], {
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
child.stdout.on('data', chunk => process.stdout.write(`[backend] ${chunk}`));
child.stderr.on('data', chunk => process.stderr.write(`[backend] ${chunk}`));

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitForHealth() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(base + '/health');
      if (res.ok) return;
    } catch {}
    await sleep(250);
  }
  throw new Error('BACKEND_START_TIMEOUT');
}

try {
  await waitForHealth();
  const matchesRes = await fetch(base + '/api/v1/matches');
  const matches = await matchesRes.json();
  if (!matchesRes.ok || matches?.status !== 'success' || !Array.isArray(matches.data) || !matches.data.length) {
    throw new Error(`MATCH_RUNTIME_LIST_FAILED_${matchesRes.status}`);
  }

  const serialized = JSON.stringify(matches.data);
  if (/kooorracity\.com|workers\.dev/i.test(serialized)) {
    throw new Error('MATCH_RUNTIME_LEAKED_UPSTREAM_URL');
  }

  const logoPath = matches.data
    .flatMap(match => [match?.team1?.logo, match?.team2?.logo])
    .find(value => typeof value === 'string' && value.startsWith('/api/matches/logo?id='));
  if (!logoPath) throw new Error('NO_OPAQUE_MATCH_LOGO_REFERENCE');

  const imageRes = await fetch(new URL(logoPath, base), {
    headers: { Origin: 'https://theeb1230-dot.github.io' },
  });
  const type = imageRes.headers.get('content-type') || '';
  const bytes = new Uint8Array(await imageRes.arrayBuffer());
  if (!imageRes.ok || !type.toLowerCase().startsWith('image/') || bytes.length < 64) {
    throw new Error(`MATCH_LOGO_PROXY_FAILED status=${imageRes.status} type=${type} bytes=${bytes.length}`);
  }
  if (imageRes.headers.get('access-control-allow-origin') !== 'https://theeb1230-dot.github.io') {
    throw new Error('MATCH_LOGO_CORS_MISSING');
  }

  console.log('PASS opaque match logo proxy', {
    status: imageRes.status,
    type,
    bytes: bytes.length,
    reference: 'opaque-runtime-path',
  });
} finally {
  child.kill('SIGTERM');
}
