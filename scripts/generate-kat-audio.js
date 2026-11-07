// Default voice generator: ElevenLabs Kat for every speakable board word.
//   ELEVENLABS_API_KEY=... npm run generate-audio
// Key falls back to the `elevenlabs-api-key` k8s secret (namespace asd).
// Voice/model/settings overridable via env (ELEVENLABS_VOICE_ID etc.).
// Output matches board convention: 22050 Hz mono 16-bit wav in public/audio/.

import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../public/audio');

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'RiK8PTtVIeKKoFFTk9fg'; // Kat
const MODEL_ID = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
const SETTINGS = {
  stability: Number(process.env.ELEVENLABS_STABILITY ?? 0.5),
  similarity_boost: Number(process.env.ELEVENLABS_SIMILARITY ?? 0.75),
  style: Number(process.env.ELEVENLABS_STYLE ?? 0.75),
  speed: Number(process.env.ELEVENLABS_SPEED ?? 0.8),
};

function apiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  try {
    const b64 = execFileSync(
      'kubectl',
      ['-n', 'asd', 'get', 'secret', 'elevenlabs-api-key', '-o', 'jsonpath={.data.api-key}'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).replace(/[{}]/g, '');
    return Buffer.from(b64, 'base64').toString('utf8');
  } catch {
    console.error('No ELEVENLABS_API_KEY env and k8s secret unreadable.');
    console.error('Run ./scripts/set-elevenlabs-key.sh first.');
    process.exit(1);
  }
}

// ponytail: same word list as the board speaks (skip folders/empties, honor
// audioId reuse + pronounce overrides so filenames match speechAdapter keys).
const { defaultVocabulary } = await import('../src/data/defaultVocabulary.js');
const seen = new Set();
const words = [];
for (const item of [...defaultVocabulary.core, ...Object.values(defaultVocabulary.categories).flat()]) {
  if (item.type === 'folder' || item.type === 'empty' || !item.word) continue;
  const key = item.audioId || item.id;
  if (seen.has(key)) continue;
  seen.add(key);
  let text = item.pronounce || item.word;
  if (item.id === 'stop' && !item.pronounce) text = 'Stop.';
  words.push({ key, text });
}

const KEY = apiKey();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kat-'));
let done = 0;
for (const { key, text } of words) {
  const mp3 = path.join(tmp, key + '.mp3');
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text + (text.endsWith('.') ? '' : '.'), model_id: MODEL_ID, voice_settings: SETTINGS }),
  });
  if (!res.ok) {
    console.error(`  ✗ ${key}.wav  HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
    continue;
  }
  fs.writeFileSync(mp3, Buffer.from(await res.arrayBuffer()));
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', mp3, '-ar', '22050', '-ac', '1', '-sample_fmt', 's16',
    path.join(OUT_DIR, key + '.wav')]);
  fs.unlinkSync(mp3);
  console.log(`  ✓ ${key}.wav  (${text})`);
  done++;
  await new Promise((r) => setTimeout(r, 200));
}
fs.rmdirSync(tmp);
console.log(`\nDone: ${done}/${words.length} words baked with ${VOICE_ID} -> ${OUT_DIR}`);
