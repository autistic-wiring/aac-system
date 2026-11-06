# Graph Report - memory  (2026-11-06)

## Corpus Check
- Corpus is ~6,949 words - fits in a single context window. You may not need a graph.

## Summary
- 50 nodes · 47 edges · 17 communities (7 shown, 10 thin omitted)
- Extraction: 77% EXTRACTED · 23% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.88)
- Token cost: 6,949 input · 0 output

## Community Hubs (Navigation)
- Voice And Vocabulary Core
- Kiosk Shell And Power
- Button Animation Pipeline
- App Component Set
- System Overview Map
- Speech Fallback Chain
- Deploy And Data Lessons
- Press Replay Wiring
- Transparent WebP Conversion
- CI Runner Setup
- Image Tag Scheme
- Unity Artwork Extraction
- Device Verification Method
- Whisper Verification Method
- Animation Wiring Gotchas
- Fitzgerald Color Coding
- Motor Planning Principle

## God Nodes (most connected - your core abstractions)
1. `Memory Index` - 8 edges
2. `Speech Adapter` - 6 edges
3. `WordCard` - 5 edges
4. `AAC System` - 5 edges
5. `Button Animation Workflow` - 5 edges
6. `Word Item Schema` - 5 edges
7. `App` - 4 edges
8. `Speech Adapter` - 4 edges
9. `Veo Generation` - 4 edges
10. `App` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Button Animation Workflow` --semantically_similar_to--> `Transparent WebP Switch`  [INFERRED] [semantically similar]
  animating-buttons.md → veo-button-animation.md
- `WordCard` --conceptually_related_to--> `Speech Adapter`  [INFERRED]
  component-tree.md → speech-pipeline.md
- `Memory Index` --references--> `Kiosk Mode Layers`  [EXTRACTED]
  MEMORY.md → kiosk-mode.md
- `Charging Aware Idle Dim` --conceptually_related_to--> `App`  [INFERRED]
  kiosk-mode.md → component-tree.md
- `Button Animation Workflow` --conceptually_related_to--> `WordCard`  [INFERRED]
  animating-buttons.md → component-tree.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Core Architecture Components** — component-tree_md_app, component-tree_md_board, component-tree_md_wordcard, component-tree_md_splashscreen, component-tree_md_navigation-bar [EXTRACTED 1.00]
- **AAC System Architecture** — project_overview_md_aac_system, project_overview_md_speech_pipeline, project_overview_md_vocabulary_system, project_overview_md_component_tree, project_overview_md_deployment [EXTRACTED 1.00]
- **3-Layer Speech Fallback Chain** — speech-pipeline_md_pre-generated-wav, speech-pipeline_md_tts-server, speech-pipeline_md_browser-speechsynthesis [EXTRACTED 1.00]
- **Speech Pipeline Fallback Chain** — speech_pipeline_md_pre_generated_wav, speech_pipeline_md_tts_server, speech_pipeline_md_browser_speech_synthesis [EXTRACTED 1.00]
- **Voice pipeline: gTTS board voice, Piper set, lab, pre-generated WAV** — tts_voice_system_gtts_voice, tts_voice_system_piper_regression, tts_voice_system_voice_lab, tts_voice_system_whisper_verification, speech-pipeline_md_pre-generated-wav [INFERRED 0.85]
- **Button animation: Veo generation, transparent WebP, board wiring** — veo_button_animation_generation, veo_button_animation_transparent_webp, veo_button_animation_wiring, animating_buttons_workflow, animating_buttons_transparent_webp [INFERRED 0.85]

## Communities (17 total, 10 thin omitted)

### Community 0 - "Voice And Vocabulary Core"
Cohesion: 0.25
Nodes (9): GoTalk Extraction Workflow, Memory Index, Browser SpeechSynthesis, Gesture Unlock, Pre-generated WAV, Speech Adapter, gTTS Board Voice, Voice Picker Lab (+1 more)

### Community 1 - "Kiosk Shell And Power"
Cohesion: 0.29
Nodes (7): App, Board, Navigation Bar, SplashScreen, Android Kiosk Shell, Charging Aware Idle Dim, Kiosk Mode Layers

### Community 2 - "Button Animation Pipeline"
Cohesion: 0.70
Nodes (5): Button Animation Workflow, WordCard, Veo Generation, Transparent WebP Switch, Word Item Schema

### Community 3 - "App Component Set"
Cohesion: 0.40
Nodes (5): App, Board, Navigation Bar, SplashScreen, WordCard

### Community 4 - "System Overview Map"
Cohesion: 0.40
Nodes (5): AAC System, Component Tree, Deployment, Speech Pipeline, Vocabulary System

### Community 5 - "Speech Fallback Chain"
Cohesion: 0.40
Nodes (5): Browser SpeechSynthesis, Gesture Unlock, Pre-generated WAV, Speech Adapter, TTS Server

### Community 6 - "Deploy And Data Lessons"
Cohesion: 0.50
Nodes (4): Test Before Prod Pipeline, GoTalk App Wiring, TTS Server, Piper Overwrite Lesson

## Knowledge Gaps
- **27 isolated node(s):** `SplashScreen`, `Navigation Bar`, `SplashScreen`, `WordCard`, `Navigation Bar` (+22 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 27 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Memory Index` connect `Voice And Vocabulary Core` to `Kiosk Shell And Power`, `Button Animation Pipeline`, `System Overview Map`, `Deploy And Data Lessons`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `WordCard` (e.g. with `Button Animation Workflow` and `Speech Adapter`) actually correct?**
  _`WordCard` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `SplashScreen`, `Navigation Bar`, `SplashScreen` to the rest of the system?**
  _27 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Why does `AAC System` connect `System Overview Map` to `Voice And Vocabulary Core`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Button Animation Workflow` (e.g. with `WordCard` and `Veo Generation`) actually correct?**
  _`Button Animation Workflow` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Why does `WordCard` connect `Button Animation Pipeline` to `Voice And Vocabulary Core`, `Kiosk Shell And Power`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._