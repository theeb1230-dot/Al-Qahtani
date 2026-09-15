# HLS fallback boundary audit

Date: 2026-09-15
Base main: `014279c75cf89260fa22a29725973ba564b22da7`

## Finding

The Basri/primary cinema media path already implements server-side opaque HLS rewriting in `server/app.mjs`:

- non-comment playlist lines are resolved against the upstream manifest and replaced by `/api/cinema/media?id=<opaque>` refs;
- `URI=` attributes used by keys, maps, alternate media and related HLS tags are rewritten to opaque refs;
- upstream URLs are validated through `assertSourceUrl(..., { allowMedia: true })` before storage;
- HLS manifests are bounded to 2 MiB, require `#EXTM3U`, use `no-store`, and are not accepted as direct downloads;
- the existing regression `scripts/hls_manifest_proxy_test.mjs` covers segment, key, map, variant and alternate-audio URI rewriting and checks that the upstream hostname does not leak.

Therefore the previous state text "safe opaque HLS playlist/segment rewriting pending" was too broad. The missing HLS work is specifically in the **27-provider fallback runtime**, not the primary Basri path.

## Exact fallback gap

`server/fallback-runtime.mjs::openDirectMedia()` currently probes HLS successfully but then rejects it with `FALLBACK_HLS_PROXY_PENDING`. `server/index-runtime.mjs::sendFallbackMedia()` only streams MP4/MPEG-TS direct responses and has no playlist/child-ref rewrite path.

The next implementation must stay server-side and fail closed:

1. Accept a fallback HLS candidate only after the existing bounded probe classifies it as direct HLS.
2. Fetch the manifest with a short timeout and manual redirects.
3. Reject redirect targets that are not allowed by the provider boundary.
4. Require a valid `#EXTM3U` body and enforce a bounded manifest size.
5. Resolve every playlist child URI against the manifest URL and validate it against the provider's permitted origin/host policy.
6. Store child targets behind new opaque fallback refs. Never return provider names, templates, session material or upstream URLs to Flutter.
7. Rewrite both bare URI lines and `URI=` attributes, including key/map/media/variant references.
8. Serve child playlists recursively through the same opaque route; preserve Range/206/Content-Range/Accept-Ranges for media segments where applicable.
9. Keep refs bounded by TTL and map size. A long VOD must not fail merely because segment refs expire before normal playback reaches them; lifetime policy needs a bounded playback-safe design rather than an unlimited token.
10. Do not call `recordPlaybackSuccess` from HTTP 200/probe/manifest fetch. Provider health success still requires an actual player playback signal/playing evidence.

## Regression gates required before merge

- master playlist with relative and absolute child playlists;
- media playlist with TS/fMP4 segments;
- `EXT-X-KEY`, `EXT-X-MAP`, `EXT-X-MEDIA` and variant URIs;
- upstream URL/provider-name non-leak assertions;
- disallowed cross-host child rejection;
- redirect rejection/allowlist behavior;
- invalid/non-HLS body rejection;
- manifest size cap;
- child ref expiry and bounded ref-store behavior;
- Range/206/Content-Range/Accept-Ranges propagation for segments;
- no provider-health success without playback evidence.

## Product/release impact

This audit is documentation-only. It does not change runtime behavior or product version and therefore does not justify a new APK/TV APK/IPA release. The currently verified product release remains v1.0.33. The physical iPhone v1.0.25 838.4 MB download bug remains authoritative until a newer physical-device retest passes.
