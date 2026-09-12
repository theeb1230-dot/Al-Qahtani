import { ProviderKind, fetchJsonWithHealth } from "./providers.js";
import { isMatchListPayload, isServerListPayload, isNewsPayload, isCinemaPayload } from "./contracts.js";
const ENDPOINTS=Object.freeze({backend:"https://al-qahtani-api.onrender.com",news:"https://news.albesriali03.workers.dev/"});
const BACKEND_TIMEOUT_MS=90000;
export async function getMatches(){return fetchJsonWithHealth(ENDPOINTS.backend+"/api/matches",{kind:ProviderKind.MATCHES,timeoutMs:BACKEND_TIMEOUT_MS,validate:isMatchListPayload})}
export async function getMatchServers(url){if(!url)return{health:"invalid_payload",data:null};return fetchJsonWithHealth(ENDPOINTS.backend+"/api/matches/servers?url="+encodeURIComponent(url),{kind:ProviderKind.MATCHES,timeoutMs:BACKEND_TIMEOUT_MS,validate:isServerListPayload})}
export async function getNewsList(){return fetchJsonWithHealth(ENDPOINTS.news+"?_="+Date.now(),{kind:ProviderKind.NEWS,validate:isNewsPayload})}
export async function getNewsArticle(url){return fetchJsonWithHealth(ENDPOINTS.news+"?action=article&url="+encodeURIComponent(url)+"&_="+Date.now(),{kind:ProviderKind.NEWS,validate:isNewsPayload})}
export async function getCinemaCategory(type,name,categoryId="",page=1){const p=Math.max(1,Number(page)||1);return fetchJsonWithHealth(ENDPOINTS.backend+"/api/v1/category?ref="+encodeURIComponent(String(categoryId||"").trim())+"&p="+encodeURIComponent(String(p)),{kind:ProviderKind.CINEMA,timeoutMs:BACKEND_TIMEOUT_MS,validate:isCinemaPayload})}
export async function searchCinema(query){return fetchJsonWithHealth(ENDPOINTS.backend+"/api/cinema/search?q="+encodeURIComponent(String(query||"").trim()),{kind:ProviderKind.CINEMA,timeoutMs:BACKEND_TIMEOUT_MS,validate:isCinemaPayload})}
export async function getCinemaDetails(ref){return fetchJsonWithHealth(ENDPOINTS.backend+"/api/cinema/details?ref="+encodeURIComponent(ref),{kind:ProviderKind.CINEMA,timeoutMs:BACKEND_TIMEOUT_MS,validate:isCinemaPayload})}
export const ProviderEndpoints=ENDPOINTS;
