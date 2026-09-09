export function isMatchListPayload(value) {
  return Boolean(value && value.success === true && Array.isArray(value.data));
}

export function isServerListPayload(value) {
  return Boolean(value && value.success === true && Array.isArray(value.servers));
}

export function isNewsPayload(value) {
  return Boolean(value && (value.status === "success" || value.success === true));
}

export function normalizeServer(server = {}) {
  const url = String(server.url || "").trim();
  const rawType = String(server.type || "").toLowerCase();

  let type = rawType;
  if (!type && /\.m3u8(?:$|\?)/i.test(url)) type = "m3u8";
  else if (!type && /\.mp4(?:$|\?)/i.test(url)) type = "mp4";
  else if (!type) type = "embed";

  return {
    name: String(server.name || "سيرفر"),
    url,
    type,
  };
}
