const { app } = require('../../server');
const request = require('supertest');

describe('E2E — Application availability', () => {
  it('GET / returns the dashboard HTML', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
    expect(res.text).toContain('CosmicDeploy');
  });

  it('GET /health returns 200 and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('E2E — Pipeline API', () => {
  it('GET /api/pipelines returns a non-empty list', async () => {
    const res = await request(app).get('/api/pipelines');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('pipelines contain valid ISO timestamps', async () => {
    const res = await request(app).get('/api/pipelines');
    res.body.forEach(p => {
      const d = new Date(p.triggeredAt);
      expect(d.toISOString()).toBe(p.triggeredAt);
    });
  });
});

describe('E2E — Status API', () => {
  it('GET /api/status returns expected structure', async () => {
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body.unitTests).toBe('passing');
    expect(res.body.e2eTests).toBe('passing');
    expect(res.body.dockerBuild).toBe('ok');
    expect(res.body.azureDeploy).toBe('online');
  });

  it('totalRuns matches number of pipelines', async () => {
    const [status, pipelines] = await Promise.all([
      request(app).get('/api/status').then(r => r.body),
      request(app).get('/api/pipelines').then(r => r.body),
    ]);
    expect(status.totalRuns).toBe(pipelines.length);
  });
});

describe('E2E — 404 fallback', () => {
  it('unknown routes return the HTML dashboard (SPA fallback)', async () => {
    const res = await request(app).get('/some/unknown/route');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });
});
