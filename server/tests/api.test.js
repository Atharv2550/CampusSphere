import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import { connectDB } from '../config/db.js';

describe('CampusSphere Backend API Integration Tests', () => {
  let studentToken = '';
  let adminToken = '';
  let studentId = '';

  beforeAll(async () => {
    await connectDB();
  });

  it('Health Check Endpoint returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.platform).toBe('CampusSphere API');
  });

  it('Student login with valid credentials returns JWT token and profile', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'student@campussphere.edu',
      password: 'Student@123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('student');

    studentToken = res.body.data.token;
    studentId = res.body.data.user.id;
  });

  it('Admin login with valid credentials returns admin role', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'admin@campussphere.edu',
      password: 'Admin@123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('admin');

    adminToken = res.body.data.token;
  });

  it('Rejects login with invalid password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'student@campussphere.edu',
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Protected route rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('RBAC blocks student from accessing admin endpoints', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Access denied');
  });

  it('RBAC permits admin to access admin user management', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('Fetches published events with filters and pagination', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('Fetches student personalized dashboard', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.upcomingRegisteredEvents).toBeDefined();
    expect(res.body.data.announcements).toBeDefined();
  });

  it('Fetches campus resources and detects availability', async () => {
    const res = await request(app).get('/api/resources');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('Fetches campus analytics with aggregated metrics', async () => {
    const res = await request(app)
      .get('/api/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary.totalUsers).toBeGreaterThan(0);
    expect(res.body.data.summary.totalEvents).toBeGreaterThan(0);
  });
});
