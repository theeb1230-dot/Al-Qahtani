import { createServer } from "./app.mjs";

const port = Number(process.env.PORT || 3000);
const server = createServer();
const [appHandler] = server.listeners("request");

// The original Basri page downloads the same resolved media used for playback.
// Preserve that behavior without exposing the upstream media URL: the browser
// receives only the existing short-lived Al-Qahtani media reference, and this
// entrypoint turns that exact proxied response into an attachment when asked.
server.removeAllListeners("request");
server.on("request", (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    if (url.pathname === "/api/cinema/media" && url.searchParams.get("download") === "1") {
      res.setHeader("Content-Disposition", 'attachment; filename="al-qahtani-media"');
      res.setHeader("X-Content-Type-Options", "nosniff");
    }
  } catch {}
  return appHandler(req, res);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Al-Qahtani backend listening on ${port}`);
});
