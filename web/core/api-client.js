import { ProviderKind, fetchJsonWithHealth } from "./providers.js";
import { isMatchListPayload, isServerListPayload, isNewsPayload, isCinemaPayload } from "./contracts.js";

const ENDPOINTS = Object.freeze({
  matches: "https://api.albasritv1.workers.dev/",
  news: "https://news.albesriali03.workers.dev/",
  cinema: "https://albas.albesriali03.workers.dev/",
});

let matchToken = "";
let matchTokenExpiresAt = 0;
let matchSessionPromise = null;

function baseHeaders(extra = {}) {
  const headers = new Headers(extra.headers || {});
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  headers.set("X-BSR-Page", location.pathname);
  return headers;
}

async function ensureMatchSession(force = false) {
  const now = Math.floor(Date.now() / 1000);
  if (!force && matchToken && matchTokenExpiresAt > now + 12) return matchToken;
  if (!force && matchSessionPromise) return matchSessionPromise;

  matchSessionPromise = (async () => {
    const result = await fetchJsonWithHealth(new URL("session", ENDPOINTS.matches).href, {
      kind: ProviderKind.MATCHES,
      validate: value => Boolean(value?.success && value?.token),
      init: { headers: baseHeaders() },
    });
    if (!result.data?.token) throw result.error || new Error("Match session unavailable");
    matchToken = String(result.data.token);
    matchTokenExpiresAt = Number(result.data.expiresAt || 0);
    return matchToken;
  })();

  try {
    return await matchSessionPromise;
  } finally {
    matchSessionPromise = null;
  }
}

async function matchFetchJson(url, { validate = () => true } = {}) {
  let token = await ensureMatchSession(false);

  const request = currentToken =>
    fetchJsonWithHealth(url, {
      kind: ProviderKind.MATCHES,
      validate,
      init: {
        headers: (() => {
          const h = baseHeaders();
          h.set("X-BSR-Token", currentToken);
          return h;
        })(),
      },
    });

  let result = await request(token);
  if (result?.error?.status === 401) {
    matchToken = "";
    matchTokenExpiresAt = 0;
    token = await ensureMatchSession(true);
    result = await request(token);
  }
  return result;
}

export async function getMatches() {
  const sessionResult = await matchFetchJson(ENDPOINTS.matches, { validate: isMatchListPayload });
  if (sessionResult?.data) return sessionResult;

  return fetchJsonWithHealth(ENDPOINTS.matches, {
    kind: ProviderKind.MATCHES,
    validate: isMatchListPayload,
  });
}

export async function getMatchServers(url) {
  if (!url) return { health: "invalid_payload", data: null };
  const sessionResult = await matchFetchJson(url, { validate: isServerListPayload });
  if (sessionResult?.data) return sessionResult;
  return fetchJsonWithHealth(url, {
    kind: ProviderKind.MATCHES,
    validate: isServerListPayload,
  });
}

export async function getNewsList() {
  return fetchJsonWithHealth(ENDPOINTS.news + "?_=" + Date.now(), {
    kind: ProviderKind.NEWS,
    validate: isNewsPayload,
  });
}

export async function getNewsArticle(url) {
  return fetchJsonWithHealth(
    ENDPOINTS.news + "?action=article&url=" + encodeURIComponent(url) + "&_=" + Date.now(),
    {
      kind: ProviderKind.NEWS,
      validate: isNewsPayload,
    },
  );
}

export async function getCinemaStatus() {
  return fetchJsonWithHealth(ENDPOINTS.cinema + "status", {
    kind: ProviderKind.CINEMA,
    validate: value => Boolean(value && typeof value === "object"),
  });
}

export const ProviderEndpoints = ENDPOINTS;


let cinemaToken = "";
let cinemaSessionPromise = null;

async function ensureCinemaSession(force = false) {
  if (!force && cinemaToken) return cinemaToken;
  if (!force && cinemaSessionPromise) return cinemaSessionPromise;

  cinemaSessionPromise = (async () => {
    const result = await fetchJsonWithHealth(ENDPOINTS.cinema + "session", {
      kind: ProviderKind.CINEMA,
      validate: value => Boolean(value?.status === "success" && value?.token),
    });
    if (!result.data?.token) throw result.error || new Error("Cinema session unavailable");
    cinemaToken = String(result.data.token);
    return cinemaToken;
  })();

  try {
    return await cinemaSessionPromise;
  } finally {
    cinemaSessionPromise = null;
  }
}

async function cinemaFetch(endpoint, retry = true) {
  const token = await ensureCinemaSession(false);
  const separator = endpoint.includes("?") ? "&" : "?";
  const url = ENDPOINTS.cinema + endpoint + separator + "token=" + encodeURIComponent(token);

  let result = await fetchJsonWithHealth(url, {
    kind: ProviderKind.CINEMA,
    validate: isCinemaPayload,
  });

  if (retry && result?.error?.status === 401) {
    cinemaToken = "";
    await ensureCinemaSession(true);
    return cinemaFetch(endpoint, false);
  }
  return result;
}

export function getCinemaGenre(url, page = 1) {
  return cinemaFetch("?action=genre&genre=" + encodeURIComponent(url) + "&p=" + Number(page || 1));
}

export function searchCinema(query) {
  return cinemaFetch("?action=search&q=" + encodeURIComponent(String(query || "").trim()));
}

export function getCinemaDetails(url) {
  return cinemaFetch("?action=series&series=" + encodeURIComponent(url));
}
