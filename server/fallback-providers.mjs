import { ProviderHealthRegistry } from "./content-runtime.mjs";

const PROVIDERS = Object.freeze([
  ["pomfy", "Pomfy", "https://api.pomfy.stream/filme/{id}#cor:6C63FF", "https://api.pomfy.stream/serie/{id}/{s}/{e}#cor:6C63FF"],
  ["videasy", "Videasy", "https://player.videasy.net/movie/{id}?color=6C63FF", "https://player.videasy.net/tv/{id}/{s}/{e}?color=6C63FF"],
  ["superflix", "Superflix", "https://superflixapi.one/filme/{id}#noEpList#noLink#color:6C63FF", "https://superflixapi.one/serie/{id}/{s}/{e}#noEpList#noLink#color:6C63FF"],
  ["vidfast", "VidFast", "https://vidfast.pro/movie/{id}?server=samba&hideServerControls=true&autoPlay=true&theme=6C63FF", "https://vidfast.pro/tv/{id}/{s}/{e}?server=samba&hideServerControls=true&autoPlay=true&theme=6C63FF"],
  ["vidsrc-pro", "VidSrc Pro", "https://vidsrc.pro/embed/movie/{id}", "https://vidsrc.pro/embed/tv/{id}/{s}/{e}"],
  ["vidsrc-to", "VidSrc To", "https://vidsrc.to/embed/movie/{id}", "https://vidsrc.to/embed/tv/{id}/{s}/{e}"],
  ["superembed", "SuperEmbed", "https://multiembed.mov/directstream.php?video_id={id}&tmdb=1", "https://multiembed.mov/directstream.php?video_id={id}&tmdb=1&s={s}&e={e}"],
  ["2embed", "2Embed", "https://www.2embed.cc/embed/{id}", "https://www.2embed.cc/embedtv/{id}&s={s}&e={e}"],
  ["autoembed", "AutoEmbed", "https://player.autoembed.cc/embed/movie/{id}", "https://player.autoembed.cc/embed/tv/{id}/{s}/{e}"],
  ["vidsrc-me", "VidSrc Me", "https://vidsrc.me/embed/movie?tmdb={id}", "https://vidsrc.me/embed/tv?tmdb={id}&season={s}&episode={e}"],
  ["embedsu", "EmbedSu", "https://embed.su/embed/movie/{id}", "https://embed.su/embed/tv/{id}/{s}/{e}"],
  ["smashystream", "SmashyStream", "https://player.smashy.stream/movie/{id}", "https://player.smashy.stream/tv/{id}?s={s}&e={e}"],
  ["nontongo", "NontonGo", "https://www.nontongo.win/embed/movie/{id}", "https://www.nontongo.win/embed/tv/{id}/{s}/{e}"],
  ["movieapi", "MovieAPI", "https://movieapi.club/movie/{id}", "https://movieapi.club/tv/{id}-{s}-{e}"],
  ["vidbox", "VidBox", "https://vidbox.to/embed/movie/{id}", "https://vidbox.to/embed/tv/{id}/{s}/{e}"],
  ["moviesapi", "MoviesAPI", "https://moviesapi.club/movie/{id}", "https://moviesapi.club/tv/{id}-{s}-{e}"],
  ["fembed", "Fembed", "https://fembed.sx/e/{id}", "https://fembed.sx/e/{id}/{s}-{e}"],
  ["frembed", "Frembed", "https://www.frembed.pro/api/film.php?id={id}", "https://www.frembed.pro/api/film.php?id={id}&s={s}&e={e}"],
  ["databasegdrive", "DatabaseGdrive", "https://databasegdriveplayer.xyz/player.php?type=movie&tmdb={id}", "https://databasegdriveplayer.xyz/player.php?type=tv&tmdb={id}&season={s}&episode={e}"],
  ["anime-day", "أنمي داي", "https://anime.videoportal.cc/embed/{id}", "https://anime.videoportal.cc/embed/{id}/{s}/{e}"],
  ["animevibe", "AnimeVibe", "https://animevibe.to/embed?id={id}", "https://animevibe.to/embed?id={id}&s={s}&e={e}"],
  ["vidsrc-xyz", "VidSrc XYZ", "https://vidsrc.xyz/embed/movie/{id}", "https://vidsrc.xyz/embed/tv/{id}/{s}/{e}"],
  ["streamhd", "StreamHD", "https://streamhd.to/embed/movie/{id}", "https://streamhd.to/embed/tv/{id}/{s}/{e}"],
  ["vidlink", "VidLink", "https://vidlink.pro/embed/movie/{id}", "https://vidlink.pro/embed/tv/{id}/{s}/{e}"],
  ["filmfast", "FilmFast", "https://filmfast.net/embed/{id}", "https://filmfast.net/embed/{id}?s={s}&e={e}"],
  ["arabstream", "ArabStream", "https://embed.arabstream.net/movie/{id}", "https://embed.arabstream.net/tv/{id}/{s}/{e}"],
  ["vidsrc-in", "الاحتياطي العام", "https://vidsrc.in/embed/movie/{id}", "https://vidsrc.in/embed/tv/{id}/{s}/{e}"],
].map(([id, name, movie, series], priority) => Object.freeze({ id, name, movie, series, priority })));

const PROVIDER_BY_ID = new Map(PROVIDERS.map((provider) => [provider.id, provider]));
const ALLOWED_HOSTS = new Set(PROVIDERS.flatMap((provider) => [new URL(provider.movie).hostname.toLowerCase(), new URL(provider.series).hostname.toLowerCase()]));

function positiveInt(value, field) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw new Error(`INVALID_${field.toUpperCase()}`);
  return number;
}

export function fallbackProviderCount() {
  return PROVIDERS.length;
}

export function listFallbackProviders() {
  return PROVIDERS.map(({ id, name, priority }) => ({ id, name, priority, movie: true, series: true }));
}

export function buildFallbackProviderUrl(providerId, { tmdbId, type, season, episode } = {}) {
  const provider = PROVIDER_BY_ID.get(String(providerId || ""));
  if (!provider) throw new Error("UNKNOWN_FALLBACK_PROVIDER");
  const id = positiveInt(tmdbId, "tmdb_id");
  const mediaType = type === "movie" ? "movie" : type === "series" || type === "tv" ? "series" : "";
  if (!mediaType) throw new Error("INVALID_MEDIA_TYPE");
  let template = mediaType === "movie" ? provider.movie : provider.series;
  template = template.replaceAll("{id}", String(id));
  if (mediaType === "series") {
    template = template.replaceAll("{s}", String(positiveInt(season, "season")));
    template = template.replaceAll("{e}", String(positiveInt(episode, "episode")));
  }
  if (template.includes("{") || template.includes("}")) throw new Error("UNRESOLVED_PROVIDER_TEMPLATE");
  const url = new URL(template);
  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname.toLowerCase())) throw new Error("FALLBACK_PROVIDER_URL_REJECTED");
  return url;
}

export class FallbackProviderPool {
  constructor({ health = new ProviderHealthRegistry({ failureThreshold: 2, cooldownMs: 60_000 }) } = {}) {
    this.health = health;
  }

  ranked(now = Date.now()) {
    const rank = new Map(this.health.rank(PROVIDERS.map((provider) => provider.id), now).map((entry) => [entry.name, entry]));
    return PROVIDERS
      .map((provider) => ({ ...provider, ...(rank.get(provider.id) || { score: 100, available: true }) }))
      .sort((a, b) => Number(b.available) - Number(a.available) || b.score - a.score || a.priority - b.priority)
      .map(({ id, name, priority, score, available }) => ({ id, name, priority, score, available }));
  }

  recordPlaybackSuccess(providerId, { latencyMs, container, range206 = false, safariPlayable = false, now = Date.now() } = {}) {
    if (!PROVIDER_BY_ID.has(providerId)) throw new Error("UNKNOWN_FALLBACK_PROVIDER");
    return this.health.recordSuccess(providerId, { latencyMs, capabilities: { container, range206, safariPlayable }, now });
  }

  recordPlaybackFailure(providerId, { now = Date.now() } = {}) {
    if (!PROVIDER_BY_ID.has(providerId)) throw new Error("UNKNOWN_FALLBACK_PROVIDER");
    return this.health.recordFailure(providerId, { now });
  }
}
