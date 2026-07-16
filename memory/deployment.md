---
title: "AAC Deployment & Infrastructure"
date_modified: 2026-07-16
tags: [deployment, docker, kubernetes, github-pages, pwa, ci]
---

# Deployment & Infrastructure

## Build

- **Tool:** Vite 7 with `@vitejs/plugin-react`
- **PWA:** `vite-plugin-pwa` with Workbox
- **Base path:** `/aac-system/` (for GitHub Pages)
- **Global:** `__APP_VERSION__` injected at build time via `vite.config.js`

## Targets

### GitHub Pages
- CI: `.github/workflows/deploy.yml`
- Trigger: push to `main` + manual dispatch
- Runner: self-hosted in k8s namespace `asd`
- Deploys `dist/` via `actions/deploy-pages@v4`

### Docker + Kubernetes
- **Dockerfile:** multi-stage — `node:22-alpine` build, `nginx:alpine` runtime
- **nginx:** SPA fallback routing, `gzip_static`, 1-year immutable asset cache, no-cache for SW/manifest
- **K8s:** 1 replica, namespace `asd`, image `registry.nexvision.cc/nexvisioncc/aac-board:latest`
- **Resources:** 50-200m CPU, 64-128Mi memory
- **TLS:** cert-manager + Let's Encrypt (production issuer)
- **Ingress:** nginx ingress at `aac.nexvision.cc`

## K8s Manifests

```
k8s/
  deployment.yaml    — pod spec, resource limits, env vars
  service.yaml       — ClusterIP on port 80
  ingress.yaml       — nginx ingress, cert-manager annotation
  certificate.yaml   — Let's Encrypt auto-renew
```

## PWA Config

- **App name:** "AAC Board" / short: "AAC"
- **Display:** `fullscreen`, orientation: `landscape`
- **Theme color:** `#6C63FF`
- **Icons:** 192x192 PNG, 512x512 PNG, SVG
- **Service Worker:** `prompt` strategy (user prompted on update)
- **TTS caching:** `NetworkOnly` for `http://127.0.0.1:5050/`

## Donation

- `public/donate.html` — PayPal SDK, selectable amounts ($5-$100 or custom)
- Accessed via floating purple heart button on the board
