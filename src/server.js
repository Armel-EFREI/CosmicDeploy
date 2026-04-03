const express = require('express');
const path = require('path');
const client = require('prom-client');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Prometheus metrics ────────────────────────────────────────────────────────
const register = client.register;
client.collectDefaultMetrics({ register }); // CPU, memory, event-loop, GC…

// 1. Nombre total de requêtes HTTP (counter par méthode/route/status)
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Nombre total de requêtes HTTP reçues',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// 2. Temps de réponse en ms (histogram → permet p50/p95/p99)
const httpResponseTimeMs = new client.Histogram({
  name: 'http_response_time_ms',
  help: 'Temps de réponse HTTP en millisecondes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500],
  registers: [register],
});

// 3. Erreurs HTTP 4xx/5xx (counter dédié pour alerting ciblé)
const httpErrorsTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Nombre total d\'erreurs HTTP (codes 4xx et 5xx)',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// 4. Utilisation mémoire RSS en Mo (gauge mis à jour à chaque requête)
const memoryUsageMb = new client.Gauge({
  name: 'memory_usage_mb',
  help: 'Utilisation mémoire RSS du processus Node.js en mégaoctets',
  registers: [register],
});

// Middleware : instrumente chaque requête
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const route = req.route ? req.route.path : req.path;
    const labels = { method: req.method, route, status_code: res.statusCode };

    httpRequestsTotal.inc(labels);
    httpResponseTimeMs.observe(labels, duration);
    memoryUsageMb.set(process.memoryUsage().rss / 1024 / 1024);

    if (res.statusCode >= 400) {
      httpErrorsTotal.inc(labels);
    }
  });
  next();
});
// ─────────────────────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// In-memory pipeline data
const pipelines = [
  {
    id: 'a3f1c2',
    sha: 'a3f1c2d',
    branch: 'main',
    author: 'armel',
    status: 'success',
    duration: '1m 42s',
    triggeredAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    id: 'b7e9d4',
    sha: 'b7e9d4a',
    branch: 'main',
    author: 'armel',
    status: 'success',
    duration: '2m 05s',
    triggeredAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
  },
  {
    id: 'c1a8f5',
    sha: 'c1a8f5b',
    branch: 'main',
    author: 'armel',
    status: 'failed',
    duration: '0m 58s',
    triggeredAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
  },
  {
    id: 'd4b2e7',
    sha: 'd4b2e7c',
    branch: 'main',
    author: 'armel',
    status: 'success',
    duration: '1m 55s',
    triggeredAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
  },
  {
    id: 'e6c3a9',
    sha: 'e6c3a9d',
    branch: 'main',
    author: 'armel',
    status: 'success',
    duration: '1m 38s',
    triggeredAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
  },
];

// GET /health
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// GET /api/pipelines
app.get('/api/pipelines', (req, res) => {
  res.status(200).json(pipelines);
});

// GET /api/status
app.get('/api/status', (req, res) => {
  res.status(200).json({
    unitTests: 'passing',
    e2eTests: 'passing',
    dockerBuild: 'ok',
    azureDeploy: 'online',
    successRate: 80,
    totalRuns: pipelines.length,
  });
});

// GET /metrics — exposition des métriques pour Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Serve index.html for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

let server;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`CosmicDeploy running on http://localhost:${PORT}`);
  });
}

module.exports = { app };
