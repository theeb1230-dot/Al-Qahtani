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

async function sanitizedServerDiagnostics() {
  try {
    const rawRes = await fetch(base + '/api/matches');
    const raw = await rawRes.json();
    const liveRaw = Array.isArray(raw?.data) ? raw.data.find(item => item?.priority === 1 && item?.link) : null;
    if (!liveRaw) return { liveRaw: false };
    const serversRes = await fetch(base + '/api/matches/servers?url=' + encodeURIComponent(String(liveRaw.link)));
    const payload = await serversRes.json();
    const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : Array.isArray(payload?.servers) ? payload.servers : [];
    const protocols = [];
    for (const row of rows.slice(0, 8)) {
      const value = typeof row === 'string' ? row : row?.url || row?.src || row?.link || row?.file || row?.embed || row?.iframe || row?.player || '';
      try { protocols.push(new URL(String(value), 'https://api.albasritv1.workers.dev/').protocol); } catch { protocols.push('invalid'); }
    }
    return {
      liveRaw: true,
      status: serversRes.status,
      topKeys: payload && typeof payload === 'object' && !Array.isArray(payload) ? Object.keys(payload).sort() : [],
      count: rows.length,
      firstRowKeys: rows[0] && typeof rows[0] === 'object' ? Object.keys(rows[0]).sort() : [],
      types: [...new Set(rows.map(row => typeof row === 'object' ? String(row?.type || '') : '').filter(Boolean))],
      protocols: [...new Set(protocols)],
    };
  } catch (error) {
    return { diagnosticsFailed: String(error?.message || error).replace(/https?:\/\/\S+/g, '[redacted]') };
  }
}

try {
  await waitForHealth();
  const matchesRes = await fetch(base + '/api/v1/matches');
  const matches = await matchesRes.json();
  if (!matchesRes.ok || matches?.status !== 'success' || !Array.isArray(matches.data) || !matches.data.length) {
    throw new Error(`MATCH_RUNTIME_LIST_FAILED_${matchesRes.status}`);
  }

  const serialized = JSON.stringify(matches.data);
  if (/kooorracity\.com|workers\.dev/i.test(serialized)) throw new Error('MATCH_RUNTIME_LEAKED_UPSTREAM_URL');

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
  if (imageRes.headers.get('access-control-allow-origin') !== 'https://theeb1230-dot.github.io') throw new Error('MATCH_LOGO_CORS_MISSING');

  console.log('PASS opaque match logo proxy', { status: imageRes.status, type, bytes: bytes.length, reference: 'opaque-runtime-path' });

  const live = matches.data.find(match => match?.status === 'live' && typeof match?.ref === 'string' && match.ref.startsWith('match:'));
  if (live) {
    const playRes = await fetch(base + '/api/v1/matches/play?ref=' + encodeURIComponent(live.ref));
    const play = await playRes.json();
    if (!playRes.ok || play?.status !== 'success' || !play?.data?.media_path?.startsWith('/api/v1/matches/media?id=')) {
      console.log('INFO sanitized live match server diagnostics', await sanitizedServerDiagnostics());
      throw new Error(`LIVE_MATCH_PLAYBACK_RESOLUTION_FAILED_${playRes.status}`);
    }
    const playSerialized = JSON.stringify(play);
    if (/https?:\/\//i.test(playSerialized) || /workers\.dev/i.test(playSerialized)) throw new Error('MATCH_PLAYBACK_LEAKED_UPSTREAM_URL');

    const mediaRes = await fetch(new URL(play.data.media_path, base), {
      headers: { Origin: 'https://theeb1230-dot.github.io', Range: 'bytes=0-4095' },
    });
    const mediaType = (mediaRes.headers.get('content-type') || '').toLowerCase();
    const mediaBytes = new Uint8Array(await mediaRes.arrayBuffer());
    if (!mediaRes.ok || !mediaBytes.length || mediaType.includes('application/json')) {
      throw new Error(`LIVE_MATCH_MEDIA_PROXY_FAILED_${mediaRes.status}`);
    }
    console.log('PASS live match playback proxy', {
      status: mediaRes.status,
      mediaType: mediaType.includes('mpegurl') ? 'hls' : mediaType.startsWith('video/') ? 'video' : 'binary',
      bytes: mediaBytes.length,
      reference: 'opaque-runtime-path',
    });
  } else {
    console.log('SKIP live match playback proxy: no live match in current Basri schedule');
  }
} finally {
  child.kill('SIGTERM');
}
