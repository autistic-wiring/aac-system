# AAC System

An open-source Augmentative and Alternative Communication (AAC) web application designed with a focus on motor planning and immediate accessibility. Built specifically to be responsive, fast, and feature offline Text-to-Speech (TTS) capabilities.

## Features

* **Motor Planning Optimized**: Vocabulary items are placed in consistent locations to build motor memory, with unused items hidden invisibly to maintain the grid structure.
* **Progressive Language**: Start with core vocabulary (Go, Stop, Want, Need, Eat, Drink, More) and slowly introduce new folders and fringe vocabulary.
* **Offline Text-to-Speech**: Uses a local offline TTS engine (Sherpa-ONNX with Piper models) pre-generating audio files to ensure the app works flawlessly without an internet connection, falling back to browser `SpeechSynthesis` if needed.
* **Responsive Grid**: A denser, responsive UI designed to work well on tablet-sized and mobile screens alike.
* **Visual Clarity**: Employs the Modified Fitzgerald Key color-coding system to aid in visual scanning and rapid word identification.
* **Haptic Feedback**: Differentiates between folders and speech buttons using subtle vibration patterns (on supported mobile devices).

## Tech Stack

* **Frontend**: React, Vite
* **Styling**: CSS
* **Text-to-Speech**: Sherpa-ONNX (WASM/Node.js) with `en_US-lessac-medium` Piper model
* **Deployment**: Docker, Kubernetes

## Setup & Installation

### Prerequisites

* Node.js (v18 or newer recommended)
* npm

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/autistic-wiring/aac-system.git
   cd aac-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Generate offline audio files (for TTS)**:
   This will generate static `.wav` files based on the defined vocabulary.
   ```bash
   node scripts/generate-audio.js
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Start the live fallback TTS server (Optional)**:
   ```bash
   node tts-server.js
   ```

## Deployment

The application includes a `Dockerfile` and Kubernetes deployment configurations (`k8s/deployment.yaml`) for containerized deployment.

1. **Build the Docker image**:
   ```bash
   docker build -t your-registry/aac-board:latest .
   ```

2. **Push to registry**:
   ```bash
   docker push your-registry/aac-board:latest
   ```

3. **Deploy to Kubernetes**:
   ```bash
   kubectl apply -f k8s/deployment.yaml
   ```

## Project Structure

* `src/components/`: React components (e.g., `WordCard`, `Board`)
* `src/data/`: Vocabulary definitions (`defaultVocabulary.js`)
* `src/utils/`: Utility scripts including the `speechAdapter`
* `scripts/`: Build tools (e.g., audio generation)
* `public/audio/`: Generated offline audio files used by the UI
* `tts-models/`: Downloaded Piper text-to-speech models

## Customizing Vocabulary

You can easily customize the available vocabulary by editing `src/data/defaultVocabulary.js`. 
* **Hiding Buttons**: To hide a button while preserving its space in the grid (crucial for motor planning), add `hidden: true` to its object.
* **Custom Pronunciation**: The system supports defining custom pronunciations per word to fix TTS quirks by adding a `pronounce: '...'` field.

## License

This project is open-source. Please see the `LICENSE` file for details if provided.
