const DIRECT_MEDIA_TYPES = Object.freeze([
  ["application/vnd.apple.mpegurl", "hls"],
  ["application/x-mpegurl", "hls"],
  ["video/mp4", "mp4"],
  ["video/mp2t", "mpeg-ts"],
  ["video/mpeg", "mpeg-ts"],
]);

function normalizeContentType(value) {
  return String(value || "").split(";", 1)[0].trim().toLowerCase();
}

export function classifyFallbackProbeResponse({ status, contentType, contentRange, acceptRanges, location } = {}) {
  const code = Number(status) || 0;
  const type = normalizeContentType(contentType);
  const container = DIRECT_MEDIA_TYPES.find(([mime]) => mime === type)?.[1] || null;
  const isRedirect = code >= 300 && code < 400;
  const reachable = code >= 200 && code < 500;

  if (isRedirect) {
    return Object.freeze({
      reachable,
      kind: "redirect",
      playable: false,
      container: null,
      range206: false,
      acceptRanges: false,
      redirect: Boolean(location),
    });
  }

  if (container) {
    return Object.freeze({
      reachable,
      kind: "direct",
      playable: code === 200 || code === 206,
      container,
      range206: code === 206 && /^bytes\s+\d+-\d+\/\d+|\*$/.test(String(contentRange || "")),
      acceptRanges: /\bbytes\b/i.test(String(acceptRanges || "")),
      redirect: false,
    });
  }

  if (type === "text/html" || type === "application/xhtml+xml") {
    return Object.freeze({
      reachable,
      kind: "embed",
      playable: false,
      container: "embed",
      range206: false,
      acceptRanges: false,
      redirect: false,
    });
  }

  return Object.freeze({
    reachable,
    kind: reachable ? "unsupported" : "unreachable",
    playable: false,
    container: null,
    range206: false,
    acceptRanges: false,
    redirect: false,
  });
}

export async function probeFallbackTarget(target, {
  fetchImpl = globalThis.fetch,
  timeoutMs = 2_500,
  now = () => Date.now(),
} = {}) {
  if (typeof fetchImpl !== "function") throw new Error("FALLBACK_PROBE_FETCH_UNAVAILABLE");
  const url = target instanceof URL ? target : new URL(String(target));
  if (url.protocol !== "https:") throw new Error("FALLBACK_PROBE_HTTPS_REQUIRED");
  const boundedTimeoutMs = Math.max(250, Math.min(Number(timeoutMs) || 2_500, 5_000));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("FALLBACK_PROBE_TIMEOUT")), boundedTimeoutMs);
  const startedAt = now();

  try {
    const response = await fetchImpl(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        Accept: "video/mp4,application/vnd.apple.mpegurl,application/x-mpegurl,video/mp2t,text/html;q=0.7,*/*;q=0.2",
        Range: "bytes=0-1023",
        "User-Agent": "Al-Qahtani-Runtime/1.0 fallback-probe",
      },
    });

    const classification = classifyFallbackProbeResponse({
      status: response.status,
      contentType: response.headers?.get?.("content-type"),
      contentRange: response.headers?.get?.("content-range"),
      acceptRanges: response.headers?.get?.("accept-ranges"),
      location: response.headers?.get?.("location"),
    });

    try {
      await response.body?.cancel?.();
    } catch {
      // Best-effort cancellation only. Probe classification has already completed.
    }

    return Object.freeze({
      ...classification,
      latencyMs: Math.max(0, now() - startedAt),
      statusCode: response.status,
    });
  } catch (error) {
    const timeout = controller.signal.aborted || error?.name === "AbortError";
    return Object.freeze({
      reachable: false,
      kind: timeout ? "timeout" : "network-error",
      playable: false,
      container: null,
      range206: false,
      acceptRanges: false,
      redirect: false,
      latencyMs: Math.max(0, now() - startedAt),
      statusCode: 0,
    });
  } finally {
    clearTimeout(timer);
  }
}
