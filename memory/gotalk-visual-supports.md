---
title: GoTalk Visual Supports (SLP alignment)
date_modified: 2026-08-16
tags: [gotalk, slp, visual-supports, pages, motor-planning, aac]
---

# GoTalk Visual Supports

Branch `feat/gotalk-visual-supports` (2026-08-16). Replaces the core board entirely with a GoTalk-style page system, replicating speech therapist Rezvan's GoTalk Lite setup (email "Fwd: Visual supports for AAC device", 2026-08-14).

## Therapist's directives (from email)

- Each page very simple: **2–3 pictures max** — never overwhelm the screen
- Hand-over-hand support + functional modelling (bring up "Help me" page, guide him to select it BEFORE helping)
- Functional messages: "Help me", "I want", "more", "all done", "my turn", "your turn", "yes", "no"
- Consistency across speech therapy, home, and behavioural therapy
- Real photos of own snacks/toys/washroom/people work well (no in-app config UI — config via source code, per user)

## Pages configured (`src/data/gotalkPages.js`)

1. Turn Taking — My turn / Your turn (artwork extracted from her PDF)
2. Yes No — Yes (green) / No (red)
3. More Block — More / All done
4. Help — Help me / Open
5. I Want — I want / More

## Visual spec (sampled from her screenshots)

- Page background `#34C7D9`, footer `#006253`, white cards, ~4px black border, rounded
- Footer: home icon (left) → launcher, page title (center), next-page arrow (right, cycles)
- `bakedLabel: true` buttons = card artwork extracted from her GoTalk screenshots (label text is part of the image); stored as webp in `public/images/gotalk/`

## Implementation notes

- Components: `GoTalkHome`, `GoTalkPage`, `GoTalkCard`; styles in `src/GoTalk.css`
- Old board removed: `Board.jsx`, `WordCard.jsx`, `defaultVocabulary.js`
- `scripts/generate-audio.js` now imports `allGotalkButtons` — still Piper, NEVER run on full vocab (see [[tts-voice-system]])
- New audio clips `help_me.wav`, `i_want.wav` generated with gTTS recipe (tld=com, 22050 mono, trim/normalize 0.92)

See [[vocabulary-system]] [[project-overview]].
