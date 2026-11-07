// Pre-decoded AudioBuffer cache: word -> AudioBuffer
const audioCache = new Map();

// AudioContext reuse. Null when the browser has no WebAudio (old iOS
// Safari) — callers fall back to <audio> element playback, then speech.
let audioCtx = null;
function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx || audioCtx.state === 'closed') {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try {
      audioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

async function fetchAndDecode(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`fetch error: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const ctx = getAudioContext();
  if (!ctx) throw new Error('no AudioContext');
  return ctx.decodeAudioData(arrayBuffer);
}

// Direct <audio> playback: works on iOS/Safari where WebAudio decode or
// autoplay policy blocks buffer playback, no decode step needed.
function playViaElement(url) {
  return new Promise((resolve, reject) => {
    const el = new Audio(url);
    el.onended = () => resolve();
    el.onerror = () => reject(new Error('audio element error'));
    const p = el.play();
    if (p && p.catch) p.catch(reject);
  });
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

// WebAudio single-tap playback stops the previous sound so rapid taps
// cut off instead of overlapping (no time-based cooldown: every tap in a
// user gesture must produce sound).
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
  if (!ctx) return null;
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
// order with a short gap. Reuses the preloaded wav cache, falls back to
// <audio> element playback (iOS-safe), then the TTS server, then device
// speech. Resolves when the full sequence ends.
export async function speakSequence(items) {
  if (!items || items.length === 0) return;
  const ctx = await ensureRunning();
  // Same-protocol as the page: the dev TTS server is plain HTTP, and an
  // http:// fetch from an https:// page is blocked as mixed content.
  const TTS_SERVER = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:5050/speak`
    : null;
  for (const item of items) {
    const key = item.audioId || item.id;
    const url = `/audio/${key}.wav`;
    const text = item.pronounce || item.word || '';
    // Stop any stray single-tap sound before starting the sequence step.
    try {
      currentSource?.stop();
    } catch {
      // Already stopped — safe to ignore.
    }
    currentSource = null;
    try {
      if (ctx && ctx.state === 'running' && audioCache.has(key)) {
        await playBufferAndWait(audioCache.get(key));
      } else {
        // Element playback needs no decode and no running context.
        try {
          await playViaElement(url);
        } catch {
          if (TTS_SERVER) {
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
        }
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
    if (!ctx) {
      window.removeEventListener('pointerup', unlock);
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchend', unlock);
      window.removeEventListener('mouseup', unlock);
      return;
    }
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
  const ttsText = pronounce || word;
  const url = `/audio/${id}.wav`;

  // 1. Instant play from the pre-decoded cache (WebAudio).
  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        pendingSpeech = { id, word, pronounce };
        try {
          await ctx.resume();
        } catch {
          // Expected if blocked by browser autoplay policy
        }
      }
      if (ctx.state === 'running' && audioCache.has(id)) {
        playBuffer(audioCache.get(id));
        return;
      }
    }
  } catch {
    // Fall through to element playback.
  }

  // 2. Direct file playback: needs no AudioContext and no decode step,
  // so it works on devices where WebAudio is unavailable or blocked.
  try {
    await playViaElement(url);
    return;
  } catch {
    // File missing or playback blocked — fall through.
  }

  // 3. Dev TTS server (same protocol: http:// from an https:// page is
  // blocked as mixed content, so match the page protocol).
  try {
    const TTS_SERVER = `${window.location.protocol}//${window.location.hostname}:5050/speak`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
      const buf = await fetchAndDecode(
        `${TTS_SERVER}?text=${encodeURIComponent(ttsText)}`,
        { signal: controller.signal }
      );
      audioCache.set(id, buf);
      try {
        playBuffer(buf);
      } catch {
        await playViaElement(url).catch(() => _fallbackSpeak(ttsText));
      }
    } catch {
      _fallbackSpeak(ttsText);
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // 4. Last resort: device speech synthesis.
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
