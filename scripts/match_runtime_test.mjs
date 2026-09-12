import assert from 'node:assert/strict';
import { assertPublicHttpsUrl, createMatchPlaybackRuntime } from '../server/match-playback.mjs';

assert.throws(() => assertPublicHttpsUrl('http://example.com/live.m3u8'), /HTTPS/);
assert.throws(() => assertPublicHttpsUrl('https://127.0.0.1/live.m3u8'), /PRIVATE/);
assert.throws(() => assertPublicHttpsUrl('https://localhost/live.m3u8'), /HOST/);
assert.equal(assertPublicHttpsUrl('https://cdn.example.org/live.m3u8').hostname, 'cdn.example.org');

let requestedTarget = '';
const runtime = createMatchPlaybackRuntime({
  matchOrigin: 'https://api.albasritv1.workers.dev/',
  fetchServers: async (target) => {
    requestedTarget = target;
    return {
      success: true,
      servers: [
        { name: 'Web Server 1', url: 'https://cdn.example.org/live/master.m3u8', type: 'm3u8' },
        { name: 'Web Server 2', url: 'https://video.example.org/embed/123', type: 'embed' },
      ],
    };
  },
});

const masked = runtime.maskMatchesPayload({
  success: true,
  data: [{
    id: 'm1',
    team1: { name: 'راسينج سانتاندير', goals: 2 },
    team2: { name: 'ألافيس', goals: 1 },
    link: 'https://api.albasritv1.workers.dev/match?id=42',
  }],
});

assert.equal(masked.data.length, 1);
assert.match(masked.data[0].ref, /^match:/);
assert.equal(masked.data[0].link, masked.data[0].ref);
assert.equal(masked.data[0].ref.includes('api.albasritv1.workers.dev'), false);

const servers = await runtime.listServers(masked.data[0].ref);
assert.equal(requestedTarget, 'https://api.albasritv1.workers.dev/match?id=42');
assert.equal(servers.length, 2);
assert.match(servers[0].ref, /^server:/);
assert.equal('url' in servers[0], false);
assert.equal(servers[0].name, 'Web Server 1');
assert.equal(servers[0].type, 'm3u8');

const playback = await runtime.resolveServer(servers[0].ref);
assert.match(playback.media_path, /^\/api\/matches\/media\?id=/);
assert.equal(playback.media_path.includes('cdn.example.org'), false);
assert.equal(playback.media_type, 'm3u8');
assert.equal(playback.server_name, 'Web Server 1');

console.log('match runtime opaque playback: ok');
