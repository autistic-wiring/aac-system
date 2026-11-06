import React, { useEffect, useRef, useState } from 'react';
import { defaultVocabulary } from '../data/defaultVocabulary';

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');

// ponytail: one static word list, grouped by page, shared by all voice sections.
const groups = [
  { title: 'First page', items: defaultVocabulary.core },
  ...defaultVocabulary.folders.map((f) => ({
    title: f.word,
    items: defaultVocabulary.categories[f.id] || [],
  })),
]
  .map((g) => ({
    ...g,
    items: g.items.filter((i) => i.type !== 'folder' && i.type !== 'empty' && i.word),
  }))
  .filter((g) => g.items.length > 0);

const keyOf = (item) => item.audioId || item.id;

function playFile(url, audioRef) {
  try { audioRef.current?.pause(); } catch { /* noop */ }
  const a = new Audio(url);
  audioRef.current = a;
  a.play().catch(() => {});
}

function speakWithVoice(word, voiceName) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  const v = window.speechSynthesis.getVoices().find((x) => x.name === voiceName);
  if (v) u.voice = v;
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

const CHOICES = [
  { id: 'current', label: 'A — Current board voice' },
  { id: 'piper', label: 'B — Piper Leslie (offline)' },
  { id: 'device', label: 'C — This device voice' },
  { id: 'voicebox', label: 'D — Voicebox clone of Strawberry' },
];

export default function VoiceLab() {
  const audioRef = useRef(null);
  const [voices, setVoices] = useState([]);
  const [deviceVoice, setDeviceVoice] = useState('');
  const [choice, setChoice] = useState(() => localStorage.getItem('voice-choice') || '');

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const load = () => {
      const vs = window.speechSynthesis.getVoices();
      setVoices(vs);
      if (!deviceVoice && vs.length > 0) {
        const en = vs.find((v) => v.lang?.toLowerCase().startsWith('en')) || vs[0];
        setDeviceVoice(en.name);
      }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const pick = (id) => {
    setChoice(id);
    localStorage.setItem('voice-choice', id);
  };

  return (
    <div className="voicelab">
      <h1>Voice picker</h1>
      <p className="voicelab-sub">
        Tap any word to hear it. Compare the voices, then pick one at the bottom.
        Your pick is saved on this device.
      </p>

      <section>
        <h2>A — Current board voice</h2>
        <p>What each button sounds like today (mixed recordings).</p>
        {groups.map((g) => (
          <div key={g.title}>
            <h3>{g.title}</h3>
            <div className="voicelab-words">
              {g.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => playFile(`${baseUrl}/audio/${keyOf(item)}.wav`, audioRef)}
                >
                  {item.word}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2>B — Piper Leslie (offline)</h2>
        <p>One consistent voice for every word, works with no internet.</p>
        {groups.map((g) => (
          <div key={g.title}>
            <h3>{g.title}</h3>
            <div className="voicelab-words">
              {g.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => playFile(`${baseUrl}/audio-piper/${keyOf(item)}.wav`, audioRef)}
                >
                  {item.word}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2>C — This device&apos;s voices</h2>
        <p>Live speech from this tablet/phone. Voice choice varies by device.</p>
        <select value={deviceVoice} onChange={(e) => setDeviceVoice(e.target.value)}>
          {voices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
        {groups.map((g) => (
          <div key={g.title}>
            <h3>{g.title}</h3>
            <div className="voicelab-words">
              {g.items.map((item) => (
                <button key={item.id} onClick={() => speakWithVoice(item.word, deviceVoice)}>
                  {item.word}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2>Your pick</h2>
        <div className="voicelab-pick">
          {CHOICES.map((c) => (
            <label key={c.id}>
              <input type="radio" name="voice-choice" checked={choice === c.id} onChange={() => pick(c.id)} />
              {c.label}
            </label>
          ))}
        </div>
        {choice === 'voicebox' && (
          <p>
            Next step: open the Voicebox app, clone from the Strawberry recording
            (<code>public/audio/strawberry.wav</code>), generate every word above,
            and send the wav files over. Section D samples will appear here once
            they land in the build.
          </p>
        )}
      </section>
    </div>
  );
}
