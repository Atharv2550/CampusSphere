import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  FactCheck as AttendanceIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  AccessTime as LateIcon,
  Save as SaveIcon,
  History as HistoryIcon,
  Class as ClassIcon,
  Search as SearchIcon,
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

  // Attendance History
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

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
        loadStudentsForClass(subs[0]);
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
    }
  };

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

  const handleSubmitAttendance = async () => {
    if (!topic.trim()) {
      showError('Please enter the syllabus lecture topic taught today.');
      return;
    }

    const currentItem = assignedSubjects[Number(selectedSubjectKey)];
    if (!currentItem) {
      showError('Please select a valid subject and class cohort.');
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
      };

      const res = await api.post('/attendance', payload);
      showSuccess('Lecture attendance recorded successfully!');

      // Prepend to history
      setHistory((prev) => [res.data.data, ...prev]);
      setTopic('');
    } catch (err) {
      console.error('Save attendance error:', err);
      showError(err.response?.data?.message || 'Failed to record lecture attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Metrics computation
  const totalStudents = students.length;
  const presentCount = Object.values(attendanceRecords).filter((s) => s === 'Present').length;
  const lateCount = Object.values(attendanceRecords).filter((s) => s === 'Late').length;
  const absentCount = Object.values(attendanceRecords).filter((s) => s === 'Absent').length;
  const attendanceRate = totalStudents > 0 ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0;

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
      <Box sx={{ mb: 3.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <Box sx={{ p: 1, bgcolor: '#eff6ff', borderRadius: 2 }}>
            <AttendanceIcon sx={{ color: '#2563eb', fontSize: 28 }} />
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
      </Box>

      <Grid container spacing={3.5}>
        {/* Left Column: Live Attendance Taking */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ p: 3, mb: 3.5, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
              Roll Call & Lecture Verification
            </Typography>

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

                {/* Summary Rate Indicator */}
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #f1f5f9' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                      Current Attendance Rate: <strong>{attendanceRate}%</strong> ({presentCount + lateCount} / {totalStudents})
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="text" onClick={() => handleMarkAll('Present')} sx={{ fontSize: '0.75rem' }}>
                        All Present
                      </Button>
                      <Button size="small" variant="text" color="error" onClick={() => handleMarkAll('Absent')} sx={{ fontSize: '0.75rem' }}>
                        All Absent
                      </Button>
                    </Stack>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={attendanceRate}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: '#e2e8f0',
                      '& .MuiLinearProgress-bar': { bgcolor: attendanceRate >= 75 ? '#16a34a' : '#eab308' },
                    }}
                  />
                  <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
                    <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700 }}>
                      ✓ Present: {presentCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#eab308', fontWeight: 700 }}>
                      ⏰ Late: {lateCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700 }}>
                      ✗ Absent: {absentCount}
                    </Typography>
                  </Stack>
                </Box>

                {/* Student Attendance Roster Table */}
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Student ID</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Status</TableCell>
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

                <Box sx={{ textAlign: 'right' }}>
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
                    }}
                  >
                    {saving ? 'Recording Attendance...' : 'Save & Submit Attendance'}
                  </Button>
                </Box>
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Attendance History */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <HistoryIcon sx={{ color: '#2563eb' }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Recorded Sessions
                </Typography>
              </Stack>
              <Chip label={`${history.length} Logs`} size="small" sx={{ fontWeight: 700 }} />
            </Box>

            {history.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                No past attendance sessions recorded yet.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {history.map((item) => (
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
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {item.subject?.code} - {item.classDivision?.name}
                      </Typography>
                      <Chip
                        label={`${item.summary?.attendanceRate || 0}%`}
                        size="small"
                        color={item.summary?.attendanceRate >= 80 ? 'success' : 'warning'}
                        sx={{ fontWeight: 800, height: 20 }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, mb: 0.5 }}>
                      Topic: {item.topic}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      📅 {new Date(item.date).toLocaleDateString()} • ⏰ {item.startTime}-{item.endTime}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* History Detail Sheet Modal */}
      <Dialog
        open={Boolean(selectedHistoryItem)}
        onClose={() => setSelectedHistoryItem(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedHistoryItem && (
          <>
            <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
              Attendance Record Sheet — {new Date(selectedHistoryItem.date).toLocaleDateString()}
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>SUBJECT & CLASS</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                    {selectedHistoryItem.subject?.name} ({selectedHistoryItem.classDivision?.name})
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', mt: 0.5 }}>
                    Topic Taught: <strong>{selectedHistoryItem.topic}</strong>
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={3} sx={{ textAlign: 'center', p: 1, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#16a34a' }}>
                      {selectedHistoryItem.summary?.presentCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#16a34a' }}>Present</Typography>
                  </Grid>
                  <Grid item xs={3} sx={{ textAlign: 'center', p: 1, bgcolor: '#fefce8', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#ca8a04' }}>
                      {selectedHistoryItem.summary?.lateCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#ca8a04' }}>Late</Typography>
                  </Grid>
                  <Grid item xs={3} sx={{ textAlign: 'center', p: 1, bgcolor: '#fef2f2', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#dc2626' }}>
                      {selectedHistoryItem.summary?.absentCount}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#dc2626' }}>Absent</Typography>
                  </Grid>
                  <Grid item xs={3} sx={{ textAlign: 'center', p: 1, bgcolor: '#eff6ff', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#2563eb' }}>
                      {selectedHistoryItem.summary?.attendanceRate}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#2563eb' }}>Rate</Typography>
                  </Grid>
                </Grid>

                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', maxHeight: 260 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedHistoryItem.records?.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontWeight: 600 }}>{r.student?.fullName || `Student #${i + 1}`}</TableCell>
                          <TableCell sx={{ textAlign: 'right' }}>
                            <Chip
                              label={r.status}
                              size="small"
                              color={r.status === 'Present' ? 'success' : r.status === 'Late' ? 'warning' : 'error'}
                              sx={{ fontWeight: 700, height: 20 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setSelectedHistoryItem(null)} sx={{ textTransform: 'none' }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
