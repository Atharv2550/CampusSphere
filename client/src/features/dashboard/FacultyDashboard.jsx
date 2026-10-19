import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Stack,
  Divider,
  Skeleton,
  Alert,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  CalendarMonth as TimetableIcon,
  Class as SubjectsIcon,
  FactCheck as AttendanceIcon,
  SwapHoriz as DutiesIcon,
  Campaign as AnnouncementIcon,
  Event as EventIcon,
  VolunteerActivism as VolunteerIcon,
  Groups as ClubsIcon,
  PendingActions as ApprovalsIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  ArrowForward as ArrowIcon,
  Add as AddIcon,
  CheckCircle as ConfirmedIcon,
  ReportProblem as ConflictIcon,
  School as SchoolIcon,
  AssignmentTurnedIn as CompleteIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const FacultyDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Conflict Report Dialog
  const [openConflictDialog, setOpenConflictDialog] = useState(false);
  const [conflictForm, setConflictForm] = useState({
    subject: '',
    conflictType: 'Room Double-Booking',
    description: '',
    preferredResolution: '',
  });

  const fetchFacultyDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/dashboard');
      setDashboardData(res.data.data);
    } catch (err) {
      console.error('Faculty dashboard load error:', err);
      setError('Unable to load live faculty dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyDashboard();
  }, []);

  const handleReportConflict = async () => {
    if (!conflictForm.description.trim()) {
      showError('Please provide a description of the timetable conflict.');
      return;
    }
    try {
      // Send notification / audit alert
      await api.post('/notifications', {
        title: `Faculty Conflict Report: ${conflictForm.conflictType}`,
        message: `${user?.fullName} reported a schedule conflict: ${conflictForm.description} (Preferred: ${conflictForm.preferredResolution || 'N/A'})`,
        type: 'system',
      }).catch(() => null);

      showSuccess('Timetable conflict reported to Campus Administration.');
      setOpenConflictDialog(false);
      setConflictForm({ subject: '', conflictType: 'Room Double-Booking', description: '', preferredResolution: '' });
    } catch (_) {
      showError('Failed to submit conflict report.');
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 3, mb: 3 }} />
        <Grid container spacing={2.5} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (error || !dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchFacultyDashboard}>Retry</Button>}>
          {error || 'Dashboard data is unavailable.'}
        </Alert>
      </Box>
    );
  }

  const {
    todayDayName,
    todayLecturesCount,
    remainingLecturesToday,
    nextItem,
    weeklyTeachingCount,
    upcomingDutiesCount,
    totalPendingApprovals,
    supervisedEventsCount,
    supervisedVolunteeringCount,
    todaySchedule = [],
    upcomingDuties = [],
    supervisedClubs = [],
    supervisedEvents = [],
    announcements = [],
    unreadNotifications = 0,
    recentAttendance = [],
  } = dashboardData;

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Faculty Welcome Hero */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          mb: 3.5,
          borderRadius: 3.5,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #2563eb 100%)',
          color: '#ffffff',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <Avatar
                src={user?.avatar}
                sx={{
                  width: 58,
                  height: 58,
                  bgcolor: '#3b82f6',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  border: '2px solid rgba(255,255,255,0.3)',
                }}
              >
                {user?.fullName?.charAt(0) || 'F'}
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                  Welcome, {user?.fullName || 'Professor'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#cbd5e1' }}>
                  {user?.department?.name || 'Department of Computer Science & Engineering'} • {user?.studentId || 'Faculty ID: FAC-104'}
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
              Today is <strong>{todayDayName}</strong>. You have <strong>{todayLecturesCount} regular lectures</strong> and <strong>{remainingLecturesToday} sessions remaining</strong> on your active roster.
            </Typography>
          </Grid>

          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Stack direction="row" spacing={1.5} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<TimetableIcon />}
                onClick={() => navigate('/faculty/timetable')}
                sx={{
                  bgcolor: '#ffffff',
                  color: '#0f172a',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { bgcolor: '#f1f5f9' },
                }}
              >
                My Timetable
              </Button>
              <Button
                variant="outlined"
                startIcon={<ConflictIcon />}
                onClick={() => setOpenConflictDialog(true)}
                sx={{
                  color: '#ffffff',
                  borderColor: 'rgba(255,255,255,0.4)',
                  textTransform: 'none',
                  '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                Report Conflict
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Action Navigation Buttons */}
      <Paper elevation={0} sx={{ p: 2, mb: 3.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1.5 }}>
          Faculty Quick Actions
        </Typography>
        <Grid container spacing={1.5}>
          <Grid item xs={6} sm={4} md={2.4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<TimetableIcon sx={{ color: '#2563eb' }} />}
              onClick={() => navigate('/faculty/timetable')}
              sx={{ py: 1.2, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', borderColor: '#e2e8f0', color: '#1e293b' }}
            >
              Full Timetable
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SubjectsIcon sx={{ color: '#0d9488' }} />}
              onClick={() => navigate('/faculty/subjects')}
              sx={{ py: 1.2, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', borderColor: '#e2e8f0', color: '#1e293b' }}
            >
              Subjects & Classes
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AttendanceIcon sx={{ color: '#0284c7' }} />}
              onClick={() => navigate('/faculty/attendance')}
              sx={{ py: 1.2, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', borderColor: '#e2e8f0', color: '#1e293b' }}
            >
              Take Attendance
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DutiesIcon sx={{ color: '#7c3aed' }} />}
              onClick={() => navigate('/faculty/duties')}
              sx={{ py: 1.2, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', borderColor: '#e2e8f0', color: '#1e293b' }}
            >
              Duties & Substitutions
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ApprovalsIcon sx={{ color: '#e11d48' }} />}
              onClick={() => navigate('/faculty/approvals')}
              sx={{ py: 1.2, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', borderColor: '#e2e8f0', color: '#1e293b' }}
            >
              Approvals ({totalPendingApprovals})
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Live Faculty Metrics */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Today's Lectures
                </Typography>
                <Box sx={{ p: 1, bgcolor: '#eff6ff', borderRadius: 2 }}>
                  <TimetableIcon sx={{ color: '#2563eb', fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {todayLecturesCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                {remainingLecturesToday} sessions remaining today
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Weekly Teaching
                </Typography>
                <Box sx={{ p: 1, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                  <SchoolIcon sx={{ color: '#16a34a', fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {weeklyTeachingCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                Scheduled weekly slots across Monday–Sat
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Pending Approvals
                </Typography>
                <Box sx={{ p: 1, bgcolor: totalPendingApprovals > 0 ? '#fef2f2' : '#f8fafc', borderRadius: 2 }}>
                  <ApprovalsIcon sx={{ color: totalPendingApprovals > 0 ? '#ef4444' : '#64748b', fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: totalPendingApprovals > 0 ? '#dc2626' : '#0f172a' }}>
                {totalPendingApprovals}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                Volunteering hours & event proposals
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Assigned Duties
                </Typography>
                <Box sx={{ p: 1, bgcolor: '#faf5ff', borderRadius: 2 }}>
                  <DutiesIcon sx={{ color: '#9333ea', fontSize: 20 }} />
                </Box>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
                {upcomingDutiesCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                Invigilations, substitutions & meetings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Two-Column Layout */}
      <Grid container spacing={3.5}>
        {/* Left Column: Today's Schedule & Duties */}
        <Grid item xs={12} lg={8}>
          {/* Prominent Chronological Today's Schedule */}
          <Paper elevation={0} sx={{ p: 3, mb: 3.5, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  Today's Teaching & Duty Schedule
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  {todayDayName} • Chronological lecture and duty timeline
                </Typography>
              </Box>
              <Button
                size="small"
                endIcon={<ArrowIcon />}
                onClick={() => navigate('/faculty/timetable')}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Weekly View
              </Button>
            </Box>

            {todaySchedule.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 3 }}>
                <TimetableIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  No scheduled sessions for today
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                  You have no teaching lectures or duty responsibilities scheduled on {todayDayName}.
                </Typography>
                <Button variant="outlined" size="small" onClick={() => navigate('/faculty/timetable')}>
                  Check Full Week
                </Button>
              </Box>
            ) : (
              <Stack spacing={2}>
                {todaySchedule.map((item, idx) => (
                  <Paper
                    key={item._id || idx}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: item.isCurrent ? '#3b82f6' : item.isCompleted ? '#e2e8f0' : '#cbd5e1',
                      bgcolor: item.isCurrent ? '#f0f9ff' : item.isCompleted ? '#f8fafc' : '#ffffff',
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: '#94a3b8', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                    }}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TimeIcon sx={{ fontSize: 18, color: item.isCurrent ? '#2563eb' : '#64748b' }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                            {item.startTime} – {item.endTime}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                          {item.itemType}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                            {item.title}
                          </Typography>
                          {item.code && (
                            <Chip label={item.code} size="small" sx={{ height: 20, fontSize: '0.72rem', fontWeight: 600 }} />
                          )}
                        </Stack>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                          {item.classDivision && (
                            <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600 }}>
                              Class: {item.classDivision}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationIcon sx={{ fontSize: 15, color: '#0284c7' }} />
                            <Typography variant="body2" sx={{ color: '#0284c7', fontWeight: 600 }}>
                              {item.room}
                            </Typography>
                          </Box>
                        </Stack>
                      </Grid>

                      <Grid item xs={12} sm={3} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                        <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }} alignItems="center">
                          <Chip
                            label={item.activityType || item.itemType}
                            size="small"
                            color={item.itemType === 'Substitution' ? 'secondary' : item.itemType === 'Duty' ? 'warning' : 'primary'}
                            variant={item.isCurrent ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                          />
                          {item.itemType === 'Lecture' && !item.isCompleted && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => navigate('/faculty/attendance')}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                bgcolor: '#0f172a',
                                '&:hover': { bgcolor: '#1e293b' },
                              }}
                            >
                              Attendance
                            </Button>
                          )}
                        </Stack>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            )}
          </Paper>

          {/* Assigned Duties & Substitutions Card */}
          <Paper elevation={0} sx={{ p: 3, mb: 3.5, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Upcoming Assigned Duties & Substitutions
              </Typography>
              <Button size="small" endIcon={<ArrowIcon />} onClick={() => navigate('/faculty/duties')} sx={{ textTransform: 'none' }}>
                View All Duties
              </Button>
            </Box>

            {upcomingDuties.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                No pending examination duties or substitution assignments.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {upcomingDuties.map((duty) => (
                  <Box
                    key={duty._id}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: '1px solid #f1f5f9',
                      bgcolor: '#f8fafc',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Chip
                          label={duty.type}
                          size="small"
                          color={duty.type === 'Substitution' ? 'secondary' : 'default'}
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {duty.title}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        📅 {new Date(duty.date).toLocaleDateString()} • ⏰ {duty.startTime} - {duty.endTime} • 📍 {duty.room || 'Campus'}
                      </Typography>
                    </Box>
                    <Chip
                      label={duty.status}
                      size="small"
                      color={duty.status === 'Completed' ? 'success' : duty.status === 'Acknowledged' ? 'info' : 'warning'}
                      sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>

          {/* Recent Lecture Attendance Records */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Recent Lecture Attendance Logs
              </Typography>
              <Button size="small" endIcon={<ArrowIcon />} onClick={() => navigate('/faculty/attendance')} sx={{ textTransform: 'none' }}>
                Attendance Portal
              </Button>
            </Box>

            {recentAttendance.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                No attendance sessions recorded recently. Use the "Take Attendance" button above to record your first lecture.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {recentAttendance.map((rec) => (
                  <Box
                    key={rec._id}
                    sx={{
                      p: 2,
                      borderRadius: 2.5,
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        {rec.subject?.name} ({rec.classDivision?.name})
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Topic: {rec.topic} • {new Date(rec.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip
                        label={`${rec.summary?.attendanceRate || 0}% Present`}
                        size="small"
                        color={rec.summary?.attendanceRate >= 80 ? 'success' : 'warning'}
                        sx={{ fontWeight: 700 }}
                      />
                      <Typography variant="caption" sx={{ display: 'block', color: '#64748b', mt: 0.5 }}>
                        {rec.summary?.presentCount} of {rec.summary?.totalStudents} students
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Next Session Focus, Supervision & Announcements */}
        <Grid item xs={12} lg={4}>
          {/* Next Lecture Focus Card */}
          {nextItem ? (
            <Card
              sx={{
                p: 2.5,
                mb: 3.5,
                borderRadius: 3.5,
                border: '1px solid #bfdbfe',
                bgcolor: '#eff6ff',
                boxShadow: 'none',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Chip label="UPCOMING NEXT" color="primary" size="small" sx={{ fontWeight: 800, fontSize: '0.7rem' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e40af' }}>
                  {nextItem.startTime} ({nextItem.itemType})
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e3a8a', mb: 0.5 }}>
                {nextItem.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#3b82f6', fontWeight: 600, mb: 1.5 }}>
                Class: {nextItem.classDivision} • Room: {nextItem.room}
              </Typography>
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate('/faculty/attendance')}
                sx={{ bgcolor: '#1e40af', '&:hover': { bgcolor: '#1e3a8a' }, textTransform: 'none', fontWeight: 700 }}
              >
                Prepare Attendance Sheet
              </Button>
            </Card>
          ) : (
            <Card sx={{ p: 2.5, mb: 3.5, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', boxShadow: 'none' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                All scheduled lectures for today completed!
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                You have concluded your scheduled sessions for today.
              </Typography>
            </Card>
          )}

          {/* Supervised Clubs & Activities */}
          <Paper elevation={0} sx={{ p: 3, mb: 3.5, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Club & Activity Supervision
              </Typography>
              <Button size="small" onClick={() => navigate('/faculty/supervision')} sx={{ textTransform: 'none' }}>
                Details
              </Button>
            </Box>

            {supervisedClubs.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                No active clubs assigned as faculty advisor.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {supervisedClubs.map((club) => (
                  <Box
                    key={club._id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        {club.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        {club.category} • {club.memberCount || 24} Members
                      </Typography>
                    </Box>
                    <ClubsIcon sx={{ color: '#0d9488', fontSize: 20 }} />
                  </Box>
                ))}
              </Stack>
            )}

            <Divider sx={{ my: 2 }} />

            <Stack direction="row" spacing={2} justifyContent="space-around">
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#2563eb' }}>
                  {supervisedEventsCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Supervised Events
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0d9488' }}>
                  {supervisedVolunteeringCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Volunteering Drives
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Department Announcements */}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Department Announcements
              </Typography>
              <Button size="small" onClick={() => navigate('/announcements')} sx={{ textTransform: 'none' }}>
                View All
              </Button>
            </Box>

            {announcements.length === 0 ? (
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                No active announcements for your department.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {announcements.map((ann) => (
                  <Box key={ann._id} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
                      {ann.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#64748b',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {ann.content}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Report Timetable Conflict Dialog */}
      <Dialog open={openConflictDialog} onClose={() => setOpenConflictDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
          Report Schedule or Room Conflict
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            Submit a conflict report directly to the Timetable Administrator to request room reassignment, timing adjustments, or substitution coordination.
          </Typography>
          <Stack spacing={2.5}>
            <TextField
              select
              label="Conflict Nature"
              value={conflictForm.conflictType}
              onChange={(e) => setConflictForm({ ...conflictForm, conflictType: e.target.value })}
              fullWidth
            >
              <MenuItem value="Room Double-Booking">Room Double-Booking</MenuItem>
              <MenuItem value="Faculty Overlapping Time Slot">Faculty Overlapping Time Slot</MenuItem>
              <MenuItem value="Class Cohort Schedule Overlap">Class Cohort Schedule Overlap</MenuItem>
              <MenuItem value="Lab Equipment / Facility Unavailability">Lab Equipment / Facility Unavailability</MenuItem>
              <MenuItem value="Urgent Duty Rescheduling Request">Urgent Duty Rescheduling Request</MenuItem>
            </TextField>

            <TextField
              label="Affected Subject / Lecture / Class"
              placeholder="e.g., CS501 Distributed Systems (CSE-5A) LH-201"
              value={conflictForm.subject}
              onChange={(e) => setConflictForm({ ...conflictForm, subject: e.target.value })}
              fullWidth
            />

            <TextField
              label="Description of Conflict"
              multiline
              rows={3}
              placeholder="Specify the exact date, time, conflicting party, or classroom details..."
              value={conflictForm.description}
              onChange={(e) => setConflictForm({ ...conflictForm, description: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Preferred Resolution / Alternative Slot"
              placeholder="e.g., Requesting LH-203 instead, or shifting session to 15:00"
              value={conflictForm.preferredResolution}
              onChange={(e) => setConflictForm({ ...conflictForm, preferredResolution: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenConflictDialog(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleReportConflict}
            sx={{ bgcolor: '#0f172a', textTransform: 'none', fontWeight: 700 }}
          >
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
