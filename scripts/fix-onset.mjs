// Boosts quiet onset samples in a WAV file so soft initial consonants
// (like fricatives/nasals) survive mobile audio hardware warmup.
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function findDataChunk(buf) {
  let pos = 12
  while (pos < buf.length - 8) {
    const id = buf.toString('ascii', pos, pos + 4)
    const size = buf.readUInt32LE(pos + 4)
    if (id === 'data') return { offset: pos + 8, size }
    pos += 8 + size
  }
  throw new Error('data chunk not found')
}

function boostOnset(wavPath, boostFactor = 4, peakThresholdRatio = 0.15) {
  const buf = readFileSync(wavPath)
  const { offset } = findDataChunk(buf)

  // Find overall peak
  let peak = 0
  for (let i = offset; i < buf.length - 1; i += 2) {
    peak = Math.max(peak, Math.abs(buf.readInt16LE(i)))
  }

  const threshold = peak * peakThresholdRatio

  // Walk samples from start; boost every sample that is below threshold
  // AND comes before the first window that exceeds threshold
  // (i.e. the quiet onset zone only — don't touch the body of the word)
  let pastOnset = false
  const out = Buffer.from(buf)
  for (let i = offset; i < buf.length - 1; i += 2) {
    const s = buf.readInt16LE(i)
    const abs = Math.abs(s)
    if (!pastOnset && abs > threshold) pastOnset = true
    if (!pastOnset && abs > 0) {
      const boosted = Math.max(-32768, Math.min(32767, Math.round(s * boostFactor)))
      out.writeInt16LE(boosted, i)
    }
  }

  writeFileSync(wavPath, out)
  console.log(`boosted onset: ${wavPath} (peak=${peak}, threshold=${Math.round(threshold)}, boost=${boostFactor}x)`)
}

boostOnset(join(__dirname, '../public/audio/stop.wav'), 5)
