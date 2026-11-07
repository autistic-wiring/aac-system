// Pre-decoded AudioBuffer cache: word -> AudioBuffer
const audioCache = new Map();

// AudioContext reuse
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

async function fetchAndDecode(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch error: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  return getAudioContext().decodeAudioData(arrayBuffer);
}

// Preload all vocabulary audio from static files into memory.
// id = vocabulary item id (e.g. "want", "all-done")
// NOTE: no ?v= query string — the URL must match the service-worker precache
// key exactly or offline playback misses the cache. Invalidation is handled
// by the SW precache revision (content hash) on each app update.
export async function preloadWords(items) {
  await Promise.all(items.map(async ({ id, audioId }) => {
    const key = audioId || id;
    try {
      const buf = await fetchAndDecode(`/audio/${key}.wav`);
      audioCache.set(key, buf);
    } catch {
      // static file missing, will fall back to TTS server or speech API on click
    }
  }));
}

// 1s cooldown between button sounds to avoid overlapping.
const SOUND_COOLDOWN_MS = 1000;
let lastPlayAt = 0;
let currentSource = null;

function playBuffer(audioBuffer) {
  const ctx = getAudioContext();
  // Stop previous sound so rapid taps never overlap.
  try {
    currentSource?.stop();
  } catch {
    // Already stopped — safe to ignore.
  }
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.detune.value = 50; // +50 cents: subtle warmth, calm

  const gainNode = ctx.createGain();
  gainNode.gain.value = 1.15;

  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  currentSource = source;
  source.onended = () => {
    if (currentSource === source) currentSource = null;
  };
  source.start();
  lastPlayAt = Date.now();
}

// Play a buffer and resolve when it finishes (for sequential playback).
// Unlike playBuffer, this does NOT cut off the previous sound — sequential
// messages must play seamlessly in order (GoTalk Express behaviour).
function playBufferAndWait(audioBuffer) {
  const ctx = getAudioContext();
  return new Promise((resolve) => {
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.detune.value = 50; // +50 cents: subtle warmth, calm

    const gainNode = ctx.createGain();
    gainNode.gain.value = 1.15;

    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    currentSource = source;
    source.onended = () => {
      if (currentSource === source) currentSource = null;
      resolve();
    };
    source.start();
    lastPlayAt = Date.now();
    // Safety: never hang longer than the clip duration + 2s.
    setTimeout(resolve, (audioBuffer.duration || 8) * 1000 + 2000);
  });
}

const SEQUENCE_GAP_MS = 150;

async function ensureRunning() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      // Expected if blocked by browser autoplay policy
    }
  }
  return ctx;
}

function speakWithSynthesisAndWait(text) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.72;
    utterance.pitch = 1.1;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
    // Safety: never hang if onend never fires.
    setTimeout(resolve, Math.max(1500, text.length * 150 + 2000));
  });
}

// GoTalk Express-style sequential playback: play each queued message in
// order with a short gap. Reuses the preloaded wav cache, falls back to the
// TTS server, then to device speech. Resolves when the full sequence ends.
export async function speakSequence(items) {
  if (!items || items.length === 0) return;
  const ctx = await ensureRunning();
  const TTS_SERVER = typeof window !== 'undefined'
    ? `http://${window.location.hostname}:5050/speak`
    : null;
  for (const item of items) {
    const key = item.audioId || item.id;
    const text = item.pronounce || item.word || '';
    // Stop any stray single-tap sound before starting the sequence step.
    try {
      currentSource?.stop();
    } catch {
      // Already stopped — safe to ignore.
    }
    currentSource = null;
    try {
      if (ctx.state === 'running') {
        if (audioCache.has(key)) {
          await playBufferAndWait(audioCache.get(key));
        } else if (TTS_SERVER) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3000);
          try {
            const response = await fetch(
              `${TTS_SERVER}?text=${encodeURIComponent(text)}`,
              { signal: controller.signal }
            );
            if (!response.ok) throw new Error(`fetch error: ${response.status}`);
            const arrayBuffer = await response.arrayBuffer();
            const buf = await ctx.decodeAudioData(arrayBuffer);
            audioCache.set(key, buf);
            await playBufferAndWait(buf);
          } catch {
            await speakWithSynthesisAndWait(text);
          } finally {
            clearTimeout(timer);
          }
        } else {
          await speakWithSynthesisAndWait(text);
        }
      } else {
        await speakWithSynthesisAndWait(text);
      }
    } catch {
      // One bad clip must not kill the rest of the sequence.
    }
    await new Promise((r) => setTimeout(r, SEQUENCE_GAP_MS));
  }
  lastPlayAt = Date.now();
}

let pendingSpeech = null;

// Helper to resume context on any valid user gesture
function setupGestureUnlock() {
  if (typeof window === 'undefined') return;

  const unlock = async () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }
    if (ctx.state === 'running') {
      if (pendingSpeech) {
        const { id, word, pronounce } = pendingSpeech;
        pendingSpeech = null;
        speakWord(id, word, pronounce);
      }
      window.removeEventListener('pointerup', unlock);
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchend', unlock);
      window.removeEventListener('mouseup', unlock);
    }
  };

  window.addEventListener('pointerup', unlock, { passive: true });
  window.addEventListener('click', unlock, { passive: true });
  window.addEventListener('touchend', unlock, { passive: true });
  window.addEventListener('mouseup', unlock, { passive: true });
}

setupGestureUnlock();

export const speakWord = async (id, word, pronounce) => {
  // Cooldown: drop taps within 1s of the last sound.
  if (Date.now() - lastPlayAt < SOUND_COOLDOWN_MS) return;
  lastPlayAt = Date.now(); // optimistic: also debounces slow TTS fetch
  const ttsText = pronounce || word;
  const ctx = getAudioContext();
  
  if (ctx.state === 'suspended') {
    pendingSpeech = { id, word, pronounce };
    try {
      await ctx.resume();
    } catch {
      // Expected if blocked by browser autoplay policy
    }
  }

  if (ctx.state === 'running') {
    // Instant play from cache
    if (audioCache.has(id)) {
      playBuffer(audioCache.get(id));
      return;
    }

    // Fallback: try TTS server
    try {
      const TTS_SERVER = `http://${window.location.hostname}:5050/speak`;
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 3000);
      const buf = await fetchAndDecode(`${TTS_SERVER}?text=${encodeURIComponent(ttsText)}`);
      audioCache.set(id, buf);
      playBuffer(buf);
    } catch {
      _fallbackSpeak(ttsText);
    }
  } else {
    // Try fallback speak if context is still suspended (might be blocked, but serves as a last resort)
    _fallbackSpeak(ttsText);
  }
};

function _fallbackSpeak(word) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.rate = 0.72;
  utterance.pitch = 1.1;
  window.speechSynthesis.speak(utterance);
}
