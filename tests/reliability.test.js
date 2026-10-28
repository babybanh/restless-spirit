import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudioController} from '../src/game/ui.js';
import {createInputController} from '../src/game/input.js';

function environment() {
  const document=new EventTarget(), window=new EventTarget(), players=[];
  document.hidden=false;
  window.setTimeout=setTimeout;window.clearTimeout=clearTimeout;
  globalThis.document=document;globalThis.window=window;
  globalThis.localStorage={getItem:()=>null,setItem(){}};
  globalThis.Audio=class extends EventTarget {
    paused=true;currentTime=0;muted=false;volume=1;
    constructor(src){super();this.src=src;players.push(this)}
    load(){} play(){this.paused=false;return Promise.resolve()} pause(){this.paused=true}
  };
  const config={audio:{musicPath:'theme.mp3',musicVolume:.5,startOnFirstMovement:true,startDelayMs:5,loopGapMs:5,sfxEnabled:false,sfxVolume:.5,sfxFiles:{}}};
  const audio=createAudioController(config);
  return {document,window,players,audio};
}
const wait=()=>new Promise(resolve=>setTimeout(resolve,15));

test('backgrounding clears keys and joystick even when the release is lost',()=>{
 const {document,window}=environment();
 const input=createInputController({controls:{debugToggleKeys:[],tuningToggleKeys:[]}},new EventTarget());
 input.keysDown.add('arrowright');input.joystick.active=true;input.joystick.directionX=1;
 window.dispatchEvent(new Event('blur'));
 assert.equal(input.keysDown.size,0);assert.equal(input.joystick.active,false);
 input.keysDown.add('a');document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));
 assert.equal(input.keysDown.size,0);
});

test('hidden updates cannot restart sound; returning waits for fresh movement',async()=>{
 const {document,window,players,audio}=environment();
 audio.startFromMovement();await wait();players[0].currentTime=12;
 window.dispatchEvent(new Event('blur'));document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));
 audio.startFromMovement();await wait();assert.equal(players[0].paused,true);
 document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'));
 await wait();assert.equal(players[0].paused,true);audio.startFromMovement();await wait();assert.equal(players[0].paused,false);
});

test('returning during the initial delay or loop gap remains recoverable',async()=>{
 const {document,window,players,audio}=environment();
 audio.startFromMovement();window.dispatchEvent(new Event('pagehide'));await wait();
 assert.equal(players[0].paused,true);window.dispatchEvent(new Event('pageshow'));audio.startFromMovement();await wait();
 assert.equal(players[0].paused,false);assert.equal(players[0].muted,false);
 players[0].paused=true;players[0].dispatchEvent(new Event('ended'));
 document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));await wait();assert.equal(players[0].paused,true);
 document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));assert.equal(players[0].paused,true);audio.startFromMovement();await wait();assert.equal(players[0].paused,false);
});

test('mute survives a tab return and re-enabling respects first movement',async()=>{
 const {document,players,audio}=environment();
 audio.startFromMovement();await wait();audio.toggleMusic();assert.equal(players[0].paused,true);
 document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));
 document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));
 assert.equal(players[0].paused,true);audio.toggleMusic();assert.equal(players[0].paused,true);audio.startFromMovement();await wait();assert.equal(players[0].paused,false);
 audio.toggleMusic();
});
