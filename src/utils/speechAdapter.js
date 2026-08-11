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
export async function preloadWords(items) {
  await Promise.all(items.map(async ({ id, audioId }) => {
    const key = audioId || id;
    try {
      const buf = await fetchAndDecode(`/audio/${key}.wav?v=${__APP_VERSION__}`);
      audioCache.set(key, buf);
    } catch {
      // static file missing, will fall back to TTS server or speech API on click
    }
  }));
}

function playBuffer(audioBuffer) {
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  source.detune.value = 50; // +50 cents: subtle warmth, calm

  const gainNode = ctx.createGain();
  gainNode.gain.value = 1.15;

  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  source.start();
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
