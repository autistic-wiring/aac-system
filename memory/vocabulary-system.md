---
title: "AAC Vocabulary System"
date_modified: 2026-07-16
tags: [vocabulary, fitzgerald-key, color-coding, motor-planning]
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

See [[speech-pipeline]] for pronunciation handling.
See [[component-tree]] for Board/WordCard rendering.
