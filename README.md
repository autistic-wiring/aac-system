# 🧩 AAC System — Open-Source Motor Planning AAC

<p align="center">
  <strong>EMPOWERING COMMUNICATION FOR EVERYONE!</strong>
</p>

<p align="center">
  <a href="https://github.com/autistic-wiring/aac-system/actions"><img src="https://img.shields.io/github/actions/workflow/status/autistic-wiring/aac-system/docker-image.yml?branch=main&style=for-the-badge" alt="CI status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
  <a href="https://www.buymeacoffee.com/autisticwiring"><img src="https://img.shields.io/badge/Support-Buy%20Me%20A%20Coffee-orange?style=for-the-badge&logo=buy-me-a-coffee" alt="Buy Me A Coffee"></a>
</p>

**AAC System** is an open-source Augmentative and Alternative Communication (AAC) web application designed with a focus on motor planning and immediate accessibility. 

Built specifically to be responsive, fast, and feature offline Text-to-Speech (TTS) capabilities — so it always works, even without an internet connection. The system is designed to grow with the user, slowly expanding its vocabulary.

[GitHub](https://github.com/autistic-wiring/aac-system) · [Support Us](#-support-us-non-profit)

---

## ❤️ Support Us (Non-Profit)

We are a non-profit initiative dedicated to providing free, high-quality AAC systems for individuals who are non-verbal. We do not charge for this software.

However, if you'd like to support the ongoing development, server costs, and time required to keep the project alive, we graciously accept donations. Every bit helps us build a better tool for those who need it most!

<a href="https://www.buymeacoffee.com/autisticwiring" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

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

The repository includes a ready-to-use Dockerfile and K8s configuration (`k8s/deployment.yaml`).

1. **Build image**:
   ```bash
   docker build -t your-registry/aac-board:latest .
   ```
2. **Push image**:
   ```bash
   docker push your-registry/aac-board:latest
   ```
3. **Deploy (Kubernetes)**:
   ```bash
   kubectl apply -f k8s/deployment.yaml
   ```

## ⚙️ Customization

Customize vocabulary in `src/data/defaultVocabulary.js`:

- `hidden: true` — Hides the button but retains its physical space in the grid (critical for motor planning).
- `pronounce: '...'` — Overrides TTS pronunciation for words that the engine struggles to say naturally (e.g., `'stopp'`).
