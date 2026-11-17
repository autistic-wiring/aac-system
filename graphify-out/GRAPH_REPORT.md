# Graph Report - memory  (2026-11-12, incremental host-agent refresh)

## Corpus Check
- Corpus is ~7,208 words - fits in a single context window. You may not need a graph.

## Summary
- 75 nodes · 104 edges · 7 communities (6 shown, 1 thin omitted)
- Extraction: 88% EXTRACTED · 12% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Deployment and Kiosk
- GoTalk Copy Guide
- Button Animation Pipeline
- Vocabulary and Architecture
- Speech and Voice System
- Component Tree and Tap Handling
- Memory Index

## God Nodes (most connected - your core abstractions)
1. `AAC Deployment and SDLC` - 14 edges
2. `AAC Vocabulary System` - 14 edges
3. `AAC Component Tree` - 12 edges
4. `GoTalk NOW Copy Guide` - 11 edges
5. `TTS Voice System` - 11 edges
6. `Memory Index` - 10 edges
7. `AAC Kiosk Mode` - 9 edges
8. `AAC System Project Overview` - 9 edges
9. `AAC Speech Pipeline` - 9 edges
10. `Veo Button Animation Notes` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Pending Speech Queue on Gesture Unlock` --semantically_similar_to--> `Express Mode Speak and Queue Flow`  [INFERRED] [semantically similar]
  speech-pipeline.md → component-tree.md
- `Peepee WAV iteration: re-record clean take over patching artifacts` --semantically_similar_to--> `Whisper STT Verification Ground Truth`  [INFERRED] [semantically similar]
  speech-pipeline.md → tts-voice-system.md
- `Viewport Cap Fix for Bottom Bar Clipping` --semantically_similar_to--> `useKiosk Fullscreen Lockdown Hook`  [INFERRED] [semantically similar]
  component-tree.md → kiosk-mode.md
- `Preloaded AudioBuffers with Detune and Gain` --semantically_similar_to--> `Three Layer Speech Fallback`  [INFERRED] [semantically similar]
  tts-voice-system.md → speech-pipeline.md
- `Washroom Card Speaking Pee Pee` --semantically_similar_to--> `Pronounce Field TTS Override`  [INFERRED] [semantically similar]
  vocabulary-system.md → speech-pipeline.md

## Hyperedges (group relationships)
- **Board tap-to-speech flow** — speech_pipeline_three_layer_fallback, speech_pipeline_pending_speech_queue, component_tree_express_speak_flow, vocabulary_system_goto_navigation [EXTRACTED 1.00]
- **Washroom card says pee pee** — vocabulary_system_washroom_card, speech_pipeline_pronounce_override, gotalk_copy_guide_label_speech_mismatch, speech_pipeline_peepee_wav_iteration [EXTRACTED 1.00]
- **Release safety nets** — deployment_tag_conflict_autobump, deployment_disaster_recovery, deployment_image_tags [EXTRACTED 1.00]

## Communities (7 total, 1 thin omitted)

### Community 0 - "Deployment and Kiosk"
Cohesion: 0.13
Nodes (16): Android Shell Built and Installed by Hand, Self-hosted CI Runner without GitHub Secrets, Immutable Tags as Rollback Targets, AAC Deployment and SDLC, Mutable Testing Stable and Immutable Release Tags, K8s Manifests with Tiny CPU Requests, Feature Branch to Testing to Prod SDLC, Testing and Prod Environments, Bundled Offline Board Fallback in APK, WebViewAssetLoader Local HTTPS Origin, BottomBar Battery Gauge via NativeBridge.getBattery (+5 more)

### Community 1 - "GoTalk Copy Guide"
Cohesion: 0.17
Nodes (12): Wireless ADB Pair Versus Connect Ports, BottomBar Page Order App Wiring, GoTalk NOW Copy Guide, Card Label Versus Spoken Phrase Mismatch, Coordinate Tap Screenshot Page Capture, Unity Bundle Artwork Extraction, GoTalk Card Colors and Asset Spec, Pad Audio and Fix Onset Processing Scripts (+4 more)

### Community 2 - "Button Animation Pipeline"
Cohesion: 0.22
Nodes (9): Border Flood Near White Transparency Mask, Animate AAC Board Buttons Guide, Veo to Transparent WebP to Board Workflow, Alpha Coverage and Pixel Delta Verification, Memory Index, Veo Button Animation Notes, Transparent Animated WebP Pipeline, Veo 3.1 Full Versus Fast Hands Quality (+1 more)

### Community 3 - "Vocabulary and Architecture"
Cohesion: 0.20
Nodes (11): AAC System Project Overview, Motor Planning First Architecture, No Test Framework Present, Fully Offline First Operation, React Vite Sherpa ONNX PWA Stack, Eat Drink Place Play Page Wiring, AAC Vocabulary System, Modified Fitzgerald Key Color Coding (+3 more)

### Community 4 - "Speech and Voice System"
Cohesion: 0.25
Nodes (7): Three Layer Speech Fallback, Preloaded AudioBuffers with Detune and Gain, TTS Voice System, gTTS Human Speech Voice, Piper Alternate Set as Comparison Only, Voice Picker Lab, Whisper STT Verification Ground Truth

### Community 5 - "Component Tree and Tap Handling"
Cohesion: 0.25
Nodes (9): Pure useState Navigation Without Router, AAC Component Tree, Express Mode Speak and Queue Flow, Haptic Feedback Vibration Patterns, Splash Screen PWA Update Check, Viewport Cap Fix for Bottom Bar Clipping, Instant Pointerdown Triggers, BottomBar Battery Gauge with Padlock Fallback, Inline SVG Lock Icon Replacing Tofu Glyph

## Knowledge Gaps
- **33 isolated node(s):** `Modified Fitzgerald Key Color Coding`, `Goto Folder Navigation`, `Voice Picker Lab`, `Self-hosted CI Runner without GitHub Secrets`, `Unity Bundle Artwork Extraction` (+28 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 40 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AAC Deployment and SDLC` connect `Deployment and Kiosk` to `GoTalk Copy Guide`, `Button Animation Pipeline`, `Vocabulary and Architecture`, `Speech and Voice System`, `Component Tree and Tap Handling`?**
  _High betweenness centrality (0.286) - this node is a cross-community bridge._
- **What connects `Modified Fitzgerald Key Color Coding`, `Goto Folder Navigation`, `Voice Picker Lab` to the rest of the system?**
  _31 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Deployment and Kiosk` be split into smaller, more focused modules?**
  _Cohesion score 0.1323529411764706 - nodes in this community are weakly interconnected._
- **Why does `AAC Vocabulary System` connect `Vocabulary and Architecture` to `GoTalk Copy Guide`, `Button Animation Pipeline`, `Speech and Voice System`, `Component Tree and Tap Handling`?**
  _High betweenness centrality (0.249) - this node is a cross-community bridge._
- **Why does `Memory Index` connect `Button Animation Pipeline` to `Deployment and Kiosk`, `GoTalk Copy Guide`, `Vocabulary and Architecture`, `Speech and Voice System`, `Component Tree and Tap Handling`?**
  _High betweenness centrality (0.227) - this node is a cross-community bridge._