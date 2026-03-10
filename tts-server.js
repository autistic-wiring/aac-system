import http from 'http';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MODEL_DIR = path.join(__dirname, 'tts-models/vits-piper-en_US-lessac-medium');
const PORT = 5050;

async function init() {
  // Load the raw WASM module and wait for it to be ready
  const createModule = require('./node_modules/sherpa-onnx/sherpa-onnx-wasm-nodejs.js');
  const wasmModule = createModule();
  await wasmModule.ready;

  const sherpaOnnxTts = require('./node_modules/sherpa-onnx/sherpa-onnx-tts.js');

  const tts = sherpaOnnxTts.createOfflineTts(wasmModule, {
    offlineTtsModelConfig: {
      offlineTtsVitsModelConfig: {
        model: MODEL_DIR + '/en_US-lessac-medium.onnx',
        lexicon: '',
        tokens: MODEL_DIR + '/tokens.txt',
        dataDir: MODEL_DIR + '/espeak-ng-data',
        noiseScale: 0.667,
        noiseScaleW: 0.8,
        lengthScale: 1.1, // slightly stretched = clear and deliberate
      },
      numThreads: 1,
      debug: 0,
      provider: 'cpu',
    },
    maxNumSentences: 1,
  });

  console.log(`Sherpa-ONNX TTS ready. Sample rate: ${tts.sampleRate}Hz`);

  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, 'http://localhost');
    if (url.pathname !== '/speak') {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const text = url.searchParams.get('text');
    if (!text) {
      res.writeHead(400);
      res.end('Missing ?text= parameter');
      return;
    }

    try {
      // Adding punctuation helps TTS handle short words
      let textToSpeak = text;
      if (text.toLowerCase() === 'stop') {
        textToSpeak = 'Stop.';
      }

      // Slower speaking rate for AAC
      const audio = tts.generate({ text: textToSpeak, sid: 0, speed: 0.55 });
      const samples = audio.samples; // Float32Array
      const sampleRate = tts.sampleRate;
      const numSamples = samples.length;

      // Float32 → Int16 PCM
      const pcm = Buffer.alloc(numSamples * 2);
      for (let i = 0; i < numSamples; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        pcm.writeInt16LE(Math.round(s * 32767), i * 2);
      }

      // Minimal WAV header
      const header = Buffer.alloc(44);
      header.write('RIFF', 0);
      header.writeUInt32LE(36 + pcm.length, 4);
      header.write('WAVE', 8);
      header.write('fmt ', 12);
      header.writeUInt32LE(16, 16);
      header.writeUInt16LE(1, 20);           // PCM
      header.writeUInt16LE(1, 22);           // mono
      header.writeUInt32LE(sampleRate, 24);
      header.writeUInt32LE(sampleRate * 2, 28);
      header.writeUInt16LE(2, 32);
      header.writeUInt16LE(16, 34);
      header.write('data', 36);
      header.writeUInt32LE(pcm.length, 40);

      const wav = Buffer.concat([header, pcm]);

      res.writeHead(200, {
        'Content-Type': 'audio/wav',
        'Content-Length': wav.length,
        'Cache-Control': 'no-cache',
      });
      res.end(wav);
    } catch (err) {
      console.error('TTS generate error:', err);
      res.writeHead(500);
      res.end('TTS error: ' + err.message);
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`TTS server listening on http://0.0.0.0:${PORT} (all interfaces)`);
  });
}

init().catch(err => {
  console.error('Failed to start TTS server:', err);
  process.exit(1);
});
