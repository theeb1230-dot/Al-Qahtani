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
  const matchesRes = await fetch(base + '/api/matches');
  const matches = await matchesRes.json();
  if (!matchesRes.ok || !matches?.success || !Array.isArray(matches.data) || !matches.data.length) {
    throw new Error(`MATCH_LIST_FAILED_${matchesRes.status}`);
  }
  const logo = matches.data.flatMap(match => [match?.team1?.logo, match?.team2?.logo]).find(Boolean);
  if (!logo) throw new Error('NO_MATCH_LOGO_IN_ORIGINAL_BASRI_PAYLOAD');
  const proxy = base + '/api/matches/logo?url=' + encodeURIComponent(String(logo));
  const imageRes = await fetch(proxy, { headers: { Origin: 'https://theeb1230-dot.github.io' } });
  const type = imageRes.headers.get('content-type') || '';
  const bytes = new Uint8Array(await imageRes.arrayBuffer());
  if (!imageRes.ok || !type.toLowerCase().startsWith('image/') || bytes.length < 64) {
    throw new Error(`MATCH_LOGO_PROXY_FAILED status=${imageRes.status} type=${type} bytes=${bytes.length}`);
  }
  if (imageRes.headers.get('access-control-allow-origin') !== 'https://theeb1230-dot.github.io') {
    throw new Error('MATCH_LOGO_CORS_MISSING');
  }
  console.log('PASS match logo proxy', { status: imageRes.status, type, bytes: bytes.length, sourceHost: new URL(logo).hostname });
} finally {
  child.kill('SIGTERM');
}
