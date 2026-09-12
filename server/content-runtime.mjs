export const PRODUCT_VERSION = "1.0.20";

export class TtlCache {
  #entries = new Map();
  constructor({ maxEntries = 128 } = {}) { this.maxEntries = Math.max(1, Number(maxEntries) || 128); }
  peek(key, now = Date.now()) { const entry = this.#entries.get(key); if (!entry) return undefined; return { value: entry.value, expiresAt: entry.expiresAt, expired: entry.expiresAt <= now }; }
  get(key, now = Date.now()) { const entry = this.peek(key, now); if (!entry) return undefined; if (entry.expired) { this.#entries.delete(key); return undefined; } return entry.value; }
  set(key, value, ttlMs, now = Date.now()) { const ttl = Math.max(1, Number(ttlMs) || 1); if (this.#entries.size >= this.maxEntries && !this.#entries.has(key)) { const oldest = this.#entries.keys().next().value; if (oldest !== undefined) this.#entries.delete(oldest); } this.#entries.set(key, { value, expiresAt: now + ttl }); return value; }
  delete(key) { return this.#entries.delete(key); }
  clear() { this.#entries.clear(); }
  get size() { return this.#entries.size; }
}

export class ProviderHealthRegistry {
  #state = new Map();
  constructor({ failureThreshold = 3, cooldownMs = 30_000 } = {}) { this.failureThreshold = Math.max(1, Number(failureThreshold) || 3); this.cooldownMs = Math.max(1_000, Number(cooldownMs) || 30_000); }
  #entry(name) { const key = String(name || "unknown"); if (!this.#state.has(key)) this.#state.set(key, { name:key, successes:0, failures:0, consecutiveFailures:0, lastLatencyMs:null, lastSuccessAt:null, lastFailureAt:null, openUntil:0, capabilities:{} }); return this.#state.get(key); }
  recordSuccess(name,{latencyMs,capabilities={},now=Date.now()}={}) { const entry=this.#entry(name); entry.successes+=1; entry.consecutiveFailures=0; entry.lastSuccessAt=now; entry.openUntil=0; if(Number.isFinite(Number(latencyMs))) entry.lastLatencyMs=Math.max(0,Number(latencyMs)); entry.capabilities={...entry.capabilities,...capabilities}; return this.snapshot(name,now); }
  recordFailure(name,{now=Date.now()}={}) { const entry=this.#entry(name); entry.failures+=1; entry.consecutiveFailures+=1; entry.lastFailureAt=now; if(entry.consecutiveFailures>=this.failureThreshold) entry.openUntil=now+this.cooldownMs; return this.snapshot(name,now); }
  isAvailable(name,now=Date.now()) { return this.#entry(name).openUntil<=now; }
  score(name,now=Date.now()) { const entry=this.#entry(name); if(entry.openUntil>now) return -1_000_000; let score=100; score+=Math.min(30,entry.successes*2); score-=Math.min(60,entry.failures*4); score-=entry.consecutiveFailures*15; if(Number.isFinite(entry.lastLatencyMs)) score-=Math.min(40,entry.lastLatencyMs/250); if(entry.capabilities.range206) score+=8; if(entry.capabilities.safariPlayable) score+=12; if(["mp4","hls","mpeg-ts"].includes(entry.capabilities.container)) score+=6; return Math.round(score*100)/100; }
  rank(names,now=Date.now()) { return [...new Set(names.map(String))].map(name=>({name,score:this.score(name,now),available:this.isAvailable(name,now)})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)); }
  snapshot(name,now=Date.now()) { const entry=this.#entry(name); return { name:entry.name, successes:entry.successes, failures:entry.failures, consecutiveFailures:entry.consecutiveFailures, lastLatencyMs:entry.lastLatencyMs, lastSuccessAt:entry.lastSuccessAt, lastFailureAt:entry.lastFailureAt, circuitOpen:entry.openUntil>now, retryAt:entry.openUntil>now?entry.openUntil:null, capabilities:{...entry.capabilities}, score:this.score(entry.name,now) }; }
  summary(now=Date.now()) { return [...this.#state.keys()].map(name=>this.snapshot(name,now)).sort((a,b)=>b.score-a.score); }
}

function asText(value){return value==null?"":String(value).trim();}
function asNumber(value,fallback=null){if(value==null)return fallback;if(typeof value==="string"&&!value.trim())return fallback;const number=Number(value);return Number.isFinite(number)?number:fallback;}
function firstScore(...values){for(const value of values){const number=asNumber(value,null);if(number!==null)return Math.max(0,Math.trunc(number));}return null;}

export function normalizeCatalogItem(item={}){return {id:asText(item.id||item.ref||item.href||item.link),title:asText(item.title||item.name)||"بدون عنوان",poster:asText(item.poster||item.img||item.image),type:item.is_series===false||item.type==="movie"?"movie":"series",year:asNumber(item.year),ref:asText(item.ref||item.href||item.link)};}

export function normalizeEpisode(episode={},index=0){const episodeNumber=asNumber(episode.episode_number??episode.num??episode.number,index+1);return {episode_id:asText(episode.episode_id||episode.id||episode.link||episode.href),episode_number:Math.max(1,Math.trunc(episodeNumber||index+1)),title:asText(episode.title||episode.name)||`الحلقة ${Math.max(1,Math.trunc(episodeNumber||index+1))}`,ref:asText(episode.ref||episode.link||episode.href),watch_available:episode.watch_available!==false&&Boolean(episode.ref||episode.link||episode.href)};}

export function normalizeMatch(match={}){
  const team1=match.team1||match.home||{};
  const team2=match.team2||match.away||{};
  const rawStatus=asText(match.status).toLowerCase();
  const inferredPriority=/(?:ended|finished|انته)/i.test(rawStatus)?3:/(?:live|جاري|مباشر)/i.test(rawStatus)?1:2;
  const priority=asNumber(match.priority,inferredPriority);
  let homeGoals=firstScore(team1.goals,team1.score,match.home_score,match.homeScore,match.team1_goals,match.team1Goals,match.score1);
  let awayGoals=firstScore(team2.goals,team2.score,match.away_score,match.awayScore,match.team2_goals,match.team2Goals,match.score2);
  if(priority===3&&homeGoals===0&&awayGoals===0){homeGoals=null;awayGoals=null;}
  return {
    id:asText(match.id||match.link),
    team1:{name:asText(team1.name),logo:asText(team1.logo||team1.image||team1.img),goals:homeGoals},
    team2:{name:asText(team2.name),logo:asText(team2.logo||team2.image||team2.img),goals:awayGoals},
    time:asText(match.time),
    status:priority===1?"live":priority===3?"ended":"scheduled",
    priority,
    competition:asText(match.competition||match.league),
    channel:asText(match.channel),
    commentator:asText(match.commentator),
    ref:asText(match.ref||match.link),
  };
}

export function buildRuntimeEnvelope({kind,data,source,health,cached=false,stale=false,generatedAt=Date.now()}){return {status:"success",version:PRODUCT_VERSION,kind:asText(kind)||"unknown",source:asText(source)||"basri-original",cached:Boolean(cached),stale:Boolean(stale),generated_at:new Date(generatedAt).toISOString(),health:health||null,data};}
