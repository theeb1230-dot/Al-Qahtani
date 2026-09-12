import { ProviderKind, fetchJsonWithHealth } from "./providers.js";
import { isNewsPayload, isCinemaPayload } from "./contracts.js";

const ENDPOINTS=Object.freeze({backend:"https://al-qahtani-api.onrender.com",news:"https://news.albesriali03.workers.dev/"});
const BACKEND_TIMEOUT_MS=90000;
const MATCH_TIMEOUT_MS=25000;

function installBrandTheme(){
  if(typeof document==='undefined'||document.getElementById('alqahtani-brand-v2'))return;
  const style=document.createElement('style');
  style.id='alqahtani-brand-v2';
  style.textContent=`
    :root{--bg:#101827!important;--panel:#172235!important;--panel2:#1d2a40!important;--text:#f6efe1!important;--muted:#aeb6c2!important;--gold:#c6974c!important;--gold2:#e2be79!important;--accent:#c6974c!important;--line:#c6974c45!important}
    body{background-color:#101827!important;background-image:radial-gradient(circle at 78% -18%,#6d4d2535 0,transparent 35%)!important;color:#f6efe1!important}
    header{background:#101827ef!important;border-color:#c6974c35!important}
    .btn.primary,.retry,.servers button.active{background:#c6974c!important;color:#15100a!important}
    .btn,.cat,.item,.hero,.card,.panel,.choice-sheet{border-color:#c6974c38!important}
    .badge,.brand strong,.brandmark strong{color:#e2be79!important}
    .qaf{position:relative!important;width:40px!important;height:40px!important;border-radius:50%!important;border:3px solid #c6974c!important;background:#101827!important;color:transparent!important;font-size:0!important;overflow:visible!important}
    .qaf:before{content:"";position:absolute;left:14px;top:10px;border-top:8px solid transparent;border-bottom:8px solid transparent;border-left:12px solid #e2be79}
    .qaf:after{content:"";position:absolute;width:13px;height:4px;background:#c6974c;right:-6px;bottom:2px;transform:rotate(45deg);border-radius:4px}
  `;
  document.head.appendChild(style);
  document.documentElement.style.colorScheme='dark';
}
installBrandTheme();

function isRuntimeList(value,kind){return Boolean(value&&value.status==="success"&&value.version&&value.kind===kind&&Array.isArray(value.data))}
function isRuntimeObject(value,kind){return Boolean(value&&value.status==="success"&&value.version&&value.kind===kind&&value.data&&typeof value.data==="object"&&!Array.isArray(value.data))}

export async function getMatches(){return fetchJsonWithHealth(ENDPOINTS.backend+"/api/v1/matches",{kind:ProviderKind.MATCHES,timeoutMs:MATCH_TIMEOUT_MS,validate:value=>isRuntimeList(value,"matches")})}
export async function getMatchServers(ref){if(!ref)return{health:"invalid_payload",data:null};return fetchJsonWithHealth(ENDPOINTS.backend+"/api/v1/matches/servers?ref="+encodeURIComponent(ref),{kind:ProviderKind.MATCHES,timeoutMs:MATCH_TIMEOUT_MS,validate:value=>isRuntimeList(value,"match-servers")})}
export async function getMatchPlayback(ref){if(!ref)return{health:"invalid_payload",data:null};return fetchJsonWithHealth(ENDPOINTS.backend+"/api/v1/matches/playback?ref="+encodeURIComponent(ref),{kind:ProviderKind.MATCHES,timeoutMs:MATCH_TIMEOUT_MS,validate:value=>isRuntimeObject(value,"match-playback")})}
export async function getNewsList(){return fetchJsonWithHealth(ENDPOINTS.news+"?_="+Date.now(),{kind:ProviderKind.NEWS,validate:isNewsPayload})}
export async function getNewsArticle(url){return fetchJsonWithHealth(ENDPOINTS.news+"?action=article&url="+encodeURIComponent(url)+"&_="+Date.now(),{kind:ProviderKind.NEWS,validate:isNewsPayload})}
function isRuntimeCatalogPayload(value){return Boolean(value&&value.status==="success"&&value.version&&value.kind==="category"&&Array.isArray(value.data))}
function adaptRuntimeCatalogEnvelope(value){return{status:"success",source:value.source||"basri-original",version:value.version,kind:value.kind,cached:Boolean(value.cached),health:value.health||null,data:(value.data||[]).map(item=>({title:item.title||"بدون عنوان",img:item.poster||item.img||item.image||"",is_series:item.type!=="movie",href:item.ref||item.id||"",year:item.year??null})).filter(item=>item.href)}}
export async function getCinemaCategory(type,name,categoryId="",page=1){const p=Math.max(1,Number(page)||1);const result=await fetchJsonWithHealth(ENDPOINTS.backend+"/api/v1/category?ref="+encodeURIComponent(String(categoryId||"").trim())+"&p="+encodeURIComponent(String(p)),{kind:ProviderKind.CINEMA,timeoutMs:BACKEND_TIMEOUT_MS,validate:isRuntimeCatalogPayload});if(result?.data)result.data=adaptRuntimeCatalogEnvelope(result.data);return result}
export async function searchCinema(query){return fetchJsonWithHealth(ENDPOINTS.backend+"/api/cinema/search?q="+encodeURIComponent(String(query||"").trim()),{kind:ProviderKind.CINEMA,timeoutMs:BACKEND_TIMEOUT_MS,validate:isCinemaPayload})}
export async function getCinemaDetails(ref){return fetchJsonWithHealth(ENDPOINTS.backend+"/api/cinema/details?ref="+encodeURIComponent(ref),{kind:ProviderKind.CINEMA,timeoutMs:BACKEND_TIMEOUT_MS,validate:isCinemaPayload})}
export const ProviderEndpoints=ENDPOINTS;
