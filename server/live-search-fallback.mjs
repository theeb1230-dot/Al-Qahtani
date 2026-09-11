const CATEGORY_ALIASES = Object.freeze({
  "أنمي": ["anime", "انمي", "أنيمي"],
  "أجنبية": ["english", "foreign"],
  "عربية": ["عربي", "arabic"],
  "تركية": ["تركي", "turkish"],
  "آسيوية": ["asian", "كوري", "ياباني"],
  "هندية": ["هندي", "indian"],
  "رمضان": ["رمضانية"],
});

function encodeCandidate(item, query = "") {
  return encodeURIComponent(JSON.stringify({
    provider: item.provider,
    id: item.provider_series_id,
    source: item.source_url || "",
    type: item.type === "movie" ? "movie" : "series",
    title: item.title || "",
    display_title: item.title || "",
    query,
  }));
}

export function mapLiveSearchPayload(payload, query = "", type = "") {
  const groups = Array.isArray(payload?.groups) ? payload.groups : [];
  const seen = new Set();
  const output = [];
  for (const group of groups) {
    for (const item of Array.isArray(group?.providers) ? group.providers : []) {
      const contentType = item.type === "movie" ? "movie" : "series";
      if (type && contentType !== type) continue;
      const provider = String(item.provider || item.search_provider || "").trim();
      const id = String(item.provider_series_id || "").trim();
      if (!provider || !id) continue;
      const key = `${provider}:${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      output.push({
        title: item.title || group.title || "بدون عنوان",
        img: item.image || item.poster || "",
        is_series: contentType !== "movie",
        href: `theeb:discover:${encodeCandidate({ ...item, provider, provider_series_id: id }, query)}`,
        year: item.year || null,
      });
      if (output.length >= 36) return output;
    }
  }
  return output;
}

export function categoryQueries(type, name) {
  const kind = type === "movie" ? "فيلم" : "مسلسل";
  return [...new Set([
    name,
    `${kind} ${name}`,
    `${name} ${kind}`,
    ...(CATEGORY_ALIASES[name] || []),
  ].map((value) => String(value || "").trim()).filter(Boolean))];
}

export async function protectedLiveSearch({ query, type = "", serviceToken, requestJson, log = () => {} }) {
  if (!query || !serviceToken || typeof requestJson !== "function") return [];
  let result;
  try {
    result = await requestJson(query, serviceToken);
  } catch (error) {
    log("theeb_live_search_transport_error", { query, error: String(error?.message || error) });
    return [];
  }
  if (!result?.response?.ok || !result?.data) {
    log("theeb_live_search_http_error", { query, status: result?.response?.status || null });
    return [];
  }
  const mapped = mapLiveSearchPayload(result.data, query, type);
  log(mapped.length ? "theeb_live_search_success" : "theeb_live_search_empty", {
    query,
    count: mapped.length,
    searched: Number(result.data?.searched_providers || 0),
    successful: Number(result.data?.successful_providers || 0),
    failed: Number(result.data?.failed_providers || 0),
  });
  return mapped;
}
