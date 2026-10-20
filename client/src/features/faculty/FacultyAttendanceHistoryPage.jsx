import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  LinearProgress,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Pagination,
  InputAdornment,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import {
  History as HistoryIcon,
  FactCheck as AttendanceIcon,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  AccessTime as LateIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon,
  Print as PrintIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  School as SubjectIcon,
  CalendarToday as CalendarIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const FacultyAttendanceHistoryPage = () => {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // Tab State: 0 = Session History, 1 = Student Report, 2 = Subject Analytics, 3 = Missing Lectures
  const [activeTab, setActiveTab] = useState(0);

  // Metadata Dropdowns
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [classes, setClasses] = useState([]);

  // --- TAB 1: Session-Level History State ---
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [totalSessionsCount, setTotalSessionsCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Filters
  const [filterSubject, setFilterSubject] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  // Selected Session for View / Detail Dialog
  const [selectedSession, setSelectedSession] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Session Correction / Edit Dialog State
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editRecords, setEditRecords] = useState({});
  const [editTopic, setEditTopic] = useState('');
  const [editReason, setEditReason] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // --- TAB 2: Individual Student Report State ---
  const [selectedClassForStudent, setSelectedClassForStudent] = useState('');
  const [classStudents, setClassStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentReport, setStudentReport] = useState(null);
  const [studentReportLoading, setStudentReportLoading] = useState(false);
  const [latePolicy, setLatePolicy] = useState('half'); // 'half' = 0.5, 'full' = 1.0, 'none' = 0.0

  // --- TAB 3: Subject & Class Reports State ---
  const [subjectReports, setSubjectReports] = useState([]);
  const [classReports, setClassReports] = useState([]);
  const [overallSummary, setOverallSummary] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // --- TAB 4: Missing Attendance State ---
  const [missingLectures, setMissingLectures] = useState([]);
  const [missingLoading, setMissingLoading] = useState(false);

  // 1. Initial Load of Assigned Subjects & Classes
  const initMetadata = async () => {
    try {
      const [subRes, classRes] = await Promise.all([
        api.get('/subjects/my'),
        api.get('/classes'),
      ]);
      setAssignedSubjects(subRes.data.data || []);
      setClasses(classRes.data.data || []);
    } catch (err) {
      console.error('Failed to load subjects/classes:', err);
    }
  };

  useEffect(() => {
    initMetadata();
  }, []);

  // 2. Fetch Sessions List with Filters & Pagination
  const fetchSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const params = {
        page: currentPage,
        limit,
      };
      if (filterSubject) params.subject = filterSubject;
      if (filterClass) params.classDivision = filterClass;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;
      if (filterStatus) params.status = filterStatus;
      if (filterSearch.trim()) params.search = filterSearch.trim();

      const res = await api.get('/attendance/sessions', { params });
      setSessions(res.data.data || []);
      setTotalSessionsCount(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Fetch sessions error:', err);
      showError('Failed to load attendance session history.');
    } finally {
      setSessionsLoading(false);
    }
  }, [currentPage, limit, filterSubject, filterClass, filterStartDate, filterEndDate, filterStatus, filterSearch, showError]);

  useEffect(() => {
    if (activeTab === 0) {
      fetchSessions();
    }
  }, [activeTab, fetchSessions]);

  // 3. Reset Filters
  const handleResetFilters = () => {
    setFilterSubject('');
    setFilterClass('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterStatus('');
    setFilterSearch('');
    setCurrentPage(1);
  };

  // 4. View Session Detail
  const handleViewSessionDetail = async (sessionId) => {
    try {
      setDetailLoading(true);
      const res = await api.get(`/attendance/sessions/${sessionId}`);
      setSelectedSession(res.data.data);
    } catch (err) {
      console.error('Fetch session detail error:', err);
      showError('Failed to load attendance session details.');
    } finally {
      setDetailLoading(false);
    }
  };

  // 5. Open Correction Dialog
  const handleOpenEditDialog = (session) => {
    setEditingSession(session);
    setEditTopic(session.topic || '');
    setEditReason('Attendance status correction by faculty');

    const map = {};
    if (session.records) {
      session.records.forEach((r) => {
        const sId = r.student?._id || r.student;
        if (sId) map[sId] = r.status || 'Present';
      });
    }
    setEditRecords(map);
    setOpenEditDialog(true);
  };

  // 6. Submit Attendance Correction (PATCH)
  const handleSaveCorrection = async () => {
    if (!editingSession?._id) return;
    if (!editReason.trim()) {
      showError('Please provide a valid correction justification.');
      return;
    }

    try {
      setSavingEdit(true);
      const recordsPayload = Object.entries(editRecords).map(([studentId, status]) => ({
        student: studentId,
        status,
      }));

      const res = await api.patch(`/attendance/sessions/${editingSession._id}`, {
        topic: editTopic.trim() || editingSession.topic,
        records: recordsPayload,
        reason: editReason.trim(),
        latePolicy: 'half',
      });

      showSuccess('Attendance session corrected and audit trail updated successfully!');
      setOpenEditDialog(false);

      // Refresh list and detail modal
      fetchSessions();
      if (selectedSession?._id === editingSession._id) {
        setSelectedSession(res.data.data);
      }
    } catch (err) {
      console.error('Correction save error:', err);
      showError(err.response?.data?.message || 'Failed to save attendance correction.');
    } finally {
      setSavingEdit(false);
    }
  };

  // 7. CSV Export
  const handleExportCSV = async () => {
    try {
      const params = {};
      if (filterSubject) params.subject = filterSubject;
      if (filterClass) params.classDivision = filterClass;
      if (filterStartDate) params.startDate = filterStartDate;
      if (filterEndDate) params.endDate = filterEndDate;

      const res = await api.get('/attendance/export-csv', {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess('Attendance report CSV downloaded successfully.');
    } catch (err) {
      console.error('Export CSV error:', err);
      showError('Failed to generate attendance CSV.');
    }
  };

  // 8. Print Handler
  const handlePrint = () => {
    window.print();
  };

  // 9. TAB 2: Class & Student Selection
  const handleClassSelectForStudent = async (classId) => {
    setSelectedClassForStudent(classId);
    setSelectedStudentId('');
    setStudentReport(null);
    if (!classId) {
      setClassStudents([]);
      return;
    }

    try {
      const res = await api.get(`/classes/${classId}/students`);
      setClassStudents(res.data.data || []);
    } catch (err) {
      console.error('Load class students error:', err);
      showError('Failed to load enrolled students.');
    }
  };

  const handleStudentSelect = async (studentId) => {
    setSelectedStudentId(studentId);
    if (!studentId) {
      setStudentReport(null);
      return;
    }

    try {
      setStudentReportLoading(true);
      const res = await api.get(`/attendance/student/${studentId}`, {
        params: { latePolicy },
      });
      setStudentReport(res.data);
    } catch (err) {
      console.error('Load student report error:', err);
      showError('Failed to load student attendance history.');
    } finally {
      setStudentReportLoading(false);
    }
  };

  // 10. TAB 3: Load Analytics Reports
  const loadAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const [subRes, clsRes, sumRes] = await Promise.all([
        api.get('/attendance/reports/subject'),
        api.get('/attendance/reports/class'),
        api.get('/attendance/reports/summary'),
      ]);
      setSubjectReports(subRes.data.data || []);
      setClassReports(clsRes.data.data || []);
      setOverallSummary(sumRes.data.data || null);
    } catch (err) {
      console.error('Load analytics error:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 2) {
      loadAnalytics();
    }
  }, [activeTab, loadAnalytics]);

  // 11. TAB 4: Load Missing Lectures
  const loadMissingLectures = useCallback(async () => {
    try {
      setMissingLoading(true);
      const res = await api.get('/attendance/missing');
      setMissingLectures(res.data.data || []);
    } catch (err) {
      console.error('Load missing lectures error:', err);
    } finally {
      setMissingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 3) {
      loadMissingLectures();
    }
  }, [activeTab, loadMissingLectures]);

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ p: 1, bgcolor: '#eff6ff', borderRadius: 2 }}>
            <HistoryIcon sx={{ color: '#2563eb', fontSize: 32 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Attendance History & Academic Reports
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Inspect date-wise lecture sessions, student roll-call records, institutional late policies, and unrecorded lectures
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={handleExportCSV}
            startIcon={<ExportIcon />}
            sx={{ fontWeight: 700, borderRadius: 2.5, textTransform: 'none' }}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            onClick={handlePrint}
            startIcon={<PrintIcon />}
            sx={{ fontWeight: 700, borderRadius: 2.5, textTransform: 'none' }}
          >
            Print View
          </Button>
          <Button
            variant="contained"
            component={Link}
            to="/faculty/attendance"
            startIcon={<AttendanceIcon />}
            sx={{
              fontWeight: 800,
              borderRadius: 2.5,
              textTransform: 'none',
              bgcolor: '#0f172a',
              '&:hover': { bgcolor: '#1e293b' },
            }}
          >
            Take Roll Call
          </Button>
        </Stack>
      </Box>

      {/* Navigation Tabs */}
      <Paper elevation={0} sx={{ mb: 3.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            '& .MuiTab-root': {
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.95rem',
              py: 2,
            },
          }}
        >
          <Tab icon={<HistoryIcon />} iconPosition="start" label="Session-Level History" />
          <Tab icon={<PersonIcon />} iconPosition="start" label="Individual Student Reports" />
          <Tab icon={<SubjectIcon />} iconPosition="start" label="Subject & Class Analytics" />
          <Tab
            icon={<WarningIcon />}
            iconPosition="start"
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>Missing / Unrecorded</span>
                {missingLectures.length > 0 && (
                  <Chip label={missingLectures.length} size="small" color="error" sx={{ height: 20, fontWeight: 800 }} />
                )}
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* ========================================================================= */}
      {/* TAB 0: SESSION-LEVEL HISTORY TABLE */}
      {/* ========================================================================= */}
      {activeTab === 0 && (
        <Stack spacing={3}>
          {/* Filters Bar */}
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Filter by Subject"
                  value={filterSubject}
                  onChange={(e) => {
                    setFilterSubject(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <MenuItem value="">All Assigned Subjects</MenuItem>
                  {assignedSubjects.map((sub, idx) => (
                    <MenuItem key={idx} value={sub.subject?._id}>
                      {sub.subject?.code} - {sub.subject?.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={2.5}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Class Division"
                  value={filterClass}
                  onChange={(e) => {
                    setFilterClass(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <MenuItem value="">All Classes</MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.name} ({cls.code})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  label="From Date"
                  value={filterStartDate}
                  onChange={(e) => {
                    setFilterStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  label="To Date"
                  value={filterEndDate}
                  onChange={(e) => {
                    setFilterEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search topic or unit..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchSessions()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            {/* Quick Filter Badges & Reset Button */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                  Status:
                </Typography>
                {['', 'Submitted', 'Corrected'].map((st) => (
                  <Chip
                    key={st}
                    label={st === '' ? 'All Statuses' : st}
                    size="small"
                    clickable
                    color={filterStatus === st ? 'primary' : 'default'}
                    onClick={() => {
                      setFilterStatus(st);
                      setCurrentPage(1);
                    }}
                    sx={{ fontWeight: 700 }}
                  />
                ))}
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={fetchSessions}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Refresh
                </Button>
                <Button
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={handleResetFilters}
                  color="inherit"
                  sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b' }}
                >
                  Clear Filters
                </Button>
              </Stack>
            </Box>
          </Paper>

          {/* Sessions Table */}
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff', overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Date & Weekday</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Time Slot</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Subject & Code</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Class Cohort</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#334155' }}>Lecture Topic</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#334155', textAlign: 'center' }}>Breakdown (P / L / A)</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#334155', textAlign: 'center' }}>Attendance Rate</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#334155', textAlign: 'center' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#334155', textAlign: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessionsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={9}>
                          <Skeleton variant="text" height={36} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : sessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} sx={{ py: 6, textAlign: 'center' }}>
                        <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 600 }}>
                          No recorded attendance sessions found matching the selected filters.
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleResetFilters}
                          sx={{ mt: 1.5, textTransform: 'none', fontWeight: 700 }}
                        >
                          Reset Filters
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((sess) => {
                      const d = new Date(sess.date);
                      const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                      const weekday = weekdayNames[d.getUTCDay()];
                      const dateStr = d.toLocaleDateString();
                      const rate = sess.summary?.attendanceRate || 0;

                      return (
                        <TableRow key={sess._id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                              {dateStr}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {weekday}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            {sess.startTime} - {sess.endTime}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                              {sess.subject?.code}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', maxWidth: 160, display: 'block', noWrap: true }}>
                              {sess.subject?.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={sess.classDivision?.name || 'Class'} size="small" sx={{ fontWeight: 600 }} />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 220 }}>
                            <Tooltip title={sess.topic}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }} noWrap>
                                {sess.topic}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Chip label={`${sess.summary?.presentCount || 0} P`} size="small" color="success" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                              <Chip label={`${sess.summary?.lateCount || 0} L`} size="small" color="warning" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                              <Chip label={`${sess.summary?.absentCount || 0} A`} size="small" color="error" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center', minWidth: 110 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={rate}
                                sx={{
                                  flexGrow: 1,
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: '#f1f5f9',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: rate >= 75 ? '#22c55e' : '#f97316',
                                  },
                                }}
                              />
                              <Typography variant="caption" sx={{ fontWeight: 800, color: rate >= 75 ? '#16a34a' : '#ea580c' }}>
                                {rate}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Chip
                              label={sess.sessionStatus || 'Submitted'}
                              size="small"
                              color={sess.sessionStatus === 'Corrected' ? 'secondary' : 'default'}
                              sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }}
                            />
                          </TableCell>
                          <TableCell sx={{ textAlign: 'right' }}>
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="View Roll Call Details">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewSessionDetail(sess._id)}
                                  sx={{ color: '#2563eb' }}
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Correct Attendance">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenEditDialog(sess)}
                                  sx={{ color: '#0f172a' }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Toolbar */}
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Showing {sessions.length} of {totalSessionsCount} recorded lecture sessions
              </Typography>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, p) => setCurrentPage(p)}
                color="primary"
                shape="rounded"
                size="small"
              />
            </Box>
          </Paper>
        </Stack>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: INDIVIDUAL STUDENT ATTENDANCE REPORT */}
      {/* ========================================================================= */}
      {activeTab === 1 && (
        <Stack spacing={3}>
          {/* Student Selector Card */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
              Select Student to Generate Comprehensive Attendance Dossier
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={5}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Select Class Cohort"
                  value={selectedClassForStudent}
                  onChange={(e) => handleClassSelectForStudent(e.target.value)}
                >
                  <MenuItem value="">Select a Class Division...</MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.name} ({cls.code}) - Sem {cls.semester}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={5}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Select Student"
                  value={selectedStudentId}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  disabled={!selectedClassForStudent || classStudents.length === 0}
                >
                  <MenuItem value="">Choose an enrolled student...</MenuItem>
                  {classStudents.map((st) => (
                    <MenuItem key={st._id} value={st._id}>
                      {st.fullName} ({st.studentId || st.email})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={2}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Late Attendance Policy"
                  value={latePolicy}
                  onChange={(e) => {
                    setLatePolicy(e.target.value);
                    if (selectedStudentId) {
                      handleStudentSelect(selectedStudentId);
                    }
                  }}
                >
                  <MenuItem value="half">0.5 Credit (Standard)</MenuItem>
                  <MenuItem value="full">1.0 Credit (Full)</MenuItem>
                  <MenuItem value="none">0.0 Credit (None)</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          {/* Student Report Content */}
          {studentReportLoading ? (
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
          ) : !studentReport ? (
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <PersonIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>
                No Student Selected
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Select a class cohort and student above to inspect their attendance history, subject breakdown, and missed lectures.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={3}>
              {/* Profile & KPI Summary Row */}
              <Grid container spacing={2.5}>
                {/* Student Profile Card */}
                <Grid item xs={12} md={4}>
                  <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Avatar sx={{ width: 56, height: 56, bgcolor: '#2563eb', fontSize: '1.4rem', fontWeight: 800 }}>
                        {studentReport.student?.fullName?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {studentReport.student?.fullName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {studentReport.student?.email}
                        </Typography>
                        <Chip
                          label={studentReport.student?.studentId || 'STU-ID'}
                          size="small"
                          sx={{ mt: 0.5, fontFamily: 'monospace', fontWeight: 700 }}
                        />
                      </Box>
                    </Stack>
                    <Divider sx={{ my: 1.5 }} />
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>Department:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{studentReport.student?.department?.name || 'CSE'}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>Late Credit Applied:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563eb' }}>
                          {latePolicy === 'half' ? '50% Credit (0.5)' : latePolicy === 'full' ? '100% Credit (1.0)' : '0% Credit'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Overall Attendance Metrics */}
                <Grid item xs={12} md={8}>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Paper elevation={0} sx={{ p: 2.5, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {studentReport.overallMetrics?.totalEligibleLectures || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748b', mt: 0.5 }}>
                          Eligible Lectures
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                      <Paper elevation={0} sx={{ p: 2.5, textAlign: 'center', borderRadius: 3, border: '1px solid #bbf7d0', bgcolor: '#f0fdf4' }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#16a34a' }}>
                          {studentReport.overallMetrics?.presentCount || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#166534', mt: 0.5 }}>
                          Present Lectures
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                      <Paper elevation={0} sx={{ p: 2.5, textAlign: 'center', borderRadius: 3, border: '1px solid #fef08a', bgcolor: '#fefce8' }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#ca8a04' }}>
                          {studentReport.overallMetrics?.lateCount || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#854d0e', mt: 0.5 }}>
                          Late Arrivals
                        </Typography>
                      </Paper>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                      <Paper elevation={0} sx={{ p: 2.5, textAlign: 'center', borderRadius: 3, border: '1px solid #fecaca', bgcolor: '#fef2f2' }}>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#dc2626' }}>
                          {studentReport.overallMetrics?.absentCount || 0}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#991b1b', mt: 0.5 }}>
                          Missed (Absent)
                        </Typography>
                      </Paper>
                    </Grid>

                    {/* Overall Attendance Percentage Bar */}
                    <Grid item xs={12}>
                      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                            Overall Attendance Ratio (Formula: [Attended / Total] &times; 100)
                          </Typography>
                          <Chip
                            label={`${studentReport.overallMetrics?.attendancePercentage || 0}%`}
                            color={studentReport.overallMetrics?.attendancePercentage >= 75 ? 'success' : 'warning'}
                            sx={{ fontWeight: 800, fontSize: '0.9rem' }}
                          />
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={studentReport.overallMetrics?.attendancePercentage || 0}
                          sx={{
                            height: 10,
                            borderRadius: 5,
                            bgcolor: '#f1f5f9',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: studentReport.overallMetrics?.attendancePercentage >= 75 ? '#22c55e' : '#f97316',
                            },
                          }}
                        />
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              {/* Subject-Wise Summary Cards */}
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Subject-Wise Performance Breakdown
              </Typography>
              <Grid container spacing={2}>
                {studentReport.subjectSummaries?.map((sub, i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {sub.subject?.code}
                        </Typography>
                        <Chip
                          label={`${sub.attendancePercentage}%`}
                          size="small"
                          color={sub.attendancePercentage >= 75 ? 'success' : 'warning'}
                          sx={{ fontWeight: 800 }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }} noWrap>
                        {sub.subject?.name}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Stack direction="row" spacing={1} justifyContent="space-between">
                        <Typography variant="caption" sx={{ color: '#64748b' }}>Total: {sub.totalEligible}</Typography>
                        <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 700 }}>Present: {sub.present}</Typography>
                        <Typography variant="caption" sx={{ color: '#ca8a04', fontWeight: 700 }}>Late: {sub.late}</Typography>
                        <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700 }}>Absent: {sub.absent}</Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Date-Wise Roll Call History Table */}
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Chronological Lecture History ({studentReport.history?.length || 0} Sessions)
              </Typography>
              <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff', overflow: 'hidden' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Date & Day</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Time Slot</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Subject</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Topic Covered</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Remarks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {studentReport.history?.map((h, i) => (
                        <TableRow key={i} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {new Date(h.date).toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {h.weekday}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>
                            {h.startTime} - {h.endTime}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{h.subject?.code}</Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 260 }}>
                            <Typography variant="body2" noWrap>{h.topic}</Typography>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Chip
                              label={h.status}
                              size="small"
                              color={h.status === 'Present' ? 'success' : h.status === 'Late' ? 'warning' : 'error'}
                              sx={{ fontWeight: 700, minWidth: 70 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {h.remarks || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Stack>
          )}
        </Stack>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUBJECT & CLASS ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 2 && (
        <Stack spacing={3}>
          {analyticsLoading ? (
            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3 }} />
          ) : (
            <>
              {/* Overall Faculty Attendance Metrics */}
              {overallSummary && (
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Paper elevation={0} sx={{ p: 2.5, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {overallSummary.totalSessions || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748b', mt: 0.5 }}>
                        Lectures Conducted
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Paper elevation={0} sx={{ p: 2.5, textAlign: 'center', borderRadius: 3, border: '1px solid #bbf7d0', bgcolor: '#f0fdf4' }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#16a34a' }}>
                        {overallSummary.averageAttendanceRate || 0}%
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#166534', mt: 0.5 }}>
                        Average Attendance
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Paper elevation={0} sx={{ p: 2.5, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#2563eb' }}>
                        {overallSummary.distinctStudentsCount || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#64748b', mt: 0.5 }}>
                        Students Enrolled
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Paper elevation={0} sx={{ p: 2.5, textAlign: 'center', borderRadius: 3, border: '1px solid #fecaca', bgcolor: '#fef2f2' }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#dc2626' }}>
                        {overallSummary.totalAbsent || 0}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#991b1b', mt: 0.5 }}>
                        Total Absences Logged
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {/* Subject Breakdown Table */}
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Course / Subject-Wise Performance
              </Typography>
              <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff', overflow: 'hidden' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Course Code</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Subject Name</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Cohorts Taught</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Sessions Held</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Total Student Logs</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Avg Attendance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {subjectReports.map((sub, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{sub.subject?.code}</TableCell>
                          <TableCell>{sub.subject?.name}</TableCell>
                          <TableCell>{sub.classes?.join(', ') || 'CSE-5A'}</TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>{sub.totalSessions}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>{sub.totalEnrolledStudents}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Chip
                              label={`${sub.averageAttendanceRate}%`}
                              size="small"
                              color={sub.averageAttendanceRate >= 75 ? 'success' : 'warning'}
                              sx={{ fontWeight: 800 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Class Cohort Breakdown Table */}
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Class Division Cohort Analytics
              </Typography>
              <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff', overflow: 'hidden' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Class Division</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Division Code</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Subjects Assigned</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Sessions Conducted</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Average Attendance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {classReports.map((cls, idx) => (
                        <TableRow key={idx} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{cls.classDivision?.name}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{cls.classDivision?.code}</TableCell>
                          <TableCell>{cls.subjects?.join(', ')}</TableCell>
                          <TableCell sx={{ textAlign: 'center', fontWeight: 700 }}>{cls.totalSessions}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Chip
                              label={`${cls.averageAttendanceRate}%`}
                              size="small"
                              color={cls.averageAttendanceRate >= 75 ? 'success' : 'warning'}
                              sx={{ fontWeight: 800 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          )}
        </Stack>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MISSING / UNRECORDED ATTENDANCE SESSIONS */}
      {/* ========================================================================= */}
      {activeTab === 3 && (
        <Stack spacing={3}>
          <Alert severity="warning" icon={<WarningIcon />} sx={{ borderRadius: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Timetable Audit: Missing Attendance Warnings
            </Typography>
            <Typography variant="body2">
              The following lectures were scheduled on your official timetable during the past 7 days, but attendance has not yet been submitted.
            </Typography>
          </Alert>

          {missingLoading ? (
            <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 3 }} />
          ) : missingLectures.length === 0 ? (
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <PresentIcon sx={{ fontSize: 48, color: '#16a34a', mb: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#16a34a' }}>
                All Attendance Sessions are Up to Date!
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                There are no pending or missing attendance submissions from your scheduled weekly timetable.
              </Typography>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff', overflow: 'hidden' }}>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#fffbeb' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: '#92400e' }}>Expected Date & Day</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#92400e' }}>Scheduled Time</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#92400e' }}>Subject</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#92400e' }}>Class Cohort</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#92400e' }}>Room</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#92400e', textAlign: 'center' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#92400e', textAlign: 'right' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {missingLectures.map((m, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {new Date(m.date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600 }}>
                            {m.dayOfWeek}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {m.startTime} - {m.endTime}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{m.subject?.code}</Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>{m.subject?.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={m.classDivision?.name} size="small" />
                        </TableCell>
                        <TableCell>{m.room || 'Room 401'}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip label="Not Recorded" size="small" color="error" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'right' }}>
                          <Button
                            variant="contained"
                            size="small"
                            component={Link}
                            to="/faculty/attendance"
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              bgcolor: '#0f172a',
                              '&:hover': { bgcolor: '#1e293b' },
                            }}
                          >
                            Record Now
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Stack>
      )}

      {/* ========================================================================= */}
      {/* SESSION DETAILS DIALOG */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(selectedSession)}
        onClose={() => setSelectedSession(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Session Attendance Roll Call & Audit Trail</span>
          <Chip
            label={selectedSession?.sessionStatus || 'Submitted'}
            color={selectedSession?.sessionStatus === 'Corrected' ? 'secondary' : 'default'}
            sx={{ fontWeight: 800 }}
          />
        </DialogTitle>
        <DialogContent dividers>
          {selectedSession && (
            <Stack spacing={2.5}>
              {/* Header Info */}
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Course & Cohort:</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {selectedSession.subject?.code} - {selectedSession.subject?.name} ({selectedSession.classDivision?.name})
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Date & Weekday:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {new Date(selectedSession.date).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Time Slot:</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {selectedSession.startTime} - {selectedSession.endTime}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Syllabus Lecture Topic:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {selectedSession.topic}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* KPI Badges */}
              <Grid container spacing={1.5}>
                <Grid item xs={3}>
                  <Box sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f1f5f9', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedSession.summary?.totalStudents || 0}</Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>Total</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f0fdf4', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#16a34a' }}>{selectedSession.summary?.presentCount || 0}</Typography>
                    <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700 }}>Present</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box sx={{ p: 1.5, textAlign: 'center', bgcolor: '#fefce8', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#ca8a04' }}>{selectedSession.summary?.lateCount || 0}</Typography>
                    <Typography variant="caption" sx={{ color: '#854d0e', fontWeight: 700 }}>Late</Typography>
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Box sx={{ p: 1.5, textAlign: 'center', bgcolor: '#fef2f2', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#dc2626' }}>{selectedSession.summary?.absentCount || 0}</Typography>
                    <Typography variant="caption" sx={{ color: '#991b1b', fontWeight: 700 }}>Absent</Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Student Roll Call Records */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Enrolled Students Roll Call:
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, maxHeight: 280 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Student Name & Email</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Student ID</TableCell>
                      <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Attendance Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedSession.records?.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.student?.fullName}</Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>{r.student?.email}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{r.student?.studentId || 'N/A'}</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Chip
                            label={r.status}
                            size="small"
                            color={r.status === 'Present' ? 'success' : r.status === 'Late' ? 'warning' : 'error'}
                            sx={{ fontWeight: 700, minWidth: 70 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>{r.remarks || '-'}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Audit Trail / Edit History Section */}
              {selectedSession.editHistory && selectedSession.editHistory.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                    Audit Trail & Correction Log ({selectedSession.editHistory.length} Edits):
                  </Typography>
                  <Stack spacing={1}>
                    {selectedSession.editHistory.map((hist, idx) => (
                      <Paper key={idx} elevation={0} sx={{ p: 1.5, bgcolor: '#fdf4ff', border: '1px solid #f0abfc', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#86198f' }}>
                            Modified by: {hist.modifiedBy?.fullName || 'Faculty'} &bull; {new Date(hist.modifiedAt).toLocaleString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#701a75' }}>
                          Reason: {hist.reason}
                        </Typography>
                        {hist.changes?.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {hist.changes.map((ch, ci) => (
                              <Typography key={ci} variant="caption" sx={{ display: 'block', color: '#581c87' }}>
                                &bull; {ch.student?.fullName || 'Student'}: changed from <strong>{ch.previousStatus}</strong> &rarr; <strong>{ch.newStatus}</strong>
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => {
              const s = selectedSession;
              setSelectedSession(null);
              handleOpenEditDialog(s);
            }}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Correct This Session
          </Button>
          <Button onClick={() => setSelectedSession(null)} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* EDIT / CORRECTION DIALOG */}
      {/* ========================================================================= */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
          Correct Submitted Attendance Session
        </DialogTitle>
        <DialogContent dividers>
          {editingSession && (
            <Stack spacing={2.5}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Editing attendance will automatically record your faculty ID, modification timestamp, and status changes in the institutional audit log.
              </Alert>

              <TextField
                fullWidth
                size="small"
                label="Lecture Topic"
                value={editTopic}
                onChange={(e) => setEditTopic(e.target.value)}
              />

              <TextField
                fullWidth
                size="small"
                label="Reason for Correction"
                placeholder="e.g. Student provided medical note / Administrative roll-call adjustment"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                required
              />

              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Update Student Attendance Statuses:
              </Typography>

              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, maxHeight: 300 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Roll Number</TableCell>
                      <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Status Toggle</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {editingSession.records?.map((r) => {
                      const sId = r.student?._id || r.student;
                      return (
                        <TableRow key={sId}>
                          <TableCell sx={{ fontWeight: 600 }}>{r.student?.fullName || 'Student'}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{r.student?.studentId || 'N/A'}</TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <RadioGroup
                              row
                              value={editRecords[sId] || 'Present'}
                              onChange={(e) => setEditRecords((prev) => ({ ...prev, [sId]: e.target.value }))}
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
                                label={<Typography variant="caption" sx={{ fontWeight: 700, color: '#ca8a04' }}>L</Typography>}
                              />
                              <FormControlLabel
                                value="Absent"
                                control={<Radio size="small" color="error" />}
                                label={<Typography variant="caption" sx={{ fontWeight: 700, color: '#dc2626' }}>A</Typography>}
                              />
                            </RadioGroup>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEditDialog(false)} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveCorrection}
            disabled={savingEdit || !editReason.trim()}
            sx={{
              textTransform: 'none',
              fontWeight: 800,
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
            }}
          >
            {savingEdit ? 'Saving Correction...' : 'Confirm & Save Correction'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacultyAttendanceHistoryPage;
