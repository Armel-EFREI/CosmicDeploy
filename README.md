# CosmicDeploy — CI/CD Mission Control

Application web Node.js/Express packagée pour un déploiement **100 % automatisé** sur une VM Azure (K3s + Docker Hub + GitHub Actions). Chaque push sur `main` déclenche la chaîne complète : tests → image → déploiement Kubernetes → healthcheck.

UI : dashboard *Cosmic Editorial* (fond sombre, accents ambre-or) listant les pipelines CI/CD et leur statut.

---

## 1. Description du projet

| Brique | Choix technique |
|---|---|
| Application | Node.js 20 + Express (REST) |
| Frontend | HTML/CSS statique servi par Express |
| Tests | Jest (unit) + Supertest (E2E) |
| Conteneurisation | Dockerfile multi-stage (bonus) |
| Orchestration locale | Docker Compose (app + Prometheus + Grafana) |
| Orchestration VM | **Kubernetes (K3s)** — Deployment + Service NodePort |
| CI/CD | GitHub Actions |
| Registry | Docker Hub |
| Infrastructure | **Terraform** (Azure VM, NSG, VNet) — bonus |
| Monitoring | **Prometheus + Grafana** — bonus |

---

## 2. Pipeline CI/CD

```
git push (main)
  │
  ▼
GitHub Actions
  │
  ├── Job 1 — Unit Tests  (Jest)
  │
  ├── Job 2 — E2E Tests   (Supertest)
  │       ↓ (parallèles, bloquants)
  │
  ├── Job 3 — Build & Push Docker Hub
  │       Tags : latest + <SHA>
  │       ↓ (uniquement si Jobs 1 et 2 OK)
  │
  └── Job 4 — Deploy Kubernetes sur VM Azure
          1. SCP des manifests k8s/*.yaml vers la VM
          2. SSH sur la VM
          3. kubectl apply -f k8s/
          4. kubectl set image deployment/cosmicdeploy=<IMAGE>:<SHA>
          5. kubectl rollout status (échec si crash)
          6. curl http://localhost:30080/health
```

**Contraintes respectées** :
- Pipeline 100 % automatique (aucune action manuelle)
- Échec si les tests échouent (bloquant)
- Aucun secret en clair dans le dépôt (tous dans GitHub Secrets)
- Déploiement **idempotent** (K8s gère le rolling update)

---

## 3. Étapes de déploiement

### 3.1. Pré-requis une seule fois (setup VM Azure)

```bash
# Côté local — provision de la VM via Terraform
cd terraform
terraform init
terraform apply   # → récupère l'IP publique et la commande SSH

# Sur la VM — installer Docker + K3s
sudo apt update && sudo apt install -y docker.io
sudo usermod -aG docker azureuser
curl -sfL https://get.k3s.io | sh -
sudo chmod 644 /etc/rancher/k3s/k3s.yaml
```

### 3.2. Configuration GitHub Secrets (une fois)

Dans `Settings → Secrets and variables → Actions` :

| Secret | Valeur |
|---|---|
| `DOCKERHUB_USERNAME` | Username Docker Hub |
| `DOCKERHUB_TOKEN` | Token d'accès Docker Hub |
| `AZURE_VM_HOST` | IP publique de la VM (output Terraform) |
| `AZURE_VM_USER` | `azureuser` |
| `AZURE_VM_PASSWORD` | Mot de passe SSH |

### 3.3. Déploiement (automatique)

```bash
git push origin main
# → GitHub Actions exécute la pipeline complète
# → App dispo sur http://<AZURE_VM_HOST>:30080
```

### 3.4. Vérifications post-déploiement

```bash
# Depuis n'importe où
curl http://<AZURE_VM_HOST>:30080/health
# → { "status": "ok", "uptime": ..., "timestamp": ... }

# Sur la VM
kubectl get pods -l app=cosmicdeploy
kubectl get svc cosmicdeploy
kubectl logs -l app=cosmicdeploy --tail=50
```

---

## 4. Exécution locale

### Sans Docker

```bash
npm install
npm start                # http://localhost:3000
npm run test:unit
npm run test:e2e
npm test                 # tout
```

### Avec Docker

```bash
docker build -t cosmicdeploy .
docker run -p 3000:3000 cosmicdeploy
```

### Avec Docker Compose (stack complète + monitoring)

```bash
docker compose up -d
# App        → http://localhost:3002
# Prometheus → http://localhost:9090
# Grafana    → http://localhost:3001  (admin / admin)
```

### Avec Kubernetes (test local via minikube)

```bash
minikube start
eval $(minikube docker-env)
docker build -t cosmicdeploy:latest .
kubectl apply -f k8s/
minikube service cosmicdeploy --url
```

---

## 5. Endpoints API

| Méthode | Path | Description |
|---|---|---|
| `GET` | `/` | Dashboard UI |
| `GET` | `/health` | `{ status, uptime, timestamp }` |
| `GET` | `/api/pipelines` | Historique des runs CI/CD |
| `GET` | `/api/status` | Statut des composants CI/CD |
| `GET` | `/metrics` | Métriques Prometheus |

---

## 6. Structure du dépôt

```
.
├── .github/workflows/ci-cd.yml   # Pipeline GitHub Actions
├── Dockerfile                    # Multi-stage (deps → runtime)
├── docker-compose.yml            # App + Prometheus + Grafana (local)
├── k8s/                          # Manifests Kubernetes
│   ├── deployment.yaml           # Deployment (1 replica, healthchecks)
│   ├── service.yaml              # Service NodePort 30080
│   └── kustomization.yaml
├── monitoring/                   # Config Prometheus + Grafana
├── terraform/                    # Provisioning VM Azure
├── src/
│   ├── server.js                 # Express app + métriques Prom
│   └── __tests__/                # Jest unit + E2E
└── public/                       # Frontend statique
```

---

## 7. Gestion des variables d'environnement & secrets

- **Aucun secret n'est committé** : `.env` est dans `.gitignore`
- Exemple fourni : `.env.example`
- En production :
  - GitHub Secrets pour la pipeline CI/CD
  - K8s `Secret docker-registry regcred` pour le pull Docker Hub (créé via `kubectl apply` dans la pipeline)
- `PORT` injecté via `env` du Deployment K8s

---

## 8. Choix techniques

- **Node.js + Express** — footprint minimal, démarrage rapide (< 200 ms)
- **Multi-stage Dockerfile** — `node_modules` prod only → image finale réduite
- **K3s** plutôt que Minikube — plus léger, daemon systemd natif, mieux adapté à une VM `Standard_B1s`
- **NodePort 30080** — exposition simple sans LoadBalancer (pas d'Azure Load Balancer managé sur cette VM)
- **SHA tag + latest** — traçabilité par commit, `latest` toujours = main actuel
- **`appleboy/ssh-action` + `scp-action`** — robustes, maintenus, auth par mot de passe ou clé
- **`kubectl set image`** après `apply` — garantit le rollout même si le manifest YAML est déjà à jour
- **`rollout status --timeout=180s`** — fait échouer la pipeline si le pod crash ou ne passe pas readiness

---

## 9. Difficultés rencontrées

### 9.1. Kubeconfig K3s inaccessible en SSH non-root
K3s écrit `/etc/rancher/k3s/k3s.yaml` en mode 600 (root only). La pipeline SSH s'exécute en tant que `azureuser` → `kubectl` retourne *permission denied*.
**Résolution** : `sudo chmod 644 /etc/rancher/k3s/k3s.yaml` + `export KUBECONFIG=...` dans le script SSH.

### 9.2. Pull Docker Hub depuis K3s
K3s utilise containerd (pas Docker) → `docker login` / `docker pull` sur la VM n'aide pas K8s à pull. Au premier déploiement : `ImagePullBackOff`.
**Résolution** : création d'un `Secret docker-registry regcred` (idempotent via `--dry-run=client | kubectl apply`) référencé par `imagePullSecrets` dans le Deployment.

### 9.3. NodePort inaccessible depuis Internet
La règle NSG Terraform n'autorisait initialement que le port 3000. Le NodePort 30080 renvoyait un timeout.
**Résolution** : ajout d'une règle `allow-k8s-nodeport` (priorité 120) dans `terraform/main.tf`.

### 9.4. `kubectl apply` ne détecte pas de diff
Quand l'image est identique (même tag) mais avec un nouveau SHA en valeur, `apply` peut dire *unchanged* et ne pas redémarrer le pod.
**Résolution** : ajout de `kubectl set image ...` après `apply` pour forcer un rollout.

### 9.5. Healthcheck prématuré
`curl` juste après `kubectl apply` échouait parce que le pod était encore `Pending`.
**Résolution** : `kubectl rollout status --timeout=180s` avant le `curl` → attend un pod `Ready` ou échoue.

### 9.6. Actions GitHub sous Node20 dépréciées
`appleboy/ssh-action` émettait des warnings *Node.js 16 actions are deprecated*.
**Résolution** : variable d'env `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true` au niveau du workflow.

---

## 10. Bonus implémentés

- **Multi-stage Dockerfile**
- **Terraform** — provisioning complet de la VM Azure (resource group, VNet, subnet, NIC, NSG, IP publique, VM Ubuntu 22.04)
- **Monitoring Prometheus + Grafana** — dashboard pré-provisionné (`monitoring/grafana/dashboards/cosmicdeploy.json`), métriques custom exposées sur `/metrics` (requêtes, latence, erreurs, mémoire)
