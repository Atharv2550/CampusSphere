import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Divider,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  RadioGroup,
  FormControlLabel,
  Radio,
  LinearProgress,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  FactCheck as AttendanceIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  AccessTime as LateIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  Edit as EditIcon,
  Sync as SyncIcon,
  Info as InfoIcon,
  Class as ClassIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const FacultyAttendancePage = () => {
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [selectedSubjectKey, setSelectedSubjectKey] = useState('');
  const [lectureDate, setLectureDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [topic, setTopic] = useState('');

  // Attendance Sheet
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: 'Present' | 'Absent' | 'Late' }
  const [saving, setSaving] = useState(false);

  // Existing Session Detection (Fixes HTTP 409 & enables correction workflow)
  const [existingSession, setExistingSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editReason, setEditReason] = useState('Attendance record correction by instructor');

  // History Drawer / Modal
  const [history, setHistory] = useState([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // 1. Initial Data Fetch
  const initData = async () => {
    try {
      setLoading(true);
      const [subRes, histRes] = await Promise.all([
        api.get('/subjects/my'),
        api.get('/attendance/my-history'),
      ]);

      const subs = subRes.data.data || [];
      setAssignedSubjects(subs);
      setHistory(histRes.data.data || []);

      if (subs.length > 0) {
        setSelectedSubjectKey('0');
        await loadStudentsForClass(subs[0]);
      }
    } catch (err) {
      console.error('Attendance init error:', err);
      showError('Failed to load classes and attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  // 2. Load Students for Class Division
  const loadStudentsForClass = async (subItem) => {
    if (!subItem?.classDivision?._id) return;
    try {
      const res = await api.get(`/classes/${subItem.classDivision._id}/students`);
      const stuList = res.data.data || [];
      setStudents(stuList);

      // Default all to 'Present'
      const initialMap = {};
      stuList.forEach((s) => {
        initialMap[s._id] = 'Present';
      });
      setAttendanceRecords(initialMap);

      if (subItem.scheduleSlots && subItem.scheduleSlots.length > 0) {
        setStartTime(subItem.scheduleSlots[0].startTime);
        setEndTime(subItem.scheduleSlots[0].endTime);
      }
    } catch (err) {
      console.error('Failed to load class students:', err);
      showError('Failed to load class cohort students.');
    }
  };

  // 3. Pre-flight Check: Does a session already exist for this subject, date & slot?
  const checkSessionStatus = useCallback(async (subIdx, dateStr, startStr) => {
    const subItem = assignedSubjects[Number(subIdx)];
    if (!subItem?.subject?._id || !subItem?.classDivision?._id || !dateStr || !startStr) {
      setExistingSession(null);
      return;
    }

    try {
      setCheckingSession(true);
      const res = await api.get('/attendance/check-session', {
        params: {
          subject: subItem.subject._id,
          classDivision: subItem.classDivision._id,
          date: dateStr,
          startTime: startStr,
        },
      });

      if (res.data.exists && res.data.session) {
        setExistingSession(res.data.session);
      } else {
        setExistingSession(null);
      }
    } catch (err) {
      console.error('Check session error:', err);
    } finally {
      setCheckingSession(false);
    }
  }, [assignedSubjects]);

  useEffect(() => {
    if (assignedSubjects.length > 0 && selectedSubjectKey !== '') {
      checkSessionStatus(selectedSubjectKey, lectureDate, startTime);
    }
  }, [selectedSubjectKey, lectureDate, startTime, checkSessionStatus, assignedSubjects.length]);

  const handleSubjectChange = (e) => {
    const idx = e.target.value;
    setSelectedSubjectKey(idx);
    const subItem = assignedSubjects[Number(idx)];
    if (subItem) {
      loadStudentsForClass(subItem);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s._id] = status;
    });
    setAttendanceRecords(updated);
  };

  // 4. Load Existing Attendance Record into Roll-Call Form
  const handleLoadExistingSession = () => {
    if (!existingSession) return;
    setTopic(existingSession.topic || '');
    if (existingSession.startTime) setStartTime(existingSession.startTime);
    if (existingSession.endTime) setEndTime(existingSession.endTime);

    const map = {};
    if (Array.isArray(existingSession.records)) {
      existingSession.records.forEach((r) => {
        const sId = r.student?._id || r.student;
        if (sId) map[sId] = r.status;
      });
    }
    setAttendanceRecords((prev) => ({ ...prev, ...map }));
    showSuccess('Loaded existing attendance records for editing.');
  };

  // 5. Submit New Attendance Session (POST /api/attendance)
  const handleSubmitAttendance = async () => {
    if (saving) return;

    if (!topic.trim()) {
      showError('Please enter the syllabus lecture topic taught today.');
      return;
    }

    const currentItem = assignedSubjects[Number(selectedSubjectKey)];
    if (!currentItem) {
      showError('Please select a valid subject and class cohort.');
      return;
    }

    if (students.length === 0) {
      showError('No students available in this class cohort to record attendance.');
      return;
    }

    // If an existing session was detected, prompt user to use Update mode instead
    if (existingSession) {
      setOpenEditDialog(true);
      return;
    }

    try {
      setSaving(true);
      const records = students.map((s) => ({
        student: s._id,
        status: attendanceRecords[s._id] || 'Present',
        remarks: '',
      }));

      const payload = {
        subject: currentItem.subject._id,
        classDivision: currentItem.classDivision._id,
        date: lectureDate,
        startTime,
        endTime,
        topic: topic.trim(),
        records,
        latePolicy: 'half',
      };

      const res = await api.post('/attendance', payload);
      showSuccess('Lecture attendance recorded successfully!');

      // Prepend to history & update state
      setHistory((prev) => [res.data.data, ...prev]);
      setExistingSession(res.data.data);
    } catch (err) {
      console.error('Save attendance error:', err);
      if (err.response?.status === 409) {
        showError(err.response.data?.message || 'Attendance already recorded for this slot today.');
        if (err.response.data?.existingSessionId) {
          setExistingSession({
            _id: err.response.data.existingSessionId,
            ...err.response.data.existingSession,
          });
        }
      } else if (err.response?.status === 422) {
        showError(err.response.data?.message || 'Validation error: Please ensure topic and student statuses are valid.');
      } else {
        showError(err.response?.data?.message || 'Failed to record lecture attendance.');
      }
    } finally {
      setSaving(false);
    }
  };

  // 6. Authorized Correction / Update (PATCH /api/attendance/sessions/:id)
  const handleConfirmUpdate = async () => {
    if (!existingSession?._id) return;

    try {
      setSaving(true);
      const records = students.map((s) => ({
        student: s._id,
        status: attendanceRecords[s._id] || 'Present',
      }));

      const res = await api.patch(`/attendance/sessions/${existingSession._id}`, {
        topic: topic.trim() || existingSession.topic,
        records,
        reason: editReason.trim() || 'Instructor attendance correction',
        latePolicy: 'half',
      });

      showSuccess('Attendance records updated and audit log recorded!');
      setExistingSession(res.data.data);
      setOpenEditDialog(false);

      // Update in history list
      setHistory((prev) =>
        prev.map((h) => (h._id === existingSession._id ? res.data.data : h))
      );
    } catch (err) {
      console.error('Update attendance error:', err);
      showError(err.response?.data?.message || 'Failed to update attendance records.');
    } finally {
      setSaving(false);
    }
  };

  // Metrics computation for current roll-call
  const totalStudents = students.length;
  const presentCount = Object.values(attendanceRecords).filter((s) => s === 'Present').length;
  const lateCount = Object.values(attendanceRecords).filter((s) => s === 'Late').length;
  const absentCount = Object.values(attendanceRecords).filter((s) => s === 'Absent').length;
  const effectivePresent = presentCount + 0.5 * lateCount;
  const attendanceRate = totalStudents > 0 ? Math.round((effectivePresent / totalStudents) * 100) : 0;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  const currentItem = assignedSubjects[Number(selectedSubjectKey)];

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ p: 1, bgcolor: '#eff6ff', borderRadius: 2 }}>
            <AttendanceIcon sx={{ color: '#2563eb', fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Lecture & Student Attendance
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Conduct live roll call, record syllabus topics, and verify verified student attendance records
            </Typography>
          </Box>
        </Stack>

        <Button
          variant="outlined"
          component={Link}
          to="/faculty/attendance-history"
          startIcon={<HistoryIcon />}
          endIcon={<ArrowForwardIcon />}
          sx={{
            fontWeight: 700,
            borderRadius: 2.5,
            textTransform: 'none',
            borderColor: '#2563eb',
            color: '#2563eb',
            '&:hover': { bgcolor: '#eff6ff', borderColor: '#1d4ed8' },
          }}
        >
          View Attendance History & Reports
        </Button>
      </Box>

      {/* Duplicate Session / Existing Attendance Warning Banner */}
      {existingSession && (
        <Alert
          severity="info"
          icon={<InfoIcon fontSize="inherit" />}
          sx={{ mb: 3, borderRadius: 2.5, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e3a8a' }}
          action={
            <Stack direction="row" spacing={1}>
              <Button
                color="primary"
                size="small"
                variant="outlined"
                onClick={handleLoadExistingSession}
                sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#ffffff' }}
              >
                Load Saved Records
              </Button>
              <Button
                color="primary"
                size="small"
                variant="contained"
                onClick={() => setOpenEditDialog(true)}
                sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#2563eb' }}
              >
                Update / Correct
              </Button>
            </Stack>
          }
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Attendance Already Submitted for this Slot ({existingSession.startTime} - {existingSession.endTime})
          </Typography>
          <Typography variant="caption" sx={{ color: '#3b82f6' }}>
            Topic: &ldquo;{existingSession.topic}&rdquo; &bull; Attendance Rate: {existingSession.summary?.attendanceRate || 0}% &bull; Status: {existingSession.sessionStatus || 'Submitted'}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3.5}>
        {/* Left Column: Live Attendance Taking */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 3, mb: 3.5, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Roll Call & Lecture Verification
              </Typography>
              {existingSession && (
                <Chip
                  label={`Mode: ${existingSession.sessionStatus === 'Corrected' ? 'Corrected' : 'Submitted'}`}
                  color="info"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              )}
            </Box>

            {assignedSubjects.length === 0 ? (
              <Alert severity="warning">
                No classes are assigned to your teaching schedule. Contact the department timetable administrator.
              </Alert>
            ) : (
              <Stack spacing={2.5}>
                {/* Class & Date Selector Row */}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Assigned Class & Subject"
                      value={selectedSubjectKey}
                      onChange={handleSubjectChange}
                      size="small"
                    >
                      {assignedSubjects.map((sub, idx) => (
                        <MenuItem key={idx} value={String(idx)}>
                          {sub.subject?.code} - {sub.subject?.name} ({sub.classDivision?.name})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      type="date"
                      fullWidth
                      label="Lecture Date"
                      value={lectureDate}
                      onChange={(e) => setLectureDate(e.target.value)}
                      size="small"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <TextField
                      label="Start Time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      size="small"
                      fullWidth
                      placeholder="09:00"
                    />
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <TextField
                      label="End Time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      size="small"
                      fullWidth
                      placeholder="10:00"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Lecture Topic / Syllabus Unit"
                      placeholder="e.g., Raft Consensus & Log Replication Protocol"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      size="small"
                      required
                    />
                  </Grid>
                </Grid>

                <Divider />

                {/* Roll Call Quick Action Toolbar */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                      Mark All:
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      startIcon={<PresentIcon />}
                      onClick={() => handleMarkAll('Present')}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                    >
                      Present
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      startIcon={<LateIcon />}
                      onClick={() => handleMarkAll('Late')}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                    >
                      Late
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<AbsentIcon />}
                      onClick={() => handleMarkAll('Absent')}
                      sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                    >
                      Absent
                    </Button>
                  </Stack>

                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Institutional Late Policy: 0.5 Credit
                  </Typography>
                </Box>

                {/* Students Roll Call Table */}
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 2.5, maxHeight: 420 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Student Name & Email</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Roll / Student ID</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569', textAlign: 'center' }}>Attendance Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.map((st) => (
                        <TableRow key={st._id} hover>
                          <TableCell>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar sx={{ width: 30, height: 30, fontSize: '0.8rem', bgcolor: '#3b82f6' }}>
                                {st.fullName?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                  {st.fullName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  {st.email}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            {st.studentId || 'STU-101'}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <RadioGroup
                              row
                              value={attendanceRecords[st._id] || 'Present'}
                              onChange={(e) => handleStatusChange(st._id, e.target.value)}
                              sx={{ justifyContent: 'center' }}
                            >
                              <FormControlLabel
                                value="Present"
                                control={<Radio size="small" color="success" />}
                                label={<Typography variant="caption" sx={{ fontWeight: 700, color: '#16a34a' }}>P</Typography>}
                              />
                              <FormControlLabel
                                value="Late"
                                control={<Radio size="small" color="warning" />}
                                label={<Typography variant="caption" sx={{ fontWeight: 700, color: '#eab308' }}>L</Typography>}
                              />
                              <FormControlLabel
                                value="Absent"
                                control={<Radio size="small" color="error" />}
                                label={<Typography variant="caption" sx={{ fontWeight: 700, color: '#dc2626' }}>A</Typography>}
                              />
                            </RadioGroup>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Submit / Update Action Button */}
                <Box sx={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  {existingSession ? (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<EditIcon />}
                      onClick={() => setOpenEditDialog(true)}
                      disabled={saving || students.length === 0}
                      sx={{
                        bgcolor: '#2563eb',
                        '&:hover': { bgcolor: '#1d4ed8' },
                        fontWeight: 800,
                        px: 4,
                        textTransform: 'none',
                        borderRadius: 2.5,
                      }}
                    >
                      {saving ? 'Updating Records...' : 'Update Submitted Attendance'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<SaveIcon />}
                      onClick={handleSubmitAttendance}
                      disabled={saving || students.length === 0}
                      sx={{
                        bgcolor: '#0f172a',
                        '&:hover': { bgcolor: '#1e293b' },
                        fontWeight: 800,
                        px: 4,
                        textTransform: 'none',
                        borderRadius: 2.5,
                      }}
                    >
                      {saving ? 'Recording Attendance...' : 'Save & Submit Attendance'}
                    </Button>
                  )}
                </Box>
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Live Session Summary & Quick Logs */}
        <Grid item xs={12} lg={4}>
          {/* Live Roll-Call Stats Card */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
              Session Roll-Call Summary
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                    Attendance Rate
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: attendanceRate >= 75 ? '#16a34a' : '#ea580c' }}>
                    {attendanceRate}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={attendanceRate}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: '#f1f5f9',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: attendanceRate >= 75 ? '#22c55e' : '#f97316',
                    },
                  }}
                />
              </Box>

              <Grid container spacing={1.5}>
                <Grid item xs={4}>
                  <Box sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#16a34a' }}>
                      {presentCount}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534' }}>
                      Present
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ p: 1.5, textAlign: 'center', bgcolor: '#fefce8', borderRadius: 2, border: '1px solid #fef08a' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#ca8a04' }}>
                      {lateCount}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#854d0e' }}>
                      Late (0.5)
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ p: 1.5, textAlign: 'center', bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #fecaca' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#dc2626' }}>
                      {absentCount}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#991b1b' }}>
                      Absent
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider />

              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Total Enrolled:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>{totalStudents} Students</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Selected Class:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>{currentItem?.classDivision?.name || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Subject Code:</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>{currentItem?.subject?.code || 'N/A'}</Typography>
                </Box>
              </Stack>
            </Stack>
          </Paper>

          {/* Recent Recorded Sessions Feed */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <HistoryIcon sx={{ color: '#2563eb' }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Recent Sessions
                </Typography>
              </Stack>
              <Chip label={`${history.length} Logs`} size="small" sx={{ fontWeight: 700 }} />
            </Box>

            {history.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                No past attendance sessions recorded yet.
              </Typography>
            ) : (
              <Stack spacing={1.5} sx={{ maxHeight: 380, overflowY: 'auto' }}>
                {history.slice(0, 6).map((item) => (
                  <Paper
                    key={item._id}
                    elevation={0}
                    onClick={() => setSelectedHistoryItem(item)}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: '1px solid #f1f5f9',
                      bgcolor: '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      '&:hover': { borderColor: '#94a3b8', bgcolor: '#ffffff' },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        {item.subject?.code} - {item.classDivision?.name}
                      </Typography>
                      <Chip
                        label={`${item.summary?.attendanceRate || 0}%`}
                        size="small"
                        color={item.summary?.attendanceRate >= 75 ? 'success' : 'warning'}
                        sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.5 }}>
                      {new Date(item.date).toLocaleDateString()} &bull; {item.startTime} - {item.endTime}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', fontWeight: 600, fontSize: '0.8rem', noWrap: true }}>
                      Topic: {item.topic}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            )}

            <Button
              fullWidth
              variant="text"
              component={Link}
              to="/faculty/attendance-history"
              sx={{ mt: 2, fontWeight: 700, textTransform: 'none', color: '#2563eb' }}
            >
              View Full History Table &rarr;
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit Correction Confirmation Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
          Correct Attendance Records
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Alert severity="warning">
              You are updating an already submitted attendance session. All changes will be logged in the permanent audit trail.
            </Alert>
            <TextField
              fullWidth
              label="Correction Reason / Justification"
              placeholder="e.g., Medical certificate received for student / Late arrival verified"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              required
            />
            <TextField
              fullWidth
              label="Lecture Topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Total students in roll call: {students.length} | Present: {presentCount} | Late: {lateCount} | Absent: {absentCount}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEditDialog(false)} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmUpdate}
            disabled={saving || !editReason.trim()}
            sx={{ textTransform: 'none', fontWeight: 800, bgcolor: '#2563eb' }}
          >
            {saving ? 'Saving Correction...' : 'Confirm & Save Correction'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog for Quick Historical Inspect */}
      <Dialog
        open={Boolean(selectedHistoryItem)}
        onClose={() => setSelectedHistoryItem(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
          Recorded Lecture Attendance Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedHistoryItem && (
            <Stack spacing={2.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {selectedHistoryItem.subject?.name} ({selectedHistoryItem.subject?.code})
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Class Division: {selectedHistoryItem.classDivision?.name} &bull; Date: {new Date(selectedHistoryItem.date).toLocaleDateString()} ({selectedHistoryItem.startTime} - {selectedHistoryItem.endTime})
                  </Typography>
                </Box>
                <Chip
                  label={`${selectedHistoryItem.summary?.attendanceRate}% Attendance`}
                  color={selectedHistoryItem.summary?.attendanceRate >= 75 ? 'success' : 'warning'}
                  sx={{ fontWeight: 800 }}
                />
              </Box>

              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Topic Taught:
                </Typography>
                <Typography variant="body2" sx={{ color: '#334155' }}>
                  {selectedHistoryItem.topic}
                </Typography>
              </Box>

              {/* Student status badges */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Student Roll Call Records ({selectedHistoryItem.records?.length || 0}):
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', maxHeight: 300 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Roll No</TableCell>
                      <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedHistoryItem.records?.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.student?.fullName || 'Student'}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.student?.studentId || 'N/A'}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip
                            label={r.status}
                            size="small"
                            color={r.status === 'Present' ? 'success' : r.status === 'Late' ? 'warning' : 'error'}
                            sx={{ fontWeight: 700, minWidth: 70 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedHistoryItem(null)} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacultyAttendancePage;
