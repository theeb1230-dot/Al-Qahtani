#!/usr/bin/env node
import { spawn } from "node:child_process";

const child = spawn(process.execPath, ["server/index.mjs"], {
  env: { ...process.env, PORT: "3137" },
  stdio: ["ignore", "pipe", "pipe"],
});
child.stdout.on("data", d => process.stdout.write("[backend] " + d));
child.stderr.on("data", d => process.stderr.write("[backend] " + d));

const BASE = "http://127.0.0.1:3137";
const ORIGIN = "https://theeb1230-dot.github.io";

async function get(path, timeoutMs=90000){
  const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),timeoutMs);
  try{
    const r=await fetch(BASE+path,{headers:{Accept:"application/json",Origin:ORIGIN},signal:ctl.signal,cache:"no-store"});
    const text=await r.text();let data=null;try{data=JSON.parse(text)}catch{}
    return{r,data,text};
  } finally {clearTimeout(t)}
}
function ok(cond,name,detail={}){
  if(!cond){console.error("FAIL",name,detail);process.exitCode=1;return false}
  console.log("PASS",name,detail);return true
}
async function waitHealth(){
  for(let i=0;i<30;i++){
    try{const x=await get("/health",3000);if(x.r.ok)return true}catch{}
    await new Promise(r=>setTimeout(r,500));
  }
  return false;
}
try{
  if(!ok(await waitHealth(),"backend health"))process.exit(1);
  const matches=await get("/api/matches",60000);
  ok(matches.r.ok&&matches.data?.success===true&&Array.isArray(matches.data?.data),"backend matches",{status:matches.r.status,count:matches.data?.data?.length});

  const search=await get("/api/cinema/search?q="+encodeURIComponent("الذئب الوحيد"),90000);
  ok(search.r.ok&&search.data?.status==="success"&&Array.isArray(search.data?.data),"backend cinema search",{status:search.r.status,source:search.data?.source,count:search.data?.data?.length});

  const category=await get("/api/cinema/category?type=series&name="+encodeURIComponent("أجنبية"),120000);
  ok(category.r.ok&&category.data?.status==="success"&&Array.isArray(category.data?.data),"backend cinema category",{status:category.r.status,source:category.data?.source,count:category.data?.data?.length});
  const known=await get("/api/cinema/search?q="+encodeURIComponent("Lucky"),90000);
  const candidate=(known.data?.data||[]).find(x=>String(x.href||"").startsWith("theeb:canonical:"));
  if(candidate){
    const details=await get("/api/cinema/details?ref="+encodeURIComponent(candidate.href),90000);
    ok(details.r.ok&&details.data?.status==="success","backend canonical details",{status:details.r.status,episodes:details.data?.episodes?.length});
    const ep=(details.data?.episodes||[]).find(x=>x.watch_available);
    if(ep){
      const play=await get("/api/cinema/details?ref="+encodeURIComponent(ep.link),90000);
      ok(play.r.ok&&["success","error"].includes(play.data?.status),"backend episode playback contract",{status:play.r.status,state:play.data?.status,message:play.data?.message||"",media:Boolean(play.data?.media_src)});
    }else console.log("SKIP episode playback: no watchable canonical episode in sample");
  }else console.log("SKIP canonical playback sample: no canonical Lucky result");
} finally {
  child.kill("SIGTERM");
}
