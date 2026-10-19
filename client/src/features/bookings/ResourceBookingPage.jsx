import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Paper,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  MeetingRoom as ResourceIcon,
  Add as AddIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  CheckCircle as ApprovedIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const ResourceBookingPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [tab, setTab] = useState(0); // 0 = Catalog, 1 = My Bookings, 2 = Manager Approvals
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking Modal
  const [openBookModal, setOpenBookModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [bookData, setBookData] = useState({
    purpose: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '12:00',
    expectedAttendees: 10,
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await api.get('/resources');
      setResources(res.data.data || []);
    } catch (_) {
      showError('Failed to load campus resources.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await api.get('/resources/bookings');
      setBookings(res.data.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchResources();
    fetchBookings();
  }, [tab]);

  const handleOpenBook = (resource) => {
    setSelectedResource(resource);
    setOpenBookModal(true);
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.post('/resources/book', {
        resourceId: selectedResource._id,
        ...bookData,
      });
      showSuccess(res.data.message);
      setOpenBookModal(false);
      fetchBookings();
      setTab(1);
    } catch (err) {
      showError(err.response?.data?.message || 'Conflict detected or booking failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewBooking = async (bookingId, status) => {
    const notes = window.prompt(`Enter review notes for ${status}:`);
    try {
      await api.patch(`/resources/bookings/${bookingId}/review`, { status, reviewNotes: notes });
      showSuccess(`Booking marked as ${status}.`);
      fetchBookings();
    } catch (err) {
      showError(err.response?.data?.message || 'Error updating booking.');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.patch(`/resources/bookings/${bookingId}/cancel`);
      showSuccess('Booking cancelled.');
      fetchBookings();
    } catch (_) {
      showError('Failed to cancel.');
    }
  };

  const isManagerOrAdmin = ['resource_manager', 'admin'].includes(user?.role);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Campus Resource Booking & Scheduling
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Reserve seminar halls, robotics labs, multimedia rooms, and audiovisual kits with conflict protection
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(e, val) => setTab(val)} sx={{ mb: 3, borderBottom: '1px solid #e2e8f0' }}>
        <Tab label="Resource Catalog" sx={{ fontWeight: 700 }} />
        <Tab label={`My Bookings (${bookings.filter((b) => b.requestedBy?._id === user?.id).length})`} sx={{ fontWeight: 700 }} />
        {isManagerOrAdmin && (
          <Tab label={`Manager Approvals (${bookings.filter((b) => b.status === 'Pending').length})`} sx={{ fontWeight: 700, color: '#0284c7' }} />
        )}
      </Tabs>

      {/* Tab 0: Resource Catalog */}
      {tab === 0 && (
        <Box>
          {loading ? (
            <LinearProgress sx={{ my: 4 }} />
          ) : (
            <Grid container spacing={3.5}>
              {resources.map((res) => (
                <Grid item xs={12} sm={6} md={4} key={res._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                        <Chip label={res.type} size="small" color="primary" sx={{ fontWeight: 700 }} />
                        <Chip
                          label={res.isMaintenance ? 'Under Maintenance' : 'Available'}
                          size="small"
                          color={res.isMaintenance ? 'warning' : 'success'}
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, minHeight: 52 }}>
                        {res.name}
                      </Typography>

                      <Typography variant="body2" sx={{ color: '#64748b', mb: 2, minHeight: 40, lineHeight: 1.4 }}>
                        {res.description}
                      </Typography>

                      <Stack spacing={1} sx={{ mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationIcon sx={{ fontSize: 16, color: '#e11d48' }} />
                          <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600 }}>
                            {res.location}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TimeIcon sx={{ fontSize: 16, color: '#2563eb' }} />
                          <Typography variant="caption" sx={{ color: '#334155' }}>
                            Hours: {res.operatingHours?.open || '08:00'} - {res.operatingHours?.close || '20:00'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PeopleIcon sx={{ fontSize: 16, color: '#0d9488' }} />
                          <Typography variant="caption" sx={{ color: '#334155' }}>
                            Capacity: {res.capacity} attendees
                          </Typography>
                        </Box>
                      </Stack>

                      <Button
                        fullWidth
                        variant="contained"
                        color="secondary"
                        disabled={res.isMaintenance}
                        onClick={() => handleOpenBook(res)}
                        sx={{ mt: 'auto', borderRadius: 2 }}
                      >
                        Reserve Resource
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Tab 1: My Bookings */}
      {tab === 1 && (
        <Paper sx={{ p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
            My Active and Past Reservations
          </Typography>

          {bookings.filter((b) => b.requestedBy?._id === user?.id).length === 0 ? (
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              You haven't requested any resource bookings yet.
            </Typography>
          ) : (
            <Stack spacing={2.5}>
              {bookings
                .filter((b) => b.requestedBy?._id === user?.id)
                .map((b) => (
                  <Card key={b._id} sx={{ p: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Box>
                        <Chip
                          label={b.status}
                          size="small"
                          color={b.status === 'Approved' ? 'success' : b.status === 'Rejected' ? 'error' : 'warning'}
                          sx={{ fontWeight: 700, mr: 1 }}
                        />
                        <Typography variant="subtitle1" component="span" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {b.resource?.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Date: {new Date(b.date).toLocaleDateString()} ({b.startTime} - {b.endTime})
                      </Typography>
                    </Box>

                    <Typography variant="body2" sx={{ color: '#334155', mb: 1 }}>
                      <strong>Purpose:</strong> {b.purpose}
                    </Typography>

                    {b.reviewNotes && (
                      <Typography variant="caption" sx={{ color: '#0369a1', display: 'block', mb: 1.5 }}>
                        Manager Notes: {b.reviewNotes}
                      </Typography>
                    )}

                    {b.status !== 'Cancelled' && (
                      <Button size="small" color="error" variant="outlined" onClick={() => handleCancelBooking(b._id)}>
                        Cancel Reservation
                      </Button>
                    )}
                  </Card>
                ))}
            </Stack>
          )}
        </Paper>
      )}

      {/* Tab 2: Manager Approvals */}
      {tab === 2 && isManagerOrAdmin && (
        <Paper sx={{ p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
            Resource Manager Conflict Guard & Approvals
          </Typography>

          {bookings.length === 0 ? (
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              No booking requests pending.
            </Typography>
          ) : (
            <Stack spacing={2.5}>
              {bookings.map((b) => (
                <Card key={b._id} sx={{ p: 2.5, bgcolor: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                        {b.resource?.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Requested by: {b.requestedBy?.fullName} ({b.requestedBy?.email})
                      </Typography>
                    </Box>
                    <Chip
                      label={b.status}
                      size="small"
                      color={b.status === 'Approved' ? 'success' : b.status === 'Rejected' ? 'error' : 'warning'}
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>

                  <Typography variant="body2" sx={{ color: '#334155', my: 1 }}>
                    Schedule: <strong>{new Date(b.date).toLocaleDateString()}</strong> from <strong>{b.startTime}</strong> to{' '}
                    <strong>{b.endTime}</strong> ({b.expectedAttendees} attendees)
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic', mb: 2 }}>
                    "{b.purpose}"
                  </Typography>

                  {b.status === 'Pending' && (
                    <Stack direction="row" spacing={1.5}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<ApprovedIcon />}
                        onClick={() => handleReviewBooking(b._id, 'Approved')}
                      >
                        Approve Reservation
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => handleReviewBooking(b._id, 'Rejected')}
                      >
                        Reject
                      </Button>
                    </Stack>
                  )}
                </Card>
              ))}
            </Stack>
          )}
        </Paper>
      )}

      {/* Book Resource Dialog */}
      <Dialog open={openBookModal} onClose={() => setOpenBookModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Reserve {selectedResource?.name}</DialogTitle>
        <Box component="form" onSubmit={handleBookSubmit}>
          <DialogContent dividers>
            <Alert severity="info" sx={{ mb: 2 }}>
              Operating hours: {selectedResource?.operatingHours?.open} - {selectedResource?.operatingHours?.close}.
              Overlapping approved slots are automatically rejected.
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Purpose of Booking"
                  placeholder="e.g. ACM Speaker Keynote & Robotics calibration"
                  value={bookData.purpose}
                  onChange={(e) => setBookData({ ...bookData, purpose: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  type="date"
                  label="Date"
                  InputLabelProps={{ shrink: true }}
                  value={bookData.date}
                  onChange={(e) => setBookData({ ...bookData, date: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  required
                  fullWidth
                  label="Start Time"
                  placeholder="10:00"
                  value={bookData.startTime}
                  onChange={(e) => setBookData({ ...bookData, startTime: e.target.value })}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  required
                  fullWidth
                  label="End Time"
                  placeholder="12:00"
                  value={bookData.endTime}
                  onChange={(e) => setBookData({ ...bookData, endTime: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  type="number"
                  label="Expected Attendees"
                  value={bookData.expectedAttendees}
                  onChange={(e) => setBookData({ ...bookData, expectedAttendees: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenBookModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="secondary" disabled={actionLoading}>
              Submit Reservation Request
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
