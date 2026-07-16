# Graph Report - memory  (2026-07-16)

## Corpus Check
- Corpus is ~1,249 words - fits in a single context window. You may not need a graph.

## Summary
- 55 nodes · 26 edges · 32 communities detected
- Extraction: 50% EXTRACTED · 50% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.87)
- Token cost: 4,800 input · 5,400 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Speech Pipeline Implementation|Speech Pipeline Implementation]]
- [[_COMMUNITY_Memory Documentation Hub|Memory Documentation Hub]]
- [[_COMMUNITY_Kubernetes Deployment Stack|Kubernetes Deployment Stack]]
- [[_COMMUNITY_Folder Navigation Pattern|Folder Navigation Pattern]]
- [[_COMMUNITY_Wake Lock Integration|Wake Lock Integration]]
- [[_COMMUNITY_Haptic Feedback System|Haptic Feedback System]]
- [[_COMMUNITY_TTS Engine & Model|TTS Engine & Model]]
- [[_COMMUNITY_Motor Planning Design|Motor Planning Design]]
- [[_COMMUNITY_Vocabulary Pronunciation|Vocabulary Pronunciation]]
- [[_COMMUNITY_PWA Service Worker|PWA Service Worker]]
- [[_COMMUNITY_CICD Pipeline|CI/CD Pipeline]]
- [[_COMMUNITY_Progressive Disclosure|Progressive Disclosure]]
- [[_COMMUNITY_Language Choice (JS)|Language Choice (JS)]]
- [[_COMMUNITY_Testing Status|Testing Status]]
- [[_COMMUNITY_Audio Generation Scripts|Audio Generation Scripts]]
- [[_COMMUNITY_Vocabulary System Core|Vocabulary System Core]]
- [[_COMMUNITY_Fitzgerald Key Colors|Fitzgerald Key Colors]]
- [[_COMMUNITY_Core Vocabulary Items|Core Vocabulary Items]]
- [[_COMMUNITY_Vocabulary Folders|Vocabulary Folders]]
- [[_COMMUNITY_Vocabulary Categories|Vocabulary Categories]]
- [[_COMMUNITY_Component Architecture|Component Architecture]]
- [[_COMMUNITY_App Root Component|App Root Component]]
- [[_COMMUNITY_Board Grid Component|Board Grid Component]]
- [[_COMMUNITY_WordCard Button|WordCard Button]]
- [[_COMMUNITY_Splash Screen|Splash Screen]]
- [[_COMMUNITY_Entry Point|Entry Point]]
- [[_COMMUNITY_YesNo Bar|Yes/No Bar]]
- [[_COMMUNITY_Landscape Layout|Landscape Layout]]
- [[_COMMUNITY_CSS Strategy|CSS Strategy]]
- [[_COMMUNITY_Deployment Docs|Deployment Docs]]
- [[_COMMUNITY_Vite Build System|Vite Build System]]
- [[_COMMUNITY_Donation System|Donation System]]

## God Nodes (most connected - your core abstractions)
1. `Project Overview Document` - 4 edges
2. `Speech Synthesis Pipeline` - 4 edges
3. `Vocabulary System Document` - 3 edges
4. `Component Tree Document` - 3 edges
5. `Layer 1: Pre-generated WAV AudioBuffer Cache` - 3 edges
6. `Kubernetes Infrastructure (asd ns, 1 replica)` - 3 edges
7. `Speech Pipeline Document` - 2 edges
8. `Deployment & Infrastructure Document` - 2 edges
9. `Layer 2: TTS HTTP Server Fallback` - 2 edges
10. `Multi-Stage Dockerfile (node:22 → nginx)` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Motor Planning Design Principle` --conceptually_related_to--> `Hidden Grid Reservation for Motor Planning`  [INFERRED]
  memory/project-overview.md → memory/vocabulary-system.md
- `3-Layer Speech Fallback Architecture` --conceptually_related_to--> `Speech Synthesis Pipeline`  [INFERRED]
  memory/project-overview.md → memory/speech-pipeline.md
- `Folder-Based Navigation by React State` --conceptually_related_to--> `currentCategory State (Folder Navigation)`  [INFERRED]
  memory/project-overview.md → memory/component-tree.md
- `Screen Wake Lock API` --conceptually_related_to--> `navigator.wakeLock API Integration`  [INFERRED]
  memory/project-overview.md → memory/component-tree.md
- `Sherpa-ONNX + Piper VITS TTS Engine` --conceptually_related_to--> `Piper VITS en_US-lessac-medium ONNX Model`  [INFERRED]
  memory/project-overview.md → memory/speech-pipeline.md

## Hyperedges (group relationships)
- **Three-Layer Speech Fallback Chain** — speech-pipeline_layer1-wav, speech-pipeline_layer2-tts, speech-pipeline_layer3-browser [EXTRACTED 1.00]
- **Kubernetes Container Deployment Stack** — deployment_k8s-infra, deployment_dockerfile, deployment_nginx-config, deployment_cert-manager [EXTRACTED 1.00]

## Communities

### Community 0 - "Speech Pipeline Implementation"
Cohesion: 0.25
Nodes (8): 3-Layer Speech Fallback Architecture, fix-onset.mjs Quiet Onset Boost, Layer 1: Pre-generated WAV AudioBuffer Cache, Layer 2: TTS HTTP Server Fallback, Layer 3: Browser SpeechSynthesis API Fallback, pad-audio.mjs 150ms Silence Padding, Speech Synthesis Pipeline, tts-server.js TTS HTTP Server (Port 5050)

### Community 1 - "Memory Documentation Hub"
Cohesion: 0.7
Nodes (5): Component Tree Document, Deployment & Infrastructure Document, Project Overview Document, Speech Pipeline Document, Vocabulary System Document

### Community 2 - "Kubernetes Deployment Stack"
Cohesion: 0.4
Nodes (5): cert-manager + Let's Encrypt TLS, Multi-Stage Dockerfile (node:22 → nginx), Kubernetes Infrastructure (asd ns, 1 replica), nginx SPA Fallback + Asset Cache, Docker + nginx + Kubernetes Infrastructure

### Community 3 - "Folder Navigation Pattern"
Cohesion: 1.0
Nodes (2): currentCategory State (Folder Navigation), Folder-Based Navigation by React State

### Community 4 - "Wake Lock Integration"
Cohesion: 1.0
Nodes (2): navigator.wakeLock API Integration, Screen Wake Lock API

### Community 5 - "Haptic Feedback System"
Cohesion: 1.0
Nodes (1): navigator.vibrate Haptic API Integration

### Community 6 - "TTS Engine & Model"
Cohesion: 1.0
Nodes (2): Sherpa-ONNX + Piper VITS TTS Engine, Piper VITS en_US-lessac-medium ONNX Model

### Community 7 - "Motor Planning Design"
Cohesion: 1.0
Nodes (2): Motor Planning Design Principle, Hidden Grid Reservation for Motor Planning

### Community 8 - "Vocabulary Pronunciation"
Cohesion: 1.0
Nodes (2): Custom Pronunciation Override (pronounce field), Word Item Schema (text, pronounce, emoji, color, hidden)

### Community 9 - "PWA Service Worker"
Cohesion: 1.0
Nodes (2): vite-plugin-pwa Configuration, PWA with Workbox Service Worker

### Community 10 - "CI/CD Pipeline"
Cohesion: 1.0
Nodes (2): Base Path /aac-system/, .github/workflows/deploy.yml

### Community 11 - "Progressive Disclosure"
Cohesion: 1.0
Nodes (1): Progressive Disclosure Pattern

### Community 12 - "Language Choice (JS)"
Cohesion: 1.0
Nodes (1): Pure JS/JSX (No TypeScript)

### Community 13 - "Testing Status"
Cohesion: 1.0
Nodes (1): No Automated Test Framework

### Community 14 - "Audio Generation Scripts"
Cohesion: 1.0
Nodes (1): generate-audio.js Pre-generation Script

### Community 15 - "Vocabulary System Core"
Cohesion: 1.0
Nodes (1): Vocabulary System

### Community 16 - "Fitzgerald Key Colors"
Cohesion: 1.0
Nodes (1): Modified Fitzgerald Key Color Coding

### Community 17 - "Core Vocabulary Items"
Cohesion: 1.0
Nodes (1): 42 Core Vocabulary Items

### Community 18 - "Vocabulary Folders"
Cohesion: 1.0
Nodes (1): 6 Vocabulary Folders

### Community 19 - "Vocabulary Categories"
Cohesion: 1.0
Nodes (1): 6 Category Subarrays

### Community 20 - "Component Architecture"
Cohesion: 1.0
Nodes (1): React Component Tree

### Community 21 - "App Root Component"
Cohesion: 1.0
Nodes (1): App.jsx Root Component

### Community 22 - "Board Grid Component"
Cohesion: 1.0
Nodes (1): Board.jsx Grid Component

### Community 23 - "WordCard Button"
Cohesion: 1.0
Nodes (1): WordCard.jsx Button Component

### Community 24 - "Splash Screen"
Cohesion: 1.0
Nodes (1): SplashScreen.jsx PWA Update Component

### Community 25 - "Entry Point"
Cohesion: 1.0
Nodes (1): main.jsx Entry Point

### Community 26 - "Yes/No Bar"
Cohesion: 1.0
Nodes (1): Yes/No Fixed Bottom Bar

### Community 27 - "Landscape Layout"
Cohesion: 1.0
Nodes (1): Landscape-First CSS Design

### Community 28 - "CSS Strategy"
Cohesion: 1.0
Nodes (1): Hand-Written CSS (No Framework)

### Community 29 - "Deployment Docs"
Cohesion: 1.0
Nodes (1): Deployment & CI/CD Infrastructure

### Community 30 - "Vite Build System"
Cohesion: 1.0
Nodes (1): Vite 7 Production Build

### Community 31 - "Donation System"
Cohesion: 1.0
Nodes (1): donate.html PayPal Donation Page

## Knowledge Gaps
- **44 isolated node(s):** `Motor Planning Design Principle`, `Progressive Disclosure Pattern`, `3-Layer Speech Fallback Architecture`, `Folder-Based Navigation by React State`, `Screen Wake Lock API` (+39 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Folder Navigation Pattern`** (2 nodes): `currentCategory State (Folder Navigation)`, `Folder-Based Navigation by React State`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Wake Lock Integration`** (2 nodes): `navigator.wakeLock API Integration`, `Screen Wake Lock API`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Haptic Feedback System`** (2 nodes): `navigator.vibrate Haptic API Integration`, `Haptic Feedback via navigator.vibrate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `TTS Engine & Model`** (2 nodes): `Sherpa-ONNX + Piper VITS TTS Engine`, `Piper VITS en_US-lessac-medium ONNX Model`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Motor Planning Design`** (2 nodes): `Motor Planning Design Principle`, `Hidden Grid Reservation for Motor Planning`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vocabulary Pronunciation`** (2 nodes): `Custom Pronunciation Override (pronounce field)`, `Word Item Schema (text, pronounce, emoji, color, hidden)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PWA Service Worker`** (2 nodes): `vite-plugin-pwa Configuration`, `PWA with Workbox Service Worker`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CI/CD Pipeline`** (2 nodes): `Base Path /aac-system/`, `.github/workflows/deploy.yml`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Progressive Disclosure`** (1 nodes): `Progressive Disclosure Pattern`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Language Choice (JS)`** (1 nodes): `Pure JS/JSX (No TypeScript)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Testing Status`** (1 nodes): `No Automated Test Framework`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Audio Generation Scripts`** (1 nodes): `generate-audio.js Pre-generation Script`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vocabulary System Core`** (1 nodes): `Vocabulary System`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Fitzgerald Key Colors`** (1 nodes): `Modified Fitzgerald Key Color Coding`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Core Vocabulary Items`** (1 nodes): `42 Core Vocabulary Items`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vocabulary Folders`** (1 nodes): `6 Vocabulary Folders`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vocabulary Categories`** (1 nodes): `6 Category Subarrays`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Component Architecture`** (1 nodes): `React Component Tree`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Root Component`** (1 nodes): `App.jsx Root Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Board Grid Component`** (1 nodes): `Board.jsx Grid Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `WordCard Button`** (1 nodes): `WordCard.jsx Button Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Splash Screen`** (1 nodes): `SplashScreen.jsx PWA Update Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Entry Point`** (1 nodes): `main.jsx Entry Point`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Yes/No Bar`** (1 nodes): `Yes/No Fixed Bottom Bar`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Landscape Layout`** (1 nodes): `Landscape-First CSS Design`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CSS Strategy`** (1 nodes): `Hand-Written CSS (No Framework)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Deployment Docs`** (1 nodes): `Deployment & CI/CD Infrastructure`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Build System`** (1 nodes): `Vite 7 Production Build`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Donation System`** (1 nodes): `donate.html PayPal Donation Page`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Are the 2 inferred relationships involving `Layer 1: Pre-generated WAV AudioBuffer Cache` (e.g. with `pad-audio.mjs 150ms Silence Padding` and `fix-onset.mjs Quiet Onset Boost`) actually correct?**
  _`Layer 1: Pre-generated WAV AudioBuffer Cache` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Motor Planning Design Principle`, `Progressive Disclosure Pattern`, `3-Layer Speech Fallback Architecture` to the rest of the system?**
  _44 weakly-connected nodes found - possible documentation gaps or missing edges._