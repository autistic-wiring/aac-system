---
title: "AAC Deployment & SDLC"
date_modified: 2026-07-17
tags: [deployment, docker, kubernetes, github-pages, pwa, ci, sdlc, versioning]
---

# Deployment & SDLC

## Environments

| Env    | URL                              | Trigger                     | Deployment            | Image tag             |
|--------|----------------------------------|-----------------------------|-----------------------|-----------------------|
| Prod   | https://aac.nexvision.cc         | push to `main` (PR merge)   | `aac-board`           | `:stable` (mutable)   |
| Testing| https://aac-testing.nexvision.cc | push to any non-main branch | `aac-board-testing`   | `:testing` (mutable)  |

Both live in namespace `asd` on the same single-node cluster.

## SDLC Flow

```
  feature branch
      │  git push origin <feature-branch>
      ▼
  [auto] .github/workflows/deploy-testing.yml
         builds :testing + :sha-<short> + :branch-<slug>
         applies k8s/*-testing.yaml, restarts aac-board-testing
         → aac-testing.nexvision.cc
      │  human smoke-tests the URL
      ▼
  open PR → review → merge to main
      │
      ▼
  [auto] .github/workflows/deploy-prod.yml
         builds :stable + :sha-<short> + :vX.Y.Z
         git-tags the release, applies k8s/*.yaml, restarts aac-board
         → aac.nexvision.cc

  If prod breaks:
  ./scripts/deploy.sh rollback v1.0.0    # repoints prod at a prior tag
```

**Hard rules:**
- Prod only moves on push to `main` (CI) or via `deploy.sh prod` (hotfix).
- Never edit `:stable` directly — it's always written by CI/script from a build.
- Testing is fully automated and disposable. `:testing` is whatever the latest feature push built.

## Image Tag Layout

All in `registry.nexvision.cc/nexvisioncc/aac-board` (anonymous read+write):

| Tag              | Mutability | Purpose                                        |
|------------------|------------|------------------------------------------------|
| `:testing`       | mutable    | latest feature-branch build — testing deploys  |
| `:stable`        | mutable    | latest main build — prod deploys               |
| `:branch-<slug>` | immutable  | one per feature branch push — traceability     |
| `:sha-xxxxxx`    | immutable  | one per git commit — rollback target           |
| `:vX.Y.Z`        | immutable  | one prod release — rollback target             |

## CI Runner Access (no GitHub Secrets)

Self-hosted runner: Deployment `github-runner-autistic-wiring` in namespace `openclaw`. Labels: `k8s,self-hosted,nexvision` → workflows use `runs-on: [self-hosted, k8s]`. DinD sidecar provides docker at `tcp://localhost:2375`. Autoscaled by `github-runner-autoscaler` CronJob (checks GitHub queue every minute). Script lives in `k8s/ci-runner/autoscaler.sh` and is applied as ConfigMap `github-runner-autoscaler-config`.

**Runner token requirements:** Classic PAT with `repo`, `workflow`, and `admin:org` scopes stored in Secret `github-runner-secret` (key: `ACCESS_TOKEN`). Token expires periodically; when it does, the autoscaler silently fails (see Troubleshooting).

**Max runners:** 1 for autistic-wiring (single-node cluster, ~50m CPU headroom, concurrency group prevents parallel deploys anyway).

Kubeconfig is mounted as a file, not passed through GitHub:

1. `k8s/ci-runner/rbac.yaml` — ServiceAccount `aac-deployer` in `asd`, Role grants only the verbs needed to apply aac-board resources + read pods/events.
2. `scripts/build-ci-kubeconfig.sh` — reads the SA token Secret, builds a kubeconfig, stores it as `openclaw/aac-deployer-kubeconfig` Secret.
3. `k8s/ci-runner/runner-patch.yaml` — strategic merge patch mounting the Secret into the runner pod at `/etc/kubeconfig/` + setting `KUBECONFIG=/etc/kubeconfig/config`.

Re-running the build script + re-patching rotates the token. No GitHub Secrets to manage.

The `myoung34/github-runner` image doesn't ship kubectl — both workflows install it on first run via `curl https://dl.k8s.io/...`.

## Automation

### `scripts/deploy.sh` (local fallback / hotfix)

Mirrors what CI does, runnable from any machine with `docker` + `kubectl` + cluster admin:

| Command                     | Action                                                                       |
|-----------------------------|------------------------------------------------------------------------------|
| `testing`                   | build HEAD → push `:testing` + `:sha-<short>` + `:branch-<slug>` → apply testing manifests → restart |
| `prod [vX.Y.Z]`             | build HEAD → push `:stable` + `:sha-<short>` + `:vX.Y.Z` → git tag → apply prod manifests → restart |
| `rollback <vX.Y.Z\|sha-x>`  | retag target as `:stable` → apply → restart prod                             |
| `status`                    | show testing/prod image, HEAD, last 5 tags                                   |

### GitHub Actions

- `.github/workflows/deploy.yml`           — GitHub Pages (legacy, unchanged)
- `.github/workflows/deploy-testing.yml`   — auto-deploy to aac-testing on feature branch push
- `.github/workflows/deploy-prod.yml`      — auto-deploy to aac.nexvision.cc on main merge + tag release

If CI is broken, the local `scripts/deploy.sh {testing,prod}` produces the exact same result.

## Build

- **Tool:** Vite 7 with `@vitejs/plugin-react`
- **PWA:** `vite-plugin-pwa` with Workbox
- **Base path:** `/` (production; GitHub Pages still uses `/aac-system/`)
- **Global:** `__APP_VERSION__` injected at build time from `package.json`
- **Dockerfile:** multi-stage — `node:22-alpine` build, `nginx:alpine` runtime
- **nginx:** SPA fallback routing, `gzip_static`, 1-year immutable asset cache, no-cache for SW/manifest

## K8s Manifests (`k8s/`)

```
certificate.yaml             — prod TLS (aac.nexvision.cc)
certificate-testing.yaml     — testing TLS (aac-testing.nexvision.cc)
deployment.yaml              — prod deployment, env=prod, image :stable
deployment-testing.yaml      — testing deployment, env=testing, image :testing
service.yaml                 — prod ClusterIP
service-testing.yaml         — testing ClusterIP
ingress.yaml                 — prod nginx ingress
ingress-testing.yaml         — testing nginx ingress
ci-runner/
  rbac.yaml                  — ServiceAccount + Role + RoleBinding + token Secret
  runner-patch.yaml          — strategic merge patch mounting kubeconfig into runner pod
```

Both deployments use 10m/100m CPU and 32Mi/64Mi memory. The single-node cluster is CPU-saturated (~98% requests); keeping requests tiny lets the default `RollingUpdate` strategy fit old+new pods simultaneously during rollout.

## TLS

- cert-manager + Let's Encrypt production issuer
- Secrets: `aac-board-tls`, `aac-board-testing-tls`

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

## Version Bump Conventions

- `package.json` `version` field is the source of truth for the next release tag.
- Bump it (e.g. `1.0.0` → `1.0.1`) before promoting if you want a clean semver.
- If you forget to bump, `promote` appends `-rN` (e.g. `v1.0.0-r1`, `v1.0.0-r2`).

## Auto-Bump Tag Conflict Handling (2026-08-07)

`bump_patch_version` in `scripts/deploy.sh` previously bumped only +0.0.1 without
checking whether that version tag already existed. `deploy.sh prod` then died at
`git tag -a vX.Y.Z` with "tag 'vX.Y.Z' already exists" **after** pushing images,
leaving k8s un-rolled (rollout must be finished manually — `kubectl apply` + restart).

Fix: the function now `git fetch --tags origin` first, then loops +0.0.1 until
`refs/tags/v<new>` is unused (local AND remote), so it always lands on a free tag.
If the script still aborts at the tag step, the images ARE already pushed —
finish manually with:
`kubectl -n asd apply -f k8s/{certificate,deployment,service,ingress}.yaml && kubectl -n asd rollout restart deployment/aac-board`

## Disaster Recovery

- Any prior `:vX.Y.Z` or `:sha-xxxxxx` is a valid rollback target — they're immutable.
- `./scripts/deploy.sh status` shows the last 5 releases.
- `git tag -l` shows all releases; `git show v1.0.0` shows the commit it marks.
