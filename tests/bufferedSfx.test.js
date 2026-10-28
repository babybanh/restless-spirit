import test from 'node:test';import assert from 'node:assert/strict';
import {createBufferedSfx} from '../src/game/bufferedSfx.js';
const flush=()=>new Promise(r=>setImmediate(r));
function environment({decodeFails=false}={}){
 let context,fetches=0;const starts=[];
 globalThis.window={AudioContext:class {
  state='suspended';sampleRate=44100;destination={};
  constructor(){context=this}
  resume(){this.state='running';return Promise.resolve()}
  suspend(){this.state='suspended';return Promise.resolve()}
  decodeAudioData(){return decodeFails?Promise.reject(new Error('unsupported')):Promise.resolve({length:100})}
  createBuffer(){return {length:1}}
  createGain(){return {gain:{value:1},connect(){},disconnect(){}}}
  createBufferSource(){return {buffer:null,connect(){},disconnect(){},start(){starts.push(this.buffer)},stop(){this.onended?.()}}}
 }};
 globalThis.fetch=async()=>{fetches++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)}};
 const player=createBufferedSfx(['/coin.wav','/coin.wav']);
 return {player,starts,get fetches(){return fetches},get context(){return context}};
}
test('decoded pickup starts without fetching or decoding during collision',async()=>{
 const e=environment();await flush();assert.equal(e.fetches,1);e.player.unlock();await flush();
 let fallback=0;assert.equal(e.player.play('/coin.wav',.5,()=>fallback++,()=>true),true);await flush();
 assert.equal(e.fetches,1);assert.equal(fallback,0);assert.equal(e.starts.filter(b=>b.length>1).length,1);
 e.player.stop();
});
test('unsupported decoder retains the HTML audio fallback',async()=>{
 const e=environment({decodeFails:true});await flush();assert.equal(e.player.unlock(),false);
 assert.equal(e.player.play('/coin.wav',.5,()=>assert.fail('caller owns fallback'),()=>true),false);e.player.stop();
});
test('backgrounding cancels queued effects and a fresh gesture unlocks again',async()=>{
 const e=environment();e.player.unlock();e.player.play('/coin.wav',.5,()=>assert.fail('stale fallback'),()=>true);e.player.stop();await flush();
 assert.equal(e.starts.filter(b=>b.length>1).length,0);e.player.unlock();await flush();
 e.player.play('/coin.wav',.5,()=>assert.fail('unexpected fallback'),()=>true);await flush();assert.equal(e.starts.filter(b=>b.length>1).length,1);e.player.stop();
});
