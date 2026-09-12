import { createMatchPlaybackRuntime } from './match-playback.mjs';
import { normalizeMatch } from './content-runtime.mjs';

const MATCHES = 'https://api.albasritv1.workers.dev/';
const BASRI_ORIGIN = 'https://www.albasritv.abrdns.com';

async function fetchJson(url, init = {}, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store', redirect: 'follow' });
    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    return { response, data };
  } finally {
    clearTimeout(timer);
  }
}

function headers(extra = {}) {
  return {
    Accept: 'application/json',
    Origin: BASRI_ORIGIN,
    Referer: `${BASRI_ORIGIN}/2026/09/matches.html`,
    'X-BSR-Page': '/2026/09/matches.html',
    ...extra,
  };
}

async function token() {
  const result = await fetchJson(`${MATCHES}session`, { headers: headers() });
  if (!result.response.ok || !result.data?.token) throw new Error(`MATCH_SESSION_${result.response.status}`);
  return String(result.data.token);
}

async function fetchMatches() {
  const session = await token();
  const result = await fetchJson(MATCHES, { headers: headers({ 'X-BSR-Token': session }) });
  if (!result.response.ok) throw new Error(`MATCH_LIST_${result.response.status}`);
  if (!result.data || !Array.isArray(result.data.data)) throw new Error('MATCH_LIST_INVALID');
  return result.data;
}

async function fetchServers(target) {
  const url = new URL(target);
  if (url.origin !== new URL(MATCHES).origin) throw new Error('BAD_MATCH_TARGET');
  const session = await token();
  const result = await fetchJson(url.href, { headers: headers({ 'X-BSR-Token': session }) });
  if (!result.response.ok) throw new Error(`MATCH_SERVERS_${result.response.status}`);
  if (!result.data || !Array.isArray(result.data.servers)) throw new Error('MATCH_SERVERS_INVALID');
  return result.data;
}

export function createProductionMatchRuntime() {
  const runtime = createMatchPlaybackRuntime({ fetchServers, matchOrigin: MATCHES });
  return {
    async matches() {
      const raw = await fetchMatches();
      const masked = runtime.maskMatchesPayload(raw);
      const normalized = masked.data.map(normalizeMatch);
      return {
        status: 'success',
        version: '1.0.13',
        kind: 'matches',
        source: 'basri-matches',
        cached: false,
        generated_at: new Date().toISOString(),
        health: null,
        data: normalized,
      };
    },
    async servers(ref) {
      return {
        status: 'success',
        version: '1.0.13',
        kind: 'match-servers',
        data: await runtime.listServers(ref),
      };
    },
    async playback(ref) {
      return {
        status: 'success',
        version: '1.0.13',
        kind: 'match-playback',
        data: await runtime.resolveServer(ref),
      };
    },
    proxyMedia: runtime.proxyMedia,
  };
}
