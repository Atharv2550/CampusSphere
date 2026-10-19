import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Chip,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  PendingActions as ApprovalsIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  VolunteerActivism as VolunteerIcon,
  Event as EventIcon,
} from '@mui/icons-material';

import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export const FacultyApprovalsPage = () => {
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [approvalsData, setApprovalsData] = useState({ pendingVolunteers: [], pendingEvents: [], totalPending: 0 });
  const [tab, setTab] = useState(0); // 0 = Volunteers, 1 = Events

  // Action dialog state
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState('approve'); // 'approve' | 'reject'
  const [feedback, setFeedback] = useState('');
  const [verifiedHours, setVerifiedHours] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.get('/faculty/approvals');
      setApprovalsData(res.data.data);
    } catch (err) {
      console.error('Approvals fetch error:', err);
      showError('Failed to load pending approvals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleOpenAction = (item, type, action) => {
    setSelectedItem(item);
    setActionType(action);
    setVerifiedHours(item.activity?.hours || 2);
    setFeedback('');
  };

  const handleSubmitVolunteerAction = async () => {
    if (!selectedItem) return;
    try {
      setSubmitting(true);
      await api.post(`/faculty/approvals/volunteering/${selectedItem._id}`, {
        action: actionType,
        verifiedHours: Number(verifiedHours),
        feedback,
      });

      showSuccess(`Participant ${actionType === 'approve' ? 'approved and hours verified' : 'rejected'}.`);
      setSelectedItem(null);
      fetchApprovals();
    } catch (err) {
      console.error('Volunteer approval error:', err);
      showError('Failed to process volunteering approval.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEventAction = async () => {
    if (!selectedItem) return;
    try {
      setSubmitting(true);
      await api.post(`/faculty/approvals/events/${selectedItem._id}`, {
        action: actionType === 'approve' ? 'publish' : 'reject',
      });

      showSuccess(`Event has been ${actionType === 'approve' ? 'approved & published' : 'rejected'}.`);
      setSelectedItem(null);
      fetchApprovals();
    } catch (err) {
      console.error('Event approval error:', err);
      showError('Failed to process event approval.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  const { pendingVolunteers = [], pendingEvents = [], totalPending = 0 } = approvalsData;

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <Box sx={{ p: 1, bgcolor: '#fef2f2', borderRadius: 2 }}>
            <ApprovalsIcon sx={{ color: '#ef4444', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Pending Faculty Approvals
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Review student service hours, verify volunteer participation, and authorize departmental event proposals
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Tabs */}
      <Paper elevation={0} sx={{ mb: 3.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
        <Tabs
          value={tab}
          onChange={(_, val) => setTab(val)}
          sx={{ px: 2, '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', py: 2 } }}
        >
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Volunteering Hours</span>
                <Chip
                  label={pendingVolunteers.length}
                  size="small"
                  color={pendingVolunteers.length > 0 ? 'error' : 'default'}
                  sx={{ height: 20, fontSize: '0.72rem', fontWeight: 800 }}
                />
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Event Proposals</span>
                <Chip
                  label={pendingEvents.length}
                  size="small"
                  color={pendingEvents.length > 0 ? 'warning' : 'default'}
                  sx={{ height: 20, fontSize: '0.72rem', fontWeight: 800 }}
                />
              </Stack>
            }
          />
        </Tabs>
      </Paper>

      {/* Tab 0: Volunteering Registrations to Verify */}
      {tab === 0 && (
        <Box>
          {pendingVolunteers.length === 0 ? (
            <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <ApproveIcon sx={{ fontSize: 50, color: '#16a34a', mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                All student volunteering hours verified!
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                There are no pending attendance records requiring faculty verification.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Volunteering Activity</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Date & Venue</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Claimed Hours</TableCell>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingVolunteers.map((item) => (
                    <TableRow key={item._id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ bgcolor: '#2563eb', width: 32, height: 32, fontSize: '0.85rem' }}>
                            {item.volunteer?.fullName?.charAt(0) || 'S'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                              {item.volunteer?.fullName || 'Student'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {item.volunteer?.studentId || item.volunteer?.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                        {item.activity?.title || 'Community Service Activity'}
                      </TableCell>
                      <TableCell sx={{ color: '#475569' }}>
                        📅 {new Date(item.activity?.date).toLocaleDateString()} • 📍 {item.activity?.venue}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${item.activity?.hours || 2} Hours`}
                          size="small"
                          color="primary"
                          sx={{ fontWeight: 800 }}
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            variant="contained"
                            size="small"
                            color="success"
                            startIcon={<ApproveIcon />}
                            onClick={() => handleOpenAction(item, 'volunteer', 'approve')}
                            sx={{ textTransform: 'none', fontWeight: 700 }}
                          >
                            Verify Hours
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<RejectIcon />}
                            onClick={() => handleOpenAction(item, 'volunteer', 'reject')}
                            sx={{ textTransform: 'none', fontWeight: 700 }}
                          >
                            Reject
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Tab 1: Event Proposals to Approve */}
      {tab === 1 && (
        <Box>
          {pendingEvents.length === 0 ? (
            <Paper elevation={0} sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <EventIcon sx={{ fontSize: 50, color: '#cbd5e1', mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                No pending event proposals
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                All student and club event proposals for your department have been reviewed.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {pendingEvents.map((ev) => (
                <Grid item xs={12} md={6} key={ev._id}>
                  <Card sx={{ p: 3, borderRadius: 3.5, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Chip label="Proposal Draft" size="small" color="warning" sx={{ fontWeight: 800 }} />
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Organizer: {ev.createdBy?.fullName || 'Student Lead'}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                      {ev.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                      {ev.description}
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ mb: 2.5 }}>
                      <Typography variant="caption" sx={{ color: '#475569' }}>
                        📅 {new Date(ev.startDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#475569' }}>
                        📍 {ev.venue}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#475569' }}>
                        Capacity: {ev.capacity} seats
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1.5}>
                      <Button
                        variant="contained"
                        fullWidth
                        color="success"
                        startIcon={<ApproveIcon />}
                        onClick={() => {
                          setSelectedItem(ev);
                          setActionType('approve');
                        }}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Approve & Publish
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        color="error"
                        startIcon={<RejectIcon />}
                        onClick={() => {
                          setSelectedItem(ev);
                          setActionType('reject');
                        }}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Reject
                      </Button>
                    </Stack>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Action Dialog for Volunteering */}
      <Dialog
        open={Boolean(selectedItem) && tab === 0}
        onClose={() => setSelectedItem(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
          {actionType === 'approve' ? 'Verify Volunteering Hours' : 'Reject Participation Request'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b' }}>STUDENT</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                {selectedItem?.volunteer?.fullName} ({selectedItem?.volunteer?.studentId})
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b' }}>ACTIVITY</Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {selectedItem?.activity?.title}
              </Typography>
            </Box>

            {actionType === 'approve' && (
              <TextField
                type="number"
                label="Verified Hours to Grant"
                value={verifiedHours}
                onChange={(e) => setVerifiedHours(e.target.value)}
                inputProps={{ min: 1, max: 50 }}
                fullWidth
              />
            )}

            <TextField
              label="Supervisor Remarks"
              placeholder="e.g., Active participation in logistics and cleanup drive"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedItem(null)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            onClick={handleSubmitVolunteerAction}
            disabled={submitting}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {submitting ? 'Saving...' : actionType === 'approve' ? 'Confirm & Verify' : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog for Event */}
      <Dialog
        open={Boolean(selectedItem) && tab === 1}
        onClose={() => setSelectedItem(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f172a' }}>
          {actionType === 'approve' ? 'Approve & Publish Campus Event' : 'Reject Event Proposal'}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: '#334155' }}>
            Are you sure you want to <strong>{actionType === 'approve' ? 'publish' : 'reject'}</strong> the proposal:
            <br />
            <strong>"{selectedItem?.title}"</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedItem(null)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            onClick={handleSubmitEventAction}
            disabled={submitting}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {submitting ? 'Processing...' : actionType === 'approve' ? 'Approve & Publish' : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
