const request = require('supertest');
const app = require('../server');

describe('API Route Integration Tests', () => {
  test('GET / should return 200 OK and online status metadata', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('name', 'LabWise Urdu API');
    expect(res.body).toHaveProperty('status', 'online');
  });
});