import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import { connectDB } from '../config/db.js';

import { LectureAttendance } from '../models/LectureAttendance.js';

describe('CampusSphere Attendance Management & History System Tests', () => {
  let facultyToken = '';
  let studentToken = '';
  let assignedSubject = null;
  let students = [];
  let createdSessionId = '';
  let testStudentId = '';

  beforeAll(async () => {
    await connectDB();

    // Clean any previous test data
    await LectureAttendance.deleteMany({
      $or: [
        { topic: /Byzantine/i },
        { topic: /Duplicate Attempt/i },
      ],
    });

    // 1. Login as faculty
    const facultyLogin = await request(app).post('/api/auth/login').send({
      email: 'faculty@campussphere.edu',
      password: 'Faculty@123',
    });
    facultyToken = facultyLogin.body.data.token;

    // 2. Login as student
    const studentLogin = await request(app).post('/api/auth/login').send({
      email: 'student@campussphere.edu',
      password: 'Student@123',
    });
    studentToken = studentLogin.body.data.token;

    // 3. Fetch faculty's assigned subject & class
    const subRes = await request(app)
      .get('/api/subjects/my')
      .set('Authorization', `Bearer ${facultyToken}`);
    assignedSubject = subRes.body.data[0];

    // 4. Fetch students enrolled in this class
    const stuRes = await request(app)
      .get(`/api/classes/${assignedSubject.classDivision._id}/students`)
      .set('Authorization', `Bearer ${facultyToken}`);
    students = stuRes.body.data;
    testStudentId = students[0]._id;
  });

  it('1. GET /api/attendance/check-session returns exists: false for unscheduled slot', async () => {
    const res = await request(app)
      .get('/api/attendance/check-session')
      .set('Authorization', `Bearer ${facultyToken}`)
      .query({
        subject: assignedSubject.subject._id,
        classDivision: assignedSubject.classDivision._id,
        date: '2026-11-15',
        startTime: '14:00',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.exists).toBe(false);
  });

  it('2. POST /api/attendance creates a new attendance session successfully', async () => {
    const records = students.map((s, idx) => ({
      student: s._id,
      status: idx === 0 ? 'Present' : 'Late',
      remarks: idx === 1 ? 'Traffic delay' : '',
    }));

    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        subject: assignedSubject.subject._id,
        classDivision: assignedSubject.classDivision._id,
        date: '2026-11-15',
        startTime: '14:00',
        endTime: '15:00',
        topic: 'Byzantine Fault Tolerance & Consensus',
        records,
        latePolicy: 'half',
      });

      if (res.status !== 201) {
        console.log('TEST 2 FAILED WITH:', res.status, res.body);
      }
      expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBeDefined();
    expect(res.body.data.sessionStatus).toBe('Submitted');
    expect(res.body.data.summary.totalStudents).toBe(students.length);

    createdSessionId = res.body.data._id;
  });

  it('3. POST /api/attendance returns HTTP 409 Conflict when submitting duplicate slot', async () => {
    const records = students.map((s) => ({
      student: s._id,
      status: 'Present',
    }));

    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        subject: assignedSubject.subject._id,
        classDivision: assignedSubject.classDivision._id,
        date: '2026-11-15',
        startTime: '14:00',
        endTime: '15:00',
        topic: 'Duplicate Attempt',
        records,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Duplicate attendance');
    expect(res.body.existingSessionId).toBe(createdSessionId);
  });

  it('4. POST /api/attendance returns HTTP 422 when topic is missing', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        subject: assignedSubject.subject._id,
        classDivision: assignedSubject.classDivision._id,
        date: '2026-11-16',
        startTime: '11:00',
        endTime: '12:00',
        topic: '   ',
        records: [{ student: testStudentId, status: 'Present' }],
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('topic');
  });

  it('5. POST /api/attendance returns HTTP 422 when student records are missing or empty', async () => {
    const res = await request(app)
      .post('/api/attendance')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        subject: assignedSubject.subject._id,
        classDivision: assignedSubject.classDivision._id,
        date: '2026-11-16',
        startTime: '11:00',
        endTime: '12:00',
        topic: 'Valid Topic',
        records: [],
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('6. GET /api/attendance/check-session now returns exists: true for created session', async () => {
    const res = await request(app)
      .get('/api/attendance/check-session')
      .set('Authorization', `Bearer ${facultyToken}`)
      .query({
        subject: assignedSubject.subject._id,
        classDivision: assignedSubject.classDivision._id,
        date: '2026-11-15',
        startTime: '14:00',
      });

    expect(res.status).toBe(200);
    expect(res.body.exists).toBe(true);
    expect(res.body.session._id).toBe(createdSessionId);
  });

  it('7. PATCH /api/attendance/sessions/:id allows authorized attendance correction with audit history', async () => {
    const res = await request(app)
      .patch(`/api/attendance/sessions/${createdSessionId}`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        topic: 'Byzantine Fault Tolerance — Part 2',
        reason: 'Student arrived late with approved medical note',
        records: [
          {
            student: testStudentId,
            status: 'Absent',
            remarks: 'Verified medical clearance',
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sessionStatus).toBe('Corrected');
    expect(res.body.data.editHistory.length).toBeGreaterThan(0);
    expect(res.body.data.editHistory[0].reason).toContain('medical note');
  });

  it('8. GET /api/attendance/sessions returns paginated list with filters', async () => {
    const res = await request(app)
      .get('/api/attendance/sessions')
      .set('Authorization', `Bearer ${facultyToken}`)
      .query({
        page: 1,
        limit: 10,
        subject: assignedSubject.subject._id,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.total).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('9. GET /api/attendance/sessions/:id returns detailed session info', async () => {
    const res = await request(app)
      .get(`/api/attendance/sessions/${createdSessionId}`)
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(createdSessionId);
    expect(res.body.data.records.length).toBeGreaterThan(0);
  });

  it('10. GET /api/attendance/student/:id returns student report with Late policy metrics', async () => {
    const res = await request(app)
      .get(`/api/attendance/student/${testStudentId}`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .query({ latePolicy: 'half' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.student._id).toBe(testStudentId);
    expect(res.body.overallMetrics.totalEligibleLectures).toBeGreaterThan(0);
    expect(res.body.overallMetrics.attendancePercentage).toBeDefined();
    expect(Array.isArray(res.body.history)).toBe(true);
    expect(Array.isArray(res.body.subjectSummaries)).toBe(true);
  });

  it('11. GET /api/attendance/reports/subject returns subject-wise analytics', async () => {
    const res = await request(app)
      .get('/api/attendance/reports/subject')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('12. GET /api/attendance/reports/class returns class-division analytics', async () => {
    const res = await request(app)
      .get('/api/attendance/reports/class')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('13. GET /api/attendance/reports/summary returns overall faculty metrics', async () => {
    const res = await request(app)
      .get('/api/attendance/reports/summary')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalSessions).toBeGreaterThan(0);
  });

  it('14. GET /api/attendance/missing detects unrecorded timetable lectures', async () => {
    const res = await request(app)
      .get('/api/attendance/missing')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('15. GET /api/attendance/export-csv returns downloadable CSV stream', async () => {
    const res = await request(app)
      .get('/api/attendance/export-csv')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Date,Weekday,Time Slot,Subject Code');
  });

  it('16. RBAC prevents student from modifying attendance sessions', async () => {
    const res = await request(app)
      .patch(`/api/attendance/sessions/${createdSessionId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ topic: 'Hacked Topic' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
