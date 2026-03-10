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
  await Promise.all(items.map(async ({ id, word }) => {
    try {
      const buf = await fetchAndDecode(`/audio/${id}.wav`);
      audioCache.set(id, buf);
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

export const speakWord = async (id, word, pronounce) => {
  const ttsText = pronounce || word;
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') await ctx.resume();

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
};

function _fallbackSpeak(word) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.rate = 0.55;
  utterance.pitch = 1.1;
  window.speechSynthesis.speak(utterance);
}
