export function encodeProviderEpisodeRef({ provider, target, title = "", episodeNumber = null }) {
  const payload = {
    provider: String(provider || ""),
    target: String(target || ""),
    title: String(title || ""),
    episode_number: episodeNumber == null ? null : String(episodeNumber),
  };
  return `providerctx:${encodeURIComponent(JSON.stringify(payload))}`;
}

export function decodeProviderEpisodeRef(ref) {
  if (!String(ref || "").startsWith("providerctx:")) return null;
  try {
    const data = JSON.parse(decodeURIComponent(String(ref).slice("providerctx:".length)));
    const provider = String(data?.provider || "").trim();
    const target = String(data?.target || "").trim();
    if (!provider || !target) return null;
    return {
      provider,
      target,
      title: String(data?.title || "").trim(),
      episodeNumber: data?.episode_number == null ? "" : String(data.episode_number),
    };
  } catch {
    return null;
  }
}

function normalizedEpisodeNumber(value) {
  const text = String(value ?? "").trim();
  const numeric = Number(text);
  return Number.isFinite(numeric) && numeric > 0 ? String(numeric) : text;
}

export function pickEpisodeByNumber(episodes = [], wanted) {
  const expected = normalizedEpisodeNumber(wanted);
  if (!expected) return null;
  return (Array.isArray(episodes) ? episodes : []).find((episode, index) => {
    const actual = normalizedEpisodeNumber(episode?.num ?? episode?.number ?? index + 1);
    return actual === expected;
  }) || null;
}
