# Graph Report - .  (2026-08-15)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 73 nodes · 47 edges · 34 communities detected
- Extraction: 70% EXTRACTED · 30% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]

## God Nodes (most connected - your core abstractions)
1. `GoTalk Visual Supports (SLP alignment)` - 10 edges
2. `Project Overview Document` - 7 edges
3. `Vocabulary System Document` - 6 edges
4. `GoTalk Page System (launcher + 2-picture pages)` - 6 edges
5. `Speech Synthesis Pipeline` - 4 edges
6. `Component Tree Document` - 3 edges
7. `Layer 1: Pre-generated WAV AudioBuffer Cache` - 3 edges
8. `Kubernetes Infrastructure (asd ns, 1 replica)` - 3 edges
9. `gotalkPages.js Page Configuration (Turn Taking, Yes No, More Block, Help, I Want)` - 3 edges
10. `Speech Pipeline Document` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Project Overview Document` --references--> `Speech Pipeline Document`  [EXTRACTED]
  memory/project-overview.md → memory/speech-pipeline.md
- `Project Overview Document` --references--> `Deployment & Infrastructure Document`  [EXTRACTED]
  memory/project-overview.md → memory/deployment.md
- `Project Overview Document` --references--> `GoTalk Visual Supports (SLP alignment)`  [EXTRACTED]
  memory/project-overview.md → memory/gotalk-visual-supports.md
- `Speech Pipeline Document` --references--> `Vocabulary System Document`  [EXTRACTED]
  memory/speech-pipeline.md → memory/vocabulary-system.md
- `GoTalk Visual Supports (SLP alignment)` --references--> `Vocabulary System Document`  [EXTRACTED]
  memory/gotalk-visual-supports.md → memory/vocabulary-system.md

## Hyperedges (group relationships)
- **Three-Layer Speech Fallback Chain** — speech-pipeline_layer1-wav, speech-pipeline_layer2-tts, speech-pipeline_layer3-browser [EXTRACTED 1.00]
- **Kubernetes Container Deployment Stack** — deployment_k8s-infra, deployment_dockerfile, deployment_nginx-config, deployment_cert-manager [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.22
Nodes (9): GoTalk Visual Supports (SLP alignment), bakedLabel Card Artwork (webp in public/images/gotalk/), GoTalkHome / GoTalkPage / GoTalkCard Components, gotalkPages.js Page Configuration (Turn Taking, Yes No, More Block, Help, I Want), Rationale: Functional Message Set (Help me, I want, more, all done, turns, yes, no), Rationale: Config via Source Code (no in-app UI, real photos), Removed Core Board Files (Board.jsx, WordCard.jsx, defaultVocabulary.js), SLP Email: Visual Supports for AAC Device (Rezvan, 2026-08-14) (+1 more)

### Community 1 - "Community 1"
Cohesion: 0.36
Nodes (8): Component Tree Document, Deployment & Infrastructure Document, Project Overview Document, Page Navigation via currentPageId React State (no router), Instant Pointer Triggers on pointerdown, Speech Pipeline Document, Vocabulary System Document, Core Board Superseded by GoTalk Pages (2026-08-16)

### Community 2 - "Community 2"
Cohesion: 0.25
Nodes (8): 3-Layer Speech Fallback Architecture, fix-onset.mjs Quiet Onset Boost, Layer 1: Pre-generated WAV AudioBuffer Cache, Layer 2: TTS HTTP Server Fallback, Layer 3: Browser SpeechSynthesis API Fallback, pad-audio.mjs 150ms Silence Padding, Speech Synthesis Pipeline, tts-server.js TTS HTTP Server (Port 5050)

### Community 3 - "Community 3"
Cohesion: 0.4
Nodes (5): cert-manager + Let's Encrypt TLS, Multi-Stage Dockerfile (node:22 → nginx), Kubernetes Infrastructure (asd ns, 1 replica), nginx SPA Fallback + Asset Cache, Docker + nginx + Kubernetes Infrastructure

### Community 4 - "Community 4"
Cohesion: 0.4
Nodes (5): GoTalk Page System (launcher + 2-picture pages), Rationale: Consistency Across Therapy, Home, and Behavioural Therapy, Rationale: Replicate Therapist Rezvan's GoTalk Lite Setup, Rationale: Hand-over-Hand Support + Functional Modelling (guide to Help me before helping), Rationale: Keep Pages to 2-3 Pictures Max

### Community 5 - "Community 5"
Cohesion: 0.67
Nodes (3): gTTS Audio Clips (help_me.wav, i_want.wav), Sherpa-ONNX + Piper VITS TTS Engine, Piper VITS en_US-lessac-medium ONNX Model

### Community 6 - "Community 6"
Cohesion: 1.0
Nodes (2): Motor Planning Design Principle, Hidden Grid Reservation for Motor Planning

### Community 7 - "Community 7"
Cohesion: 1.0
Nodes (2): currentCategory State (Folder Navigation), Folder-Based Navigation by React State

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (2): navigator.wakeLock API Integration, Screen Wake Lock API

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (2): Custom Pronunciation Override (pronounce field), Word Item Schema (text, pronounce, emoji, color, hidden)

### Community 10 - "Community 10"
Cohesion: 1.0
Nodes (1): navigator.vibrate Haptic API Integration

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (2): vite-plugin-pwa Configuration, PWA with Workbox Service Worker

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (2): Base Path /aac-system/, .github/workflows/deploy.yml

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (1): Progressive Disclosure Pattern

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (1): Pure JS/JSX (No TypeScript)

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (1): No Automated Test Framework

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (1): generate-audio.js Pre-generation Script

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (1): Vocabulary System

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (1): Modified Fitzgerald Key Color Coding

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (1): 42 Core Vocabulary Items

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (1): 6 Vocabulary Folders

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (1): 6 Category Subarrays

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (1): React Component Tree

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (1): App.jsx Root Component

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (1): Board.jsx Grid Component

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (1): WordCard.jsx Button Component

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (1): SplashScreen.jsx PWA Update Component

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (1): main.jsx Entry Point

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (1): Yes/No Fixed Bottom Bar

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (1): Landscape-First CSS Design

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (1): Hand-Written CSS (No Framework)

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (1): Deployment & CI/CD Infrastructure

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (1): Vite 7 Production Build

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (1): donate.html PayPal Donation Page

## Knowledge Gaps
- **57 isolated node(s):** `Motor Planning Design Principle`, `Progressive Disclosure Pattern`, `3-Layer Speech Fallback Architecture`, `Folder-Based Navigation by React State`, `Screen Wake Lock API` (+52 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 6`** (2 nodes): `Motor Planning Design Principle`, `Hidden Grid Reservation for Motor Planning`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (2 nodes): `currentCategory State (Folder Navigation)`, `Folder-Based Navigation by React State`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (2 nodes): `navigator.wakeLock API Integration`, `Screen Wake Lock API`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (2 nodes): `Custom Pronunciation Override (pronounce field)`, `Word Item Schema (text, pronounce, emoji, color, hidden)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 10`** (2 nodes): `navigator.vibrate Haptic API Integration`, `Haptic Feedback via navigator.vibrate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (2 nodes): `vite-plugin-pwa Configuration`, `PWA with Workbox Service Worker`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (2 nodes): `Base Path /aac-system/`, `.github/workflows/deploy.yml`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (1 nodes): `Progressive Disclosure Pattern`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (1 nodes): `Pure JS/JSX (No TypeScript)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (1 nodes): `No Automated Test Framework`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `generate-audio.js Pre-generation Script`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `Vocabulary System`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `Modified Fitzgerald Key Color Coding`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `42 Core Vocabulary Items`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `6 Vocabulary Folders`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `6 Category Subarrays`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `React Component Tree`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (1 nodes): `App.jsx Root Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `Board.jsx Grid Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `WordCard.jsx Button Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `SplashScreen.jsx PWA Update Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `main.jsx Entry Point`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `Yes/No Fixed Bottom Bar`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `Landscape-First CSS Design`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `Hand-Written CSS (No Framework)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `Deployment & CI/CD Infrastructure`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `Vite 7 Production Build`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `donate.html PayPal Donation Page`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GoTalk Visual Supports (SLP alignment)` connect `Community 0` to `Community 1`, `Community 4`, `Community 5`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `GoTalk Page System (launcher + 2-picture pages)` connect `Community 4` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `Project Overview Document` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `Motor Planning Design Principle`, `Progressive Disclosure Pattern`, `3-Layer Speech Fallback Architecture` to the rest of the system?**
  _57 weakly-connected nodes found - possible documentation gaps or missing edges._