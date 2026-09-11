import { createServer } from "./app.mjs";

const port = Number(process.env.PORT || 3000);
const server = createServer();
const [appHandler] = server.listeners("request");

// The original Basri page downloads the same resolved media used for playback.
// Keep attachment semantics behind the validated Al-Qahtani media-reference path:
// invalid/expired references remain ordinary JSON errors and never receive
// download headers, while a successful proxied media response becomes an
// attachment without exposing the upstream URL.
server.removeAllListeners("request");
server.on("request", (req, res) => {
  let wantsDownload = false;
  try {
    const url = new URL(req.url || "/", "http://localhost");
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

server.listen(port, "0.0.0.0", () => {
  console.log(`Al-Qahtani backend listening on ${port}`);
});
