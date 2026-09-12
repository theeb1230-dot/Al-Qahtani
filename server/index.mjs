import { pathToFileURL } from "node:url";
import { createServer } from "./app.mjs";
import { createNewsRuntime } from "./news-runtime.mjs";

const MATCH_LOGO_HOSTS = new Set(["kooorracity.com", "www.kooorracity.com"]);

function applyLogoCors(req, res) {
  const origin = String(req.headers.origin || "");
  if (["https://theeb1230-dot.github.io", "http://localhost:8000", "http://127.0.0.1:8000"].includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
}

function isAllowedMatchLogoUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" && MATCH_LOGO_HOSTS.has(url.hostname.toLowerCase()) && url.pathname.startsWith("/wp-content/uploads/");
  } catch {
    return false;
  }
}

async function proxyMatchLogo(req, res, url) {
  applyLogoCors(req, res);
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
    return res.end();
  }
  if (req.method !== "GET") {
    res.writeHead(405, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }));
  }

  const source = url.searchParams.get("url") || "";
  if (!isAllowedMatchLogoUrl(source)) {
    res.writeHead(400, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    return res.end(JSON.stringify({ error: "INVALID_MATCH_LOGO" }));
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const upstream = await fetch(source, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        Referer: "https://kooorracity.com/",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
      },
    });
    if (!upstream.ok || !isAllowedMatchLogoUrl(upstream.url)) {
      res.writeHead(502, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      return res.end(JSON.stringify({ error: "MATCH_LOGO_UPSTREAM" }));
    }
    const type = String(upstream.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!type.startsWith("image/")) {
      res.writeHead(502, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      return res.end(JSON.stringify({ error: "MATCH_LOGO_NOT_IMAGE" }));
    }
    const bytes = Buffer.from(await upstream.arrayBuffer());
    if (!bytes.length || bytes.length > 2 * 1024 * 1024) {
      res.writeHead(502, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      return res.end(JSON.stringify({ error: "MATCH_LOGO_SIZE" }));
    }
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=21600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    });
    return res.end(bytes);
  } catch {
    res.writeHead(504, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    return res.end(JSON.stringify({ error: "MATCH_LOGO_TIMEOUT" }));
  } finally {
    clearTimeout(timer);
  }
}

function sendRuntimeJson(req, res, status, payload) {
  applyLogoCors(req, res);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  return res.end(JSON.stringify(payload));
}

async function handleNewsRuntime(req, res, url, newsRuntime) {
  applyLogoCors(req, res);
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
    return res.end();
  }
  if (req.method !== "GET") return sendRuntimeJson(req, res, 405, { status: "error", message: "METHOD_NOT_ALLOWED" });
  try {
    if (url.pathname === "/api/v1/news") return sendRuntimeJson(req, res, 200, await newsRuntime.list());
    if (url.pathname === "/api/v1/news/article") {
      const ref = String(url.searchParams.get("ref") || "").trim();
      if (!ref) return sendRuntimeJson(req, res, 400, { status: "error", message: "MISSING_NEWS_REFERENCE" });
      return sendRuntimeJson(req, res, 200, await newsRuntime.article(ref));
    }
  } catch (error) {
    const message = String(error?.message || "NEWS_RUNTIME_FAILED");
    const status = message === "NEWS_REFERENCE_EXPIRED" ? 410 : 502;
    return sendRuntimeJson(req, res, status, { status: "error", message });
  }
}

export function createProductionServer({ appServer = createServer(), newsRuntime = createNewsRuntime() } = {}) {
  const [appHandler] = appServer.listeners("request");
  if (typeof appHandler !== "function") throw new Error("APP_REQUEST_HANDLER_MISSING");

  appServer.removeAllListeners("request");
  appServer.on("request", async (req, res) => {
    let wantsDownload = false;
    try {
      const url = new URL(req.url || "/", "http://localhost");
      if (url.pathname === "/api/matches/logo") return await proxyMatchLogo(req, res, url);
      if (url.pathname === "/api/v1/news" || url.pathname === "/api/v1/news/article") {
        return await handleNewsRuntime(req, res, url, newsRuntime);
      }
      wantsDownload = url.pathname === "/api/cinema/media" && url.searchParams.get("download") === "1";
    } catch {}

    if (wantsDownload) {
      const originalWrite = res.write.bind(res);
      const originalEnd = res.end.bind(res);
      let decorated = false;

      const decorateValidatedMedia = () => {
        if (decorated || res.statusCode < 200 || res.statusCode >= 300) return;
        const contentType = String(res.getHeader("Content-Type") || "").toLowerCase();
        if (contentType.includes("application/json")) return;
        if (!res.hasHeader("Content-Disposition")) {
          res.setHeader("Content-Disposition", 'attachment; filename="al-qahtani-media"');
        }
        res.setHeader("X-Content-Type-Options", "nosniff");
        decorated = true;
      };

      res.write = (...args) => {
        decorateValidatedMedia();
        return originalWrite(...args);
      };
      res.end = (...args) => {
        decorateValidatedMedia();
        return originalEnd(...args);
      };
    }

    return appHandler(req, res);
  });
  return appServer;
}

export function startProductionServer({ port = Number(process.env.PORT || 3000) } = {}) {
  const server = createProductionServer();
  return server.listen(port, "0.0.0.0", () => {
    console.log(`Al-Qahtani backend listening on ${port}`);
  });
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (invokedPath === import.meta.url) startProductionServer();
