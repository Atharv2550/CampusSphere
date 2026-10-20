import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import { connectDB } from '../config/db.js';

describe('Attendance API 422 Validation Tests', () => {
  let facultyToken = '';
  let assignedSubject = null;

  beforeAll(async () => {
    await connectDB();
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'faculty@campussphere.edu',
      password: 'Faculty@123',
    });
    facultyToken = loginRes.body.data.token;

    const subRes = await request(app)
      .get('/api/subjects/my')
      .set('Authorization', `Bearer ${facultyToken}`);
    assignedSubject = subRes.body.data[0];
  });

  it('Returns 422 when topic is missing', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        subject: assignedSubject.subject._id,
        classDivision: assignedSubject.classDivision._id,
        date: '2026-10-25',
        startTime: '11:00',
        endTime: '12:00',
        topic: '', // Missing topic
        records: [],
      });
    expect(res.status).toBe(422);
  });

  it('Returns 422 when status has invalid enum', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        subject: assignedSubject.subject._id,
        classDivision: assignedSubject.classDivision._id,
        date: '2026-10-25',
        startTime: '11:00',
        endTime: '12:00',
        topic: 'Test Topic',
        records: [
          {
            student: '6ad626e77cb78215142744d0',
            status: 'UNKNOWN_STATUS', // Invalid enum
          },
        ],
      });
    expect(res.status).toBe(422);
  });
});
