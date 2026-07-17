# 🧩 AAC System — Open-Source Motor Planning AAC

<p align="center">
  <strong>EMPOWERING COMMUNICATION FOR EVERYONE!</strong>
</p>

<p align="center">
  <a href="https://github.com/autistic-wiring/aac-system/actions"><img src="https://img.shields.io/github/actions/workflow/status/autistic-wiring/aac-system/docker-image.yml?branch=main&style=for-the-badge" alt="CI status"></a>
  <a href="https://autistic-wiring.github.io/aac-system/"><img src="https://img.shields.io/badge/Live%20Demo-Visit%20Site-green?style=for-the-badge&logo=github" alt="Live Demo"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
  <a href="https://autistic-wiring.github.io/aac-system/donate.html"><img src="https://img.shields.io/badge/Support-Buy%20Me%20A%20Coffee-orange?style=for-the-badge&logo=buy-me-a-coffee" alt="Buy Me A Coffee"></a>
</p>

**AAC System** is an open-source Augmentative and Alternative Communication (AAC) web application designed with a focus on motor planning and immediate accessibility. 

Built specifically to be responsive, fast, and feature offline Text-to-Speech (TTS) capabilities — so it always works, even without an internet connection. The system is designed to grow with the user, slowly expanding its vocabulary.

[GitHub](https://github.com/autistic-wiring/aac-system) · [Live Demo](https://autistic-wiring.github.io/aac-system/) · [Support Us](#-support-us-non-profit)

---

## ❤️ Support Us (Non-Profit)

We are a non-profit initiative dedicated to providing free, high-quality AAC systems for individuals who are non-verbal. We do not charge for this software.

However, if you'd like to support the ongoing development, server costs, and time required to keep the project alive, we graciously accept donations. Every bit helps us build a better tool for those who need it most!

<a href="https://autistic-wiring.github.io/aac-system/donate.html" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

<a href="https://autistic-wiring.github.io/aac-system/donate.html" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="Donate with PayPal" style="height: 60px !important;width: 217px !important;"></a>

## ✨ Highlights

- **Motor Planning Optimized** — Vocabulary items remain in consistent locations over time. Unused or upcoming buttons are hidden invisibly to build spatial and motor memory safely.
- **Offline Text-to-Speech** — Uses local Offline TTS (Sherpa-ONNX with Piper models). Pre-generated audio files ensure flawless operation offline, falling back to browser `SpeechSynthesis` if needed.
- **Progressive Language** — Start with core vocabulary (Go, Stop, Want, Need, Eat, Drink, More, Yes, No) and progressively introduce new folders.
- **Responsive Grid** — A dense, adaptable UI designed for tablets and mobile devices alike.
- **Modified Fitzgerald Key** — Color-coding system for rapid visual scanning and word category identification.
- **Haptic Feedback** — Distinguishes between navigating folders and triggering speech using precise mobile vibration patterns.

## 🚀 Quick start (Local Development)

Runtime: **Node ≥18**.

```bash
git clone https://github.com/autistic-wiring/aac-system.git
cd aac-system

npm install

# Generate offline audio files for TTS
node scripts/generate-audio.js

# Start the frontend app
npm run dev

# Start the live fallback TTS server (Optional)
node tts-server.js
```

## 🐳 Deployment (Docker & K8s)

The repository includes a ready-to-use Dockerfile and K8s configuration (`k8s/`).

### SDLC

Two environments, fully automated on push:

| Env     | URL                                  | Trigger                        | Image tag    |
|---------|--------------------------------------|--------------------------------|--------------|
| Testing | https://aac-testing.nexvision.cc     | push to any non-main branch    | `:testing`   |
| Prod    | https://aac.nexvision.cc             | push to `main` (PR merge)      | `:stable`    |

```
  feature branch
      │  git push
      ▼
  [auto] CI builds :testing + :sha-<short> + :branch-<slug>
         deploys to aac-testing.nexvision.cc
      │  smoke-test, open PR, review
      ▼
  merge PR to main
      │
      ▼
  [auto] CI builds :stable + :sha-<short> + :vX.Y.Z
         git-tags the release, deploys to aac.nexvision.cc
```

Every prod release is a git tag (`vX.Y.Z`) and an immutable image tag, so rollback is one command:

```bash
./scripts/deploy.sh rollback v1.0.0     # repoints prod at the previous release
```

### Local deploy / hotfix

If GitHub Actions is down or you need to deploy a hotfix manually:

```bash
./scripts/deploy.sh testing             # build HEAD, deploy to testing
./scripts/deploy.sh prod                # build HEAD, tag vX.Y.Z, deploy to prod
./scripts/deploy.sh status              # show testing/prod versions + recent tags
```

### CI runner access

The self-hosted runner (in cluster namespace `openclaw`) mounts a kubeconfig
from a Kubernetes Secret — no GitHub Secrets involved. RBAC is scoped to a
dedicated `aac-deployer` ServiceAccount with rights only on `asd` namespace
resources for this repo. See [`k8s/ci-runner/`](k8s/ci-runner) for manifests.

### Manual build

```bash
docker build -t registry.nexvision.cc/nexvisioncc/aac-board:latest .
docker push registry.nexvision.cc/nexvisioncc/aac-board:latest
kubectl apply -f k8s/
```

## ⚙️ Customization

Customize vocabulary in `src/data/defaultVocabulary.js`:

- `hidden: true` — Hides the button but retains its physical space in the grid (critical for motor planning).
- `pronounce: '...'` — Overrides TTS pronunciation for words that the engine struggles to say naturally (e.g., `'stopp'`).
