// Decode short effects before play. HTMLAudioElement.play() can synchronously
// stall mobile WebKit on the first audible collision, even after muted priming.
export function createBufferedSfx(paths) {
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return null;
  let context;
  try { context = new Context(); } catch { return null; }
  const buffers = new Map();
  const loads = new Map();
  const voices = new Set();
  let unlocked = false;
  let decodeFailed = false;
  let resumePending = null;
  let generation = 0;

  function load(path) {
    if (loads.has(path)) return loads.get(path);
    const promise = fetch(path)
      .then((response) => {
        if (!response.ok) throw new Error(`SFX request failed: ${response.status}`);
        return response.arrayBuffer();
      })
      .then((data) => context.decodeAudioData(data))
      .then((buffer) => { buffers.set(path, buffer); return buffer; })
      .catch(() => { decodeFailed = true; return null; });
    loads.set(path, promise);
    return promise;
  }
  for (const path of new Set(paths)) void load(path);

  function unlock(fromGesture = false) {
    if (decodeFailed || context.state === 'closed') return false;
    if (unlocked && context.state !== 'running' && !fromGesture) return true;
    unlocked = true;
    if (context.state !== 'running' && !resumePending) {
      // Both resume and the silent pulse originate in the real input handler.
      resumePending = context.resume().catch(() => undefined).finally(() => { resumePending = null; });
      const pulse = context.createBufferSource();
      pulse.buffer = context.createBuffer(1, 1, context.sampleRate);
      pulse.connect(context.destination);
      pulse.onended = () => pulse.disconnect();
      pulse.start();
    }
    return true;
  }

  function start(buffer, volume) {
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(context.destination);
    voices.add(source);
    source.onended = () => {
      voices.delete(source);
      source.disconnect();
      gain.disconnect();
    };
    source.start();
  }

  function play(path, volume, fallback, allowed) {
    if (!unlocked || decodeFailed || context.state === 'closed') return false;
    const buffer = buffers.get(path);
    if (buffer && context.state === 'running') {
      start(buffer, volume);
      return true;
    }
    const requestedAt = performance.now();
    const token = generation;
    // Never decode or initialize a media element synchronously in a collision.
    void Promise.all([load(path), resumePending]).then(([decoded]) => {
      if (token !== generation || !allowed() || performance.now() - requestedAt > 400) return;
      if (decoded && context.state === 'running') start(decoded, volume);
      else fallback();
    });
    return true;
  }

  function stop() {
    generation += 1;
    unlocked = false;
    for (const source of voices) {
      try { source.stop(); } catch { /* A source may already have ended. */ }
    }
    voices.clear();
    if (context.state === 'running') void context.suspend().catch(() => undefined);
  }

  return { unlock, play, stop };
}
