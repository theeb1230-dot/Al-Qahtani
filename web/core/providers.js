export const ProviderKind = Object.freeze({
  MATCHES: "matches",
  NEWS: "news",
  CINEMA: "cinema",
});

export const ProviderHealth = Object.freeze({
  HEALTHY: "healthy",
  DEGRADED: "degraded",
  UNAVAILABLE: "unavailable",
  INVALID_PAYLOAD: "invalid_payload",
});

const DEFAULT_TIMEOUT_MS = 8000;

export class ProviderError extends Error {
  constructor(message, { kind, status = null, cause = null } = {}) {
    super(message);
    this.name = "ProviderError";
    this.kind = kind;
    this.status = status;
    this.cause = cause;
  }
}

export async function fetchJsonWithHealth(url, {
  kind,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  init = {},
  validate = () => true,
} = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();

  try {
    const headers = new Headers(init.headers || {});
    if (!headers.has("Accept")) headers.set("Accept", "application/json");

    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers,
    });

    if (!response.ok) {
      throw new ProviderError(`HTTP ${response.status}`, {
        kind,
        status: response.status,
      });
    }

    const data = await response.json();
    if (!validate(data)) {
      return {
        health: ProviderHealth.INVALID_PAYLOAD,
        latencyMs: Math.round(performance.now() - startedAt),
        data: null,
      };
    }

    return {
      health: ProviderHealth.HEALTHY,
      latencyMs: Math.round(performance.now() - startedAt),
      data,
    };
  } catch (cause) {
    if (cause?.name === "AbortError") {
      return {
        health: ProviderHealth.UNAVAILABLE,
        latencyMs: timeoutMs,
        data: null,
        error: new ProviderError("Provider timeout", { kind, cause }),
      };
    }

    return {
      health: ProviderHealth.UNAVAILABLE,
      latencyMs: Math.round(performance.now() - startedAt),
      data: null,
      error: cause instanceof ProviderError
        ? cause
        : new ProviderError("Provider request failed", { kind, cause }),
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function firstHealthy(providers) {
  let lastResult = null;
  for (const provider of providers) {
    const result = await provider();
    lastResult = result;
    if (result?.health === ProviderHealth.HEALTHY) return result;
  }
  return lastResult || { health: ProviderHealth.UNAVAILABLE, data: null };
}
