import { ProviderKind, fetchJsonWithHealth } from "./providers.js";
import { isMatchListPayload, isServerListPayload, isNewsPayload, isCinemaPayload } from "./contracts.js";
const ENDPOINTS=Object.freeze({backend:"https://al-qahtani-api.onrender.com",news:"https://news.albesriali03.workers.dev/"});
const BACKEND_TIMEOUT_MS=90000;
export async function getMatches(){return fetchJsonWithHealth(ENDPOINTS.backend+"/api/matches",{kind:ProviderKind.MATCHES,timeoutMs:BACKEND_TIMEOUT_MS,validate:isMatchListPayload})}
export async function getMatchServers(url){if(!url)return{health:"invalid_payload",data:null};return fetchJsonWithHealth(ENDPOINTS.backend+"/api/matches/servers?url="+encodeURIComponent(url),{kind:ProviderKind.MATCHES,timeoutMs:BACKEND_TIMEOUT_MS,validate:isServerListPayload})}
export async function getNewsList(){return fetchJsonWithHealth(ENDPOINTS.news+"?_="+Date.now(),{kind:ProviderKind.NEWS,validate:isNewsPayload})}
export async function getNewsArticle(url){return fetchJsonWithHealth(ENDPOINTS.news+"?action=article&url="+encodeURIComponent(url)+"&_="+Date.now(),{kind:ProviderKind.NEWS,validate:isNewsPayload})}
function isRuntimeCatalogPayload(value){return Boolean(value&&value.status==="success"&&value.version&&value.kind==="category"&&Array.isArray(value.data))}
function adaptRuntimeCatalogEnvelope(value){return{status:"success",source:value.source||"basri-original",version:value.version,kind:value.kind,cached:Boolean(value.cached),health:value.health||null,data:(value.data||[]).map(item=>({title:item.title||"بدون عنوان",img:item.poster||"",is_series:item.type!=="movie",href:item.ref||item.id||"",year:item.year??null})).filter(item=>item.href)}}
export async function getCinemaCategory(type,name,categoryId="",page=1){const p=Math.max(1,Number(page)||1);const result=await fetchJsonWithHealth(ENDPOINTS.backend+"/api/v1/category?ref="+encodeURIComponent(String(categoryId||"").trim())+"&p="+encodeURIComponent(String(p)),{kind:ProviderKind.CINEMA,timeoutMs:BACKEND_TIMEOUT_MS,validate:isRuntimeCatalogPayload});if(result?.data)result.data=adaptRuntimeCatalogEnvelope(result.data);return result}
export async function searchCinema(query){return fetchJsonWithHealth(ENDPOINTS.backend+"/api/cinema/search?q="+encodeURIComponent(String(query||"").trim()),{kind:ProviderKind.CINEMA,timeoutMs:BACKEND_TIMEOUT_MS,validate:isCinemaPayload})}
export async function getCinemaDetails(ref){return fetchJsonWithHealth(ENDPOINTS.backend+"/api/cinema/details?ref="+encodeURIComponent(ref),{kind:ProviderKind.CINEMA,timeoutMs:BACKEND_TIMEOUT_MS,validate:isCinemaPayload})}
export const ProviderEndpoints=ENDPOINTS;
