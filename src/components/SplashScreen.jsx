import { useState, useEffect, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { defaultVocabulary } from '../data/defaultVocabulary'
import './SplashScreen.css'

// Same key derivation as speechAdapter preloadWords (audioId || id).
// Fetching each once here warms the service-worker precache / HTTP cache so
// every button sound plays instantly, including fully offline.
const audioKeys = [
  ...new Set(
    [
      ...defaultVocabulary.core,
      ...defaultVocabulary.folders,
      ...Object.values(defaultVocabulary.categories).flat(),
    ]
      .filter((item) => item.type !== 'folder')
      .map((item) => item.audioId || item.id)
  ),
]

export default function SplashScreen({ onDone }) {
  const [status, setStatus] = useState('Checking for updates...')
  const [statusType, setStatusType] = useState('checking') // checking | updated | ready
  const timerDone = useRef(false)
  const swDone = useRef(false)
  const audioDone = useRef(false)
  const hasUpdate = useRef(false)

  const { updateServiceWorker } = useRegisterSW({
    onRegistered() {
      swDone.current = true
      maybeFinish()
    },
    onNeedRefresh() {
      hasUpdate.current = true
      swDone.current = true
      maybeFinish()
    },
    onOfflineReady() {
      swDone.current = true
      maybeFinish()
    },
    onRegisterError() {
      swDone.current = true
      maybeFinish()
    },
  })

  function maybeFinish() {
    if (!timerDone.current || !swDone.current || !audioDone.current) return

    if (hasUpdate.current) {
      setStatus('New version found! Updating...')
      setStatusType('updated')
      // slight delay so user sees the message, then reload with new SW
      setTimeout(() => updateServiceWorker(true), 1200)
    } else {
      setStatus("You're up to date ✓")
      setStatusType('ready')
      setTimeout(onDone, 900)
    }
  }

  // Warm every button sound into cache with visible progress. Failures are
  // non-fatal (offline first visit, missing file) — splash still finishes.
  async function warmAudioCache() {
    let done = 0
    setStatus(`Preparing sounds (0/${audioKeys.length})...`)
    await Promise.all(
      audioKeys.map(async (key) => {
        try {
          await fetch(`/audio/${key}.wav`)
        } catch {
          /* offline or missing — decode falls back to TTS/speech API */
        }
        done += 1
        setStatus(`Preparing sounds (${done}/${audioKeys.length})...`)
      })
    )
    audioDone.current = true
    maybeFinish()
  }

  useEffect(() => {
    // Deferred so the initial setStatus runs outside the effect body
    // (react-hooks/set-state-in-effect); still fires immediately on mount.
    const kickoff = setTimeout(warmAudioCache, 0)
    // minimum splash display: 2s
    const t = setTimeout(() => {
      timerDone.current = true
      maybeFinish()
    }, 2000)

    // safety fallback: if SW never responds (no network, etc.), proceed after 6s
    const fallback = setTimeout(() => {
      if (!swDone.current) {
        swDone.current = true
        maybeFinish()
      }
    }, 6000)

    return () => {
      clearTimeout(kickoff)
      clearTimeout(t)
      clearTimeout(fallback)
    }
  }, [])

  return (
    <div className="splash">
      <div className="splash-content">
        <div className="splash-icon">
          <img src="/icons/icon-512.png" alt="AAC Board" />
        </div>
        <h1 className="splash-title">AAC Board</h1>
        <p className="splash-version">v{__APP_VERSION__}</p>
        <div className="splash-status-row">
          <span className={`splash-dot ${statusType}`} />
          <p className="splash-status">{status}</p>
        </div>
      </div>
    </div>
  )
}
