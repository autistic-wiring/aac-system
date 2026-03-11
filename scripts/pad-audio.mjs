// Prepend 150ms of silence to all WAV files in public/audio/.
// Run once: node scripts/pad-audio.mjs
// Safe to re-run — skips files that already have a leading silence marker.

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const audioDir = join(__dirname, '../public/audio')
const SILENCE_SECONDS = 0.15

function prependSilence(wavBuf, seconds) {
  // Scan chunks to find fmt and data
  let fmtOffset = -1, dataOffset = -1
  let pos = 12
  while (pos < wavBuf.length - 8) {
    const id = wavBuf.toString('ascii', pos, pos + 4)
    const size = wavBuf.readUInt32LE(pos + 4)
    if (id === 'fmt ') fmtOffset = pos
    if (id === 'data') { dataOffset = pos; break }
    pos += 8 + size
  }
  if (dataOffset === -1) throw new Error('data chunk not found')

  const channels      = wavBuf.readUInt16LE(fmtOffset + 10)
  const sampleRate    = wavBuf.readUInt32LE(fmtOffset + 12)
  const bitsPerSample = wavBuf.readUInt16LE(fmtOffset + 22)
  const origDataSize  = wavBuf.readUInt32LE(dataOffset + 4)

  const silenceSamples = Math.ceil(sampleRate * seconds)
  const silenceBytes   = silenceSamples * channels * (bitsPerSample / 8)

  const out = Buffer.alloc(wavBuf.length + silenceBytes)

  // Copy everything up to (and including) the data chunk header
  wavBuf.copy(out, 0, 0, dataOffset + 8)
  // Silence block is already zero-filled by Buffer.alloc
  // Copy original PCM data after silence
  wavBuf.copy(out, dataOffset + 8 + silenceBytes, dataOffset + 8)

  // Patch sizes
  out.writeUInt32LE(out.length - 8, 4)                        // RIFF size
  out.writeUInt32LE(origDataSize + silenceBytes, dataOffset + 4) // data size

  return out
}

const files = readdirSync(audioDir).filter(f => f.endsWith('.wav'))
let count = 0
for (const file of files) {
  const filePath = join(audioDir, file)
  const buf = readFileSync(filePath)

  // Detect if already padded: check for leading silence in first 500 samples
  const dataPos = (() => {
    let p = 12
    while (p < buf.length - 8) {
      if (buf.toString('ascii', p, p + 4) === 'data') return p + 8
      p += 8 + buf.readUInt32LE(p + 4)
    }
    return -1
  })()
  if (dataPos === -1) continue

  const sampleRate = buf.readUInt32LE(12 + buf.toString('ascii', 12, 16) === 'fmt ' ? 12 : 0)
  // Simple check: if first 100 bytes of PCM are all zero, likely already padded
  const sample = buf.slice(dataPos, dataPos + 100)
  if (sample.every(b => b === 0)) {
    console.log(`skip  ${file} (already padded)`)
    continue
  }

  const padded = prependSilence(buf, SILENCE_SECONDS)
  writeFileSync(filePath, padded)
  count++
  console.log(`pad   ${file}  +${Math.round(SILENCE_SECONDS * 1000)}ms`)
}
console.log(`\nDone. Padded ${count} files.`)
