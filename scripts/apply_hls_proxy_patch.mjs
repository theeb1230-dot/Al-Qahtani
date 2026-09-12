import fs from "node:fs";

const appPath = "server/app.mjs";
const pubspecPath = "flutter_app/pubspec.yaml";
const packagePath = "package.json";

let app = fs.readFileSync(appPath, "utf8");
const start = app.indexOf("async function proxyMedia(req, res, id) {");
const end = app.indexOf("\nexport function createServer", start);
if (start < 0 || end < 0) throw new Error("PROXY_MEDIA_BLOCK_NOT_FOUND");

const replacement = `function hlsChildPath(value, baseUrl, entry) {
  const raw = String(value || "").trim();
  if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return raw;
  const target = assertSourceUrl(new URL(raw, baseUrl).href, { allowMedia: true });
  const id = storeMedia(target.href, baseUrl, { title: entry.downloadName });
  return \`/api/cinema/media?id=\${encodeURIComponent(id)}\`;
}

function rewriteHlsAttributeUris(line, baseUrl, entry) {
  return line.replace(/URI=(?:"([^"]+)"|'([^']+)'|([^,\\s]+))/gi, (match, doubleQuoted, singleQuoted, bare) => {
    const raw = doubleQuoted || singleQuoted || bare || "";
    const proxied = hlsChildPath(raw, baseUrl, entry);
    return \`URI="\${proxied}"\`;
  });
}

function rewriteHlsManifest(manifest, baseUrl, entry) {
  return String(manifest || "")
    .split(/\\r?\\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) return rewriteHlsAttributeUris(line, baseUrl, entry);
      return hlsChildPath(trimmed, baseUrl, entry);
    })
    .join("\\n");
}

export function __rewriteHlsManifestForTest(manifest, baseUrl, metadata = {}) {
  requireTestMode();
  const entry = { downloadName: sanitizeDownloadFilename(metadata.title || metadata.filename || "al-qahtani-media") };
  return rewriteHlsManifest(manifest, assertSourceUrl(baseUrl, { allowMedia: true }).href, entry);
}

function isHlsResponse(target, contentType = "") {
  const type = String(contentType || "").toLowerCase();
  return type.includes("mpegurl") || /\\.m3u8(?:$|\\?)/i.test(target.pathname + target.search);
}

async function readUpstreamText(upstream, maxBytes = 2 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of upstream) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("HLS_MANIFEST_TOO_LARGE");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size).toString("utf8");
}

async function proxyMedia(req, res, id) {
  const entry = mediaRefs.get(id);
  if (!entry || entry.expiresAt <= Date.now()) {
    mediaRefs.delete(id);
    return sendJson(req, res, 404, { status: "error", message: "MEDIA_REFERENCE_EXPIRED" });
  }
  const target = assertSourceUrl(entry.url, { allowMedia: true });
  const requestUrl = new URL(req.url || "/", "http://localhost");
  const wantsDownload = requestUrl.searchParams.get("download") === "1";
  const headers = {
    Accept: "*/*",
    Referer: safeHeaderUrl(entry.referer || BasriSource.origin + "/"),
    "User-Agent": BasriSource.userAgent,
  };
  if (req.headers.range && !/\\.m3u8(?:$|\\?)/i.test(target.pathname + target.search)) headers.Range = req.headers.range;
  try {
    const upstream = await openMedia(target, headers);
    const status = Number(upstream.statusCode || 502);
    if (status < 200 || status >= 300) {
      upstream.resume();
      return sendJson(req, res, status, { status: "error", message: \`MEDIA_UPSTREAM_\${status}\` });
    }

    const contentType = String(upstream.headers["content-type"] || "");
    if (isHlsResponse(target, contentType)) {
      if (wantsDownload) {
        upstream.resume();
        return sendJson(req, res, 409, { status: "error", message: "HLS_DOWNLOAD_REQUIRES_PACKAGING" });
      }
      const manifest = await readUpstreamText(upstream);
      if (!manifest.trimStart().startsWith("#EXTM3U")) {
        return sendJson(req, res, 502, { status: "error", message: "INVALID_HLS_MANIFEST" });
      }
      const rewritten = rewriteHlsManifest(manifest, target.href, entry);
      const body = Buffer.from(rewritten, "utf8");
      applyCors(req, res);
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
      res.setHeader("Content-Length", String(body.byteLength));
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.statusCode = 200;
      return res.end(body);
    }

    applyCors(req, res);
    for (const name of ["content-type", "content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
      const value = upstream.headers[name];
      if (value) res.setHeader(name, value);
    }
    if (!upstream.headers["content-type"]) res.setHeader("Content-Type", "video/mp4");
    if (wantsDownload) {
      res.setHeader("Content-Disposition", buildDownloadContentDisposition(entry.downloadName));
      res.setHeader("X-Content-Type-Options", "nosniff");
    }
    res.setHeader("Cache-Control", "no-store");
    res.statusCode = status;
    for await (const chunk of upstream) res.write(chunk);
    res.end();
  } catch (error) {
    log("media_proxy_failed", { host: target.hostname, code: String(error?.code || ""), error: String(error?.message || error) });
    if (!res.headersSent) return sendJson(req, res, 502, { status: "error", message: "MEDIA_PROXY_FAILED" });
    res.destroy(error);
  }
}
`;

app = app.slice(0, start) + replacement + app.slice(end);
fs.writeFileSync(appPath, app);

let pubspec = fs.readFileSync(pubspecPath, "utf8");
if (!pubspec.includes("version: 1.0.10+10")) throw new Error("EXPECTED_VERSION_NOT_FOUND");
pubspec = pubspec.replace("version: 1.0.10+10", "version: 1.0.11+11");
fs.writeFileSync(pubspecPath, pubspec);

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
pkg.scripts.check = "node --check server/app.mjs && node --check server/index.mjs && node --check server/news-runtime.mjs && NODE_ENV=test node scripts/hls_manifest_proxy_test.mjs";
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n");

console.log("Applied HLS opaque media proxy patch and bumped 1.0.11+11");
