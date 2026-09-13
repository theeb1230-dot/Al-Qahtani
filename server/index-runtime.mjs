import { pathToFileURL } from "node:url";
import { createProductionServer } from "./index.mjs";
import { createTmdbRuntime } from "./tmdb-runtime.mjs";

const ALLOWED_ORIGINS = new Set([
  "https://theeb1230-dot.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
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

export function createAlQahtaniRuntimeServer({
  baseServer = createProductionServer(),
  tmdbRuntime = createTmdbRuntime(),
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

    if (url.pathname === "/api/v1/tmdb/status" || url.pathname === "/api/v1/tmdb/search") {
      applyCors(req, res);
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        return res.end();
      }
      if (req.method !== "GET") {
        return sendJson(req, res, 405, { status: "error", message: "METHOD_NOT_ALLOWED" });
      }
      try {
        if (url.pathname === "/api/v1/tmdb/status") {
          return sendJson(req, res, 200, tmdbRuntime.status());
        }
        const query = String(url.searchParams.get("q") || "").trim();
        if (query.length < 2) return sendJson(req, res, 200, { status: "success", source: "tmdb", data: [] });
        return sendJson(req, res, 200, await tmdbRuntime.search(query));
      } catch (error) {
        const message = String(error?.message || "TMDB_FAILED");
        const status = message === "TMDB_NOT_CONFIGURED" ? 503 : message === "TMDB_TIMEOUT" ? 504 : 502;
        return sendJson(req, res, status, { status: "error", message });
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
