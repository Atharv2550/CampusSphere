import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  IconButton,
  Tabs,
  Tab,
  Skeleton,
} from '@mui/material';
import {
  CalendarMonth as TimetableIcon,
  Add as AddIcon,
  SwapHoriz as DutiesIcon,
  Delete as DeleteIcon,
  Warning as ConflictIcon,
  CheckCircle as ValidIcon,
  Class as ClassIcon,
  MenuBook as SubjectIcon,
} from '@mui/icons-material';

import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const AdminTimetableManagement = ({ initialFacultyId = null, autoOpenTimetable = false }) => {
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [duties, setDuties] = useState([]);
  const [facultyUsers, setFacultyUsers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subTab, setSubTab] = useState(0); // 0 = Timetable Entries, 1 = Duties & Substitutions
  const [facultyFilter, setFacultyFilter] = useState(initialFacultyId || 'all');

  // Timetable Dialog
  const [openTimetableModal, setOpenTimetableModal] = useState(false);
  const [timetableForm, setTimetableForm] = useState({
    faculty: initialFacultyId || '',
    subject: '',
    classDivision: '',
    department: '',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    room: 'LH-201',
    activityType: 'Theory',
    status: 'Published',
    notes: '',
  });
  const [conflictCheckResult, setConflictCheckResult] = useState(null);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [savingEntry, setSavingEntry] = useState(false);

  // Duty Dialog
  const [openDutyModal, setOpenDutyModal] = useState(false);
  const [dutyForm, setDutyForm] = useState({
    faculty: initialFacultyId || '',
    originalFaculty: '',
    type: 'Examination Invigilation',
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '16:00',
    room: 'Exam Hall 101',
    reason: '',
    notes: '',
  });
  const [savingDuty, setSavingDuty] = useState(false);

  // Quick Subject / Class Dialogs
  const [openSubjectModal, setOpenSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', semester: 5, credits: 4, lectureHoursPerWeek: 4, description: '' });

  const [openClassModal, setOpenClassModal] = useState(false);
  const [classForm, setClassForm] = useState({ name: '', code: '', semester: 5, room: 'LH-201', studentCount: 35 });

  const loadAll = async () => {
    try {
      setLoading(true);
      const [entriesRes, dutiesRes, usersRes, subjectsRes, classesRes] = await Promise.all([
        api.get('/timetable/admin'),
        api.get('/duties/admin'),
        api.get('/admin/users'),
        api.get('/subjects'),
        api.get('/classes'),
      ]);

      setEntries(entriesRes.data.data || []);
      setDuties(dutiesRes.data.data || []);
      const allUsers = usersRes.data.data || [];
      const faculties = allUsers.filter((u) => u.role === 'faculty');
      setFacultyUsers(faculties);
      setSubjects(subjectsRes.data.data || []);
      setClasses(classesRes.data.data || []);

      if (faculties.length > 0) {
        const targetFac = initialFacultyId
          ? (faculties.find((f) => f._id === initialFacultyId) || faculties[0])
          : faculties[0];

        setTimetableForm((prev) => ({
          ...prev,
          faculty: targetFac._id,
          department: targetFac.department?._id || targetFac.department || '',
        }));
        setDutyForm((prev) => ({ ...prev, faculty: targetFac._id }));
      }
      if (subjectsRes.data.data?.length > 0) {
        setTimetableForm((prev) => ({ ...prev, subject: subjectsRes.data.data[0]._id }));
      }
      if (classesRes.data.data?.length > 0) {
        setTimetableForm((prev) => ({ ...prev, classDivision: classesRes.data.data[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load timetable admin data:', err);
      showError('Failed to load timetable administration records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (initialFacultyId) {
      setFacultyFilter(initialFacultyId);
      if (facultyUsers.length > 0) {
        const targetFac = facultyUsers.find((f) => f._id === initialFacultyId);
        if (targetFac) {
          setTimetableForm((prev) => ({
            ...prev,
            faculty: targetFac._id,
            department: targetFac.department?._id || targetFac.department || prev.department,
          }));
          setDutyForm((prev) => ({ ...prev, faculty: targetFac._id }));
        }
      }
      if (autoOpenTimetable) {
        setOpenTimetableModal(true);
      }
    }
  }, [initialFacultyId, facultyUsers, autoOpenTimetable]);

  const handleCheckConflict = async () => {
    try {
      setCheckingConflict(true);
      setConflictCheckResult(null);

      const res = await api.post('/timetable/check-conflict', {
        faculty: timetableForm.faculty,
        room: timetableForm.room,
        classDivision: timetableForm.classDivision,
        dayOfWeek: timetableForm.dayOfWeek,
        startTime: timetableForm.startTime,
        endTime: timetableForm.endTime,
      });

      setConflictCheckResult(res.data);
      if (res.data.hasConflict) {
        showError('Schedule conflict detected! Review overlapping items below.');
      } else {
        showSuccess('Slot is clear! No overlapping faculty, room, or class schedules.');
      }
    } catch (err) {
      console.error('Conflict check error:', err);
      showError('Conflict check failed.');
    } finally {
      setCheckingConflict(false);
    }
  };

  const handleCreateTimetableEntry = async () => {
    if (!timetableForm.faculty || !timetableForm.subject || !timetableForm.classDivision) {
      showError('Please select faculty, subject, and class division.');
      return;
    }

    try {
      setSavingEntry(true);
      await api.post('/timetable/admin', timetableForm);
      showSuccess('Timetable entry created, published, and faculty notified!');
      setOpenTimetableModal(false);
      setConflictCheckResult(null);
      loadAll();
    } catch (err) {
      console.error('Create timetable entry error:', err);
      showError(err.response?.data?.message || 'Failed to create timetable entry.');
    } finally {
      setSavingEntry(false);
    }
  };

  const handleDeleteTimetableEntry = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and delete this timetable assignment?')) return;
    try {
      await api.delete(`/timetable/admin/${id}`);
      showSuccess('Timetable entry removed and faculty notified.');
      setEntries((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      showError('Failed to delete timetable entry.');
    }
  };

  const handleCreateDuty = async () => {
    if (!dutyForm.title.trim() || !dutyForm.faculty) {
      showError('Please specify duty title and assigned faculty.');
      return;
    }
    try {
      setSavingDuty(true);
      await api.post('/duties/admin', dutyForm);
      showSuccess('Duty assignment created and faculty notified!');
      setOpenDutyModal(false);
      loadAll();
    } catch (err) {
      console.error('Create duty error:', err);
      showError(err.response?.data?.message || 'Failed to assign duty.');
    } finally {
      setSavingDuty(false);
    }
  };

  const handleDeleteDuty = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this duty assignment?')) return;
    try {
      await api.delete(`/duties/admin/${id}`);
      showSuccess('Duty assignment cancelled.');
      setDuties((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      showError('Failed to cancel duty.');
    }
  };

  const handleCreateSubject = async () => {
    if (!subjectForm.name || !subjectForm.code) return;
    try {
      const deptId = facultyUsers[0]?.department?._id || facultyUsers[0]?.department;
      await api.post('/subjects', { ...subjectForm, department: deptId });
      showSuccess('Subject created successfully!');
      setOpenSubjectModal(false);
      loadAll();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create subject.');
    }
  };

  const handleCreateClass = async () => {
    if (!classForm.name || !classForm.code) return;
    try {
      const deptId = facultyUsers[0]?.department?._id || facultyUsers[0]?.department;
      await api.post('/classes', { ...classForm, department: deptId });
      showSuccess('Class cohort created successfully!');
      setOpenClassModal(false);
      loadAll();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create class division.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 3 }}>
        <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Action Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Faculty Timetable & Academic Duty Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Schedule recurring lecture timetables, detect room/faculty conflicts, and coordinate duties & substitutions
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          <Button
            variant="outlined"
            size="small"
            startIcon={<SubjectIcon />}
            onClick={() => setOpenSubjectModal(true)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            + Add Subject
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ClassIcon />}
            onClick={() => setOpenClassModal(true)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            + Add Class
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DutiesIcon />}
            onClick={() => setOpenDutyModal(true)}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            + Assign Duty / Sub
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setOpenTimetableModal(true)}
            sx={{ bgcolor: '#0f172a', textTransform: 'none', fontWeight: 700 }}
          >
            + Schedule Timetable Entry
          </Button>
        </Stack>
      </Box>

      {/* Sub Tabs */}
      <Tabs
        value={subTab}
        onChange={(_, val) => setSubTab(val)}
        sx={{ mb: 3, borderBottom: '1px solid #e2e8f0' }}
      >
        <Tab label={`Weekly Timetable Entries (${entries.length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
        <Tab label={`Duties & Substitutions (${duties.length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
      </Tabs>

      {/* Tab 0: Timetable Entries Table */}
      {subTab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TextField
                select
                size="small"
                label="Filter by Faculty Member"
                value={facultyFilter}
                onChange={(e) => setFacultyFilter(e.target.value)}
                sx={{ minWidth: 280 }}
              >
                <MenuItem value="all">All Faculty Members ({entries.length} slots)</MenuItem>
                {facultyUsers.map((f) => (
                  <MenuItem key={f._id} value={f._id}>
                    Prof. {f.fullName} {f.employeeId ? `(${f.employeeId})` : ''}
                  </MenuItem>
                ))}
              </TextField>

              {facultyFilter !== 'all' && (
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setFacultyFilter('all')}
                  sx={{ textTransform: 'none', color: '#64748b' }}
                >
                  Clear Filter (Show All)
                </Button>
              )}
            </Box>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Day & Time</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Faculty Member</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Class Cohort</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Room / Lab</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(facultyFilter === 'all'
                  ? entries
                  : entries.filter((item) => (item.faculty?._id || item.faculty) === facultyFilter)
                ).map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {item.dayOfWeek}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 700 }}>
                      {item.startTime} – {item.endTime}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                    Prof. {item.faculty?.fullName || 'Faculty Member'}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {item.subject?.code}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {item.subject?.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{item.classDivision?.name}</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0284c7' }}>{item.room}</TableCell>
                  <TableCell>
                    <Chip label={item.activityType} size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={item.status} color="success" size="small" sx={{ fontWeight: 700, height: 20 }} />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <IconButton size="small" color="error" onClick={() => handleDeleteTimetableEntry(item._id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        </Box>
      )}

      {/* Tab 1: Duties & Substitutions Table */}
      {subTab === 1 && (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Duty Type</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Assigned Faculty</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Date & Time</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Room</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {duties.map((duty) => (
                <TableRow key={duty._id} hover>
                  <TableCell>
                    <Chip
                      label={duty.type}
                      size="small"
                      color={duty.type === 'Substitution' ? 'secondary' : 'default'}
                      sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{duty.title}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Prof. {duty.faculty?.fullName}</TableCell>
                  <TableCell sx={{ color: '#475569' }}>
                    {new Date(duty.date).toLocaleDateString()} • {duty.startTime}-{duty.endTime}
                  </TableCell>
                  <TableCell sx={{ color: '#0284c7', fontWeight: 600 }}>{duty.room || 'Campus'}</TableCell>
                  <TableCell>
                    <Chip
                      label={duty.status}
                      size="small"
                      color={duty.status === 'Completed' ? 'success' : duty.status === 'Acknowledged' ? 'info' : 'warning'}
                      sx={{ fontWeight: 700, height: 20 }}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <IconButton size="small" color="error" onClick={() => handleDeleteDuty(duty._id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Timetable Entry Modal */}
      <Dialog
        open={openTimetableModal}
        onClose={() => setOpenTimetableModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
          Schedule Recurring Weekly Timetable Entry
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <TextField
              select
              fullWidth
              label="Select Faculty Member"
              value={timetableForm.faculty}
              onChange={(e) => {
                const f = facultyUsers.find((u) => u._id === e.target.value);
                setTimetableForm({
                  ...timetableForm,
                  faculty: e.target.value,
                  department: f?.department?._id || f?.department || timetableForm.department,
                });
              }}
              size="small"
            >
              {facultyUsers.map((f) => (
                <MenuItem key={f._id} value={f._id}>
                  Prof. {f.fullName} {f.employeeId ? `(${f.employeeId})` : ''} {f.designation ? `— ${f.designation}` : `(${f.email})`}
                </MenuItem>
              ))}
            </TextField>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="Subject"
                  value={timetableForm.subject}
                  onChange={(e) => setTimetableForm({ ...timetableForm, subject: e.target.value })}
                  size="small"
                >
                  {subjects.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.code} - {s.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="Class Cohort"
                  value={timetableForm.classDivision}
                  onChange={(e) => setTimetableForm({ ...timetableForm, classDivision: e.target.value })}
                  size="small"
                >
                  {classes.map((c) => (
                    <MenuItem key={c._id} value={c._id}>
                      {c.name} (Sem {c.semester})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="Day of Week"
                  value={timetableForm.dayOfWeek}
                  onChange={(e) => setTimetableForm({ ...timetableForm, dayOfWeek: e.target.value })}
                  size="small"
                >
                  {DAYS.map((d) => (
                    <MenuItem key={d} value={d}>
                      {d}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="Activity Type"
                  value={timetableForm.activityType}
                  onChange={(e) => setTimetableForm({ ...timetableForm, activityType: e.target.value })}
                  size="small"
                >
                  <MenuItem value="Theory">Theory Lecture</MenuItem>
                  <MenuItem value="Laboratory">Laboratory Session</MenuItem>
                  <MenuItem value="Practical">Practical Workshop</MenuItem>
                  <MenuItem value="Tutorial">Tutorial / Mentoring</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="Start Time (HH:mm)"
                  value={timetableForm.startTime}
                  onChange={(e) => setTimetableForm({ ...timetableForm, startTime: e.target.value })}
                  size="small"
                  fullWidth
                  placeholder="09:00"
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  label="End Time (HH:mm)"
                  value={timetableForm.endTime}
                  onChange={(e) => setTimetableForm({ ...timetableForm, endTime: e.target.value })}
                  size="small"
                  fullWidth
                  placeholder="10:00"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Designated Classroom or Laboratory"
                  value={timetableForm.room}
                  onChange={(e) => setTimetableForm({ ...timetableForm, room: e.target.value })}
                  size="small"
                  fullWidth
                  placeholder="e.g., LH-201, Advanced Computing Lab-3"
                  required
                />
              </Grid>
            </Grid>

            {/* Conflict Check Feedback */}
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                  Pre-Publish Conflict Verification
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleCheckConflict}
                  disabled={checkingConflict}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  {checkingConflict ? 'Auditing...' : 'Check Slot Conflict'}
                </Button>
              </Box>

              {conflictCheckResult && (
                <Box sx={{ mt: 1.5 }}>
                  {conflictCheckResult.hasConflict ? (
                    <Alert severity="error" icon={<ConflictIcon />} sx={{ py: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                        Conflict Detected:
                      </Typography>
                      {conflictCheckResult.conflicts?.map((c, i) => (
                        <Typography key={i} variant="caption" sx={{ display: 'block' }}>
                          • {c}
                        </Typography>
                      ))}
                    </Alert>
                  ) : (
                    <Alert severity="success" icon={<ValidIcon />} sx={{ py: 0.5 }}>
                      Slot is completely clear! No overlapping faculty, room, or student cohort sessions.
                    </Alert>
                  )}
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenTimetableModal(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateTimetableEntry}
            disabled={savingEntry}
            sx={{ bgcolor: '#0f172a', textTransform: 'none', fontWeight: 700 }}
          >
            {savingEntry ? 'Publishing...' : 'Save & Publish to Faculty'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Duty / Substitution Modal */}
      <Dialog
        open={openDutyModal}
        onClose={() => setOpenDutyModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
          Assign Faculty Duty or Lecture Substitution
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="Duty Responsibility Type"
                  value={dutyForm.type}
                  onChange={(e) => setDutyForm({ ...dutyForm, type: e.target.value })}
                  size="small"
                >
                  <MenuItem value="Examination Invigilation">Examination Invigilation</MenuItem>
                  <MenuItem value="Substitution">Lecture Substitution</MenuItem>
                  <MenuItem value="Department Meeting">Department Meeting</MenuItem>
                  <MenuItem value="Event Supervision">Event Supervision</MenuItem>
                  <MenuItem value="Committee Duty">Committee Duty</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="Assigned Faculty"
                  value={dutyForm.faculty}
                  onChange={(e) => setDutyForm({ ...dutyForm, faculty: e.target.value })}
                  size="small"
                >
                  {facultyUsers.map((f) => (
                    <MenuItem key={f._id} value={f._id}>
                      Prof. {f.fullName} {f.employeeId ? `(${f.employeeId})` : ''} {f.designation ? `— ${f.designation}` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {dutyForm.type === 'Substitution' && (
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Original Instructor (To be Substituted)"
                    value={dutyForm.originalFaculty}
                    onChange={(e) => setDutyForm({ ...dutyForm, originalFaculty: e.target.value })}
                    size="small"
                  >
                    {facultyUsers.map((f) => (
                      <MenuItem key={f._id} value={f._id}>
                        Prof. {f.fullName} {f.employeeId ? `(${f.employeeId})` : ''} {f.designation ? `— ${f.designation}` : ''}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Duty Title / Subject"
                  placeholder="e.g., Mid-Term Exam Duty - Operating Systems"
                  value={dutyForm.title}
                  onChange={(e) => setDutyForm({ ...dutyForm, title: e.target.value })}
                  size="small"
                  required
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  type="date"
                  fullWidth
                  label="Duty Date"
                  value={dutyForm.date}
                  onChange={(e) => setDutyForm({ ...dutyForm, date: e.target.value })}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={6} sm={4}>
                <TextField
                  label="Start Time"
                  value={dutyForm.startTime}
                  onChange={(e) => setDutyForm({ ...dutyForm, startTime: e.target.value })}
                  size="small"
                  fullWidth
                />
              </Grid>

              <Grid item xs={6} sm={4}>
                <TextField
                  label="End Time"
                  value={dutyForm.endTime}
                  onChange={(e) => setDutyForm({ ...dutyForm, endTime: e.target.value })}
                  size="small"
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Location / Room / Hall"
                  placeholder="e.g., Exam Hall 101, Conference Room A"
                  value={dutyForm.room}
                  onChange={(e) => setDutyForm({ ...dutyForm, room: e.target.value })}
                  size="small"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reason or Official Instructions"
                  placeholder="e.g., Official mid-term centralized university invigilation schedule"
                  value={dutyForm.reason}
                  onChange={(e) => setDutyForm({ ...dutyForm, reason: e.target.value })}
                  size="small"
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDutyModal(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateDuty}
            disabled={savingDuty}
            sx={{ bgcolor: '#0f172a', textTransform: 'none', fontWeight: 700 }}
          >
            {savingDuty ? 'Assigning...' : 'Assign Duty & Notify'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Add Subject Dialog */}
      <Dialog open={openSubjectModal} onClose={() => setOpenSubjectModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Academic Subject</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Subject Name"
              value={subjectForm.name}
              onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
              fullWidth
              size="small"
              placeholder="e.g., Cloud Computing & Kubernetes"
            />
            <TextField
              label="Subject Code"
              value={subjectForm.code}
              onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
              fullWidth
              size="small"
              placeholder="e.g., CS504"
            />
            <TextField
              type="number"
              label="Semester"
              value={subjectForm.semester}
              onChange={(e) => setSubjectForm({ ...subjectForm, semester: Number(e.target.value) })}
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenSubjectModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSubject} sx={{ bgcolor: '#0f172a' }}>
            Create Subject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Add Class Dialog */}
      <Dialog open={openClassModal} onClose={() => setOpenClassModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Class Division Cohort</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Division Name"
              value={classForm.name}
              onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              fullWidth
              size="small"
              placeholder="e.g., CSE-6A"
            />
            <TextField
              label="Class Code"
              value={classForm.code}
              onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
              fullWidth
              size="small"
              placeholder="e.g., CSE-6A"
            />
            <TextField
              type="number"
              label="Semester"
              value={classForm.semester}
              onChange={(e) => setClassForm({ ...classForm, semester: Number(e.target.value) })}
              fullWidth
              size="small"
            />
            <TextField
              label="Home Classroom"
              value={classForm.room}
              onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenClassModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateClass} sx={{ bgcolor: '#0f172a' }}>
            Create Class
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
