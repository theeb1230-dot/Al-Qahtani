import crypto from "node:crypto";
import https from "node:https";
import net from "node:net";

const REF_TTL_MS = 15 * 60_000;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_HLS_BYTES = 2 * 1024 * 1024;

function text(value) { return value == null ? "" : String(value).trim(); }

function isPrivateIpv4(host) {
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  return parts[0] === 10
    || parts[0] === 127
    || (parts[0] === 169 && parts[1] === 254)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168)
    || parts[0] === 0;
}

function isPrivateIpv6(host) {
  const h = host.toLowerCase();
  return h === '::1' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80:');
}

export function assertPublicHttpsUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('MATCH_URL_HTTPS_REQUIRED');
  if (url.username || url.password) throw new Error('MATCH_URL_CREDENTIALS_REJECTED');
  if (url.port && url.port !== '443') throw new Error('MATCH_URL_PORT_REJECTED');
  const host = url.hostname.toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new Error('MATCH_URL_HOST_REJECTED');
  const ipKind = net.isIP(host);
  if ((ipKind === 4 && isPrivateIpv4(host)) || (ipKind === 6 && isPrivateIpv6(host))) throw new Error('MATCH_URL_PRIVATE_IP');
  return url;
}

function inferType(url, rawType = '') {
  const type = text(rawType).toLowerCase();
  if (['m3u8', 'hls'].includes(type)) return 'm3u8';
  if (['mp4', 'video/mp4'].includes(type)) return 'mp4';
  const target = text(url).toLowerCase();
  if (/\.m3u8(?:$|\?)/.test(target)) return 'm3u8';
  if (/\.mp4(?:$|\?)/.test(target)) return 'mp4';
  if (/\.(?:ts|m2ts)(?:$|\?)/.test(target)) return 'stream';
  return 'embed';
}

function prune(map) {
  const now = Date.now();
  for (const [key, entry] of map) if (entry.expiresAt <= now) map.delete(key);
  while (map.size > 256) map.delete(map.keys().next().value);
}

function store(map, value) {
  prune(map);
  const id = crypto.randomBytes(18).toString('base64url');
  map.set(id, { ...value, expiresAt: Date.now() + REF_TTL_MS });
  return id;
}

function resolveRef(map, ref, code) {
  const id = text(ref).replace(/^[^:]+:/, '');
  const entry = map.get(id);
  if (!entry || entry.expiresAt <= Date.now()) {
    map.delete(id);
    throw new Error(code);
  }
  return entry;
}

async function fetchTextSafe(value, { referer = '', maxBytes = MAX_HTML_BYTES, redirects = 0 } = {}) {
  if (redirects > 4) throw new Error('MATCH_REDIRECT_LIMIT');
  const url = assertPublicHttpsUrl(value);
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'manual',
    cache: 'no-store',
    headers: {
      Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1',
      ...(referer ? { Referer: referer } : {}),
    },
  });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get('location');
    if (!location) throw new Error('MATCH_REDIRECT_WITHOUT_LOCATION');
    return fetchTextSafe(new URL(location, url).href, { referer: url.href, maxBytes, redirects: redirects + 1 });
  }
  if (!response.ok) throw new Error(`MATCH_EMBED_HTTP_${response.status}`);
  const reader = response.body?.getReader();
  if (!reader) return { html: await response.text(), url: response.url || url.href };
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value: chunk } = await reader.read();
    if (done) break;
    size += chunk.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error('MATCH_EMBED_TOO_LARGE');
    }
    chunks.push(chunk);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return { html: new TextDecoder().decode(bytes), url: response.url || url.href };
}

function candidateUrls(html, baseUrl) {
  const direct = [];
  const nested = [];
  const seen = new Set();
  const patterns = [
    /<source[^>]+src=["']([^"']+)["']/gi,
    /<video[^>]+src=["']([^"']+)["']/gi,
    /(?:file|src)\s*[:=]\s*["'](https?:\/\/[^"']+)["']/gi,
  ];
  for (const re of patterns) {
    for (const match of String(html || '').matchAll(re)) {
      try {
        const url = assertPublicHttpsUrl(new URL(match[1], baseUrl).href).href;
        if (seen.has(url)) continue;
        seen.add(url);
        if (inferType(url) === 'embed') nested.push(url); else direct.push(url);
      } catch {}
    }
  }
  for (const match of String(html || '').matchAll(/<iframe[^>]+src=["']([^"']+)["']/gi)) {
    try {
      const url = assertPublicHttpsUrl(new URL(match[1], baseUrl).href).href;
      if (!seen.has(url)) { seen.add(url); nested.push(url); }
    } catch {}
  }
  return { direct, nested };
}

async function resolveEmbed(url, depth = 0) {
  if (depth > 2) return null;
  const page = await fetchTextSafe(url, { referer: depth ? url : '' });
  const candidates = candidateUrls(page.html, page.url);
  if (candidates.direct.length) return { url: candidates.direct[0], referer: page.url, type: inferType(candidates.direct[0]) };
  for (const nested of candidates.nested.slice(0, 3)) {
    try {
      const resolved = await resolveEmbed(nested, depth + 1);
      if (resolved) return resolved;
    } catch {}
  }
  return null;
}

function requestExternal(target, headers, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 4) return reject(new Error('MATCH_MEDIA_REDIRECT_LIMIT'));
    const url = assertPublicHttpsUrl(target);
    const request = https.request(url, { method: 'GET', headers }, (response) => {
      const status = Number(response.statusCode || 0);
      const location = response.headers.location;
      if ([301, 302, 303, 307, 308].includes(status) && location) {
        response.resume();
        try {
          const next = assertPublicHttpsUrl(new URL(location, url).href);
          resolve(requestExternal(next, headers, redirects + 1));
        } catch (error) { reject(error); }
        return;
      }
      resolve(response);
    });
    request.setTimeout(60_000, () => request.destroy(new Error('MATCH_MEDIA_TIMEOUT')));
    request.on('error', reject);
    request.end();
  });
}

async function readTextStream(stream, maxBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('MATCH_HLS_TOO_LARGE');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size).toString('utf8');
}

export function createMatchPlaybackRuntime({ fetchServers, matchOrigin }) {
  if (typeof fetchServers !== 'function') throw new TypeError('fetchServers is required');
  const workerOrigin = new URL(matchOrigin).origin;
  const matches = new Map();
  const servers = new Map();
  const media = new Map();

  function maskMatchesPayload(payload) {
    const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    const data = list.map((match) => {
      const raw = text(match?.link || match?.url || match?.ref);
      let ref = '';
      if (raw) {
        const target = new URL(raw);
        if (target.origin !== workerOrigin) throw new Error('BAD_MATCH_TARGET');
        ref = `match:${store(matches, { url: target.href })}`;
      }
      return { ...match, link: ref, ref };
    });
    return Array.isArray(payload) ? data : { ...payload, data };
  }

  async function listServers(matchRef) {
    const match = resolveRef(matches, matchRef, 'MATCH_REFERENCE_EXPIRED');
    const payload = await fetchServers(match.url);
    const list = Array.isArray(payload?.servers) ? payload.servers : [];
    return list.map((server, index) => {
      const raw = text(server?.url || server?.src);
      if (!raw) return null;
      const target = assertPublicHttpsUrl(raw);
      const type = inferType(target.href, server?.type);
      const ref = `server:${store(servers, { url: target.href, type, name: text(server?.name) || `سيرفر ${index + 1}` })}`;
      return { ref, name: text(server?.name) || `سيرفر ${index + 1}`, type };
    }).filter(Boolean);
  }

  async function resolveServer(serverRef) {
    const server = resolveRef(servers, serverRef, 'MATCH_SERVER_REFERENCE_EXPIRED');
    let resolved = null;
    if (server.type !== 'embed') {
      resolved = { url: server.url, referer: '', type: server.type };
    } else {
      resolved = await resolveEmbed(server.url);
    }
    if (!resolved?.url) throw new Error('NO_MATCH_MEDIA');
    const target = assertPublicHttpsUrl(resolved.url);
    const mediaType = resolved.type === 'm3u8' ? 'm3u8' : resolved.type === 'mp4' ? 'mp4' : 'stream';
    const id = store(media, {
      url: target.href,
      referer: resolved.referer || server.url,
      name: server.name,
      type: mediaType,
    });
    return { media_path: `/api/matches/media?id=${encodeURIComponent(id)}`, media_type: mediaType, server_name: server.name };
  }

  function storeChild(value, base, parent) {
    const target = assertPublicHttpsUrl(new URL(value, base).href);
    const id = store(media, { url: target.href, referer: base, name: parent.name, type: inferType(target.href) });
    return `/api/matches/media?id=${encodeURIComponent(id)}`;
  }

  function rewriteManifest(manifest, base, parent) {
    return String(manifest || '').split(/\r?\n/).map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith('#')) {
        return line.replace(/URI=(?:"([^"]+)"|'([^']+)'|([^,\s]+))/gi, (_m, a, b, c) => `URI="${storeChild(a || b || c || '', base, parent)}"`);
      }
      return storeChild(trimmed, base, parent);
    }).join('\n');
  }

  async function proxyMedia(req, res, id) {
    const entry = media.get(id);
    if (!entry || entry.expiresAt <= Date.now()) {
      media.delete(id);
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ status: 'error', message: 'MATCH_MEDIA_REFERENCE_EXPIRED' }));
    }
    const target = assertPublicHttpsUrl(entry.url);
    const headers = {
      Accept: '*/*',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1',
      ...(entry.referer ? { Referer: entry.referer } : {}),
    };
    if (req.headers.range && !/\.m3u8(?:$|\?)/i.test(target.pathname + target.search)) headers.Range = req.headers.range;
    const upstream = await requestExternal(target, headers);
    const status = Number(upstream.statusCode || 502);
    if (status < 200 || status >= 300) {
      upstream.resume();
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify({ status: 'error', message: `MATCH_MEDIA_UPSTREAM_${status}` }));
    }
    const contentType = text(upstream.headers['content-type']);
    const isHls = contentType.toLowerCase().includes('mpegurl') || /\.m3u8(?:$|\?)/i.test(target.pathname + target.search);
    if (isHls) {
      const manifest = await readTextStream(upstream, MAX_HLS_BYTES);
      if (!manifest.trimStart().startsWith('#EXTM3U')) throw new Error('INVALID_MATCH_HLS');
      const body = Buffer.from(rewriteManifest(manifest, target.href, entry), 'utf8');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl; charset=utf-8');
      res.setHeader('Content-Length', String(body.byteLength));
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.end(body);
    }
    for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) {
      const value = upstream.headers[name];
      if (value) res.setHeader(name, value);
    }
    if (!upstream.headers['content-type']) res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Cache-Control', 'no-store');
    res.statusCode = status;
    for await (const chunk of upstream) res.write(chunk);
    res.end();
  }

  return { maskMatchesPayload, listServers, resolveServer, proxyMedia };
}
