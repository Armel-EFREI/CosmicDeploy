# CosmicDeploy — CI/CD Mission Control

A CI/CD dashboard built with Node.js/Express and the **Cosmic Editorial** design system (dark, amber-gold accents). Every push on `main` triggers a fully automated deployment pipeline — no manual action required.

## Pipeline

```
git push (main)
  ↓
GitHub Actions
  ↓
Job 1 — Unit Tests       (Jest)
  ↓
Job 2 — E2E Tests        (Supertest)
  ↓  only if both pass
Job 3 — Build & Push     (Docker Hub: latest + SHA tag)
  ↓
Job 4 — Deploy           (SSH → Azure VM → docker run → healthcheck)
```

## Run locally

```bash
npm install
npm start
# → http://localhost:3000
```

## Run tests

```bash
npm run test:unit   # unit tests only
npm run test:e2e    # e2e tests only
npm test            # all
```

## Docker

```bash
docker build -t cosmicdeploy .
docker run -p 3000:3000 cosmicdeploy
# or
docker compose up -d
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Dashboard UI |
| `GET` | `/health` | `{ status: "ok", uptime, timestamp }` |
| `GET` | `/api/pipelines` | Recent pipeline runs |
| `GET` | `/api/status` | CI/CD component status |

## GitHub Secrets required

| Secret | Value |
|--------|-------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `AZURE_VM_HOST` | Public IP of the Azure VM |
| `AZURE_VM_USER` | SSH username (e.g. `azureuser`) |
| `AZURE_SSH_PRIVATE_KEY` | Private SSH key (PEM format) |

## Technical choices

- **Node.js + Express** — minimal footprint, fast startup, easy to test
- **Jest + Supertest** — unit and E2E tests without a running server process
- **Multi-stage Dockerfile** — production-only deps, smaller image
- **Fixed container name `myapp`** — guarantees idempotent redeploy (`stop → rm → run`)
- **SHA + latest tags** — traceability per commit, latest always points to current main
- **`appleboy/ssh-action`** — simple, battle-tested SSH deploy step
