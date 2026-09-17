import assert from 'node:assert/strict';
import http from 'node:http';
import { createAlQahtaniRuntimeServer } from '../server/index-runtime.mjs';
const ref='fallback:abcdefghijklmnopqrstuvwx';
const fallbackRuntime={status(){return{status:'ok'}},resolve(){throw new Error('unused')},probe(){throw new Error('unused')},openDirectMedia(){throw new Error('unused')},recordFailure(value,evidence){assert.equal(value,ref);if(evidence.playerFailure!==true)throw new Error('PLAYER_FAILURE_EVIDENCE_REQUIRED');return{status:'success',data:{ref:'fallback:nextopaqueabcdefghijkl'}}},recordSuccess(value,evidence){assert.equal(value,ref);if(evidence.playbackSignal!==true||evidence.playing!==true)throw new Error('PLAYING_EVIDENCE_REQUIRED');return{status:'success'}}};
const tmdbRuntime={status(){return{status:'ok'}},search(){return{status:'success',data:[]}},details(){return{}},season(){return[]}};
const baseServer=http.createServer((_req,res)=>{res.writeHead(404);res.end()});
const server=createAlQahtaniRuntimeServer({baseServer,tmdbRuntime,fallbackRuntime});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
const get=path=>new Promise((resolve,reject)=>{http.get({hostname:'127.0.0.1',port,path},res=>{let body='';res.on('data',c=>body+=c);res.on('end',()=>resolve({status:res.statusCode,body}))}).on('error',reject)});
try{let r=await get(`/api/v1/fallback/next?ref=${encodeURIComponent(ref)}`);assert.equal(r.status,400);assert.match(r.body,/PLAYER_FAILURE_EVIDENCE_REQUIRED/);r=await get(`/api/v1/fallback/next?ref=${encodeURIComponent(ref)}&player_failure=true`);assert.equal(r.status,200);r=await get(`/api/v1/fallback/success?ref=${encodeURIComponent(ref)}&playback_signal=true`);assert.equal(r.status,400);assert.match(r.body,/PLAYING_EVIDENCE_REQUIRED/);r=await get(`/api/v1/fallback/success?ref=${encodeURIComponent(ref)}&playback_signal=true&playing=true`);assert.equal(r.status,200);console.log('fallback_evidence_http_test: ok')}finally{await new Promise(r=>server.close(r))}
