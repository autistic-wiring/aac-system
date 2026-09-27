# Graph Report - .  (2026-07-17)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 28 nodes · 28 edges · 5 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1e91a84b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Default Vocabulary
- Prod Environment
- AAC System
- Speech Adapter
- App

## God Nodes (most connected - your core abstractions)
1. `Speech Adapter` - 5 edges
2. `Default Vocabulary` - 5 edges
3. `App` - 4 edges
4. `Board` - 4 edges
5. `AAC System` - 4 edges
6. `WordCard` - 3 edges
7. `Prod Environment` - 3 edges
8. `Testing Environment` - 3 edges
9. `CI Workflow` - 2 edges
10. `Deploy Script` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Default Vocabulary` --references--> `Speech Adapter`  [EXTRACTED]
  vocabulary-system.md → speech-pipeline.md
- `PWA Config` --references--> `App`  [EXTRACTED]
  deployment.md → component-tree.md
- `Donation Page` --references--> `Board`  [EXTRACTED]
  deployment.md → component-tree.md
- `Default Vocabulary` --references--> `Board`  [EXTRACTED]
  vocabulary-system.md → component-tree.md
- `Animation Video` --references--> `WordCard`  [EXTRACTED]
  veo-button-animation.md → component-tree.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **AAC System Architecture** — project_overview_md_aac_system, project_overview_md_speech_pipeline, project_overview_md_vocabulary_system, project_overview_md_component_tree, project_overview_md_deployment [EXTRACTED 1.00]
- **Speech Pipeline Fallback Chain** — speech_pipeline_md_pre_generated_wav, speech_pipeline_md_tts_server, speech_pipeline_md_browser_speech_synthesis [EXTRACTED 1.00]
- **Deployment Pipeline** — deployment_md_ci_workflow, deployment_md_deploy_script, deployment_md_prod_environment, deployment_md_testing_environment, deployment_md_k8s_manifests [EXTRACTED 1.00]

## Communities (5 total, 0 thin omitted)

### Community 0 - "Default Vocabulary"
Cohesion: 0.25
Nodes (9): Board, WordCard, Donation Page, Animation Script, Animation Video, Veo Model, Default Vocabulary, Fitzgerald Key (+1 more)

### Community 1 - "Prod Environment"
Cohesion: 0.60
Nodes (5): CI Workflow, Deploy Script, K8s Manifests, Prod Environment, Testing Environment

### Community 2 - "AAC System"
Cohesion: 0.40
Nodes (5): AAC System, Component Tree, Deployment, Speech Pipeline, Vocabulary System

### Community 3 - "Speech Adapter"
Cohesion: 0.40
Nodes (5): Browser SpeechSynthesis, Gesture Unlock, Pre-generated WAV, Speech Adapter, TTS Server

### Community 4 - "App"
Cohesion: 0.50
Nodes (4): App, Navigation Bar, SplashScreen, PWA Config

## Knowledge Gaps
- **15 isolated node(s):** `SplashScreen`, `Navigation Bar`, `PWA Config`, `Donation Page`, `Speech Pipeline` (+10 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Default Vocabulary` connect `Default Vocabulary` to `Speech Adapter`?**
  _High betweenness centrality (0.231) - this node is a cross-community bridge._
- **Why does `Board` connect `Default Vocabulary` to `App`?**
  _High betweenness centrality (0.182) - this node is a cross-community bridge._
- **Why does `Speech Adapter` connect `Speech Adapter` to `Default Vocabulary`?**
  _High betweenness centrality (0.165) - this node is a cross-community bridge._
- **What connects `SplashScreen`, `Navigation Bar`, `PWA Config` to the rest of the system?**
  _15 weakly-connected nodes found - possible documentation gaps or missing edges._