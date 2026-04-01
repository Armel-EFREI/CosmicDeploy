const { app } = require('../../server');
const request = require('supertest');

describe('Unit — GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('includes uptime as a number', async () => {
    const res = await request(app).get('/health');
    expect(typeof res.body.uptime).toBe('number');
  });

  it('includes a valid ISO timestamp', async () => {
    const res = await request(app).get('/health');
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });
});

describe('Unit — GET /api/status', () => {
  it('returns 200', async () => {
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
  });

  it('contains expected CI/CD fields', async () => {
    const res = await request(app).get('/api/status');
    expect(res.body).toHaveProperty('unitTests');
    expect(res.body).toHaveProperty('e2eTests');
    expect(res.body).toHaveProperty('dockerBuild');
    expect(res.body).toHaveProperty('azureDeploy');
  });

  it('successRate is a number between 0 and 100', async () => {
    const res = await request(app).get('/api/status');
    expect(res.body.successRate).toBeGreaterThanOrEqual(0);
    expect(res.body.successRate).toBeLessThanOrEqual(100);
  });
});

describe('Unit — GET /api/pipelines', () => {
  it('returns 200 with an array', async () => {
    const res = await request(app).get('/api/pipelines');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('each pipeline has required fields', async () => {
    const res = await request(app).get('/api/pipelines');
    res.body.forEach(p => {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('sha');
      expect(p).toHaveProperty('status');
      expect(p).toHaveProperty('branch');
      expect(p).toHaveProperty('author');
    });
  });

  it('pipeline status is either success or failed', async () => {
    const res = await request(app).get('/api/pipelines');
    res.body.forEach(p => {
      expect(['success', 'failed']).toContain(p.status);
    });
  });
});
