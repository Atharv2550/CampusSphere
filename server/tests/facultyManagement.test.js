import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';
import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';

describe('CampusSphere Faculty Management & Creation Integration Tests', () => {
  let adminToken = '';
  let studentToken = '';
  let createdFacultyId = '';
  const testEmpId = `TEST-EMP-${Date.now().toString().slice(-5)}`;
  const testEmail = `prof.${Date.now().toString().slice(-5)}@campussphere.edu`;
  const testPassword = 'ProfSecurePass@123';

  beforeAll(async () => {
    await connectDB();

    // 1. Admin login
    const adminRes = await request(app).post('/api/auth/login').send({
      email: 'admin@campussphere.edu',
      password: 'Admin@123',
    });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.token;

    // 2. Student login
    const studentRes = await request(app).post('/api/auth/login').send({
      email: 'student@campussphere.edu',
      password: 'Student@123',
    });
    expect(studentRes.status).toBe(200);
    studentToken = studentRes.body.data.token;
  });

  it('1. Unauthenticated request to POST /api/admin/faculty is rejected with 401', async () => {
    const res = await request(app).post('/api/admin/faculty').send({
      fullName: 'Dr. Unauthorized Test',
      email: 'unauth@campussphere.edu',
      employeeId: 'EMP-UNAUTH',
      password: 'Password@123',
    });
    expect(res.status).toBe(401);
  });

  it('2. Student is blocked with 403 Forbidden from creating faculty accounts', async () => {
    const res = await request(app)
      .post('/api/admin/faculty')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        fullName: 'Dr. Hacker',
        email: 'hacker@campussphere.edu',
        employeeId: 'EMP-HACK-01',
        password: 'Password@123',
      });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('3. Admin creation validates required fields (returns 400)', async () => {
    const res = await request(app)
      .post('/api/admin/faculty')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Incomplete Faculty',
        // missing email, employeeId, password
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('required');
  });

  it('4. Admin creation validates password length (returns 400 for < 6 chars)', async () => {
    const res = await request(app)
      .post('/api/admin/faculty')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Dr. Short Pass',
        email: 'shortpass@campussphere.edu',
        employeeId: 'EMP-SHORT-01',
        password: '123',
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('at least 6 characters');
  });

  it('5. Admin successfully creates a new faculty account with employeeId and designation', async () => {
    const res = await request(app)
      .post('/api/admin/faculty')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Dr. Sophia Williams',
        email: testEmail,
        employeeId: testEmpId,
        designation: 'Associate Professor',
        phoneNumber: '+1-555-0199',
        status: 'active',
        password: testPassword,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('faculty');
    expect(res.body.data.employeeId).toBe(testEmpId);
    expect(res.body.data.designation).toBe('Associate Professor');
    expect(res.body.data.academicYear).toBe('Faculty/Staff');
    expect(res.body.data.status).toBe('active');
    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data.password).toBeUndefined(); // Plaintext password must never be exposed

    createdFacultyId = res.body.data._id;
  });

  it('6. Admin creation rejects duplicate email with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/admin/faculty')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Dr. Duplicate Email',
        email: testEmail, // duplicate
        employeeId: `DIFF-EMP-${Date.now().toString().slice(-4)}`,
        password: 'Password@123',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already exists');
  });

  it('7. Admin creation rejects duplicate Employee ID with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/admin/faculty')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Dr. Duplicate EmpId',
        email: `unique.${Date.now().toString().slice(-4)}@campussphere.edu`,
        employeeId: testEmpId, // duplicate
        password: 'Password@123',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already exists');
  });

  it('8. Newly created faculty can successfully log in using initial password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: testPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('faculty');
    expect(res.body.data.user.email).toBe(testEmail);
  });

  it('9. Admin can update faculty profile, designation, and status', async () => {
    const res = await request(app)
      .put(`/api/admin/faculty/${createdFacultyId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Prof. Sophia Williams, Ph.D.',
        designation: 'Professor & Department Head',
        phoneNumber: '+1-555-0288',
        status: 'active',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe('Prof. Sophia Williams, Ph.D.');
    expect(res.body.data.designation).toBe('Professor & Department Head');
    expect(res.body.data.phoneNumber).toBe('+1-555-0288');
  });

  it('10. Faculty directory search by Employee ID finds the newly created faculty', async () => {
    const res = await request(app)
      .get(`/api/admin/users?search=${testEmpId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].employeeId).toBe(testEmpId);
  });

  it('11. Faculty directory filters by role=faculty', async () => {
    const res = await request(app)
      .get('/api/admin/users?role=faculty')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.every((u) => u.role === 'faculty')).toBe(true);
  });

  it('12. Safety: Admin cannot suspend the only active administrator', async () => {
    const adminUser = await User.findOne({ role: 'admin', status: 'active' });
    expect(adminUser).toBeDefined();

    // Attempting to suspend the admin account
    const res = await request(app)
      .patch(`/api/admin/users/${adminUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'suspended',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('13. Public registration never allows escalation to faculty or admin role', async () => {
    const testRegEmail = `reg.${Date.now().toString().slice(-4)}@campussphere.edu`;
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Attempted Privileged Register',
      email: testRegEmail,
      password: 'Password@123',
      confirmPassword: 'Password@123',
      role: 'faculty', // malicious attempt to self-assign faculty
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('student'); // Must be enforced as student
  });
});
