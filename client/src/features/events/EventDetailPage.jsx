import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  Stack,
  Divider,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  CalendarToday as DateIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  QrCode as CodeIcon,
  CheckCircle as ConfirmedIcon,
  Cancel as CancelIcon,
  ArrowBack as BackIcon,
  HourglassEmpty as WaitlistIcon,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendees, setAttendees] = useState([]);
  const [checkInPin, setCheckInPin] = useState('');
  const [openCheckIn, setOpenCheckIn] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEventDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/events/${id}`);
      setEvent(res.data.data);

      // If user is organizer or admin, fetch attendee list
      const isOrganizer =
        user && (user.role === 'admin' || res.data.data.organizer?._id === user.id || user.role === 'faculty');
      if (isOrganizer) {
        const attRes = await api.get(`/events/${id}/attendees`);
        setAttendees(attRes.data.data || []);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetail();
  }, [id]);

  const handleRegister = async () => {
    try {
      setActionLoading(true);
      const res = await api.post(`/events/${id}/register`);
      showSuccess(res.data.message);
      fetchEventDetail();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to register.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!window.confirm('Are you sure you want to cancel your seat? If there are waitlisted students, one will be promoted immediately.')) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/events/${id}/cancel`);
      showSuccess(res.data.message);
      fetchEventDetail();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to cancel registration.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelfCheckIn = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.post(`/events/${id}/checkin`, { code: checkInPin });
      showSuccess(res.data.message);
      setOpenCheckIn(false);
      fetchEventDetail();
    } catch (err) {
      showError(err.response?.data?.message || 'Invalid check-in code.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOrganizerMarkCheckIn = async (attendeeUserId) => {
    try {
      const res = await api.post(`/events/${id}/checkin`, { userId: attendeeUserId });
      showSuccess('Marked attendee present.');
      fetchEventDetail();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to mark check-in.');
    }
  };

  if (loading || !event) {
    return <LinearProgress sx={{ mt: 4 }} />;
  }

  const isFull = event.currentRegisteredCount >= event.capacity;
  const registration = event.userRegistration;
  const isRegistered = registration && registration.status === 'registered';
  const isWaitlisted = registration && registration.status === 'waitlisted';
  const isAttended = registration && registration.status === 'attended';
  const isOrganizerOrAdmin =
    user && (user.role === 'admin' || event.organizer?._id === user.id || user.role === 'faculty');

  return (
    <Box>
      <Button startIcon={<BackIcon />} onClick={() => navigate('/events')} sx={{ mb: 2 }}>
        Back to Events Catalog
      </Button>

      {/* Banner Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 65%, #0f766e 100%)',
          color: '#ffffff',
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip label={event.category} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#ffffff', fontWeight: 700 }} />
          <Chip
            label={event.status}
            sx={{
              bgcolor: event.status === 'Published' ? '#10b981' : '#f59e0b',
              color: '#ffffff',
              fontWeight: 700,
            }}
          />
        </Box>

        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
          {event.title}
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <DateIcon sx={{ color: '#38bdf8' }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  DATE & TIME
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {new Date(event.startDate).toLocaleDateString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
                  {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LocationIcon sx={{ color: '#f43f5e' }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  CAMPUS VENUE
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {event.venue}
                </Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <PeopleIcon sx={{ color: '#34d399' }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  CAPACITY
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {event.currentRegisteredCount} / {event.capacity} Registered
                </Typography>
                {event.currentWaitlistCount > 0 && (
                  <Typography variant="caption" sx={{ color: '#fbbf24' }}>
                    ({event.currentWaitlistCount} on waitlist)
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content Grid */}
      <Grid container spacing={4}>
        {/* Left: Event Details & Description */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4, borderRadius: 3, mb: 4, border: '1px solid #e2e8f0' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
              About This Event
            </Typography>
            <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-line', mb: 3 }}>
              {event.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Organizer & Department
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: '#2563eb', width: 44, height: 44 }}>
                {event.organizer?.fullName?.charAt(0) || 'O'}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {event.organizer?.fullName}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {event.department?.name || 'Academic Affairs'} • {event.organizer?.email}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Organizer / Admin Attendee Roster */}
          {isOrganizerOrAdmin && (
            <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Participant Roster ({attendees.length})
                </Typography>
                <Chip label={`PIN: ${event.checkInCode}`} color="primary" sx={{ fontWeight: 800 }} />
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Participant</TableCell>
                      <TableCell>Department</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendees.map((att) => (
                      <TableRow key={att._id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {att.user?.fullName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {att.user?.email}
                          </Typography>
                        </TableCell>
                        <TableCell>{att.user?.department?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={att.status}
                            size="small"
                            color={att.status === 'attended' ? 'success' : att.status === 'registered' ? 'primary' : 'warning'}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {att.status !== 'attended' && (
                            <Button size="small" variant="outlined" onClick={() => handleOrganizerMarkCheckIn(att.user?._id)}>
                              Mark Attended
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Grid>

        {/* Right: Registration & Ticket Box */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Event Registration
            </Typography>

            {/* Registration State Actions */}
            {isAttended ? (
              <Alert severity="success" icon={<ConfirmedIcon />} sx={{ mb: 2 }}>
                Attendance verified on {new Date(registration.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}!
              </Alert>
            ) : isRegistered ? (
              <Box sx={{ mb: 3 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  You have a confirmed seat for this event!
                </Alert>

                <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0', textAlign: 'center', mb: 2 }}>
                  <Typography variant="caption" sx={{ color: '#166534', fontWeight: 700 }}>
                    YOUR CHECK-IN CODE
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#15803d', letterSpacing: '0.15em' }}>
                    {event.checkInCode}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#166534' }}>
                    Show this PIN or self check-in upon arrival
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={<CodeIcon />}
                  onClick={() => setOpenCheckIn(true)}
                  sx={{ mb: 1.5, py: 1.2 }}
                >
                  Enter PIN to Check In
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelRegistration}
                  disabled={actionLoading}
                >
                  Cancel Registration
                </Button>
              </Box>
            ) : isWaitlisted ? (
              <Box sx={{ mb: 3 }}>
                <Alert severity="warning" icon={<WaitlistIcon />} sx={{ mb: 2 }}>
                  You are #{registration.waitlistPosition} on the waitlist. You will be automatically confirmed if another participant cancels.
                </Alert>
                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  onClick={handleCancelRegistration}
                  disabled={actionLoading}
                >
                  Leave Waitlist
                </Button>
              </Box>
            ) : (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                  Registration is free for all campus students and faculty.
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  color={isFull ? 'warning' : 'secondary'}
                  size="large"
                  onClick={handleRegister}
                  disabled={actionLoading}
                  sx={{ py: 1.5, fontWeight: 700 }}
                >
                  {isFull ? 'Join Event Waitlist' : 'Register Now'}
                </Button>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ color: '#64748b', fontSize: '0.85rem' }}>
              <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                Registration Deadline: {new Date(event.registrationDeadline).toLocaleDateString()}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                Event Check-In: Closes 15 mins after start time
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Self Check-In Dialog */}
      <Dialog open={openCheckIn} onClose={() => setOpenCheckIn(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Self Attendance Check-In</DialogTitle>
        <Box component="form" onSubmit={handleSelfCheckIn}>
          <DialogContent>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
              Enter the 6-character check-in PIN displayed by the organizer at the venue entrance:
            </Typography>
            <TextField
              required
              fullWidth
              autoFocus
              label="6-Digit PIN"
              value={checkInPin}
              onChange={(e) => setCheckInPin(e.target.value.toUpperCase())}
              placeholder="e.g. HACK26"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenCheckIn(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary" disabled={actionLoading}>
              Verify Attendance
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
