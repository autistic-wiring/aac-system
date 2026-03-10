// Run once to pre-generate all vocabulary audio files:
//   node scripts/generate-audio.js

import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MODEL_DIR = path.join(__dirname, '../tts-models/vits-piper-en_US-lessac-medium');
const OUT_DIR = path.join(__dirname, '../public/audio');

// Import vocabulary directly
const { defaultVocabulary } = await import('../src/data/defaultVocabulary.js');

const allItems = [
  ...defaultVocabulary.core,
  ...defaultVocabulary.folders,
  ...Object.values(defaultVocabulary.categories).flat()
];

const createModule = require('../node_modules/sherpa-onnx/sherpa-onnx-wasm-nodejs.js');
const sherpaOnnxTts = require('../node_modules/sherpa-onnx/sherpa-onnx-tts.js');

console.log('Loading TTS model...');
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

console.log(`TTS ready (${tts.sampleRate}Hz). Generating audio files...\n`);

function buildWav(samples, sampleRate) {
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
}

for (const item of allItems) {
  // Adding punctuation helps TTS engines articulate short words better.
  let textToSpeak = item.word;
  if (item.id === 'stop') {
    textToSpeak = 'Stop.';
  }

  const audio = tts.generate({ text: textToSpeak, sid: 0, speed: 0.55 });
  const wav = buildWav(audio.samples, tts.sampleRate);
  const filename = item.id + '.wav';
  fs.writeFileSync(path.join(OUT_DIR, filename), wav);
  console.log(`  ✓ ${filename}  (${textToSpeak})`);
}

console.log(`\nDone! ${allItems.length} files written to public/audio/`);
process.exit(0);
