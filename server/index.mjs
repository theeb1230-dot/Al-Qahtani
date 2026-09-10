const nativeFetch = globalThis.fetch.bind(globalThis);
const THEEB_ORIGIN = "https://theeb-arab-api.onrender.com";
const SERVICE_TOKEN = String(process.env.THEEB_SERVICE_TOKEN || "").trim();

globalThis.fetch = async (input, init = {}) => {
  let url;
  try {
    url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  } catch {
    return nativeFetch(input, init);
  }

  if (url.origin === THEEB_ORIGIN && url.pathname.startsWith("/api/providers/")) {
    const inherited = input instanceof Request ? input.headers : undefined;
    const headers = new Headers(init.headers || inherited || {});
    if (SERVICE_TOKEN && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${SERVICE_TOKEN}`);
    }
    return nativeFetch(input, { ...init, headers });
  }

  return nativeFetch(input, init);
};

const { createServer } = await import("./app.mjs");
const port = Number(process.env.PORT || 3000);
createServer().listen(port, "0.0.0.0", () => {
  console.log(`Al-Qahtani backend listening on ${port}`);
});
