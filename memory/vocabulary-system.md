---
title: "AAC Vocabulary System"
date_modified: 2026-11-06
tags: [vocabulary, fitzgerald-key, color-coding, motor-planning, board-layout]
---

# Vocabulary System

Defined in `src/data/defaultVocabulary.js`.

## Modified Fitzgerald Key Color Coding

| Color | HEX | Category |
|-------|-----|---------|
| Yellow | `#ffeb3b` | Pronouns |
| Green | `#81c784` | Verbs |
| Orange | `#ffb74d` | Nouns |
| Blue | `#64b5f6` | Adjectives |
| Pink | `#f48fb1` / `#f06292` | Prepositions / Social |
| Purple | `#ba68c8` | Questions |
| Red | `#ef5350` | Emergency |
| Grey | `#e0e0e0` | Folders |

## Data Structure

```js
defaultVocabulary = {
  core[],       // 42 items: pronouns, verbs, adjectives, prepositions, questions, social
  folders[],    // 6 folders: food, places, people, activities, things, about_me
  categories{}  // 6 subcategory arrays with 4-10 items each
}
```

## Motor Planning

Items with `hidden: true` keep their grid position but are invisible. Allows vocabulary expansion without breaking muscle memory.

Initial state: 8 visible core words (Go, Stop, Want, Need, Eat, Drink, More, Yes, No) + Food folder.

## Current board layout (2026-11-06)

First page is a 3×3 grid: eat / drink / more / go / help / all-done / blank / play / blank.
`type: 'empty'` slots render as blank space (no button) — see `src/components/Board.jsx`.
Three first-page buttons navigate via `goto` to sub-pages:

| Button | Target page | Contents |
|--------|-------------|----------|
| Eat, Drink | `eat_drink` (Eat & Drink) | strawberry, orange, apple, cereal, cracker, water + blanks (row 2 = cereal, cracker) |
| Go | `place` (Place) | class, gym, outdoor, playground, home (`audioId: home`) + blanks |
| Play | `play_page` (Play) | blocks, cars, spin (`audioId: spinning`, image `spinning.png`), carry, run, cap + blanks |

`folders[]` now lists `eat_drink`, `place`, `play_page` first, then the legacy
`action` / `favorites` / `social` folders. `goto` is a vocabulary-item field
(folder id to navigate to on tap); items without `goto` speak instead.

## Word Item Schema

Each vocabulary item:
```
{ text, pronounce?, emoji, color, backgroundColor?, hidden?, category? }
```

- `text` — display text
- `pronounce` — TTS override for mispronounced words
- `emoji` — visual icon (rendered as emoji text, no image loading)
- `color` — text color (Fitzgerald Key)
- `backgroundColor` — optional card background
- `hidden` — true = invisible but grid-reserved
- `goto` — folder id to navigate to on tap (no speech); absent = speaks the word
- `audioId` — wav key override (e.g. `all-done`, `home`, `spinning`)

See [[speech-pipeline]] for pronunciation handling.
See [[component-tree]] for Board/WordCard rendering.
See [[tts-voice-system]] for per-word wav coverage (`/voice` lab lists every speakable item).
