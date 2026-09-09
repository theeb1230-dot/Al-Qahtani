import http from "node:http";
const MATCHES="https://api.albasritv1.workers.dev/";
const THEEB="https://theeb-arab-api.onrender.com";
const LEGACY_ORIGIN="https://www.albasritv.abrdns.com";
const LEGACY_REFERER=LEGACY_ORIGIN+"/2026/09/movies-series.html";
const ALLOWED_ORIGINS=new Set(["https://theeb1230-dot.github.io","http://localhost:8000","http://127.0.0.1:8000"]);

function cors(req,res){
  const origin=String(req.headers.origin||"");
  if(origin&&ALLOWED_ORIGINS.has(origin)) res.setHeader("Access-Control-Allow-Origin",origin);
  res.setHeader("Vary","Origin");
  res.setHeader("Access-Control-Allow-Methods","GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
}
function send(res,status,data){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});res.end(JSON.stringify(data))}
async function jfetch(url,init={},timeout=45000){
 const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),timeout);
 try{const r=await fetch(url,{...init,signal:ctl.signal,cache:"no-store"});const text=await r.text();let data=null;try{data=JSON.parse(text)}catch{};return{r,data,text}}finally{clearTimeout(t)}
}
function legacyHeaders(token=""){const h={Accept:"application/json",Origin:LEGACY_ORIGIN,Referer:LEGACY_REFERER,"X-BSR-Page":"/2026/09/matches.html"};if(token)h["X-BSR-Token"]=token;return h}
async function matchSession(){const x=await jfetch(MATCHES+"session",{headers:legacyHeaders()});if(!x.r.ok||!x.data?.token)throw new Error("MATCH_SESSION_"+x.r.status);return x.data.token}
async function matches(){const token=await matchSession();const x=await jfetch(MATCHES,{headers:legacyHeaders(token)});if(!x.r.ok)throw new Error("MATCH_LIST_"+x.r.status);return x.data}
async function matchServers(target){const u=new URL(target);if(u.origin!==new URL(MATCHES).origin)throw new Error("BAD_MATCH_TARGET");const token=await matchSession();const x=await jfetch(u.href,{headers:legacyHeaders(token)});if(!x.r.ok)throw new Error("MATCH_SERVERS_"+x.r.status);return x.data}
async function cinemaSearch(q){
 let x=await jfetch(THEEB+"/v1/search?q="+encodeURIComponent(q),{headers:{Accept:"application/json"}});
 let items=x.data?.data?.items||[];
 if(items.length)return{status:"success",source:"library",data:items.map(i=>({title:i.title,img:i.image||"",is_series:i.content_type!=="movie",href:"theeb:canonical:"+i.id,year:i.year||null}))};
 x=await jfetch(THEEB+"/v1/discover?q="+encodeURIComponent(q),{headers:{Accept:"application/json"}},60000);
 items=x.data?.data?.items||[];
 return{status:"success",source:"discover",data:items.map(i=>({title:i.display_title||i.title,img:i.image||"",is_series:i.content_type!=="movie",href:"theeb:discover:"+encodeURIComponent(JSON.stringify({provider:i.provider,id:i.provider_series_id,source:i.source_url||""})),year:i.year||null}))};
}
async function canonicalDetails(id){
 const [s,e]=await Promise.all([
  jfetch(THEEB+"/v1/series/"+id,{headers:{Accept:"application/json"}}),
  jfetch(THEEB+"/v1/series/"+id+"/episodes",{headers:{Accept:"application/json"}})
 ]);
 if(!s.r.ok)throw new Error("SERIES_"+s.r.status);
 const series=s.data?.data||{};const eps=e.data?.data?.items||[];
 return{status:"success",movie_title:series.title||"",poster:series.image||"",episodes:eps.map(x=>({num:x.episode_number||x.id,link:"theeb:episode:"+x.id,id:x.id,watch_available:x.watch_available,download_available:x.download_available}))};
}
async function discoveredDetails(ref){
 const p=JSON.parse(decodeURIComponent(ref));const target=encodeURIComponent(p.source||p.id);
 const x=await jfetch(THEEB+"/api/providers/"+encodeURIComponent(p.provider)+"/series/"+target,{headers:{Accept:"application/json"}},60000);
 if(!x.r.ok)throw new Error("DISCOVER_DETAILS_"+x.r.status);
 const d=x.data||{};return{status:"success",movie_title:d.title||d.name||"",poster:d.image||d.poster||"",episodes:(d.episodes||[]).map((e,i)=>({num:e.number||e.num||i+1,link:e.url||e.id||"",provider:p.provider}))};
}
const server=http.createServer(async(req,res)=>{
 cors(req,res);if(req.method==="OPTIONS"){res.writeHead(204);return res.end()}
 const u=new URL(req.url,"http://localhost");
 try{
  if(u.pathname==="/health")return send(res,200,{status:"ok"});
  if(u.pathname==="/api/matches")return send(res,200,await matches());
  if(u.pathname==="/api/matches/servers")return send(res,200,await matchServers(u.searchParams.get("url")||""));
  if(u.pathname==="/api/cinema/search")return send(res,200,await cinemaSearch((u.searchParams.get("q")||"").trim()));
  if(u.pathname==="/api/cinema/details"){
    const ref=u.searchParams.get("ref")||"";
    if(ref.startsWith("theeb:canonical:"))return send(res,200,await canonicalDetails(ref.split(":").pop()));
    if(ref.startsWith("theeb:discover:"))return send(res,200,await discoveredDetails(ref.slice("theeb:discover:".length)));
    return send(res,400,{status:"error",message:"BAD_REFERENCE"});
  }
  return send(res,404,{error:"NOT_FOUND"});
 }catch(e){return send(res,502,{status:"error",message:String(e?.message||"UPSTREAM_FAILED")})}
});
server.listen(Number(process.env.PORT||3000),"0.0.0.0",()=>console.log("Al-Qahtani backend listening"));
