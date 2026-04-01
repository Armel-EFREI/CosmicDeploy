# TP — CI/CD complet : Tests → Docker Hub → Déploiement sur VM Azure

## Contexte du projet

Industrialisation du déploiement d'une application web via une pipeline CI/CD entièrement automatisée. Chaque push sur `main` déclenche sans intervention manuelle : tests unitaires, tests E2E, build Docker, push sur Docker Hub, déploiement SSH sur VM Azure.

## Chaîne CI/CD

```
git push (main)
  ↓
GitHub Actions
  ↓
Job 1 — Unit tests
  ↓
Job 2 — E2E tests
  ↓ (uniquement si Job 1 + Job 2 OK)
Job 3 — Build & Push Docker Hub
  ↓
Job 4 — Deploy sur VM Azure (SSH)
  ↓
Vérification (healthcheck / requête HTTP)
```

## Application

- API ou application web fonctionnelle localement
- Expose un port (3000 ou 8080)
- Endpoint de vérification : `GET /health`

## Dockerisation

Fournir :
- Un `Dockerfile` ou `docker-compose.yml` fonctionnel
- Conteneur lançable avec `docker run` ou `docker compose up`
- Port correctement exposé

## Tests obligatoires

### Tests unitaires
- Exécutables en CI via une commande unique
- La pipeline échoue si un test échoue

### Tests E2E (ex: Cypress, Playwright, ou HTTP)
- Simulent un parcours réel (HTTP ou navigateur)
- Exécutables en CI via une commande unique
- La pipeline échoue si un test échoue
- Doivent couvrir au minimum :
  - La disponibilité de l'application
  - Au moins un endpoint/fonctionnalité en plus de `/health`

## GitHub Actions — Détail des jobs

### Job 1 — Unit tests
- Installe les dépendances
- Exécute les tests unitaires

### Job 2 — E2E tests
- Installe/démarre ce qui est nécessaire
- Exécute les tests E2E

### Job 3 — Build & Push Docker Hub
- Construit l'image Docker
- Tag l'image (ex: `username/app:latest` et `username/app:<sha>`)
- Push sur Docker Hub
- Conditionné au succès des Job 1 et Job 2

### Job 4 — Deploy sur VM Azure
- Connexion SSH à la VM
- Pull de l'image depuis Docker Hub
- Redémarrage idempotent du conteneur (nom fixe `myapp` ou `docker compose up -d`)
- Vérification que l'application répond (healthcheck HTTP)

## Déploiement Azure — Contraintes

- Déploiement effectué uniquement via GitHub Actions (jamais à la main)
- Application accessible via l'IP publique de la VM
- Déploiement **idempotent** : repousser le même commit ne doit pas créer plusieurs conteneurs ni casser le service
- Recommandation : nom de conteneur fixe ou `docker compose up -d`

## Gestion des secrets (GitHub Secrets)

Aucun identifiant en clair dans le dépôt. Utiliser GitHub Secrets pour :

| Secret | Usage |
|--------|-------|
| `DOCKERHUB_USERNAME` | Identifiant Docker Hub |
| `DOCKERHUB_TOKEN` | Token d'accès Docker Hub |
| `AZURE_VM_HOST` | IP publique de la VM |
| `AZURE_VM_USER` | Utilisateur SSH |
| `AZURE_SSH_PRIVATE_KEY` | Clé privée SSH |

## Structure attendue du dépôt

```
.
├── .github/
│   └── workflows/
│       └── ci-cd.yml       # Pipeline GitHub Actions
├── Dockerfile               # ou docker-compose.yml
├── README.md                # Explication du pipeline et des choix techniques
└── src/                     # Code de l'application
```

## Livrables

1. Dépôt GitHub avec :
   - Code de l'application
   - Dockerfile / docker-compose.yml
   - Workflow GitHub Actions (`.github/workflows/ci-cd.yml`)

2. Application fonctionnelle :
   - Capture d'écran de la VM Azure accessible sur l'IP publique

3. README expliquant :
   - Le fonctionnement du pipeline
   - Comment le déploiement est déclenché
   - Les choix techniques réalisés
