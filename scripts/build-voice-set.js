// Build a consistent single-voice wav set with the local Piper (lessac) model.
// Usage:
//   node scripts/build-voice-set.js public/audio --missing-only  # fill gaps, keep existing
//   node scripts/build-voice-set.js public/audio-piper            # full alternate set
// Same model/settings as scripts/generate-audio.js so files match that voice.

import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const outDir = process.argv[2] || path.join(__dirname, '../public/audio-piper');
const missingOnly = process.argv.includes('--missing-only');
fs.mkdirSync(outDir, { recursive: true });

// ponytail: import from source of truth, skip folders/empties (never speak).
const { defaultVocabulary } = await import('../src/data/defaultVocabulary.js');
const items = [
  ...defaultVocabulary.core,
  ...Object.values(defaultVocabulary.categories).flat(),
].filter((i) => i.type !== 'folder' && i.type !== 'empty' && i.word);

const MODEL_DIR = path.join(__dirname, '../tts-models/vits-piper-en_US-lessac-medium');
const createModule = require('../node_modules/sherpa-onnx/sherpa-onnx-wasm-nodejs.js');
const sherpaOnnxTts = require('../node_modules/sherpa-onnx/sherpa-onnx-tts.js');

const wasmModule = createModule();
await wasmModule.ready;
const tts = sherpaOnnxTts.createOfflineTts(wasmModule, {
  offlineTtsModelConfig: {
    offlineTtsVitsModelConfig: {
      model: MODEL_DIR + '/en_US-lessac-medium.onnx',
      lexicon: '',
      tokens: MODEL_DIR + '/tokens.txt',
      dataDir: MODEL_DIR + '/espeak-ng-data',
      noiseScale: 0.667,
      noiseScaleW: 0.8,
      lengthScale: 1.1,
    },
    numThreads: 1,
    debug: 0,
    provider: 'cpu',
  },
  maxNumSentences: 1,
});

const buildWav = (samples, sampleRate) => {
  const pcm = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    pcm.writeInt16LE(Math.round(s * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
};

let done = 0, skipped = 0;
for (const item of items) {
  const key = item.audioId || item.id;
  const dest = path.join(outDir, key + '.wav');
  if (missingOnly && fs.existsSync(dest)) { skipped++; continue; }
  let text = item.pronounce || item.word;
  if (item.id === 'stop' && !item.pronounce) text = 'Stop.';
  const audio = tts.generate({ text, sid: 0, speed: 0.55 });
  fs.writeFileSync(dest, buildWav(audio.samples, tts.sampleRate));
  console.log(`  ✓ ${key}.wav  (${text})`);
  done++;
}
console.log(`\nDone: ${done} written, ${skipped} skipped -> ${outDir}`);
process.exit(0);
