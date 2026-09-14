import { pathToFileURL } from "node:url";
import { createProductionServer } from "./index.mjs";
import { createTmdbRuntime } from "./tmdb-runtime.mjs";
import { createFallbackPlaybackRuntime } from "./fallback-runtime.mjs";

const ALLOWED_ORIGINS = new Set([
  "https://theeb1230-dot.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
]);

const TMDB_ROUTES = new Set([
  "/api/v1/tmdb/status",
  "/api/v1/tmdb/search",
  "/api/v1/tmdb/details",
  "/api/v1/tmdb/season",
]);

const FALLBACK_ROUTES = new Set([
  "/api/v1/fallback/status",
  "/api/v1/fallback/resolve",
  "/api/v1/fallback/probe",
  "/api/v1/fallback/next",
]);

function applyCors(req, res) {
  const origin = String(req.headers.origin || "");
  if (ALLOWED_ORIGINS.has(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(req, res, status, payload) {
  applyCors(req, res);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(JSON.stringify(payload));
}

function errorStatus(message) {
  if (message === "TMDB_NOT_CONFIGURED") return 503;
  if (message === "TMDB_TIMEOUT") return 504;
  if (["TMDB_BAD_REFERENCE", "TMDB_BAD_SEASON", "TMDB_SEASON_REQUIRES_SERIES"].includes(message)) return 400;
  if (["INVALID_TMDB_ID", "INVALID_MEDIA_TYPE", "INVALID_SEASON", "INVALID_EPISODE", "BAD_FALLBACK_REFERENCE"].includes(message)) return 400;
  if (message === "FALLBACK_REFERENCE_EXPIRED") return 410;
  if (message === "NO_FALLBACK_PROVIDER_AVAILABLE") return 503;
  return 502;
}

function fallbackIdentity(url) {
  return {
    tmdbId: url.searchParams.get("tmdb_id"),
    type: url.searchParams.get("type"),
    season: url.searchParams.get("season"),
    episode: url.searchParams.get("episode"),
  };
}

export function createAlQahtaniRuntimeServer({
  baseServer = createProductionServer(),
  tmdbRuntime = createTmdbRuntime(),
  fallbackRuntime = createFallbackPlaybackRuntime(),
} = {}) {
  const [baseHandler] = baseServer.listeners("request");
  if (typeof baseHandler !== "function") throw new Error("BASE_REQUEST_HANDLER_MISSING");
  baseServer.removeAllListeners("request");
  baseServer.on("request", async (req, res) => {
    let url;
    try {
      url = new URL(req.url || "/", "http://localhost");
    } catch {
      return baseHandler(req, res);
    }

    if (TMDB_ROUTES.has(url.pathname)) {
      applyCors(req, res);
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
      }
      if (req.method !== "GET") return sendJson(req, res, 405, { status: "error", message: "METHOD_NOT_ALLOWED" });
      try {
        if (url.pathname === "/api/v1/tmdb/status") return sendJson(req, res, 200, tmdbRuntime.status());
        if (url.pathname === "/api/v1/tmdb/search") {
          const query = String(url.searchParams.get("q") || "").trim();
          if (query.length < 2) return sendJson(req, res, 200, { status: "success", source: "tmdb", data: [] });
          return sendJson(req, res, 200, await tmdbRuntime.search(query));
        }
        const ref = String(url.searchParams.get("ref") || "").trim();
        if (!ref) return sendJson(req, res, 400, { status: "error", message: "TMDB_BAD_REFERENCE" });
        if (url.pathname === "/api/v1/tmdb/details") return sendJson(req, res, 200, await tmdbRuntime.details(ref));
        const season = String(url.searchParams.get("season") || "").trim();
        return sendJson(req, res, 200, await tmdbRuntime.season(ref, season));
      } catch (error) {
        const message = String(error?.message || "TMDB_FAILED");
        return sendJson(req, res, errorStatus(message), { status: "error", message });
      }
    }

    if (FALLBACK_ROUTES.has(url.pathname)) {
      applyCors(req, res);
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
      }
      if (req.method !== "GET") return sendJson(req, res, 405, { status: "error", message: "METHOD_NOT_ALLOWED" });
      try {
        if (url.pathname === "/api/v1/fallback/status") return sendJson(req, res, 200, fallbackRuntime.status());
        if (url.pathname === "/api/v1/fallback/resolve") return sendJson(req, res, 200, fallbackRuntime.resolve(fallbackIdentity(url)));
        const ref = String(url.searchParams.get("ref") || "").trim();
        if (url.pathname === "/api/v1/fallback/probe") return sendJson(req, res, 200, await fallbackRuntime.probe(ref));
        return sendJson(req, res, 200, fallbackRuntime.recordFailure(ref));
      } catch (error) {
        const message = String(error?.message || "FALLBACK_FAILED");
        return sendJson(req, res, errorStatus(message), { status: "error", message });
      }
    }

    return baseHandler(req, res);
  });
  return baseServer;
}

export function startAlQahtaniRuntimeServer({ port = Number(process.env.PORT || 3000) } = {}) {
  const server = createAlQahtaniRuntimeServer();
  return server.listen(port, "0.0.0.0", () => {
    console.log(`Al-Qahtani backend listening on ${port}`);
  });
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (invokedPath === import.meta.url) startAlQahtaniRuntimeServer();
