const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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
