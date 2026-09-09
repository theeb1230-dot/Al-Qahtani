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


export function isCinemaPayload(value) {
  return Boolean(value && typeof value === "object" && (value.status === "success" || value.status === "error"));
}

export function normalizeMediaItem(item = {}) {
  return {
    title: String(item.title || item.movie_title || ""),
    href: String(item.href || item.url || ""),
    image: String(item.img || item.image || ""),
    isSeries: Boolean(item.is_series),
  };
}

export function normalizeEpisode(item = {}) {
  return {
    number: Number(item.num || item.number || 0),
    link: String(item.link || item.href || ""),
  };
}

export function isPlayableMediaPayload(value) {
  if (!value || value.status !== "success") return false;
  return Boolean(value.media_src || value.is_iframe || Array.isArray(value.episodes));
}
