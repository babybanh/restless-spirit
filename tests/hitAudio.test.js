import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudioController} from '../src/game/ui.js';
import {gameConfig} from '../src/gameConfig.js';

const flush=()=>new Promise(resolve=>setImmediate(resolve));
function environment({pendingPrime=false}={}) {
  const document=new EventTarget(), window=new EventTarget(), players=[];
  document.hidden=false;
  Object.assign(window,{setTimeout,clearTimeout,ontouchstart:null,matchMedia:()=>({matches:true})});
  window.AudioContext=class {
    state='suspended';sampleRate=44100;destination={};
    resume(){return new Promise(()=>{});}
    decodeAudioData(){return new Promise(()=>{});}
    createBuffer(){return {length:1};}
    createBufferSource(){return {connect(){},disconnect(){},start(){}};}
  };
  Object.assign(globalThis,{document,window,localStorage:{getItem:()=>null,setItem(){}},fetch:()=>new Promise(()=>{})});
  let finishPrime;
  globalThis.Audio=class extends EventTarget {
    muted=false;volume=1;paused=true;currentTime=0;plays=[];
    constructor(src){super();this.src=src;players.push(this);}
    load(){}
    pause(){this.paused=true;}
    play(){
      this.paused=false;this.plays.push({muted:this.muted,volume:this.volume});
      if(pendingPrime&&this.muted&&/hit\.wav/.test(this.src))return new Promise(resolve=>{finishPrime=resolve;});
      return Promise.resolve();
    }
  };
  const config=structuredClone(gameConfig);config.audio.startOnFirstMovement=false;
  const audio=createAudioController(config);
  return {audio,window,document,players,finishPrime:()=>finishPrime()};
}
const hitPlayer=e=>e.players.find(p=>/hit\.wav/.test(p.src));

test('hit bypasses stalled decode and resume; cold mobile pickup stays silent',async()=>{
  const e=environment();e.audio.prepareFromGesture();await flush();
  const player=hitPlayer(e);assert.ok(player.plays.some(p=>p.muted));
  e.audio.playSfx('bananaPickup');assert.equal(e.players.length,2);
  e.audio.playSfx('bunnyHit');await flush();
  assert.equal(player.plays.filter(p=>!p.muted&&p.volume>0).length,1);
  assert.equal(player.paused,false);
});
test('late muted-prime completion cannot pause or reset a hit',async()=>{
  const e=environment({pendingPrime:true});e.audio.prepareFromGesture();
  e.audio.playSfx('bunnyHit');const player=hitPlayer(e);player.currentTime=.1;
  e.finishPrime();await flush();
  assert.equal(player.paused,false);assert.equal(player.muted,false);assert.equal(player.currentTime,.1);
});
test('hit still respects SFX mute and backgrounding',async()=>{
  const e=environment();e.audio.prepareFromGesture();await flush();
  const player=hitPlayer(e), initial=player.plays.length;
  e.audio.toggleSfx();e.audio.playSfx('bunnyHit');assert.equal(player.plays.length,initial);
  e.audio.toggleSfx();e.window.dispatchEvent(new Event('blur'));
  e.audio.playSfx('bunnyHit');assert.equal(player.plays.length,initial);
  e.window.dispatchEvent(new Event('focus'));e.audio.prepareFromGesture();
  e.audio.playSfx('bunnyHit');assert.equal(player.plays.at(-1).muted,false);
});
