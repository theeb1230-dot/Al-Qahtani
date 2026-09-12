function normalizeMarker(value=''){
  return String(value).trim().toLowerCase().replace(/\./g,'');
}

export function parseBasriMatchClock(value){
  const raw=String(value??'').trim();
  const match=raw.match(/(\d{1,2}):(\d{2})(?:\s*([ap]\.?m\.?|[صم]))?/i);
  if(!match)return null;
  let hour=Number(match[1]);
  const minute=Number(match[2]);
  if(!Number.isInteger(hour)||hour<0||hour>23||!Number.isInteger(minute)||minute<0||minute>59)return null;
  const marker=normalizeMarker(match[3]||'');
  if(marker){
    const pm=marker==='pm'||marker==='م';
    const am=marker==='am'||marker==='ص';
    if(!pm&&!am)return null;
    hour=hour%12+(pm?12:0);
  }else if(hour>=1&&hour<=11){
    // The original Basri match feed currently emits Saudi fixture times as an
    // ambiguous 12-hour clock without AM/PM. Football fixtures in this feed
    // are afternoon/evening slots, so preserve the source clock and restore
    // the missing PM marker instead of incorrectly labelling 03:00 as 3 AM.
    hour+=12;
  }
  return {hour,minute,raw};
}

export function formatSaudiMatchTime(value){
  const parsed=parseBasriMatchClock(value);
  if(!parsed)return String(value??'');
  const displayHour=parsed.hour%12||12;
  return `${displayHour}:${String(parsed.minute).padStart(2,'0')} ${parsed.hour>=12?'م':'ص'}`;
}

function riyadhMinutes(now){
  const parts=new Intl.DateTimeFormat('en-GB',{
    timeZone:'Asia/Riyadh',hour:'2-digit',minute:'2-digit',hour12:false,
  }).formatToParts(now);
  const hour=Number(parts.find(part=>part.type==='hour')?.value);
  const minute=Number(parts.find(part=>part.type==='minute')?.value);
  return Number.isFinite(hour)&&Number.isFinite(minute)?hour*60+minute:null;
}

export function hasSaudiMatchTimePassed(value,now=new Date()){
  const parsed=parseBasriMatchClock(value);
  const current=riyadhMinutes(now);
  if(!parsed||current==null)return false;
  return current>=parsed.hour*60+parsed.minute;
}
